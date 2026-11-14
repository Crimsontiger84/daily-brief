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

## 3. UI 스펙 — 디자인은 Antigravity가 주도
### 3.1 기술 조건
- 정적 사이트: `index.html` + `app.js`. 빌드 단계 없음, GitHub Pages(main 브랜치 루트)에서 그대로 동작.
- Tailwind CSS는 CDN(`https://cdn.tailwindcss.com`)으로 불러오고 `tailwind.config`를 인라인으로 확장한다.
- 데이터는 `fetch('./data/news.json')` 상대 경로로 읽는다(절대 경로 금지 — Pages 하위 경로에서 깨진다).
- 외부 JS 프레임워크 없이 바닐라 JS. 기사 텍스트는 `textContent`로 넣어 HTML 주입을 막는다.

### 3.2 디자인 방향
- 색·서체·레이아웃·모션은 정해 두지 않는다. Antigravity가 최신 웹 디자인 트렌드를 웹 검색으로 조사한 뒤, 이 제품에 가장 어울리는 방향 하나를 골라 일관되게 적용한다.
- 제품 성격: 골프 테크 PM 한 사람이 매일 아침 5분 안에 읽는 개인 전문 브리핑. 신뢰감 있고 읽기 편해야 하며, 흔한 템플릿처럼 보이면 안 된다.
- 서체는 제목·본문·UI 모두 `Noto Sans KR` 하나로 통일한다(Google Fonts). 세리프 서체와 고정폭 서체는 쓰지 않고, 숫자도 `Noto Sans KR`의 `tabular-nums`로 처리한다.
- 분위기는 현대적이고 세련되게. 신문·종이 문서를 흉내 낸 요소(제호풍 세리프, 괘선 격자, `01 //` 식 번호 라벨, 대문자 고정폭 캡션, 종이색 배경)는 낡아 보이므로 쓰지 않는다.
- 한국어 본문이 주가 되므로 한글 가독성(행간, 줄 길이, 굵기 대비)을 최우선으로 한다.
- 라이트·다크 모드를 모두 제공한다(`prefers-color-scheme` 추종 + 토글).
- 세 카테고리는 색이나 형태로 한눈에 구분되어야 한다.
- 고른 방향과 근거를 `index.html` 맨 위 주석에 3줄 이내로 적는다.

### 3.3 반드시 들어가야 하는 내용 (배치와 표현은 자유)
- 제호, 오늘 날짜(한국어 요일 포함), `updated_at` 기준 마지막 갱신 시각, 다크 모드 토글
- `executive_summary`
- 총 기사 수, 카테고리별 기사 수, 평균 중요도
- 카테고리 필터, 정렬(중요도순·최신순), 제목·요약·태그 검색
- `importance_score`가 가장 높은 기사는 눈에 띄게
- 출처 고지("요약은 AI 생성, 원문 확인 필요")

### 3.4 기사마다 보여야 하는 정보
- `category`, `importance_score`
- `korean_title`, `original_title`
- `summary`
- `pm_insights` — 요약과 구분되어 보이게
- `source_name`, `published_date`, `tags`(클릭 시 해당 태그로 검색), 원문 링크(`target="_blank" rel="noopener noreferrer"`)

### 3.5 동작·품질 조건
- 로딩 중 스켈레톤, `fetch` 실패 시 안내 문구, 필터 결과가 없을 때 빈 상태 문구.
- 375px 폭에서 가로 스크롤 없음. 키보드 포커스 표시, 본문 대비 WCAG AA.
- 선택한 필터·정렬·다크 모드는 `localStorage`에 저장(실패해도 화면은 정상 동작).
- 인쇄 시 필터 바를 숨기고 1열로.

## 4. 완료 기준
- [ ] `python scripts\validate_and_deploy.py --check` 가 `PASS` 출력
- [ ] `index.html`을 로컬 서버(`python -m http.server 8000`)로 열었을 때 콘솔 오류 없음
- [ ] 모든 `source_url`이 실제로 열리는 기사 페이지

## 5. 추가 요구사항 (2026-11-14) — 앞 장과 충돌하면 이 장이 우선
### 5.1 뉴스 선정
- 카테고리마다 "그날 가장 화제가 된" 뉴스를 고른다. 여러 주요 매체가 동시에 다루거나 업계에서 가장 많이 언급되는 사건이 우선이다.
- 출처는 미국·영국 매체 위주로 한다(전체 기사의 80% 이상). 예: Reuters, Bloomberg, Financial Times, WSJ, BBC, The Guardian, The Verge, TechCrunch, Golf Digest, GolfWRX, MyGolfSpy, Sports Business Journal.
- 한국 매체는 한국 고유 사안(한국은행 결정, 한국 수출 통계 등)에 한해 최대 2건까지만 쓴다.
- `US-Korea Macro Economy`도 미국·영국 매체의 보도를 우선 인용한다.

### 5.2 영어 필드 (schema.json 에 필수로 추가됨)
| 필드 | 규칙 |
|---|---|
| `executive_summary_en` | `executive_summary`와 같은 내용의 영어 3~5문장 |
| `english_title` | 영어 제목. 원문이 영어라도 더 쉬운 말로 다시 쓴다 |
| `summary_en` | `summary`와 같은 내용의 영어 2~4문장 |
| `pm_insights_en` | `pm_insights`와 같은 내용의 영어 1~3문장 |

영어 작성 원칙: 중급 영어 학습자가 사전 없이 읽을 수 있어야 한다. 짧은 문장(가급적 20단어 이하), 흔한 단어, 능동태를 쓴다. 관용구·전문 용어·어려운 단어는 피하고, 꼭 필요한 전문 용어는 쉬운 말로 한 번 풀어 준다. 한국어 필드는 지금처럼 모두 채운다.

### 5.3 언어 토글 (UI)
- 화면 상단에 한국어/English 토글 버튼을 둔다. 기본값은 한국어.
- English로 바꾸면 화면의 모든 글이 영어로 바뀐다: 제목, 라벨, 버튼, 필터, 안내 문구, 날짜 표기, 그리고 기사 내용(`english_title`, `summary_en`, `pm_insights_en`, `executive_summary_en`).
- 영어 필드가 없는 예전 데이터는 한국어 필드로 대체해 깨지지 않게 한다.
- 선택은 `localStorage`에 저장하고 `<html lang>`도 함께 바꾼다. UI 문구는 쉬운 영어로 쓴다.

### 5.4 스크랩 (UI)
- 기사 카드마다 스크랩 버튼(북마크 아이콘)을 둔다. 누르면 저장, 다시 누르면 해제.
- 필터 바에 "스크랩" 보기를 추가하고 저장된 기사 수를 표시한다. 이 보기에서는 스크랩한 기사만 나온다.
- `data\news.json`은 매일 덮어써지므로, 스크랩할 때 기사 객체 전체와 스크랩 시각을 `localStorage`에 저장한다. 그래야 날짜가 지나도 스크랩한 기사를 계속 볼 수 있다.
- 스크랩 보기는 최근에 스크랩한 순으로 정렬하고, 언어 토글·검색이 똑같이 동작한다. 비어 있을 때는 안내 문구를 보여 준다.
- `localStorage`를 못 쓰는 환경에서도 화면은 정상 동작해야 한다.

### 5.5 고정 요소 금지
- 필터 바와 헤더는 스크롤하면 함께 올라가야 한다. 화면 상단에 고정(sticky/fixed)하지 않는다. 기사 읽기를 가린다.
