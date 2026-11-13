/**
 * The Daily Brief — Briefing Dashboard Application (app.js)
 * Vanilla JS implementation adhering strictly to SPEC.md & schema.json
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'daily_brief_theme',
    CATEGORY: 'daily_brief_category',
    SORT: 'daily_brief_sort'
  };

  const CATEGORY_META = {
    'Golf & Sports Tech': {
      label: 'GOLF & SPORTS TECH',
      badgeBg: 'bg-[#0F7B4F]/10 dark:bg-[#0F7B4F]/25',
      badgeText: 'text-[#0F7B4F] dark:text-emerald-300',
      borderColor: 'border-[#0F7B4F]/30'
    },
    'AI Agents & LLM': {
      label: 'AI AGENTS & LLM',
      badgeBg: 'bg-[#3B5BDB]/10 dark:bg-[#3B5BDB]/25',
      badgeText: 'text-[#3B5BDB] dark:text-indigo-300',
      borderColor: 'border-[#3B5BDB]/30'
    },
    'US-Korea Macro Economy': {
      label: 'US-KOREA MACRO ECONOMY',
      badgeBg: 'bg-[#B45309]/10 dark:bg-[#B45309]/25',
      badgeText: 'text-[#B45309] dark:text-amber-300',
      borderColor: 'border-[#B45309]/30'
    }
  };

  const state = {
    articles: [],
    updatedAt: null,
    executiveSummary: '',
    category: 'all',
    sort: 'importance',
    search: '',
    darkMode: false
  };

  // Safe localStorage helpers
  function getStorage(key, fallback) {
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // Ignore storage errors in restricted environments
    }
  }

  // Format Korean date with day of week
  function formatKoreanToday(dateObj) {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayName = days[dateObj.getDay()];
    return `${y}년 ${m}월 ${d}일 ${dayName}`;
  }

  function formatUpdatedAt(isoString) {
    if (!isoString) return '확인 불가';
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) return isoString;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const mm = String(parsed.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm} KST`;
  }

  // Theme initialization & toggle
  function initTheme() {
    const saved = getStorage(STORAGE_KEYS.THEME, null);
    if (saved === 'dark') {
      state.darkMode = true;
    } else if (saved === 'light') {
      state.darkMode = false;
    } else {
      state.darkMode =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
  }

  function applyTheme() {
    const root = document.documentElement;
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const label = document.getElementById('theme-label');

    if (state.darkMode) {
      root.classList.add('dark');
      if (sunIcon) sunIcon.classList.remove('hidden');
      if (moonIcon) moonIcon.classList.add('hidden');
      if (label) label.textContent = '라이트 모드';
    } else {
      root.classList.remove('dark');
      if (sunIcon) sunIcon.classList.add('hidden');
      if (moonIcon) moonIcon.classList.remove('hidden');
      if (label) label.textContent = '다크 모드';
    }
  }

  function toggleTheme() {
    state.darkMode = !state.darkMode;
    setStorage(STORAGE_KEYS.THEME, state.darkMode ? 'dark' : 'light');
    applyTheme();
  }

  // Restore saved filter & sort preferences
  function initFilterState() {
    const savedCategory = getStorage(STORAGE_KEYS.CATEGORY, 'all');
    const validCategories = [
      'all',
      'Golf & Sports Tech',
      'AI Agents & LLM',
      'US-Korea Macro Economy'
    ];
    state.category = validCategories.includes(savedCategory) ? savedCategory : 'all';

    const savedSort = getStorage(STORAGE_KEYS.SORT, 'importance');
    state.sort = savedSort === 'latest' ? 'latest' : 'importance';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.value = state.sort;
    }
    updateCategoryTabStyles();
  }

  function updateCategoryTabStyles() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach((btn) => {
      const cat = btn.getAttribute('data-category');
      const isActive = cat === state.category;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

      if (isActive) {
        btn.className =
          'cat-tab px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold bg-ft-claret dark:bg-ft-darkClaret text-white shadow-sm transition-colors';
      } else {
        btn.className =
          'cat-tab px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold bg-ft-card dark:bg-ft-darkCard text-ft-text dark:text-ft-darkText border border-ft-border dark:border-ft-darkBorder hover:border-ft-claret dark:hover:border-ft-darkClaret transition-colors';
      }
    });
  }

  // Render summary metrics row
  function renderMetrics(articles) {
    const total = articles.length;
    const golfCount = articles.filter((a) => a.category === 'Golf & Sports Tech').length;
    const aiCount = articles.filter((a) => a.category === 'AI Agents & LLM').length;
    const macroCount = articles.filter((a) => a.category === 'US-Korea Macro Economy').length;

    const avgScore =
      total > 0
        ? (
            articles.reduce((acc, cur) => acc + (Number(cur.importance_score) || 0), 0) / total
          ).toFixed(1)
        : '0.0';

    const elTotal = document.getElementById('stat-total');
    const elGolf = document.getElementById('stat-golf');
    const elAi = document.getElementById('stat-ai');
    const elMacro = document.getElementById('stat-macro');
    const elAvg = document.getElementById('stat-avg');

    if (elTotal) elTotal.textContent = `${total}건`;
    if (elGolf) elGolf.textContent = `${golfCount}건`;
    if (elAi) elAi.textContent = `${aiCount}건`;
    if (elMacro) elMacro.textContent = `${macroCount}건`;
    if (elAvg) elAvg.textContent = `${avgScore} / 10`;
  }

  // Build DOM element for an Article Card (safe textContent only)
  function createArticleCard(article, isTopStory) {
    const card = document.createElement('article');
    card.className = isTopStory
      ? 'bg-ft-card dark:bg-ft-darkCard border-2 border-ft-claret/40 dark:border-ft-darkClaret/50 rounded-xl p-6 sm:p-8 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between'
      : 'bg-ft-card dark:bg-ft-darkCard border border-ft-border dark:border-ft-darkBorder rounded-lg p-5 sm:p-6 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between';

    const topContent = document.createElement('div');

    // 1. Header Row: Category Label & Importance Badge
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center justify-between gap-2 mb-3';

    const catMeta = CATEGORY_META[article.category] || {
      label: article.category,
      badgeBg: 'bg-gray-200 dark:bg-gray-700',
      badgeText: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-300'
    };

    const catBadge = document.createElement('span');
    catBadge.className = `inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider border ${catMeta.badgeBg} ${catMeta.badgeText} ${catMeta.borderColor}`;
    catBadge.textContent = catMeta.label;

    const score = Number(article.importance_score) || 0;
    const isHighImportance = score >= 9;
    const scoreBadge = document.createElement('span');
    scoreBadge.className = isHighImportance
      ? 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-extrabold bg-ft-claret dark:bg-ft-darkClaret text-white shadow-sm'
      : 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-ft-bg dark:bg-ft-darkBg text-ft-text dark:text-ft-darkText border border-ft-border dark:border-ft-darkBorder';
    scoreBadge.title = 'PM 관점 중요도 점수';
    scoreBadge.textContent = `중요도 ${score}/10`;

    headerRow.appendChild(catBadge);
    headerRow.appendChild(scoreBadge);
    topContent.appendChild(headerRow);

    // 2. Korean Title (Serif, Bold)
    const korTitle = document.createElement(isTopStory ? 'h3' : 'h3');
    korTitle.className = isTopStory
      ? 'font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-ft-text dark:text-ft-darkText leading-snug mb-1.5'
      : 'font-serif text-lg sm:text-xl font-bold text-ft-text dark:text-ft-darkText leading-snug mb-1.5';
    korTitle.textContent = article.korean_title;
    topContent.appendChild(korTitle);

    // 3. Original Title (Small Gray Italic)
    const origTitle = document.createElement('p');
    origTitle.className =
      'text-xs sm:text-sm italic text-ft-muted dark:text-ft-darkMuted mb-4 leading-relaxed';
    origTitle.textContent = article.original_title;
    topContent.appendChild(origTitle);

    // 4. Summary Body
    const summaryEl = document.createElement('p');
    summaryEl.className = isTopStory
      ? 'text-sm sm:text-base text-ft-text dark:text-ft-darkText leading-relaxed mb-5'
      : 'text-sm text-ft-text dark:text-ft-darkText leading-relaxed mb-5';
    summaryEl.textContent = article.summary;
    topContent.appendChild(summaryEl);

    // 5. PM's Insight Highlight Box
    const insightBox = document.createElement('div');
    insightBox.className =
      'bg-ft-bg/90 dark:bg-ft-darkBg/90 border-l-4 border-ft-claret dark:border-ft-darkClaret rounded-r-md p-3.5 sm:p-4 mb-5';

    const insightHeader = document.createElement('div');
    insightHeader.className =
      'flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ft-claret dark:text-ft-darkClaret mb-1.5';

    const insightIcon = document.createElement('i');
    insightIcon.setAttribute('data-lucide', 'lightbulb');
    insightIcon.className = 'w-3.5 h-3.5';
    insightIcon.setAttribute('aria-hidden', 'true');

    const insightLabel = document.createElement('span');
    insightLabel.textContent = "PM's Insight";

    insightHeader.appendChild(insightIcon);
    insightHeader.appendChild(insightLabel);

    const insightBody = document.createElement('p');
    insightBody.className =
      'text-xs sm:text-sm text-ft-text dark:text-ft-darkText font-medium leading-relaxed';
    insightBody.textContent = article.pm_insights;

    insightBox.appendChild(insightHeader);
    insightBox.appendChild(insightBody);
    topContent.appendChild(insightBox);

    card.appendChild(topContent);

    // 6. Card Footer: Tags, Source Name · Published Date, Link
    const footerContent = document.createElement('div');
    footerContent.className =
      'pt-3.5 border-t border-ft-border dark:border-ft-darkBorder space-y-3';

    // Tag Chips
    if (Array.isArray(article.tags) && article.tags.length > 0) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'flex flex-wrap items-center gap-1.5';

      article.tags.forEach((tagText) => {
        const tagBtn = document.createElement('button');
        tagBtn.type = 'button';
        tagBtn.className =
          'px-2 py-0.5 rounded text-[11px] font-medium bg-ft-bg dark:bg-ft-darkBg text-ft-muted dark:text-ft-darkMuted border border-ft-border dark:border-ft-darkBorder hover:border-ft-claret dark:hover:border-ft-darkClaret hover:text-ft-claret dark:hover:text-ft-darkClaret transition-colors';
        tagBtn.textContent = `#${tagText}`;
        tagBtn.setAttribute('aria-label', `${tagText} 태그로 검색`);
        tagBtn.addEventListener('click', () => {
          applyTagSearch(tagText);
        });
        tagsWrap.appendChild(tagBtn);
      });

      footerContent.appendChild(tagsWrap);
    }

    // Bottom Meta & Source Link
    const metaRow = document.createElement('div');
    metaRow.className = 'flex items-center justify-between gap-2 text-xs';

    const sourceMeta = document.createElement('span');
    sourceMeta.className = 'text-ft-muted dark:text-ft-darkMuted font-medium truncate';
    sourceMeta.textContent = `${article.source_name} · ${article.published_date}`;

    const linkEl = document.createElement('a');
    linkEl.href = article.source_url;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    linkEl.className =
      'shrink-0 font-bold text-ft-teal dark:text-ft-darkTeal hover:underline inline-flex items-center gap-1';
    linkEl.textContent = '원문 보기 →';

    metaRow.appendChild(sourceMeta);
    metaRow.appendChild(linkEl);
    footerContent.appendChild(metaRow);

    card.appendChild(footerContent);
    return card;
  }

  function applyTagSearch(tagText) {
    state.search = tagText;
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    if (searchInput) {
      searchInput.value = tagText;
    }
    if (searchClear) {
      searchClear.classList.toggle('hidden', !tagText);
    }
    renderArticles();
  }

  // Filter & Sort pipeline
  function getFilteredAndSortedArticles() {
    const query = state.search.trim().toLowerCase();

    const filtered = state.articles.filter((article) => {
      if (state.category !== 'all' && article.category !== state.category) {
        return false;
      }
      if (!query) return true;

      const inKorTitle = (article.korean_title || '').toLowerCase().includes(query);
      const inOrigTitle = (article.original_title || '').toLowerCase().includes(query);
      const inSummary = (article.summary || '').toLowerCase().includes(query);
      const inInsights = (article.pm_insights || '').toLowerCase().includes(query);
      const inSource = (article.source_name || '').toLowerCase().includes(query);
      const inTags =
        Array.isArray(article.tags) &&
        article.tags.some((t) => String(t).toLowerCase().includes(query));

      return inKorTitle || inOrigTitle || inSummary || inInsights || inSource || inTags;
    });

    filtered.sort((a, b) => {
      if (state.sort === 'latest') {
        const dateDiff = String(b.published_date).localeCompare(String(a.published_date));
        if (dateDiff !== 0) return dateDiff;
        return (Number(b.importance_score) || 0) - (Number(a.importance_score) || 0);
      }
      // Default: importance descending
      const scoreDiff = (Number(b.importance_score) || 0) - (Number(a.importance_score) || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return String(b.published_date).localeCompare(String(a.published_date));
    });

    return filtered;
  }

  function renderArticles() {
    const topStorySection = document.getElementById('top-story-section');
    const topStoryContainer = document.getElementById('top-story-container');
    const gridSection = document.getElementById('articles-grid-section');
    const gridContainer = document.getElementById('articles-grid');
    const emptyState = document.getElementById('empty-state');
    const countLabel = document.getElementById('filtered-count-label');

    const filtered = getFilteredAndSortedArticles();

    if (filtered.length === 0) {
      if (topStorySection) topStorySection.classList.add('hidden');
      if (gridSection) gridSection.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Pick Top Story: highest importance_score among filtered articles
    let topStoryIndex = 0;
    let maxScore = -1;
    filtered.forEach((item, idx) => {
      const s = Number(item.importance_score) || 0;
      if (s > maxScore) {
        maxScore = s;
        topStoryIndex = idx;
      }
    });

    const topArticle = filtered[topStoryIndex];
    const remainingArticles = filtered.filter((_, idx) => idx !== topStoryIndex);

    if (topStoryContainer && topStorySection) {
      topStoryContainer.replaceChildren(createArticleCard(topArticle, true));
      topStorySection.classList.remove('hidden');
    }

    if (gridContainer && gridSection) {
      gridContainer.replaceChildren();
      if (remainingArticles.length > 0) {
        remainingArticles.forEach((article) => {
          gridContainer.appendChild(createArticleCard(article, false));
        });
        if (countLabel) {
          countLabel.textContent = `외 ${remainingArticles.length}건의 기사 (총 ${filtered.length}건 표시 중)`;
        }
        gridSection.classList.remove('hidden');
      } else {
        gridSection.classList.add('hidden');
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Fetch data/news.json
  async function loadBriefingData() {
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const errorState = document.getElementById('error-state');
    const errorMsg = document.getElementById('error-message');
    const execSkeleton = document.getElementById('exec-summary-skeleton');
    const execText = document.getElementById('exec-summary-text');

    if (loadingSkeleton) loadingSkeleton.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');

    try {
      const response = await fetch('./data/news.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} (${response.statusText})`);
      }
      const data = await response.json();

      if (!data || !Array.isArray(data.articles)) {
        throw new Error('유효하지 않은 브리핑 JSON 형식입니다.');
      }

      state.articles = data.articles;
      state.updatedAt = data.updated_at || '';
      state.executiveSummary = data.executive_summary || '';

      // Update Masthead & Footer timestamps
      const lastUpdatedEl = document.getElementById('last-updated');
      const footerUpdatedEl = document.getElementById('footer-updated-at');
      const formattedTime = formatUpdatedAt(state.updatedAt);

      if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `마지막 갱신: ${formattedTime}`;
      }
      if (footerUpdatedEl) {
        footerUpdatedEl.textContent = `데이터 생성 시각: ${formattedTime}`;
      }

      // Update Executive Summary
      if (execSkeleton) execSkeleton.classList.add('hidden');
      if (execText) {
        execText.textContent = state.executiveSummary;
        execText.classList.remove('hidden');
      }

      // Render Metrics & Cards
      renderMetrics(state.articles);
      if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
      renderArticles();
    } catch (err) {
      if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
      if (execSkeleton) execSkeleton.classList.add('hidden');
      if (errorState) errorState.classList.remove('hidden');
      if (errorMsg) {
        errorMsg.textContent = `데이터 로드 실패 (${err.message}). 로컬 HTTP 서버(예: python -m http.server 8000) 환경에서 접속했는지 확인해 주세요.`;
      }
    }
  }

  // Event Listeners setup
  function bindEvents() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-category') || 'all';
        state.category = selected;
        setStorage(STORAGE_KEYS.CATEGORY, selected);
        updateCategoryTabStyles();
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
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        state.search = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchClear.classList.add('hidden');
        renderArticles();
      });
    }

    const resetFilterBtn = document.getElementById('reset-filter-btn');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        state.category = 'all';
        state.sort = 'importance';
        state.search = '';
        setStorage(STORAGE_KEYS.CATEGORY, 'all');
        setStorage(STORAGE_KEYS.SORT, 'importance');

        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.add('hidden');
        if (sortSelect) sortSelect.value = 'importance';

        updateCategoryTabStyles();
        renderArticles();
      });
    }

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', loadBriefingData);
    }
  }

  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const todayEl = document.getElementById('today-date');
    if (todayEl) {
      todayEl.textContent = formatKoreanToday(new Date());
    }

    initTheme();
    initFilterState();
    bindEvents();

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    loadBriefingData();
  });
})();
