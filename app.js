/**
 * PM 인텔리전스 브리핑 — app.js
 * Calm SaaS Intelligence & Soft Layered Bento
 * SPEC.md 3장 규격 준수 (바닐라 JS, 상대 경로 fetch('./data/news.json'), 모든 텍스트 textContent 바인딩)
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
      symbol: '●',
      label: 'Golf & Sports Tech',
      badgeClass:
        'rounded-full bg-cat-golfBg text-cat-golfText border-cat-golfBorder dark:bg-cat-golfDarkBg/60 dark:text-cat-golfDarkText dark:border-cat-golfDarkBorder/50',
      activeTabClass:
        'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 tabular-nums bg-emerald-800 bg-cat-golfText text-white border-emerald-800 border-cat-golfText dark:bg-emerald-500 dark:bg-cat-golfAccent dark:text-slate-950 dark:text-canvas-dark dark:border-emerald-500 dark:border-cat-golfAccent shadow-sm',
      pmBoxClass:
        'bg-cat-golfBg/45 dark:bg-cat-golfDarkBg/25 border-cat-golfBorder/80 dark:border-cat-golfDarkBorder/40',
      pmDotClass: 'bg-cat-golfAccent',
      pmLabelClass: 'text-cat-golfText dark:text-cat-golfDarkText'
    },
    'AI Agents & LLM': {
      symbol: '◆',
      label: 'AI Agents & LLM',
      badgeClass:
        'rounded-lg bg-cat-aiBg text-cat-aiText border-cat-aiBorder dark:bg-cat-aiDarkBg/60 dark:text-cat-aiDarkText dark:border-cat-aiDarkBorder/50',
      activeTabClass:
        'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 tabular-nums bg-indigo-800 bg-cat-aiText text-white border-indigo-800 border-cat-aiText dark:bg-indigo-400 dark:text-slate-950 dark:text-canvas-dark dark:border-indigo-400 shadow-sm',
      pmBoxClass:
        'bg-cat-aiBg/45 dark:bg-cat-aiDarkBg/25 border-cat-aiBorder/80 dark:border-cat-aiDarkBorder/40',
      pmDotClass: 'bg-cat-aiAccent',
      pmLabelClass: 'text-cat-aiText dark:text-cat-aiDarkText'
    },
    'US-Korea Macro Economy': {
      symbol: '■',
      label: 'US-Korea Macro Economy',
      badgeClass:
        'rounded-md bg-cat-macroBg text-cat-macroText border-cat-macroBorder dark:bg-cat-macroDarkBg/60 dark:text-cat-macroDarkText dark:border-cat-macroDarkBorder/50',
      activeTabClass:
        'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 tabular-nums bg-amber-800 bg-cat-macroText text-white border-amber-800 border-cat-macroText dark:bg-amber-500 dark:bg-cat-macroAccent dark:text-slate-950 dark:text-canvas-dark dark:border-amber-500 dark:border-cat-macroAccent shadow-sm',
      pmBoxClass:
        'bg-cat-macroBg/55 dark:bg-cat-macroDarkBg/25 border-cat-macroBorder/80 dark:border-cat-macroDarkBorder/40',
      pmDotClass: 'bg-cat-macroAccent',
      pmLabelClass: 'text-cat-macroText dark:text-cat-macroDarkText'
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
      // localStorage 접근 불가 시에도 화면 정상 동작 보장 (SPEC.md 3.5)
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
    const counts = {
      all: state.articles.length,
      'Golf & Sports Tech': state.articles.filter((a) => a.category === 'Golf & Sports Tech').length,
      'AI Agents & LLM': state.articles.filter((a) => a.category === 'AI Agents & LLM').length,
      'US-Korea Macro Economy': state.articles.filter((a) => a.category === 'US-Korea Macro Economy').length
    };

    tabs.forEach((tab) => {
      const cat = tab.getAttribute('data-category') || 'all';
      const active = cat === state.category;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');

      const meta = CATEGORY_META[cat];
      const countSuffix = state.articles.length > 0 ? ` ${counts[cat] ?? 0}` : '';
      if (cat === 'all') {
        tab.textContent = `전체${countSuffix}`;
      } else if (meta) {
        tab.textContent = `${meta.symbol} ${meta.label}${countSuffix}`;
      }

      if (active) {
        if (cat === 'all') {
          tab.className =
            'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border bg-slate-900 bg-ink-primary text-white border-slate-900 border-ink-primary dark:bg-slate-50 dark:bg-ink-darkPrimary dark:text-slate-950 dark:text-canvas-dark dark:border-slate-50 dark:border-ink-darkPrimary shadow-sm transition-all duration-150 tabular-nums';
        } else if (meta) {
          tab.className = meta.activeTabClass;
        }
      } else {
        tab.className =
          'cat-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-slate-100 bg-surface-subtle dark:bg-slate-800 dark:bg-surface-darkSubtle text-slate-700 text-ink-body dark:text-slate-300 dark:text-ink-darkBody hover:bg-slate-200 dark:hover:bg-surface-darkMuted transition-all duration-150 tabular-nums';
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
    const total = articles.length;
    const golf = articles.filter((a) => a.category === 'Golf & Sports Tech').length;
    const ai = articles.filter((a) => a.category === 'AI Agents & LLM').length;
    const macro = articles.filter((a) => a.category === 'US-Korea Macro Economy').length;
    const highPriority = articles.filter((a) => (Number(a.importance_score) || 0) >= 9).length;
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
    const elHigh = document.getElementById('stat-high-priority');

    if (elTotal) elTotal.textContent = `${total}건`;
    if (elGolf) elGolf.textContent = `${golf}건`;
    if (elAi) elAi.textContent = `${ai}건`;
    if (elMacro) elMacro.textContent = `${macro}건`;
    if (elAvg) elAvg.textContent = `${avg} / 10`;
    if (elHigh) elHigh.textContent = `핵심(9점+) ${highPriority}건`;

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
    if (score >= 9) {
      badge.className =
        'px-2.5 py-1 rounded-full text-xs font-bold bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-dark border border-accent/20 dark:border-accent-dark/30 tabular-nums';
      badge.textContent = `중요도 ${score} / 10`;
    } else {
      badge.className =
        'px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-subtle dark:bg-surface-darkSubtle text-ink-body dark:text-ink-darkBody border border-slate-200/80 dark:border-slate-700/70 tabular-nums';
      badge.textContent = `중요도 ${score} / 10`;
    }

    wrap.appendChild(badge);
    return wrap;
  }

  function createFooterBlock(article) {
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
    sourceLink.textContent = '원문 보기 ↗';

    bottomRow.appendChild(metaText);
    bottomRow.appendChild(sourceLink);
    footerWrap.appendChild(bottomRow);

    return footerWrap;
  }

  // SPEC.md 3.4: 기사 카드 생성 (모든 기사 텍스트는 textContent로 바인딩)
  function createArticleCard(article, isTopStory) {
    const catMeta = CATEGORY_META[article.category] || {
      symbol: '●',
      label: String(article.category || ''),
      badgeClass: 'rounded-full bg-surface-subtle text-ink-primary border-slate-200',
      pmBoxClass: 'bg-surface-subtle border-slate-200',
      pmDotClass: 'bg-accent',
      pmLabelClass: 'text-accent dark:text-accent-dark'
    };

    const score = Number(article.importance_score) || 0;

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
      catBadge.className = `inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border ${catMeta.badgeClass}`;
      catBadge.textContent = `${catMeta.symbol} ${catMeta.label}`;

      leftMeta.appendChild(catBadge);
      topBar.appendChild(leftMeta);
      topBar.appendChild(createScoreBadge(score, true));
      heroCard.appendChild(topBar);

      // 비대칭 2열 본문 그리드 (좌측: 제목 + 요약 / 우측: PM 시사점 + 태그/출처)
      const grid = document.createElement('div');
      grid.id = 'top-story-grid';
      grid.className = 'grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start';

      const leftCol = document.createElement('div');
      leftCol.className = 'lg:col-span-7 space-y-3.5';

      const korTitle = document.createElement('h3');
      korTitle.className =
        'text-xl sm:text-2xl lg:text-[26px] font-extrabold text-ink-primary dark:text-ink-darkPrimary leading-[1.38] tracking-tight';
      korTitle.textContent = article.korean_title || '';

      const origTitle = document.createElement('p');
      origTitle.className =
        'text-xs sm:text-sm text-ink-muted dark:text-ink-darkMuted leading-relaxed font-normal';
      origTitle.textContent = article.original_title || '';

      const summaryP = document.createElement('p');
      summaryP.className =
        'text-sm sm:text-[15.5px] text-ink-body dark:text-ink-darkBody leading-[1.8] pt-1 font-normal';
      summaryP.textContent = article.summary || '';

      leftCol.appendChild(korTitle);
      leftCol.appendChild(origTitle);
      leftCol.appendChild(summaryP);

      const rightCol = document.createElement('div');
      rightCol.className =
        'lg:col-span-5 bg-surface-light/90 dark:bg-surface-darkSubtle/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between h-full';

      const pmWrap = document.createElement('div');
      pmWrap.className = `rounded-xl p-4 border ${catMeta.pmBoxClass}`;

      const pmHeader = document.createElement('div');
      pmHeader.className = 'flex items-center gap-2 mb-2';

      const pmDot = document.createElement('span');
      pmDot.className = `w-2 h-2 rounded-full ${catMeta.pmDotClass}`;
      pmDot.setAttribute('aria-hidden', 'true');

      const pmHeading = document.createElement('p');
      pmHeading.className = `text-xs font-bold ${catMeta.pmLabelClass}`;
      pmHeading.textContent = 'PM 시사점 · 프로덕트 전략 인사이트';

      pmHeader.appendChild(pmDot);
      pmHeader.appendChild(pmHeading);

      const pmText = document.createElement('p');
      pmText.className =
        'text-xs sm:text-sm text-ink-primary dark:text-ink-darkPrimary leading-[1.74] font-medium';
      pmText.textContent = article.pm_insights || '';

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
    topBar.className = 'flex items-center justify-between gap-2 mb-3.5';

    const catLabel = document.createElement('span');
    catLabel.className = `inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border truncate ${catMeta.badgeClass}`;
    catLabel.textContent = `${catMeta.symbol} ${catMeta.label}`;

    topBar.appendChild(catLabel);
    topBar.appendChild(createScoreBadge(score, false));
    bodyWrap.appendChild(topBar);

    const korTitle = document.createElement('h3');
    korTitle.className =
      'text-[17px] sm:text-[18.5px] font-bold text-ink-primary dark:text-ink-darkPrimary leading-[1.42] tracking-tight mb-1.5';
    korTitle.textContent = article.korean_title || '';
    bodyWrap.appendChild(korTitle);

    const origTitle = document.createElement('p');
    origTitle.className =
      'text-xs text-ink-muted dark:text-ink-darkMuted mb-3.5 leading-relaxed font-normal';
    origTitle.textContent = article.original_title || '';
    bodyWrap.appendChild(origTitle);

    const summaryP = document.createElement('p');
    summaryP.className =
      'text-sm text-ink-body dark:text-ink-darkBody leading-[1.76] mb-4 font-normal';
    summaryP.textContent = article.summary || '';
    bodyWrap.appendChild(summaryP);

    // PM Insight 박스 — 요약과 시각적으로 명확히 구분 (SPEC.md 3.4)
    const pmBox = document.createElement('div');
    pmBox.className = `rounded-xl p-4 border ${catMeta.pmBoxClass}`;

    const pmHeader = document.createElement('div');
    pmHeader.className = 'flex items-center gap-1.5 mb-1.5';

    const pmDot = document.createElement('span');
    pmDot.className = `w-2 h-2 rounded-full ${catMeta.pmDotClass}`;
    pmDot.setAttribute('aria-hidden', 'true');

    const pmHeading = document.createElement('p');
    pmHeading.className = `text-xs font-bold ${catMeta.pmLabelClass}`;
    pmHeading.textContent = 'PM 시사점';

    pmHeader.appendChild(pmDot);
    pmHeader.appendChild(pmHeading);

    const pmText = document.createElement('p');
    pmText.className =
      'text-xs sm:text-[13.5px] text-ink-primary dark:text-ink-darkPrimary leading-[1.7] font-medium';
    pmText.textContent = article.pm_insights || '';

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
    if (hasCategory) {
      parts.push(`카테고리: ${state.category}`);
    }
    if (hasSearch) {
      parts.push(`검색어: "${state.search.trim()}"`);
    }
    statusText.textContent = `적용된 필터 (${parts.join(' · ')}) — 총 ${filteredCount}건 표시 중`;
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

  function renderArticles() {
    const topStorySection = document.getElementById('top-story-section');
    const topStoryContainer = document.getElementById('top-story-container');
    const gridSection = document.getElementById('articles-grid-section');
    const gridContainer = document.getElementById('articles-grid');
    const emptyState = document.getElementById('empty-state');
    const feedCountLabel = document.getElementById('feed-count-label');

    const q = state.search.trim().toLowerCase();

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

    updateActiveFilterBar(filtered.length);

    if (filtered.length === 0) {
      if (topStorySection) topStorySection.classList.add('hidden');
      if (gridSection) gridSection.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

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
          feedCountLabel.textContent = `외 ${restArticles.length}건의 브리핑`;
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
      updateCategoryTabsUI();
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
