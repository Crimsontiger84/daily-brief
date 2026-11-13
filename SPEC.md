# SPEC.md — Antigravity 작업 지시서

첫 빌드(1장 A)는 Antigravity 앱에서, 일일 갱신(1장 B)은 Antigravity CLI(`agy -p`)가 무인으로 수행한다.

프로젝트 루트: `C:\Users\a\Documents\Tech`
이 문서와 `schema.json`이 유일한 기준이다. 둘이 충돌하면 `schema.json`이 우선한다.

## 0. 역할과 소유 범위
- 네가 만들고 고치는 파일: `data\news.json`, `index.html`, `app.js`, `styles.css`(필요 시)
- 건드리지 않는 파일: `CLAUDE.md`, `SPEC.md`, `schema.json`, `scripts\*`, `.claudeignore`, `.claude\*`
- Git 명령(add/commit/push)은 실행하지 않는다. 배포는 `scripts\validate_and_deploy.py`가 한다.

## 1. 작업 모드
### A. 첫 빌드 (1회)
1. `index.html`, `app.js`를 3장의 UI 스펙대로 만든다.
2. 2장의 리서치 규칙대로 `data\news.json`을 만든다.
3. `python scripts\validate_and_deploy.py --check`를 실행해 통과할 때까지 데이터를 고친다.

### B. 일일 갱신 (매일 아침, `run_daily_pipeline.ps1`이 호출)
- `data\news.json`만 새로 쓴다. UI 파일은 수정하지 않는다.

## 2. 뉴스 리서치 규칙
### 2.1 관심 분야 (카테고리 값은 철자 그대로)
| category | 다룰 주제 | 우선 출처 예시 |
|---|---|---|
| `Golf & Sports Tech` | 골프 시뮬레이터·런치 모니터(Golfzon, TrackMan, Foresight/GCQuad, Full Swing, Uneekor, Garmin, Rapsodo, SkyTrak), 스크린골프·실내 골프 사업, TGL 등 테크 리그, 스포츠 센서/비전/웨어러블, 투자·M&A·특허 | Golf Digest, GolfWRX, MyGolfSpy, Sports Business Journal, SportTechie, Front Office Sports, 각 사 보도자료 |
| `AI Agents & LLM` | 에이전트 프레임워크·코딩 에이전트, 주요 모델 출시(OpenAI, Anthropic, Google, Meta, xAI 및 한국 기업), 가격·벤치마크, 엔터프라이즈 도입 사례, 규제·안전 | 공식 블로그, The Information, TechCrunch, The Verge, Ars Technica, arXiv |
| `US-Korea Macro Economy` | 연준·한국은행 금리, CPI·고용·GDP, 원/달러 환율, 수출입·반도체 경기, 관세·통상 정책, 증시 흐름 | Financial Times, Bloomberg, Reuters, WSJ, 한국은행, 연합뉴스, 한국경제 |

### 2.2 선정 기준
- 기사 수: 총 8~12개, 카테고리당 최소 2개.
- 최신성: 최근 48시간 이내 발행 기사 우선. 부족하면 최대 7일까지 허용.
- 반드시 웹 검색으로 확인한 실제 기사만 쓴다. `source_url`은 직접 열어 본 원문 주소여야 하며, 추측·조합한 URL이나 기억에 의존한 내용은 금지한다.
- 같은 사건을 다룬 기사는 가장 원출처에 가까운 하나만 싣는다.
- 확인하지 못한 수치는 쓰지 않는다.

### 2.3 필드 작성법
| 필드 | 규칙 |
|---|---|
| `updated_at` | 생성 시각, ISO 8601 KST. 예: `2026-11-13T07:00:00+09:00` |
| `executive_summary` | 한국어 3~5문장. 세 분야를 관통하는 오늘의 흐름 |
| `id` | `YYYY-MM-DD-<golf|ai|macro>-NN`, 중복 금지 |
| `importance_score` | 1~10 정수. 9~10 사업 판단에 즉시 영향 / 6~8 주목 / 1~5 참고 |
| `published_date` | 원문 발행일 `YYYY-MM-DD` |
| `original_title` | 원문 제목 그대로 |
| `korean_title` | 자연스러운 한국어 제목 (직역 금지) |
| `summary` | 한국어 2~4문장, 사실과 수치 중심 |
| `pm_insights` | 한국어 1~3문장. 골프 시뮬레이터/스포츠 테크 제품 PM에게 주는 시사점(기회·위협·해볼 일) |
| `tags` | 1~6개 짧은 키워드 |

- 스키마에 없는 필드는 추가하지 않는다. 파일은 UTF-8(BOM 없음), 유효한 JSON이어야 한다.
- `articles`는 `importance_score` 내림차순으로 정렬한다.

## 3. UI 스펙 — Financial Times + Morning Brew 스타일
### 3.1 기술 조건
- 정적 사이트: `index.html` + `app.js`. 빌드 단계 없음, GitHub Pages(main 브랜치 루트)에서 그대로 동작.
- Tailwind CSS는 CDN(`https://cdn.tailwindcss.com`)으로 불러오고 `tailwind.config`를 인라인으로 확장한다.
- 데이터는 `fetch('./data/news.json')` 상대 경로로 읽는다(절대 경로 금지 — Pages 하위 경로에서 깨진다).
- 외부 JS 프레임워크 없이 바닐라 JS. 기사 텍스트는 `textContent`로 넣어 HTML 주입을 막는다.

### 3.2 디자인 토큰
| 항목 | 값 |
|---|---|
| 배경 | FT 살몬 `#FFF1E5`, 카드 `#FFF7EF`, 구분선 `#E6D9CE` |
| 본문 색 | `#33302E`, 보조 `#66605C` |
| 강조 | FT 클라렛 `#990F3D`, 링크 틸 `#0D7680` |
| 다크 모드 | 배경 `#1A1817`, 카드 `#262321`, 본문 `#F2E9E1` (`prefers-color-scheme` 추종 + 토글) |
| 제목 서체 | 세리프: `Playfair Display`, 한글 `Noto Serif KR` |
| 본문 서체 | 산세리프: `Inter`, 한글 `Pretendard` 또는 `Noto Sans KR` |
| 카테고리 색 | Golf `#0F7B4F` / AI `#3B5BDB` / Macro `#B45309` |

### 3.3 화면 구성 (위에서 아래)
1. **마스트헤드**: 신문 제호 느낌의 세리프 로고(가칭 "The Daily Brief"), 오늘 날짜(한국어 요일 포함), `updated_at` 기준 "마지막 갱신" 표시, 다크 모드 토글. 아래에 가는 이중 괘선.
2. **Executive Summary**: Morning Brew처럼 친근한 인사 한 줄 + `executive_summary`를 큰 세리프 본문으로. 왼쪽에 클라렛 세로 막대.
3. **지표 줄**: 총 기사 수, 카테고리별 기사 수, 평균 중요도를 작은 숫자 타일로.
4. **필터 바**(스크롤 시 상단 고정): 전체/3개 카테고리 탭, 정렬(중요도순·최신순), 제목·요약·태그 대상 검색창.
5. **톱 스토리**: `importance_score`가 가장 높은 기사 1개를 전폭 대형 카드로.
6. **기사 그리드**: 데스크톱 3열, 태블릿 2열, 모바일 1열.
7. **푸터**: 출처 고지("요약은 AI 생성, 원문 확인 필요"), 생성 시각.

### 3.4 기사 카드
- 상단: 카테고리 색 라벨(대문자 소형), 중요도 배지(예: `8/10`, 9 이상은 클라렛으로 강조)
- `korean_title`(세리프, 굵게) → `original_title`(작은 회색 이탤릭)
- `summary` 본문
- **PM Insight** 박스: 옅은 배경 + 왼쪽 강조선, `pm_insights` 표시
- 하단: `source_name` · `published_date`, 태그 칩(클릭 시 해당 태그로 검색), "원문 보기 →" 링크(`target="_blank" rel="noopener noreferrer"`)

### 3.5 동작·품질 조건
- 로딩 중 스켈레톤, `fetch` 실패 시 안내 문구, 필터 결과가 없을 때 빈 상태 문구.
- 375px 폭에서 가로 스크롤 없음. 키보드 포커스 표시, 본문 대비 WCAG AA.
- 선택한 필터·정렬·다크 모드는 `localStorage`에 저장(실패해도 화면은 정상 동작).
- 인쇄 시 필터 바를 숨기고 1열로.

## 4. 완료 기준
- [ ] `python scripts\validate_and_deploy.py --check` 가 `PASS` 출력
- [ ] `index.html`을 로컬 서버(`python -m http.server 8000`)로 열었을 때 콘솔 오류 없음
- [ ] 모든 `source_url`이 실제로 열리는 기사 페이지
