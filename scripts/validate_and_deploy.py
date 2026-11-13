#!/usr/bin/env python3
"""data/news.json 을 schema.json 기준으로 검증하고, 통과하면 GitHub 로 배포한다.

사용법:
    python scripts\\validate_and_deploy.py           # 검증 + git add/commit/push
    python scripts\\validate_and_deploy.py --check   # 검증만 (배포 안 함)

종료 코드: 0 성공 / 1 검증 실패 / 2 파일·환경 문제 / 3 git 실패
표준 라이브러리만 사용한다.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_PATH = os.path.join(ROOT, "data", "news.json")
SCHEMA_PATH = os.path.join(ROOT, "schema.json")
COMMIT_MESSAGE = "chore: daily market briefing update"
MIN_PER_CATEGORY = 2  # SPEC.md 2.2: 카테고리당 최소 기사 수

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
    """스키마로 표현하기 어려운 규칙: id 중복, 카테고리 분포."""
    articles = news.get("articles")
    if not isinstance(articles, list):
        return
    seen = {}
    counts = {}
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
    categories = schema["properties"]["articles"]["items"]["properties"]["category"]["enum"]
    for category in categories:
        if counts.get(category, 0) < MIN_PER_CATEGORY:
            errors.append(
                f"$.articles: '{category}' 기사가 {MIN_PER_CATEGORY}개 이상이어야 함 (실제 {counts.get(category, 0)}개)"
            )


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
    schema = load_json(SCHEMA_PATH, "schema.json")
    news = load_json(NEWS_PATH, "news.json")

    errors = []
    validate(news, schema, "$", errors)
    extra_checks(news, schema, errors)

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
