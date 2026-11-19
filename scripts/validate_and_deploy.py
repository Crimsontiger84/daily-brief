#!/usr/bin/env python3
"""data/news.json 을 schema.json 기준으로 검증하고, 통과하면 GitHub 로 배포한다.

사용법:
    python scripts\\validate_and_deploy.py              # 검증 + 링크 검사 + git add/commit/push
    python scripts\\validate_and_deploy.py --check      # 검증 + 링크 검사만 (배포 안 함)
    python scripts\\validate_and_deploy.py --no-links   # 링크 검사 생략 (오프라인용)

링크 검사: 각 기사의 source_url 에 실제 HTTP 요청을 보낸다.
  - 구글 검색 리다이렉트(grounding-api-redirect) 주소는 최종 도착 URL 로 바꿔 news.json 에 저장한다.
  - 404/410, 없는 도메인, 연결 실패, 리다이렉트 해석 실패는 FAIL.
  - 401/403/429/5xx/시간 초과는 봇 차단일 수 있어 경고만 한다 (브라우저에서는 열리는 경우가 많다).

종료 코드: 0 성공 / 1 검증 실패 / 2 파일·환경 문제 / 3 git 실패
표준 라이브러리만 사용한다.
"""
import json
import os
import re
import shutil
import socket
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_PATH = os.path.join(ROOT, "data", "news.json")
SCHEMA_PATH = os.path.join(ROOT, "schema.json")
COMMIT_MESSAGE = "chore: daily market briefing update"
MIN_PER_CATEGORY = 2  # SPEC.md 2.2: 카테고리당 최소 기사 수
# SPEC.md 5.6: 골프 사업 비중을 늘리기 위해 카테고리별 최소치를 따로 둔다.
MIN_BY_CATEGORY = {"Golf & Sports Tech": 4}
MAX_PER_SOURCE = 2  # SPEC.md 5.6: 같은 매체는 하루 최대 2건

LINK_TIMEOUT = 20
LINK_WORKERS = 6
BROKEN_STATUS = {404, 410}
LINK_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

TYPE_MAP = {
    "string": str,
    "integer": int,
    "number": (int, float),
    "array": list,
    "object": dict,
    "boolean": bool,
}


def check_format(value, fmt):
    """format 키워드 검사. 문제가 있으면 오류 문구, 없으면 None."""
    try:
        if fmt == "date":
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                raise ValueError
            date.fromisoformat(value)
        elif fmt == "date-time":
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return "시간대가 없음 (예: 2026-11-13T07:00:00+09:00)"
        elif fmt == "uri":
            if not re.match(r"^https?://[^\s/]+\.[^\s]+$", value):
                raise ValueError
    except ValueError:
        return f"{fmt} 형식이 아님: {value!r}"
    return None


def validate(value, schema, path, errors):
    """schema.json 에서 쓰는 JSON Schema 키워드만 지원하는 소형 검증기."""
    expected = schema.get("type")
    if expected:
        py_type = TYPE_MAP[expected]
        is_bool = isinstance(value, bool) and expected != "boolean"
        if is_bool or not isinstance(value, py_type):
            errors.append(f"{path}: 타입이 {expected} 여야 함 (실제: {type(value).__name__})")
            return

    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: 허용되지 않는 값 {value!r} (허용: {schema['enum']})")

    if isinstance(value, str):
        if len(value.strip()) < schema.get("minLength", 0):
            errors.append(f"{path}: 너무 짧음 (최소 {schema['minLength']}자, 실제 {len(value.strip())}자)")
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: 패턴 {schema['pattern']} 불일치: {value!r}")
        if "format" in schema:
            problem = check_format(value, schema["format"])
            if problem:
                errors.append(f"{path}: {problem}")

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {schema['minimum']} 이상이어야 함 (실제 {value})")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {schema['maximum']} 이하여야 함 (실제 {value})")

    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}: 항목이 {schema['minItems']}개 이상이어야 함 (실제 {len(value)}개)")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}: 항목이 {schema['maxItems']}개 이하여야 함 (실제 {len(value)}개)")
        if "items" in schema:
            for index, item in enumerate(value):
                validate(item, schema["items"], f"{path}[{index}]", errors)

    if isinstance(value, dict):
        props = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{path}: 필수 필드 '{key}' 누락")
        if schema.get("additionalProperties") is False:
            for key in value:
                if key not in props:
                    errors.append(f"{path}: 스키마에 없는 필드 '{key}'")
        for key, sub_schema in props.items():
            if key in value:
                validate(value[key], sub_schema, f"{path}.{key}", errors)


def extra_checks(news, schema, errors):
    """스키마로 표현하기 어려운 규칙: id 중복, 카테고리 분포, 매체 쏠림."""
    articles = news.get("articles")
    if not isinstance(articles, list):
        return
    seen = {}
    counts = {}
    sources = {}
    for index, article in enumerate(articles):
        if not isinstance(article, dict):
            continue
        article_id = article.get("id")
        if isinstance(article_id, str):
            if article_id in seen:
                errors.append(f"$.articles[{index}].id: '{article_id}' 중복 (articles[{seen[article_id]}] 와 같음)")
            else:
                seen[article_id] = index
        category = article.get("category")
        if isinstance(category, str):
            counts[category] = counts.get(category, 0) + 1
        source = article.get("source_name")
        if isinstance(source, str) and source.strip():
            key = source.strip().lower()
            sources[key] = sources.get(key, 0) + 1
    categories = schema["properties"]["articles"]["items"]["properties"]["category"]["enum"]
    for category in categories:
        minimum = MIN_BY_CATEGORY.get(category, MIN_PER_CATEGORY)
        if counts.get(category, 0) < minimum:
            errors.append(
                f"$.articles: '{category}' 기사가 {minimum}개 이상이어야 함 (실제 {counts.get(category, 0)}개)"
            )
    for source, count in sources.items():
        if count > MAX_PER_SOURCE:
            errors.append(f"$.articles: 같은 매체 '{source}' 기사가 {count}건 — 하루 최대 {MAX_PER_SOURCE}건")


def is_search_redirect(url):
    return "grounding-api-redirect" in url or "vertexaisearch.cloud.google.com" in url


def probe_url(url):
    """실제 요청을 보내 (판정, 최종 URL, 상세) 를 돌려준다. 판정: ok | broken | unverified.

    리다이렉트는 따라가며, 최종 URL 은 마지막으로 도착한 주소다.
    HEAD 를 거부하는 사이트가 많아 GET 으로 확인한다.
    """
    request = urllib.request.Request(url, headers=LINK_HEADERS, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=LINK_TIMEOUT) as response:
            return "ok", response.geturl(), f"HTTP {response.status}"
    except urllib.error.HTTPError as exc:
        final_url = exc.geturl() or url
        if exc.code in BROKEN_STATUS:
            return "broken", final_url, f"HTTP {exc.code}"
        return "unverified", final_url, f"HTTP {exc.code}"
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, (socket.timeout, TimeoutError)):
            return "unverified", url, "timeout"
        if isinstance(exc.reason, socket.gaierror):
            return "broken", url, "domain not found"
        if isinstance(exc.reason, ssl.SSLError):
            # 이 PC의 인증서 저장소 문제일 수 있어 링크 자체가 깨졌다고 보지 않는다.
            return "unverified", url, f"SSL check failed: {exc.reason.__class__.__name__}"
        return "broken", url, f"connection failed: {exc.reason}"
    except (socket.timeout, TimeoutError):
        return "unverified", url, "timeout"
    except Exception as exc:  # noqa: BLE001 - 어떤 오류든 결과에 남긴다
        return "broken", url, f"error: {exc}"


def check_links(news, errors, warnings):
    """source_url 을 검사하고 검색 리다이렉트를 최종 URL 로 바꾼다. 바뀐 기사 수를 돌려준다."""
    articles = news.get("articles")
    if not isinstance(articles, list):
        return 0
    targets = [
        (index, article)
        for index, article in enumerate(articles)
        if isinstance(article, dict) and isinstance(article.get("source_url"), str)
    ]
    with ThreadPoolExecutor(max_workers=LINK_WORKERS) as pool:
        results = list(pool.map(lambda t: probe_url(t[1]["source_url"]), targets))

    rewritten = 0
    for (index, article), (status, final_url, detail) in zip(targets, results):
        url = article["source_url"]
        label = f"$.articles[{index}].source_url ({article.get('id', '?')})"
        if is_search_redirect(url):
            if status == "broken" or is_search_redirect(final_url):
                errors.append(f"{label}: 검색 리다이렉트 주소를 원문 URL 로 풀지 못함 ({detail})")
                continue
            article["source_url"] = final_url
            rewritten += 1
            print(f"[FIX] {label}: 리다이렉트 → {final_url}")
            url = final_url
        if status == "broken":
            errors.append(f"{label}: 열리지 않음 ({detail}) {url}")
        elif status == "unverified":
            warnings.append(f"{label}: 확인 불가 ({detail}, 봇 차단일 수 있음) {url}")
    return rewritten


def save_news(news):
    with open(NEWS_PATH, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(news, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def load_json(path, label):
    if not os.path.isfile(path):
        print(f"[ERROR] {label} 파일이 없습니다: {path}")
        sys.exit(2)
    try:
        with open(path, "r", encoding="utf-8-sig") as handle:
            return json.load(handle)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        print(f"[ERROR] {label} 을(를) JSON 으로 읽을 수 없습니다: {exc}")
        sys.exit(1 if label == "news.json" else 2)


def git(*args, check=True):
    result = subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if check and result.returncode != 0:
        print(f"[ERROR] git {' '.join(args)} 실패 (exit {result.returncode})")
        print((result.stderr or result.stdout).strip())
        sys.exit(3)
    return result


def deploy():
    if shutil.which("git") is None:
        print("[ERROR] git 이 설치되어 있지 않거나 PATH 에 없습니다.")
        sys.exit(2)
    if git("rev-parse", "--is-inside-work-tree", check=False).returncode != 0:
        print("[ERROR] 이 폴더는 git 저장소가 아닙니다. 먼저 `git init -b main` 과 원격 설정을 하세요.")
        sys.exit(2)
    if git("remote", "get-url", "origin", check=False).returncode != 0:
        print("[ERROR] 원격 'origin' 이 없습니다. `git remote add origin <GitHub 저장소 URL>` 을 실행하세요.")
        sys.exit(2)

    git("add", ".")
    if git("diff", "--cached", "--quiet", check=False).returncode == 0:
        print("[INFO] 변경 사항이 없어 커밋을 건너뜁니다.")
    else:
        git("commit", "-m", COMMIT_MESSAGE)
        print(f"[OK] 커밋 완료: {COMMIT_MESSAGE}")
    git("push", "origin", "main")
    print("[OK] git push origin main 완료 — GitHub Pages 가 곧 갱신됩니다.")


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass

    check_only = "--check" in sys.argv[1:]
    skip_links = "--no-links" in sys.argv[1:]
    schema = load_json(SCHEMA_PATH, "schema.json")
    news = load_json(NEWS_PATH, "news.json")

    errors = []
    warnings = []
    if skip_links:
        print("[INFO] --no-links: 원문 링크 검사를 건너뜁니다.")
    else:
        if check_links(news, errors, warnings):
            save_news(news)
            print("[OK] 리다이렉트 주소를 원문 URL 로 바꿔 news.json 에 저장했습니다.")
    validate(news, schema, "$", errors)
    extra_checks(news, schema, errors)

    for message in warnings:
        print(f"[WARN] {message}")
    if errors:
        print(f"FAIL: 검증 오류 {len(errors)}건 — 배포하지 않습니다.")
        for message in errors:
            print(f"  - {message}")
        sys.exit(1)

    print(f"PASS: 기사 {len(news['articles'])}개, updated_at={news['updated_at']}")
    if check_only:
        return
    deploy()


if __name__ == "__main__":
    main()
