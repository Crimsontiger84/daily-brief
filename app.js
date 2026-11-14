/**
 * PM 인텔리전스 브리핑 — app.js
 * Calm SaaS Intelligence & Soft Layered Bento
 * SPEC.md 3장 및 5.3(언어 토글), 5.4(스크랩) 규격 준수
 * 바닐라 JS, 상대 경로 fetch('./data/news.json'), 모든 텍스트 textContent 바인딩, 정적 Tailwind 클래스만 사용
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'daily_brief_theme',
    CATEGORY: 'daily_brief_category',
    SORT: 'daily_brief_sort',
    LANG: 'daily_brief_lang',
    SCRAPS: 'daily_brief_scraps'
  };

  const UI_TEXT = {
    ko: {
      docTitle: 'PM 데일리 인텔리전스 브리핑',
      headerBadge: '일일 프로덕트 전략 대시보드',
      headerTitle: 'PM 인텔리전스 브리핑',
      headerSubtitle: '골프·스포츠 테크, AI 에이전트, 한·미 거시경제 핵심 동향과 제품 시사점',
      todayLabel: '오늘',
      lastUpdatedPrefix: '마지막 갱신: ',
      langToggleAria: '언어 전환 (한국어 / English)',
      langKoLabel: '한국어',
      langEnLabel: 'English',
      themeToggleAria: '다크 모드 전환',
      lightMode: '라이트 모드',
      darkMode: '다크 모드',
      overviewAria: '오늘의 핵심 흐름 및 브리핑 지표',
      execSummaryHeading: '오늘의 핵심 흐름',
      execSummaryBadge: '3대 분야 종합 요약',
      catLegendLabel: '카테고리 구분:',
      metricsHeading: '브리핑 지표 요약',
      statTotalLabel: '총 기사 수',
      statAvgLabel: '평균 중요도',
      ratioBarLabel: '분야별 기사 비중',
      ratioBarHint: '카드를 눌러 분야별 필터링',
      filterBarAria: '기사 필터 및 검색',
      categoryTabsAria: '카테고리 필터',
      tabAll: '전체',
      tabScrap: '★ 스크랩',
      sortLabel: '정렬',
      sortSelectAria: '기사 정렬 기준',
      sortImportance: '중요도순',
      sortLatest: '최신순',
      searchPlaceholder: '제목, 요약, 태그 검색... (/ 키)',
      searchAria: '제목, 요약, 태그 검색',
      searchClearAria: '검색어 지우기',
      inlineResetBtn: '필터 전체 초기화 ↺',
      loadingAria: '기사 불러오는 중',
      errorHeading: '브리핑 데이터를 불러오지 못했습니다',
      errorDefaultMsg: '데이터 파일(./data/news.json)을 읽는 중 문제가 발생했습니다. 서버 실행 상태를 확인해 주세요.',
      retryBtn: '다시 시도',
      emptyFilterHeading: '선택한 조건에 일치하는 기사가 없습니다',
      emptyFilterDesc: '다른 카테고리를 선택하거나 검색어를 초기화해 보세요.',
      emptyFilterBtn: '필터 초기화',
      emptyScrapHeading: '아직 스크랩한 기사가 없습니다',
      emptyScrapDesc: '기사 카드 우측 상단의 스크랩 버튼을 눌러 나중에 다시 볼 기사를 저장해 보세요.',
      emptyScrapBtn: '전체 기사 보기',
      topStorySectionAria: '최고 중요도 핵심 기사',
      topStoryBadge: '최우선 주목 브리핑',
      topStoryHeading: '오늘 가장 중요도가 높은 핵심 기사',
      gridSectionAria: '전체 브리핑 기사 목록',
      gridHeadingDefault: '분야별 브리핑 피드',
      gridHeadingScrap: '스크랩한 기사 보관함',
      footerDisclaimerTitle: '출처 고지: 요약은 AI 생성, 원문 확인 필요',
      footerDisclaimerBody:
        '본 대시보드의 요약과 PM 시사점은 빠른 파악을 돕기 위해 AI로 작성되었습니다. 의사결정 시 반드시 각 기사의 원문 링크를 통해 정확한 사실과 수치를 확인하시기 바랍니다.',
      footerUpdatedPrefix: '생성 시각: ',
      backToTop: '↑ 맨 위로 이동',
      pmHeadingHero: 'PM 시사점 · 프로덕트 전략 인사이트',
      pmHeadingCard: 'PM 시사점',
      readOriginal: '원문 보기 ↗',
      scrapBtnLabel: '스크랩',
      scrappedBtnLabel: '스크랩됨',
      scrapBtnAriaSave: '기사 스크랩',
      scrapBtnAriaRemove: '스크랩 해제',
      scrappedTimePrefix: '스크랩: '
    },
    en: {
      docTitle: 'Daily PM News Briefing',
      headerBadge: 'Daily Product Dashboard',
      headerTitle: 'Daily PM News Briefing',
      headerSubtitle: 'Key news and product tips in golf tech, AI agents, and the US-Korea economy',
      todayLabel: 'Today',
      lastUpdatedPrefix: 'Updated: ',
      langToggleAria: 'Switch language (Korean / English)',
      langKoLabel: 'Korean',
      langEnLabel: 'English',
      themeToggleAria: 'Switch color theme',
      lightMode: 'Light mode',
      darkMode: 'Dark mode',
      overviewAria: 'Daily summary and key stats',
      execSummaryHeading: 'Today at a Glance',
      execSummaryBadge: '3 Key Areas',
      catLegendLabel: 'Categories:',
      metricsHeading: 'Briefing Stats',
      statTotalLabel: 'Total Articles',
      statAvgLabel: 'Avg. Score',
      ratioBarLabel: 'Share by Category',
      ratioBarHint: 'Click a card to filter',
      filterBarAria: 'Filter and search articles',
      categoryTabsAria: 'Category filter',
      tabAll: 'All',
      tabScrap: '★ Scrap',
      sortLabel: 'Sort',
      sortSelectAria: 'Sort articles by',
      sortImportance: 'Most Important',
      sortLatest: 'Newest First',
      searchPlaceholder: 'Search title, summary, tags... (Press /)',
      searchAria: 'Search title, summary, and tags',
      searchClearAria: 'Clear search',
      inlineResetBtn: 'Reset filters ↺',
      loadingAria: 'Loading articles',
      errorHeading: 'Could not load the news briefing',
      errorDefaultMsg: 'Could not read ./data/news.json. Please check if the server is running.',
      retryBtn: 'Try again',
      emptyFilterHeading: 'No articles match your filter',
      emptyFilterDesc: 'Try choosing another category or clearing your search.',
      emptyFilterBtn: 'Reset filters',
      emptyScrapHeading: 'No saved articles yet',
      emptyScrapDesc: 'Click the Scrap button on any article card to save it here for later.',
      emptyScrapBtn: 'View all articles',
      topStorySectionAria: 'Top story',
      topStoryBadge: 'Top Pick',
      topStoryHeading: 'Most Important Story Today',
      gridSectionAria: 'Briefing article list',
      gridHeadingDefault: 'Briefing Feed',
      gridHeadingScrap: 'Saved Articles (Scrap)',
      footerDisclaimerTitle: 'Note: Summaries are written by AI. Please check the original articles.',
      footerDisclaimerBody:
        'The summaries and PM insights on this page are generated by AI to help you read quickly. Before making business decisions, please open the original source links to check all facts and numbers.',
      footerUpdatedPrefix: 'Created at: ',
      backToTop: '↑ Back to top',
      pmHeadingHero: 'PM Insights · Product Strategy',
      pmHeadingCard: 'PM Insights',
      readOriginal: 'Read original ↗',
      scrapBtnLabel: 'Scrap',
      scrappedBtnLabel: 'Saved',
      scrapBtnAriaSave: 'Save article to scrap',
      scrapBtnAriaRemove: 'Remove article from scrap',
      scrappedTimePrefix: 'Saved: '
    }
  };

  const TAB_CLASSES = {
    inactive:
      'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-slate-100 bg-surface-subtle dark:bg-slate-800 dark:bg-surface-darkSubtle text-slate-700 text-ink-body dark:text-slate-300 dark:text-ink-darkBody hover:bg-slate-200 dark:hover:bg-surface-darkMuted transition-all duration-150 tabular-nums',
    activeAll:
      'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border bg-slate-900 bg-ink-primary text-white border-slate-900 border-ink-primary dark:bg-slate-50 dark:bg-ink-darkPrimary dark:text-slate-950 dark:text-canvas-dark dark:border-slate-50 dark:border-ink-darkPrimary shadow-sm transition-all duration-150 tabular-nums',
    activeScrap:
      'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border bg-blue-600 bg-accent text-white border-blue-600 border-accent dark:bg-blue-400 dark:bg-accent-dark dark:text-slate-950 dark:text-canvas-dark dark:border-blue-400 dark:border-accent-dark shadow-sm transition-all duration-150 tabular-nums'
  };

  const CATEGORY_META = {
    'Golf & Sports Tech': {
      symbol: '●',
      label: 'Golf & Sports Tech',
      heroBadgeClass:
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border rounded-full bg-cat-golfBg text-cat-golfText border-cat-golfBorder dark:bg-cat-golfDarkBg/60 dark:text-cat-golfDarkText dark:border-cat-golfDarkBorder/50',
      cardBadgeClass:
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border truncate rounded-full bg-cat-golfBg text-cat-golfText border-cat-golfBorder dark:bg-cat-golfDarkBg/60 dark:text-cat-golfDarkText dark:border-cat-golfDarkBorder/50',
      activeTabClass:
        'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 tabular-nums bg-emerald-800 bg-cat-golfText text-white border-emerald-800 border-cat-golfText dark:bg-emerald-500 dark:bg-cat-golfAccent dark:text-slate-950 dark:text-canvas-dark dark:border-emerald-500 dark:border-cat-golfAccent shadow-sm',
      pmBoxClass:
        'rounded-xl p-4 border bg-cat-golfBg/45 dark:bg-cat-golfDarkBg/25 border-cat-golfBorder/80 dark:border-cat-golfDarkBorder/40',
      pmDotClass: 'w-2 h-2 rounded-full bg-cat-golfAccent',
      pmLabelClass: 'text-xs font-bold text-cat-golfText dark:text-cat-golfDarkText'
    },
    'AI Agents & LLM': {
      symbol: '◆',
      label: 'AI Agents & LLM',
      heroBadgeClass:
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border rounded-lg bg-cat-aiBg text-cat-aiText border-cat-aiBorder dark:bg-cat-aiDarkBg/60 dark:text-cat-aiDarkText dark:border-cat-aiDarkBorder/50',
      cardBadgeClass:
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border truncate rounded-lg bg-cat-aiBg text-cat-aiText border-cat-aiBorder dark:bg-cat-aiDarkBg/60 dark:text-cat-aiDarkText dark:border-cat-aiDarkBorder/50',
      activeTabClass:
        'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 tabular-nums bg-indigo-800 bg-cat-aiText text-white border-indigo-800 border-cat-aiText dark:bg-indigo-400 dark:text-slate-950 dark:text-canvas-dark dark:border-indigo-400 shadow-sm',
      pmBoxClass:
        'rounded-xl p-4 border bg-cat-aiBg/45 dark:bg-cat-aiDarkBg/25 border-cat-aiBorder/80 dark:border-cat-aiDarkBorder/40',
      pmDotClass: 'w-2 h-2 rounded-full bg-cat-aiAccent',
      pmLabelClass: 'text-xs font-bold text-cat-aiText dark:text-cat-aiDarkText'
    },
    'US-Korea Macro Economy': {
      symbol: '■',
      label: 'US-Korea Macro Economy',
      heroBadgeClass:
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border rounded-md bg-cat-macroBg text-cat-macroText border-cat-macroBorder dark:bg-cat-macroDarkBg/60 dark:text-cat-macroDarkText dark:border-cat-macroDarkBorder/50',
      cardBadgeClass:
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border truncate rounded-md bg-cat-macroBg text-cat-macroText border-cat-macroBorder dark:bg-cat-macroDarkBg/60 dark:text-cat-macroDarkText dark:border-cat-macroDarkBorder/50',
      activeTabClass:
        'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 tabular-nums bg-amber-800 bg-cat-macroText text-white border-amber-800 border-cat-macroText dark:bg-amber-500 dark:bg-cat-macroAccent dark:text-slate-950 dark:text-canvas-dark dark:border-amber-500 dark:border-cat-macroAccent shadow-sm',
      pmBoxClass:
        'rounded-xl p-4 border bg-cat-macroBg/55 dark:bg-cat-macroDarkBg/25 border-cat-macroBorder/80 dark:border-cat-macroDarkBorder/40',
      pmDotClass: 'w-2 h-2 rounded-full bg-cat-macroAccent',
      pmLabelClass: 'text-xs font-bold text-cat-macroText dark:text-cat-macroDarkText'
    }
  };

  const DEFAULT_CAT_META = {
    symbol: '●',
    label: '',
    heroBadgeClass:
      'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border rounded-full bg-surface-subtle text-ink-primary border-slate-200',
    cardBadgeClass:
      'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border truncate rounded-full bg-surface-subtle text-ink-primary border-slate-200',
    pmBoxClass: 'rounded-xl p-4 border bg-surface-subtle border-slate-200',
    pmDotClass: 'w-2 h-2 rounded-full bg-accent',
    pmLabelClass: 'text-xs font-bold text-accent dark:text-accent-dark'
  };

  const state = {
    articles: [],
    scraps: [],
    updatedAt: '',
    executiveSummary: '',
    executiveSummaryEn: '',
    category: 'all',
    sort: 'importance',
    search: '',
    darkMode: false,
    lang: 'ko',
    hasLoadedData: false,
    lastError: ''
  };

  function t() {
    return state.lang === 'en' ? UI_TEXT.en : UI_TEXT.ko;
  }

  function pickArticleField(enValue, koValue) {
    if (state.lang === 'en') {
      const cleanEn = typeof enValue === 'string' ? enValue.trim() : '';
      if (cleanEn.length > 0) {
        return cleanEn;
      }
    }
    const cleanKo = typeof koValue === 'string' ? koValue.trim() : '';
    if (cleanKo.length > 0) {
      return cleanKo;
    }
    return typeof enValue === 'string' ? enValue.trim() : '';
  }

  function getStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // localStorage 접근 불가 시에도 화면 정상 동작 보장 (SPEC.md 3.5 & 5.4)
    }
  }

  function formatTodayDate(dateObj) {
    if (state.lang === 'en') {
      const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mName = monthsEn[dateObj.getMonth()];
      const d = dateObj.getDate();
      const y = dateObj.getFullYear();
      const dayName = daysEn[dateObj.getDay()];
      return `${mName} ${d}, ${y} (${dayName})`;
    }
    const daysKo = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayName = daysKo[dateObj.getDay()];
    return `${y}년 ${m}월 ${d}일 (${dayName})`;
  }

  function formatTimestamp(isoString) {
    if (!isoString) return '-';
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) return isoString;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const mm = String(parsed.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }

  function normalizeScrapEntry(raw, indexFallback) {
    if (!raw || typeof raw !== 'object') return null;
    const baseArticle =
      raw.article && typeof raw.article === 'object' ? raw.article : raw;
    const id = String(
      baseArticle.id || raw.id || baseArticle.source_url || baseArticle.original_title || ''
    );
    if (!id) return null;

    const scrappedAt = String(
      raw.scrapped_at || raw.saved_at || raw.scrappedAt || raw.savedAt || new Date().toISOString()
    );
    const parsedMs = new Date(scrappedAt).getTime();
    const scrappedOrder =
      typeof raw.scrapped_order === 'number'
        ? raw.scrapped_order
        : Number.isFinite(parsedMs)
        ? parsedMs
        : Date.now() - (indexFallback || 0);

    const cleanArticle = {
      id,
      category: baseArticle.category || '',
      importance_score: Number(baseArticle.importance_score) || 0,
      published_date: baseArticle.published_date || '',
      source_name: baseArticle.source_name || '',
      source_url: baseArticle.source_url || '#',
      original_title: baseArticle.original_title || '',
      korean_title: baseArticle.korean_title || '',
      summary: baseArticle.summary || '',
      pm_insights: baseArticle.pm_insights || '',
      english_title: baseArticle.english_title || '',
      summary_en: baseArticle.summary_en || '',
      pm_insights_en: baseArticle.pm_insights_en || '',
      tags: Array.isArray(baseArticle.tags) ? baseArticle.tags.slice() : []
    };

    return {
      ...cleanArticle,
      scrapped_at: scrappedAt,
      saved_at: scrappedAt,
      scrappedAt: scrappedAt,
      scrapped_order: scrappedOrder,
      article: { ...cleanArticle }
    };
  }

  function initScraps() {
    const rawJson = getStorage(STORAGE_KEYS.SCRAPS, null);
    if (!rawJson) {
      state.scraps = [];
      return;
    }
    try {
      const parsed = JSON.parse(rawJson);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object'
        ? Object.values(parsed)
        : [];
      const normalized = list
        .map((item, idx) => normalizeScrapEntry(item, idx))
        .filter(Boolean);
      normalized.sort((a, b) => (b.scrapped_order || 0) - (a.scrapped_order || 0));
      state.scraps = normalized;
    } catch (_) {
      state.scraps = [];
    }
  }

  function saveScraps() {
    setStorage(STORAGE_KEYS.SCRAPS, JSON.stringify(state.scraps));
  }

  function enrichScrapsWithFetchedArticles(fetchedArticles) {
    if (!Array.isArray(fetchedArticles) || state.scraps.length === 0) return;
    const byId = new Map();
    fetchedArticles.forEach((art) => {
      if (art && art.id) {
        byId.set(String(art.id), art);
      }
    });

    let updated = false;
    state.scraps = state.scraps.map((entry) => {
      const fresh = byId.get(String(entry.id));
      if (!fresh) return entry;
      const merged = normalizeScrapEntry(
        {
          ...fresh,
          ...entry,
          english_title: entry.english_title || fresh.english_title || '',
          summary_en: entry.summary_en || fresh.summary_en || '',
          pm_insights_en: entry.pm_insights_en || fresh.pm_insights_en || '',
          scrapped_at: entry.scrapped_at,
          scrapped_order: entry.scrapped_order
        },
        0
      );
      updated = true;
      return merged || entry;
    });

    if (updated) {
      saveScraps();
    }
  }

  function getScrapEntry(articleId) {
    if (!articleId) return null;
    return state.scraps.find((item) => item.id === String(articleId)) || null;
  }

  function isScrapped(articleId) {
    return Boolean(getScrapEntry(articleId));
  }

  function toggleScrap(article) {
    if (!article) return;
    const articleId = String(
      article.id || article.source_url || article.original_title || ''
    );
    if (!articleId) return;

    if (isScrapped(articleId)) {
      state.scraps = state.scraps.filter((item) => item.id !== articleId);
    } else {
      const nowIso = new Date().toISOString();
      const topOrder = state.scraps.reduce(
        (max, item) => Math.max(max, Number(item.scrapped_order) || 0),
        Date.now()
      );
      const newEntry = normalizeScrapEntry(
        {
          ...article,
          id: articleId,
          scrapped_at: nowIso,
          scrapped_order: topOrder + 1
        },
        0
      );
      if (newEntry) {
        state.scraps.unshift(newEntry);
      }
    }

    saveScraps();
    updateCategoryTabsUI();
    renderArticles();
  }

  function initLang() {
    const saved = getStorage(STORAGE_KEYS.LANG, 'ko');
    state.lang = saved === 'en' ? 'en' : 'ko';
    applyLanguageUI();
  }

  function toggleLang() {
    state.lang = state.lang === 'ko' ? 'en' : 'ko';
    setStorage(STORAGE_KEYS.LANG, state.lang);
    applyLanguageUI();
    renderMetrics(state.articles);
    updateCategoryTabsUI();
    renderArticles();
  }

  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  }

  function setAttrById(id, attr, value) {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute(attr, value);
    }
  }

  function applyLanguageUI() {
    const strings = t();
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'ko';
    document.title = strings.docTitle;

    setTextById('header-badge-text', strings.headerBadge);
    setTextById('header-title', strings.headerTitle);
    setTextById('header-subtitle', strings.headerSubtitle);
    setTextById('today-label', strings.todayLabel);
    setTextById('today-date', formatTodayDate(new Date()));

    const formattedUpdated = formatTimestamp(state.updatedAt);
    setTextById('last-updated', `${strings.lastUpdatedPrefix}${formattedUpdated}`);
    setTextById('footer-updated-at', `${strings.footerUpdatedPrefix}${formattedUpdated}`);

    const langToggle = document.getElementById('lang-toggle');
    const langOptKo = document.getElementById('lang-opt-ko');
    const langOptEn = document.getElementById('lang-opt-en');
    if (langToggle) {
      langToggle.setAttribute('aria-label', strings.langToggleAria);
      langToggle.setAttribute('aria-pressed', state.lang === 'en' ? 'true' : 'false');
    }
    if (langOptKo) {
      langOptKo.textContent = strings.langKoLabel;
      langOptKo.className =
        state.lang === 'ko'
          ? 'font-bold text-accent dark:text-accent-dark'
          : 'font-medium text-ink-muted dark:text-ink-darkMuted';
    }
    if (langOptEn) {
      langOptEn.textContent = strings.langEnLabel;
      langOptEn.className =
        state.lang === 'en'
          ? 'font-bold text-accent dark:text-accent-dark'
          : 'font-medium text-ink-muted dark:text-ink-darkMuted';
    }

    setAttrById('overview-section', 'aria-label', strings.overviewAria);
    setTextById('exec-summary-heading', strings.execSummaryHeading);
    setTextById('exec-summary-badge', strings.execSummaryBadge);
    setTextById('cat-legend-label', strings.catLegendLabel);
    setTextById('metrics-heading', strings.metricsHeading);
    setTextById('stat-total-label', strings.statTotalLabel);
    setTextById('stat-avg-label', strings.statAvgLabel);
    setTextById('ratio-bar-label', strings.ratioBarLabel);
    setTextById('ratio-bar-hint', strings.ratioBarHint);

    setAttrById('filter-bar', 'aria-label', strings.filterBarAria);
    setAttrById('category-tabs', 'aria-label', strings.categoryTabsAria);
    setTextById('sort-label', strings.sortLabel);
    setAttrById('sort-select', 'aria-label', strings.sortSelectAria);
    setTextById('sort-opt-importance', strings.sortImportance);
    setTextById('sort-opt-latest', strings.sortLatest);

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.placeholder = strings.searchPlaceholder;
      searchInput.setAttribute('aria-label', strings.searchAria);
    }
    setAttrById('search-clear', 'aria-label', strings.searchClearAria);
    setTextById('inline-reset-btn', strings.inlineResetBtn);

    setAttrById('loading-skeleton', 'aria-label', strings.loadingAria);
    setTextById('error-heading', strings.errorHeading);
    if (state.lastError) {
      setTextById(
        'error-message',
        state.lang === 'en'
          ? `Could not load ./data/news.json (${state.lastError}).`
          : `데이터(./data/news.json)를 불러오지 못했습니다 (${state.lastError}).`
      );
    } else {
      setTextById('error-message', strings.errorDefaultMsg);
    }
    setTextById('retry-btn', strings.retryBtn);

    setAttrById('top-story-section', 'aria-label', strings.topStorySectionAria);
    setTextById('top-story-badge', strings.topStoryBadge);
    setTextById('top-story-heading', strings.topStoryHeading);
    setAttrById('articles-grid-section', 'aria-label', strings.gridSectionAria);

    setTextById('footer-disclaimer-title', strings.footerDisclaimerTitle);
    setTextById('footer-disclaimer-body', strings.footerDisclaimerBody);
    setTextById('back-to-top', strings.backToTop);

    const execText = document.getElementById('exec-summary-text');
    if (execText && state.hasLoadedData) {
      execText.textContent = pickArticleField(
        state.executiveSummaryEn,
        state.executiveSummary
      );
    }

    applyTheme();
  }

  function initTheme() {
    const saved = getStorage(STORAGE_KEYS.THEME, null);
    if (saved === 'dark') {
      state.darkMode = true;
    } else if (saved === 'light') {
      state.darkMode = false;
    } else {
      state.darkMode =
        Boolean(window.matchMedia) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();

    if (window.matchMedia) {
      try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', (e) => {
          if (getStorage(STORAGE_KEYS.THEME, null) === null) {
            state.darkMode = e.matches;
            applyTheme();
          }
        });
      } catch (_) {
        // 구형 브라우저 호환
      }
    }
  }

  function applyTheme() {
    const root = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    const toggleBtn = document.getElementById('theme-toggle');
    const strings = t();

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', strings.themeToggleAria);
    }

    if (state.darkMode) {
      root.classList.add('dark');
      if (icon) icon.textContent = '☀';
      if (label) label.textContent = strings.lightMode;
      if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      root.classList.remove('dark');
      if (icon) icon.textContent = '☾';
      if (label) label.textContent = strings.darkMode;
      if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  function toggleTheme() {
    state.darkMode = !state.darkMode;
    setStorage(STORAGE_KEYS.THEME, state.darkMode ? 'dark' : 'light');
    applyTheme();
  }

  function initFilters() {
    const validCategories = [
      'all',
      'Golf & Sports Tech',
      'AI Agents & LLM',
      'US-Korea Macro Economy',
      'scrap'
    ];
    const savedCat = getStorage(STORAGE_KEYS.CATEGORY, 'all');
    state.category = validCategories.includes(savedCat) ? savedCat : 'all';

    const savedSort = getStorage(STORAGE_KEYS.SORT, 'importance');
    state.sort = savedSort === 'latest' ? 'latest' : 'importance';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.value = state.sort;
    }
    updateCategoryTabsUI();
  }

  function updateCategoryTabsUI() {
    const tabs = document.querySelectorAll('.cat-tab');
    const strings = t();
    const counts = {
      all: state.articles.length,
      'Golf & Sports Tech': state.articles.filter((a) => a.category === 'Golf & Sports Tech').length,
      'AI Agents & LLM': state.articles.filter((a) => a.category === 'AI Agents & LLM').length,
      'US-Korea Macro Economy': state.articles.filter((a) => a.category === 'US-Korea Macro Economy').length,
      scrap: state.scraps.length
    };

    tabs.forEach((tab) => {
      const cat = tab.getAttribute('data-category') || 'all';
      const active = cat === state.category;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');

      const meta = CATEGORY_META[cat];
      const countSuffix = state.articles.length > 0 ? ` ${counts[cat] ?? 0}` : '';

      if (cat === 'all') {
        tab.textContent = `${strings.tabAll}${countSuffix}`;
      } else if (cat === 'scrap') {
        tab.textContent = `${strings.tabScrap} ${counts.scrap}`;
      } else if (meta) {
        tab.textContent = `${meta.symbol} ${meta.label}${countSuffix}`;
      }

      if (active) {
        if (cat === 'all') {
          tab.className = TAB_CLASSES.activeAll;
        } else if (cat === 'scrap') {
          tab.className = TAB_CLASSES.activeScrap;
        } else if (meta) {
          tab.className = meta.activeTabClass;
        }
      } else {
        tab.className = TAB_CLASSES.inactive;
      }
    });

    const metricBtns = document.querySelectorAll('.metric-cat-btn');
    metricBtns.forEach((btn) => {
      const cat = btn.getAttribute('data-metric-category');
      const isSelected = state.category === cat;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (isSelected) {
        btn.classList.add('ring-2', 'ring-accent', 'dark:ring-accent-dark');
      } else {
        btn.classList.remove('ring-2', 'ring-accent', 'dark:ring-accent-dark');
      }
    });
  }

  function renderMetrics(articles) {
    const list = Array.isArray(articles) ? articles : [];
    const total = list.length;
    const golf = list.filter((a) => a.category === 'Golf & Sports Tech').length;
    const ai = list.filter((a) => a.category === 'AI Agents & LLM').length;
    const macro = list.filter((a) => a.category === 'US-Korea Macro Economy').length;
    const highPriority = list.filter((a) => (Number(a.importance_score) || 0) >= 9).length;
    const avg =
      total > 0
        ? (
            list.reduce((sum, a) => sum + (Number(a.importance_score) || 0), 0) / total
          ).toFixed(1)
        : '0.0';

    const elTotal = document.getElementById('stat-total');
    const elGolf = document.getElementById('stat-golf');
    const elAi = document.getElementById('stat-ai');
    const elMacro = document.getElementById('stat-macro');
    const elAvg = document.getElementById('stat-avg');
    const elHigh = document.getElementById('stat-high-priority');

    if (!state.hasLoadedData && total === 0) {
      if (elTotal) elTotal.textContent = '-';
      if (elGolf) elGolf.textContent = '-';
      if (elAi) elAi.textContent = '-';
      if (elMacro) elMacro.textContent = '-';
      if (elAvg) elAvg.textContent = '-';
      if (elHigh) {
        elHigh.textContent = state.lang === 'en' ? 'Top (9+) -' : '핵심(9점+) -건';
      }
      return;
    }

    if (state.lang === 'en') {
      if (elTotal) elTotal.textContent = `${total}`;
      if (elGolf) elGolf.textContent = `${golf}`;
      if (elAi) elAi.textContent = `${ai}`;
      if (elMacro) elMacro.textContent = `${macro}`;
      if (elAvg) elAvg.textContent = `${avg} / 10`;
      if (elHigh) elHigh.textContent = `Top (9+) ${highPriority}`;
    } else {
      if (elTotal) elTotal.textContent = `${total}건`;
      if (elGolf) elGolf.textContent = `${golf}건`;
      if (elAi) elAi.textContent = `${ai}건`;
      if (elMacro) elMacro.textContent = `${macro}건`;
      if (elAvg) elAvg.textContent = `${avg} / 10`;
      if (elHigh) elHigh.textContent = `핵심(9점+) ${highPriority}건`;
    }

    if (total > 0) {
      const barGolf = document.getElementById('bar-golf');
      const barAi = document.getElementById('bar-ai');
      const barMacro = document.getElementById('bar-macro');
      if (barGolf) barGolf.style.width = `${(golf / total) * 100}%`;
      if (barAi) barAi.style.width = `${(ai / total) * 100}%`;
      if (barMacro) barMacro.style.width = `${(macro / total) * 100}%`;
    }
  }

  function createScoreBadge(score, isHero) {
    const wrap = document.createElement('div');
    wrap.className = 'inline-flex items-center gap-2';

    if (isHero) {
      const meter = document.createElement('div');
      meter.className = 'hidden sm:flex items-center gap-1';
      meter.setAttribute('aria-hidden', 'true');

      for (let i = 1; i <= 10; i += 1) {
        const dot = document.createElement('span');
        if (i <= score) {
          dot.className =
            score >= 9
              ? 'w-1.5 h-3 rounded-full bg-accent dark:bg-accent-dark'
              : 'w-1.5 h-3 rounded-full bg-ink-primary dark:bg-ink-darkPrimary';
        } else {
          dot.className = 'w-1.5 h-3 rounded-full bg-slate-200 dark:bg-slate-700';
        }
        meter.appendChild(dot);
      }
      wrap.appendChild(meter);
    }

    const badge = document.createElement('span');
    const scoreText =
      state.lang === 'en' ? `Score ${score} / 10` : `중요도 ${score} / 10`;

    if (score >= 9) {
      badge.className =
        'px-2.5 py-1 rounded-full text-xs font-bold bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-dark border border-accent/20 dark:border-accent-dark/30 tabular-nums';
    } else {
      badge.className =
        'px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-subtle dark:bg-surface-darkSubtle text-ink-body dark:text-ink-darkBody border border-slate-200/80 dark:border-slate-700/70 tabular-nums';
    }
    badge.textContent = scoreText;

    wrap.appendChild(badge);
    return wrap;
  }

  function createBookmarkIcon(scrapped) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('fill', scrapped ? 'currentColor' : 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'shrink-0');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z');
    svg.appendChild(path);
    return svg;
  }

  function createScrapButton(article) {
    const strings = t();
    const articleId = String(
      article.id || article.source_url || article.original_title || ''
    );
    const scrapped = isScrapped(articleId);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-scrap-id', articleId);
    btn.setAttribute('aria-pressed', scrapped ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      scrapped ? strings.scrapBtnAriaRemove : strings.scrapBtnAriaSave
    );

    if (scrapped) {
      btn.className =
        'scrap-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent text-white dark:bg-accent-dark dark:text-canvas-dark border border-accent dark:border-accent-dark shadow-sm hover:opacity-90 transition-all duration-150';
    } else {
      btn.className =
        'scrap-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-subtle dark:bg-surface-darkSubtle text-ink-body dark:text-ink-darkBody border border-slate-200/80 dark:border-slate-700/70 hover:border-accent hover:text-accent dark:hover:border-accent-dark dark:hover:text-accent-dark transition-all duration-150';
    }

    btn.appendChild(createBookmarkIcon(scrapped));

    const labelSpan = document.createElement('span');
    labelSpan.textContent = scrapped ? strings.scrappedBtnLabel : strings.scrapBtnLabel;
    btn.appendChild(labelSpan);

    btn.addEventListener('click', () => {
      toggleScrap(article);
    });

    return btn;
  }

  function createFooterBlock(article) {
    const strings = t();
    const footerWrap = document.createElement('div');
    footerWrap.className =
      'pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3';

    if (Array.isArray(article.tags) && article.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'flex flex-wrap gap-1.5';

      article.tags.forEach((tag) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className =
          'px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-subtle/80 dark:bg-surface-darkSubtle text-ink-body dark:text-ink-darkBody hover:bg-accent-soft hover:text-accent dark:hover:bg-accent/20 dark:hover:text-accent-dark transition-colors';
        chip.textContent = `#${tag}`;
        chip.addEventListener('click', () => {
          setSearchQuery(String(tag));
        });
        tagsContainer.appendChild(chip);
      });

      footerWrap.appendChild(tagsContainer);
    }

    const scrapEntry = getScrapEntry(
      article.id || article.source_url || article.original_title
    );
    if (scrapEntry && scrapEntry.scrapped_at) {
      const scrapTimeRow = document.createElement('p');
      scrapTimeRow.className =
        'text-[11px] font-medium text-accent dark:text-accent-dark tabular-nums';
      scrapTimeRow.textContent = `${strings.scrappedTimePrefix}${formatTimestamp(scrapEntry.scrapped_at)}`;
      footerWrap.appendChild(scrapTimeRow);
    }

    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex items-center justify-between gap-2 text-xs';

    const metaText = document.createElement('span');
    metaText.className = 'text-ink-muted dark:text-ink-darkMuted font-medium truncate tabular-nums';
    metaText.textContent = `${article.source_name || ''} · ${article.published_date || ''}`;

    const sourceLink = document.createElement('a');
    sourceLink.href = article.source_url || '#';
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.className =
      'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle/70 dark:bg-surface-darkSubtle font-semibold text-xs text-ink-primary dark:text-ink-darkPrimary hover:bg-accent hover:text-white dark:hover:bg-accent-dark dark:hover:text-canvas-dark transition-colors';
    sourceLink.textContent = strings.readOriginal;

    bottomRow.appendChild(metaText);
    bottomRow.appendChild(sourceLink);
    footerWrap.appendChild(bottomRow);

    return footerWrap;
  }

  // SPEC.md 3.4 & 5.3 & 5.4: 기사 카드 생성 (모든 텍스트는 textContent로 바인딩)
  function createArticleCard(article, isTopStory) {
    const strings = t();
    const catMeta = CATEGORY_META[article.category] || {
      ...DEFAULT_CAT_META,
      label: String(article.category || '')
    };

    const score = Number(article.importance_score) || 0;
    const displayTitle = pickArticleField(
      article.english_title,
      article.korean_title || article.original_title
    );
    const displaySummary = pickArticleField(article.summary_en, article.summary);
    const displayPmInsights = pickArticleField(
      article.pm_insights_en,
      article.pm_insights
    );

    if (isTopStory) {
      const heroCard = document.createElement('article');
      heroCard.className =
        'hero-surface rounded-2xl border border-accent/25 dark:border-accent-dark/30 shadow-soft-lg dark:shadow-soft-dark p-6 sm:p-8 transition-all duration-200';

      // 상단 메타 헤더
      const topBar = document.createElement('div');
      topBar.className =
        'flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200/70 dark:border-slate-800';

      const leftMeta = document.createElement('div');
      leftMeta.className = 'flex flex-wrap items-center gap-2';

      const catBadge = document.createElement('span');
      catBadge.className = catMeta.heroBadgeClass;
      catBadge.textContent = `${catMeta.symbol} ${catMeta.label}`;

      leftMeta.appendChild(catBadge);

      const rightControls = document.createElement('div');
      rightControls.className = 'flex flex-wrap items-center gap-2';
      rightControls.appendChild(createScoreBadge(score, true));
      rightControls.appendChild(createScrapButton(article));

      topBar.appendChild(leftMeta);
      topBar.appendChild(rightControls);
      heroCard.appendChild(topBar);

      // 비대칭 2열 본문 그리드 (좌측: 제목 + 요약 / 우측: PM 시사점 + 태그/출처)
      const grid = document.createElement('div');
      grid.id = 'top-story-grid';
      grid.className = 'grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start';

      const leftCol = document.createElement('div');
      leftCol.className = 'lg:col-span-7 space-y-3.5';

      const mainTitle = document.createElement('h3');
      mainTitle.className =
        'text-xl sm:text-2xl lg:text-[26px] font-extrabold text-ink-primary dark:text-ink-darkPrimary leading-[1.38] tracking-tight';
      mainTitle.textContent = displayTitle;

      const origTitle = document.createElement('p');
      origTitle.className =
        'text-xs sm:text-sm text-ink-muted dark:text-ink-darkMuted leading-relaxed font-normal';
      origTitle.textContent = article.original_title || '';

      const summaryP = document.createElement('p');
      summaryP.className =
        'text-sm sm:text-[15.5px] text-ink-body dark:text-ink-darkBody leading-[1.8] pt-1 font-normal';
      summaryP.textContent = displaySummary;

      leftCol.appendChild(mainTitle);
      leftCol.appendChild(origTitle);
      leftCol.appendChild(summaryP);

      const rightCol = document.createElement('div');
      rightCol.className =
        'lg:col-span-5 bg-surface-light/90 dark:bg-surface-darkSubtle/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between h-full';

      const pmWrap = document.createElement('div');
      pmWrap.className = catMeta.pmBoxClass;

      const pmHeader = document.createElement('div');
      pmHeader.className = 'flex items-center gap-2 mb-2';

      const pmDot = document.createElement('span');
      pmDot.className = catMeta.pmDotClass;
      pmDot.setAttribute('aria-hidden', 'true');

      const pmHeading = document.createElement('p');
      pmHeading.className = catMeta.pmLabelClass;
      pmHeading.textContent = strings.pmHeadingHero;

      pmHeader.appendChild(pmDot);
      pmHeader.appendChild(pmHeading);

      const pmText = document.createElement('p');
      pmText.className =
        'text-xs sm:text-sm text-ink-primary dark:text-ink-darkPrimary leading-[1.74] font-medium';
      pmText.textContent = displayPmInsights;

      pmWrap.appendChild(pmHeader);
      pmWrap.appendChild(pmText);

      rightCol.appendChild(pmWrap);
      rightCol.appendChild(createFooterBlock(article));

      grid.appendChild(leftCol);
      grid.appendChild(rightCol);
      heroCard.appendChild(grid);

      return heroCard;
    }

    // 일반 그리드 카드
    const card = document.createElement('article');
    card.className =
      'bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-soft dark:shadow-soft-dark p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg hover:border-slate-300 dark:hover:border-slate-700';

    const bodyWrap = document.createElement('div');

    const topBar = document.createElement('div');
    topBar.className = 'flex flex-wrap items-center justify-between gap-2 mb-3.5';

    const catLabel = document.createElement('span');
    catLabel.className = catMeta.cardBadgeClass;
    catLabel.textContent = `${catMeta.symbol} ${catMeta.label}`;

    const rightControls = document.createElement('div');
    rightControls.className = 'inline-flex items-center gap-1.5';
    rightControls.appendChild(createScoreBadge(score, false));
    rightControls.appendChild(createScrapButton(article));

    topBar.appendChild(catLabel);
    topBar.appendChild(rightControls);
    bodyWrap.appendChild(topBar);

    const mainTitle = document.createElement('h3');
    mainTitle.className =
      'text-[17px] sm:text-[18.5px] font-bold text-ink-primary dark:text-ink-darkPrimary leading-[1.42] tracking-tight mb-1.5';
    mainTitle.textContent = displayTitle;
    bodyWrap.appendChild(mainTitle);

    const origTitle = document.createElement('p');
    origTitle.className =
      'text-xs text-ink-muted dark:text-ink-darkMuted mb-3.5 leading-relaxed font-normal';
    origTitle.textContent = article.original_title || '';
    bodyWrap.appendChild(origTitle);

    const summaryP = document.createElement('p');
    summaryP.className =
      'text-sm text-ink-body dark:text-ink-darkBody leading-[1.76] mb-4 font-normal';
    summaryP.textContent = displaySummary;
    bodyWrap.appendChild(summaryP);

    // PM Insight 박스 — 요약과 시각적으로 명확히 구분 (SPEC.md 3.4)
    const pmBox = document.createElement('div');
    pmBox.className = catMeta.pmBoxClass;

    const pmHeader = document.createElement('div');
    pmHeader.className = 'flex items-center gap-1.5 mb-1.5';

    const pmDot = document.createElement('span');
    pmDot.className = catMeta.pmDotClass;
    pmDot.setAttribute('aria-hidden', 'true');

    const pmHeading = document.createElement('p');
    pmHeading.className = catMeta.pmLabelClass;
    pmHeading.textContent = strings.pmHeadingCard;

    pmHeader.appendChild(pmDot);
    pmHeader.appendChild(pmHeading);

    const pmText = document.createElement('p');
    pmText.className =
      'text-xs sm:text-[13.5px] text-ink-primary dark:text-ink-darkPrimary leading-[1.7] font-medium';
    pmText.textContent = displayPmInsights;

    pmBox.appendChild(pmHeader);
    pmBox.appendChild(pmText);
    bodyWrap.appendChild(pmBox);

    card.appendChild(bodyWrap);
    card.appendChild(createFooterBlock(article));

    return card;
  }

  function updateActiveFilterBar(filteredCount) {
    const statusBox = document.getElementById('active-filter-status');
    const statusText = document.getElementById('active-filter-text');
    if (!statusBox || !statusText) return;

    const hasCategory = state.category !== 'all';
    const hasSearch = state.search.trim().length > 0;

    if (!hasCategory && !hasSearch) {
      statusBox.classList.add('hidden');
      return;
    }

    const parts = [];
    if (state.lang === 'en') {
      if (hasCategory) {
        parts.push(
          state.category === 'scrap'
            ? 'View: Scrap'
            : `Category: ${state.category}`
        );
      }
      if (hasSearch) {
        parts.push(`Search: "${state.search.trim()}"`);
      }
      const noun = filteredCount === 1 ? 'article' : 'articles';
      statusText.textContent = `Active filters (${parts.join(' · ')}) — Showing ${filteredCount} ${noun}`;
    } else {
      if (hasCategory) {
        parts.push(
          state.category === 'scrap'
            ? '보기: 스크랩'
            : `카테고리: ${state.category}`
        );
      }
      if (hasSearch) {
        parts.push(`검색어: "${state.search.trim()}"`);
      }
      statusText.textContent = `적용된 필터 (${parts.join(' · ')}) — 총 ${filteredCount}건 표시 중`;
    }

    statusBox.classList.remove('hidden');
  }

  function setSearchQuery(query) {
    state.search = query;
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    if (searchInput) searchInput.value = query;
    if (searchClear) searchClear.classList.toggle('hidden', !query);
    renderArticles();
  }

  function resetAllFilters() {
    state.category = 'all';
    state.sort = 'importance';
    state.search = '';
    setStorage(STORAGE_KEYS.CATEGORY, 'all');
    setStorage(STORAGE_KEYS.SORT, 'importance');

    const sortEl = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    if (sortEl) sortEl.value = 'importance';
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.classList.add('hidden');

    updateCategoryTabsUI();
    renderArticles();
  }

  function matchesSearch(article, queryLower) {
    if (!queryLower) return true;
    const fields = [
      article.korean_title,
      article.english_title,
      article.original_title,
      article.summary,
      article.summary_en,
      article.pm_insights,
      article.pm_insights_en,
      article.source_name,
      article.category
    ];
    const inText = fields.some(
      (f) => typeof f === 'string' && f.toLowerCase().includes(queryLower)
    );
    if (inText) return true;
    return (
      Array.isArray(article.tags) &&
      article.tags.some((t) => String(t).toLowerCase().includes(queryLower))
    );
  }

  function updateEmptyStateCopy(isScrapView, hasSearchQuery) {
    const strings = t();
    if (isScrapView && !hasSearchQuery && state.scraps.length === 0) {
      setTextById('empty-heading', strings.emptyScrapHeading);
      setTextById('empty-desc', strings.emptyScrapDesc);
      setTextById('reset-filter-btn', strings.emptyScrapBtn);
    } else {
      setTextById('empty-heading', strings.emptyFilterHeading);
      setTextById('empty-desc', strings.emptyFilterDesc);
      setTextById('reset-filter-btn', strings.emptyFilterBtn);
    }
  }

  function renderArticles() {
    const topStorySection = document.getElementById('top-story-section');
    const topStoryContainer = document.getElementById('top-story-container');
    const gridSection = document.getElementById('articles-grid-section');
    const gridContainer = document.getElementById('articles-grid');
    const emptyState = document.getElementById('empty-state');
    const feedCountLabel = document.getElementById('feed-count-label');
    const strings = t();

    const q = state.search.trim().toLowerCase();
    const isScrapView = state.category === 'scrap';

    if (isScrapView) {
      // SPEC.md 5.4: 스크랩 보기는 최근에 스크랩한 순으로 정렬하고, 언어 토글·검색이 똑같이 동작한다.
      const sortedScraps = state.scraps
        .slice()
        .sort((a, b) => (b.scrapped_order || 0) - (a.scrapped_order || 0));
      const filteredScraps = sortedScraps.filter((item) => matchesSearch(item, q));

      updateActiveFilterBar(filteredScraps.length);

      if (topStorySection) {
        topStorySection.classList.add('hidden');
      }

      if (filteredScraps.length === 0) {
        if (gridSection) gridSection.classList.add('hidden');
        updateEmptyStateCopy(true, q.length > 0);
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      setTextById('grid-section-heading', strings.gridHeadingScrap);

      if (feedCountLabel) {
        feedCountLabel.textContent =
          state.lang === 'en'
            ? `${filteredScraps.length} saved · Sorted by recently saved`
            : `총 ${filteredScraps.length}건 · 최근 스크랩순`;
      }

      if (gridContainer && gridSection) {
        gridContainer.replaceChildren();
        filteredScraps.forEach((article) => {
          gridContainer.appendChild(createArticleCard(article, false));
        });
        gridSection.classList.remove('hidden');
      }
      return;
    }

    // 일반 보기 (전체 또는 카테고리별)
    if (!state.hasLoadedData && state.articles.length === 0) {
      return;
    }

    const filtered = state.articles.filter((article) => {
      if (state.category !== 'all' && article.category !== state.category) {
        return false;
      }
      return matchesSearch(article, q);
    });

    updateActiveFilterBar(filtered.length);

    if (filtered.length === 0) {
      if (topStorySection) topStorySection.classList.add('hidden');
      if (gridSection) gridSection.classList.add('hidden');
      updateEmptyStateCopy(false, q.length > 0);
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    setTextById('grid-section-heading', strings.gridHeadingDefault);

    // 최고 중요도 기사 1건 선정 (SPEC.md 3.3)
    let topIndex = 0;
    let highestScore = -1;
    filtered.forEach((article, idx) => {
      const score = Number(article.importance_score) || 0;
      if (score > highestScore) {
        highestScore = score;
        topIndex = idx;
      }
    });

    const topArticle = filtered[topIndex];
    const restArticles = filtered.filter((_, idx) => idx !== topIndex);

    // 정렬 (중요도순 / 최신순)
    restArticles.sort((a, b) => {
      if (state.sort === 'latest') {
        const byDate = String(b.published_date).localeCompare(String(a.published_date));
        if (byDate !== 0) return byDate;
        return (Number(b.importance_score) || 0) - (Number(a.importance_score) || 0);
      }
      const byScore = (Number(b.importance_score) || 0) - (Number(a.importance_score) || 0);
      if (byScore !== 0) return byScore;
      return String(b.published_date).localeCompare(String(a.published_date));
    });

    if (topStoryContainer && topStorySection) {
      topStoryContainer.replaceChildren(createArticleCard(topArticle, true));
      topStorySection.classList.remove('hidden');
    }

    if (gridContainer && gridSection) {
      gridContainer.replaceChildren();
      if (restArticles.length > 0) {
        restArticles.forEach((article) => {
          gridContainer.appendChild(createArticleCard(article, false));
        });
        if (feedCountLabel) {
          const moreNoun = restArticles.length === 1 ? 'story' : 'stories';
          feedCountLabel.textContent =
            state.lang === 'en'
              ? `${restArticles.length} more ${moreNoun}`
              : `외 ${restArticles.length}건의 브리핑`;
        }
        gridSection.classList.remove('hidden');
      } else {
        gridSection.classList.add('hidden');
      }
    }
  }

  async function fetchNews() {
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const errorState = document.getElementById('error-state');
    const execSkeleton = document.getElementById('exec-summary-skeleton');
    const execText = document.getElementById('exec-summary-text');

    if (loadingSkeleton) loadingSkeleton.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');

    try {
      const response = await fetch('./data/news.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data || !Array.isArray(data.articles)) {
        throw new Error('Invalid schema');
      }

      state.articles = data.articles;
      state.updatedAt = data.updated_at || '';
      state.executiveSummary = data.executive_summary || '';
      state.executiveSummaryEn = data.executive_summary_en || '';
      state.hasLoadedData = true;
      state.lastError = '';

      enrichScrapsWithFetchedArticles(state.articles);

      const strings = t();
      const formattedUpdated = formatTimestamp(state.updatedAt);
      setTextById('last-updated', `${strings.lastUpdatedPrefix}${formattedUpdated}`);
      setTextById('footer-updated-at', `${strings.footerUpdatedPrefix}${formattedUpdated}`);

      if (execSkeleton) execSkeleton.classList.add('hidden');
      if (execText) {
        execText.textContent = pickArticleField(
          state.executiveSummaryEn,
          state.executiveSummary
        );
        execText.classList.remove('hidden');
      }

      renderMetrics(state.articles);
      updateCategoryTabsUI();
      if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
      renderArticles();
    } catch (err) {
      state.lastError = err && err.message ? err.message : 'Error';
      if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
      if (execSkeleton) execSkeleton.classList.add('hidden');
      if (errorState) errorState.classList.remove('hidden');
      setTextById(
        'error-message',
        state.lang === 'en'
          ? `Could not load ./data/news.json (${state.lastError}).`
          : `데이터(./data/news.json)를 불러오지 못했습니다 (${state.lastError}).`
      );
      if (state.category === 'scrap') {
        renderArticles();
      }
    }
  }

  function bindEvents() {
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', toggleLang);
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-category') || 'all';
        state.category = cat;
        setStorage(STORAGE_KEYS.CATEGORY, cat);
        updateCategoryTabsUI();
        renderArticles();
      });
    });

    const metricCatBtns = document.querySelectorAll('.metric-cat-btn');
    metricCatBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-metric-category') || 'all';
        state.category = state.category === cat ? 'all' : cat;
        setStorage(STORAGE_KEYS.CATEGORY, state.category);
        updateCategoryTabsUI();
        renderArticles();
      });
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value === 'latest' ? 'latest' : 'importance';
        setStorage(STORAGE_KEYS.SORT, state.sort);
        renderArticles();
      });
    }

    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.search = e.target.value || '';
        if (searchClear) {
          searchClear.classList.toggle('hidden', !state.search);
        }
        renderArticles();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.search) {
          setSearchQuery('');
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        setSearchQuery('');
        if (searchInput) searchInput.focus();
      });
    }

    // '/' 단축키로 검색창 포커스
    document.addEventListener('keydown', (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInput &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (document.activeElement && document.activeElement.tagName) || ''
        )
      ) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAllFilters);
    }

    const inlineResetBtn = document.getElementById('inline-reset-btn');
    if (inlineResetBtn) {
      inlineResetBtn.addEventListener('click', resetAllFilters);
    }

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', fetchNews);
    }

    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initScraps();
    initTheme();
    initLang();
    initFilters();
    bindEvents();
    fetchNews();
  });
})();
