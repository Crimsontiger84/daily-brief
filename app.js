/**
 * The Daily Brief — app.js
 * SPEC.md 3장 규격 준수 (바닐라 JS, 상대 경로 fetch, textContent 바인딩)
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'daily_brief_theme',
    CATEGORY: 'daily_brief_category',
    SORT: 'daily_brief_sort'
  };

  const CATEGORY_STYLES = {
    'Golf & Sports Tech': {
      label: 'GOLF & SPORTS TECH',
      classes: 'bg-[#0F7B4F]/10 text-[#0F7B4F] dark:bg-[#0F7B4F]/25 dark:text-emerald-300 border-[#0F7B4F]/30'
    },
    'AI Agents & LLM': {
      label: 'AI AGENTS & LLM',
      classes: 'bg-[#3B5BDB]/10 text-[#3B5BDB] dark:bg-[#3B5BDB]/25 dark:text-indigo-300 border-[#3B5BDB]/30'
    },
    'US-Korea Macro Economy': {
      label: 'US-KOREA MACRO ECONOMY',
      classes: 'bg-[#B45309]/10 text-[#B45309] dark:bg-[#B45309]/25 dark:text-amber-300 border-[#B45309]/30'
    }
  };

  const state = {
    articles: [],
    updatedAt: '',
    executiveSummary: '',
    category: 'all',
    sort: 'importance',
    search: '',
    darkMode: false
  };

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
      // localStorage 실패 시에도 화면은 정상 동작 (SPEC.md 3.5)
    }
  }

  function formatKoreanToday(dateObj) {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayName = days[dateObj.getDay()];
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
  }

  function applyTheme() {
    const root = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    const toggleBtn = document.getElementById('theme-toggle');

    if (state.darkMode) {
      root.classList.add('dark');
      if (icon) icon.textContent = '☀';
      if (label) label.textContent = '라이트 모드';
      if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      root.classList.remove('dark');
      if (icon) icon.textContent = '☾';
      if (label) label.textContent = '다크 모드';
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
      'US-Korea Macro Economy'
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
    tabs.forEach((tab) => {
      const cat = tab.getAttribute('data-category');
      const active = cat === state.category;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');

      if (active) {
        tab.className =
          'cat-tab px-3 py-1.5 rounded text-xs sm:text-sm font-bold bg-ft-claret text-white transition-colors';
      } else {
        tab.className =
          'cat-tab px-3 py-1.5 rounded text-xs sm:text-sm font-semibold bg-ft-card dark:bg-ft-darkCard text-ft-text dark:text-ft-darkText border border-ft-divider dark:border-ft-darkDivider hover:border-ft-claret transition-colors';
      }
    });
  }

  function renderMetrics(articles) {
    const total = articles.length;
    const golf = articles.filter((a) => a.category === 'Golf & Sports Tech').length;
    const ai = articles.filter((a) => a.category === 'AI Agents & LLM').length;
    const macro = articles.filter((a) => a.category === 'US-Korea Macro Economy').length;
    const avg =
      total > 0
        ? (
            articles.reduce((sum, a) => sum + (Number(a.importance_score) || 0), 0) / total
          ).toFixed(1)
        : '0.0';

    const elTotal = document.getElementById('stat-total');
    const elGolf = document.getElementById('stat-golf');
    const elAi = document.getElementById('stat-ai');
    const elMacro = document.getElementById('stat-macro');
    const elAvg = document.getElementById('stat-avg');

    if (elTotal) elTotal.textContent = String(total);
    if (elGolf) elGolf.textContent = String(golf);
    if (elAi) elAi.textContent = String(ai);
    if (elMacro) elMacro.textContent = String(macro);
    if (elAvg) elAvg.textContent = `${avg} / 10`;
  }

  // SPEC.md 3.4 기사 카드 생성 (모든 기사 텍스트는 textContent로 삽입)
  function createArticleCard(article, isTopStory) {
    const card = document.createElement('article');
    card.className = isTopStory
      ? 'bg-ft-card dark:bg-ft-darkCard border-2 border-ft-claret/50 rounded-lg p-6 sm:p-7 flex flex-col justify-between'
      : 'bg-ft-card dark:bg-ft-darkCard border border-ft-divider dark:border-ft-darkDivider rounded-lg p-5 flex flex-col justify-between';

    const bodyWrap = document.createElement('div');

    // 상단: 카테고리 색 라벨(대문자 소형) + 중요도 배지(예: 8/10, 9 이상은 클라렛 강조)
    const topBar = document.createElement('div');
    topBar.className = 'flex items-center justify-between gap-2 mb-3';

    const catInfo = CATEGORY_STYLES[article.category] || {
      label: String(article.category || '').toUpperCase(),
      classes: 'bg-ft-bg text-ft-text border-ft-divider'
    };

    const catLabel = document.createElement('span');
    catLabel.className = `inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${catInfo.classes}`;
    catLabel.textContent = catInfo.label;

    const score = Number(article.importance_score) || 0;
    const scoreBadge = document.createElement('span');
    scoreBadge.className =
      score >= 9
        ? 'inline-block px-2 py-0.5 rounded text-xs font-bold bg-ft-claret text-white'
        : 'inline-block px-2 py-0.5 rounded text-xs font-semibold bg-ft-bg dark:bg-ft-darkBg text-ft-muted dark:text-ft-darkMuted border border-ft-divider dark:border-ft-darkDivider';
    scoreBadge.textContent = `${score}/10`;

    topBar.appendChild(catLabel);
    topBar.appendChild(scoreBadge);
    bodyWrap.appendChild(topBar);

    // korean_title (세리프, 굵게)
    const korTitle = document.createElement('h2');
    korTitle.className = isTopStory
      ? 'font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-ft-text dark:text-ft-darkText leading-snug mb-1.5'
      : 'font-serif text-lg sm:text-xl font-bold text-ft-text dark:text-ft-darkText leading-snug mb-1.5';
    korTitle.textContent = article.korean_title || '';
    bodyWrap.appendChild(korTitle);

    // original_title (작은 회색 이탤릭)
    const origTitle = document.createElement('p');
    origTitle.className =
      'text-xs sm:text-sm italic text-ft-muted dark:text-ft-darkMuted mb-3.5 leading-relaxed';
    origTitle.textContent = article.original_title || '';
    bodyWrap.appendChild(origTitle);

    // summary 본문
    const summaryP = document.createElement('p');
    summaryP.className = isTopStory
      ? 'text-sm sm:text-base text-ft-text dark:text-ft-darkText leading-relaxed mb-4'
      : 'text-sm text-ft-text dark:text-ft-darkText leading-relaxed mb-4';
    summaryP.textContent = article.summary || '';
    bodyWrap.appendChild(summaryP);

    // PM Insight 박스: 옅은 배경 + 왼쪽 강조선, pm_insights 표시
    const pmBox = document.createElement('div');
    pmBox.className =
      'bg-ft-bg/80 dark:bg-ft-darkBg/80 border-l-4 border-ft-claret rounded-r p-3.5 mb-4';

    const pmHeading = document.createElement('p');
    pmHeading.className =
      'text-[11px] font-bold uppercase tracking-wider text-ft-claret dark:text-[#F472B6] mb-1';
    pmHeading.textContent = 'PM Insight';

    const pmText = document.createElement('p');
    pmText.className =
      'text-xs sm:text-sm text-ft-text dark:text-ft-darkText leading-relaxed';
    pmText.textContent = article.pm_insights || '';

    pmBox.appendChild(pmHeading);
    pmBox.appendChild(pmText);
    bodyWrap.appendChild(pmBox);

    card.appendChild(bodyWrap);

    // 하단: source_name · published_date, 태그 칩(클릭 시 해당 태그로 검색), "원문 보기 →" 링크
    const footerWrap = document.createElement('div');
    footerWrap.className =
      'pt-3 border-t border-ft-divider dark:border-ft-darkDivider space-y-2.5';

    if (Array.isArray(article.tags) && article.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'flex flex-wrap gap-1.5';

      article.tags.forEach((tag) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className =
          'px-2 py-0.5 rounded text-[11px] bg-ft-bg dark:bg-ft-darkBg text-ft-muted dark:text-ft-darkMuted border border-ft-divider dark:border-ft-darkDivider hover:border-ft-claret hover:text-ft-claret dark:hover:text-[#F472B6] transition-colors';
        chip.textContent = `#${tag}`;
        chip.addEventListener('click', () => {
          setSearchQuery(String(tag));
        });
        tagsContainer.appendChild(chip);
      });

      footerWrap.appendChild(tagsContainer);
    }

    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex items-center justify-between gap-2 text-xs';

    const metaText = document.createElement('span');
    metaText.className = 'text-ft-muted dark:text-ft-darkMuted truncate';
    metaText.textContent = `${article.source_name || ''} · ${article.published_date || ''}`;

    const sourceLink = document.createElement('a');
    sourceLink.href = article.source_url || '#';
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.className =
      'shrink-0 font-semibold text-ft-teal dark:text-ft-darkTeal hover:underline';
    sourceLink.textContent = '원문 보기 →';

    bottomRow.appendChild(metaText);
    bottomRow.appendChild(sourceLink);
    footerWrap.appendChild(bottomRow);

    card.appendChild(footerWrap);
    return card;
  }

  function setSearchQuery(query) {
    state.search = query;
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    if (searchInput) searchInput.value = query;
    if (searchClear) searchClear.classList.toggle('hidden', !query);
    renderArticles();
  }

  function renderArticles() {
    const topStorySection = document.getElementById('top-story-section');
    const topStoryContainer = document.getElementById('top-story-container');
    const gridSection = document.getElementById('articles-grid-section');
    const gridContainer = document.getElementById('articles-grid');
    const emptyState = document.getElementById('empty-state');

    const q = state.search.trim().toLowerCase();

    // 카테고리 및 검색 필터 (제목·요약·태그 대상)
    const filtered = state.articles.filter((article) => {
      if (state.category !== 'all' && article.category !== state.category) {
        return false;
      }
      if (!q) return true;

      const inKor = (article.korean_title || '').toLowerCase().includes(q);
      const inOrig = (article.original_title || '').toLowerCase().includes(q);
      const inSum = (article.summary || '').toLowerCase().includes(q);
      const inTags =
        Array.isArray(article.tags) &&
        article.tags.some((t) => String(t).toLowerCase().includes(q));

      return inKor || inOrig || inSum || inTags;
    });

    if (filtered.length === 0) {
      if (topStorySection) topStorySection.classList.add('hidden');
      if (gridSection) gridSection.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // 톱 스토리: importance_score가 가장 높은 기사 1개 선정 (SPEC.md 3.3.5)
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

    // 나머지 기사 정렬 (중요도순 · 최신순)
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
        gridSection.classList.remove('hidden');
      } else {
        gridSection.classList.add('hidden');
      }
    }
  }

  async function fetchNews() {
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
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

      const formattedUpdated = formatTimestamp(state.updatedAt);
      const lastUpdatedEl = document.getElementById('last-updated');
      const footerUpdatedEl = document.getElementById('footer-updated-at');

      if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `마지막 갱신: ${formattedUpdated}`;
      }
      if (footerUpdatedEl) {
        footerUpdatedEl.textContent = `생성 시각: ${formattedUpdated}`;
      }

      if (execSkeleton) execSkeleton.classList.add('hidden');
      if (execText) {
        execText.textContent = state.executiveSummary;
        execText.classList.remove('hidden');
      }

      renderMetrics(state.articles);
      if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
      renderArticles();
    } catch (err) {
      if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
      if (execSkeleton) execSkeleton.classList.add('hidden');
      if (errorState) errorState.classList.remove('hidden');
      if (errorMessage) {
        errorMessage.textContent = `데이터(./data/news.json)를 불러오지 못했습니다 (${err.message}).`;
      }
    }
  }

  function bindEvents() {
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
        setSearchQuery('');
        if (searchInput) searchInput.focus();
      });
    }

    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.category = 'all';
        state.sort = 'importance';
        state.search = '';
        setStorage(STORAGE_KEYS.CATEGORY, 'all');
        setStorage(STORAGE_KEYS.SORT, 'importance');

        const sortEl = document.getElementById('sort-select');
        if (sortEl) sortEl.value = 'importance';
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.add('hidden');

        updateCategoryTabsUI();
        renderArticles();
      });
    }

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', fetchNews);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const todayEl = document.getElementById('today-date');
    if (todayEl) {
      todayEl.textContent = formatKoreanToday(new Date());
    }

    initTheme();
    initFilters();
    bindEvents();
    fetchNews();
  });
})();
