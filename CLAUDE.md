# CLAUDE.md — 전문 뉴스 브리핑 프로젝트 영구 지침

## 프로젝트
- 루트: `C:\Users\a\Documents\Tech` (Windows 11, PowerShell)
- 목적: 매일 아침 갱신되는 개인 전문 뉴스 대시보드를 GitHub Pages로 배포
- 분야: Golf & Sports Tech / AI Agents & LLM / US-Korea Macro Economy

## 역할 분담
| 담당 | 책임 | 소유 파일 |
|---|---|---|
| Claude | 아키텍처 관리, 스키마 검증, GitHub Pages 배포 | `CLAUDE.md`, `SPEC.md`, `schema.json`, `scripts\*`, `.claudeignore`, `.claude\settings.json` |
| Antigravity (앱, 수동) | UI 구현, 첫 빌드 | `index.html`, `app.js`, `*.css` |
| Antigravity CLI (`agy -p`, 자동) | 일일 웹 리서치, 뉴스 데이터 작성 | `data\news.json` |

`agy`는 데스크톱 앱과 별개 제품이다(`winget install --id Google.AntigravityCLI -e`). 앱 내부의 `agentapi`는 앱 터미널에서만 동작하고, Gemini CLI는 무료 개인 계정에서 지원이 끊겨 쓰지 않는다.

## Claude 금지 사항
1. UI 직접 코딩 금지 — `index.html`, `app.js`, `*.css`를 작성·수정·열람하지 않는다.
2. 웹 리서치 직접 수행 금지 — 뉴스 검색·요약은 Antigravity 몫이다.
3. `data\*.json`을 직접 읽거나 쓰지 않는다. 데이터 상태는 `python scripts\validate_and_deploy.py --check` 출력으로만 확인한다.
4. UI·데이터 변경이 필요하면 `SPEC.md` 또는 `schema.json`을 고쳐 Antigravity에 지시한다.

## 토큰 원칙
- 목표: 사용량 30% 이하. 응답은 짧게, 보고는 요약으로.
- 큰 파일 내용 대신 검증 스크립트의 결과(통과/오류 목록)만 본다.

## 작업 흐름
1. `scripts\run_daily_pipeline.ps1` → `agy`가 `data\news.json` 갱신
2. `scripts\validate_and_deploy.py` → `schema.json` 기준 검증
3. 통과 시 `git add .` → `git commit -m "chore: daily market briefing update"` → `git push origin main`
4. 실패 시 배포하지 않고 오류 목록을 Antigravity에 전달해 재생성

## 변경 규칙
- 스키마를 바꾸면 `schema.json`, `SPEC.md`, 검증 스크립트를 함께 맞춘다.
- 배포 브랜치는 `main`, GitHub Pages 소스는 `main` 브랜치 루트(`/`).
