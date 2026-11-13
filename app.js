/**
 * THE PM BRIEF — app.js
 * Swiss Architectural Bento & Quiet Luxury Memo
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
      shortCode: 'GOLF · TECH',
      label: 'Golf & Sports Tech',
      topBarClass: 'cat-bar-golf',
      badgeClass:
        'bg-cat-golfBg text-cat-golf border-cat-golf/30 dark:bg-cat-golfDarkBg dark:text-cat-golfDark dark:border-cat-golfDark/40',
      activeTabClass:
        'bg-cat-golf text-white border-cat-golf dark:bg-cat-golfDark dark:text-carbon-bg dark:border-cat-golfDark',
      pmAccentClass: 'border-l-cat-golf dark:border-l-cat-golfDark',
      pmLabelClass: 'text-cat-golf dark:text-cat-golfDark'
    },
    'AI Agents & LLM': {
      symbol: '◆',
      shortCode: 'AI · AGENT',
      label: 'AI Agents & LLM',
      topBarClass: 'cat-bar-ai',
      badgeClass:
        'bg-cat-aiBg text-cat-ai border-cat-ai/30 dark:bg-cat-aiDarkBg dark:text-cat-aiDark dark:border-cat-aiDark/40',
      activeTabClass:
        'bg-cat-ai text-white border-cat-ai dark:bg-cat-aiDark dark:text-carbon-bg dark:border-cat-aiDark',
      pmAccentClass: 'border-l-cat-ai dark:border-l-cat-aiDark',
      pmLabelClass: 'text-cat-ai dark:text-cat-aiDark'
    },
    'US-Korea Macro Economy': {
      symbol: '■',
      shortCode: 'MACRO · FX',
      label: 'US-Korea Macro Economy',
      topBarClass: 'cat-bar-macro',
      badgeClass:
        'bg-cat-macroBg text-cat-macro border-cat-macro/30 dark:bg-cat-macroDarkBg dark:text-cat-macroDark dark:border-cat-macroDark/40',
      activeTabClass:
        'bg-cat-macro text-white border-cat-macro dark:bg-cat-macroDark dark:text-carbon-bg dark:border-cat-macroDark',
      pmAccentClass: 'border-l-cat-macro dark:border-l-cat-macroDark',
      pmLabelClass: 'text-cat-macro dark:text-cat-macroDark'
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
      // localStorage 접근 불가 시에도 정상 동작 보장 (SPEC.md 3.5)
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
      const countSuffix = state.articles.length > 0 ? ` (${counts[cat] ?? 0})` : '';
      if (cat === 'all') {
        tab.textContent = `전체${countSuffix}`;
      } else if (meta) {
        tab.textContent = `${meta.symbol} ${meta.label}${countSuffix}`;
      }

      if (active) {
        if (cat === 'all') {
          tab.className =
            'cat-tab px-3 py-1.5 text-xs sm:text-sm font-bold border bg-paper-ink text-paper-surface border-paper-ink dark:bg-carbon-ink dark:text-carbon-bg dark:border-carbon-ink transition-colors';
        } else {
          tab.className = `cat-tab px-3 py-1.5 text-xs sm:text-sm font-bold border transition-colors ${meta.activeTabClass}`;
        }
      } else {
        tab.className =
          'cat-tab px-3 py-1.5 text-xs sm:text-sm font-semibold border bg-paper-surface dark:bg-carbon-surface text-paper-ink dark:text-carbon-ink border-paper-border dark:border-carbon-border hover:border-paper-borderStrong dark:hover:border-carbon-borderStrong transition-colors';
      }
    });

    // 지표 박스의 카테고리 버튼 선택 강조 동기화
    const metricBtns = document.querySelectorAll('.metric-cat-btn');
    metricBtns.forEach((btn) => {
      const cat = btn.getAttribute('data-metric-category');
      const isSelected = state.category === cat;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (isSelected) {
        btn.classList.add('ring-2', 'ring-paper-ink', 'dark:ring-carbon-ink');
      } else {
        btn.classList.remove('ring-2', 'ring-paper-ink', 'dark:ring-carbon-ink');
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
    if (elHigh) elHigh.textContent = `9+ CRITICAL: ${highPriority}건`;

    if (total > 0) {
      const barGolf = document.getElementById('bar-golf');
      const barAi = document.getElementById('bar-ai');
      const barMacro = document.getElementById('bar-macro');
      if (barGolf) barGolf.style.width = `${(golf / total) * 100}%`;
      if (barAi) barAi.style.width = `${(ai / total) * 100}%`;
      if (barMacro) barMacro.style.width = `${(macro / total) * 100}%`;
    }
  }

  function createScoreMeter(score) {
    const wrap = document.createElement('div');
    wrap.className = 'inline-flex items-center gap-2';

    const dots = document.createElement('div');
    dots.className = 'hidden sm:flex items-center gap-0.5';
    dots.setAttribute('aria-hidden', 'true');

    for (let i = 1; i <= 10; i += 1) {
      const seg = document.createElement('span');
      if (i <= score) {
        seg.className =
          score >= 9
            ? 'w-1.5 h-2.5 bg-signal dark:bg-signal-dark'
            : 'w-1.5 h-2.5 bg-paper-ink dark:bg-carbon-ink';
      } else {
        seg.className = 'w-1.5 h-2.5 bg-paper-border dark:bg-carbon-border';
      }
      dots.appendChild(seg);
    }

    const badge = document.createElement('span');
    if (score >= 9) {
      badge.className =
        'px-2 py-0.5 font-mono text-xs font-bold bg-signal text-white tabular-nums';
      badge.textContent = `CRITICAL ${score}/10`;
    } else if (score >= 6) {
      badge.className =
        'px-2 py-0.5 font-mono text-xs font-bold bg-paper-subtle dark:bg-carbon-subtle text-paper-ink dark:text-carbon-ink border border-paper-border dark:border-carbon-border tabular-nums';
      badge.textContent = `SCORE ${score}/10`;
    } else {
      badge.className =
        'px-2 py-0.5 font-mono text-xs font-medium bg-paper-subtle dark:bg-carbon-subtle text-paper-muted dark:text-carbon-muted border border-paper-border dark:border-carbon-border tabular-nums';
      badge.textContent = `REF ${score}/10`;
    }

    wrap.appendChild(dots);
    wrap.appendChild(badge);
    return wrap;
  }

  function createFooterBlock(article) {
    const footerWrap = document.createElement('div');
    footerWrap.className =
      'pt-3.5 mt-4 border-t border-paper-border dark:border-carbon-border space-y-3';

    if (Array.isArray(article.tags) && article.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'flex flex-wrap gap-1.5';

      article.tags.forEach((tag) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className =
          'px-2 py-0.5 text-[11px] font-medium bg-paper-subtle dark:bg-carbon-subtle text-paper-body dark:text-carbon-body border border-paper-border dark:border-carbon-border hover:border-signal hover:text-signal dark:hover:border-signal-dark dark:hover:text-signal-dark transition-colors';
        chip.textContent = `#${tag}`;
        chip.addEventListener('click', () => {
          setSearchQuery(String(tag));
        });
        tagsContainer.appendChild(chip);
      });

      footerWrap.appendChild(tagsContainer);
    }

    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex items-center justify-between gap-2 text-xs font-mono';

    const metaText = document.createElement('span');
    metaText.className = 'text-paper-muted dark:text-carbon-muted truncate tabular-nums';
    metaText.textContent = `${article.source_name || ''} · ${article.published_date || ''}`;

    const sourceLink = document.createElement('a');
    sourceLink.href = article.source_url || '#';
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.className =
      'shrink-0 inline-flex items-center gap-1 font-sans font-bold text-xs text-paper-ink dark:text-carbon-ink hover:text-signal dark:hover:text-signal-dark underline underline-offset-4 transition-colors';
    sourceLink.textContent = '원문 보기 ↗';

    bottomRow.appendChild(metaText);
    bottomRow.appendChild(sourceLink);
    footerWrap.appendChild(bottomRow);

    return footerWrap;
  }

  // SPEC.md 3.4: 기사 카드 생성 (모든 기사 텍스트는 textContent로 바인딩)
  function createArticleCard(article, isTopStory, displayIndex) {
    const catMeta = CATEGORY_META[article.category] || {
      symbol: '●',
      shortCode: 'BRIEF',
      label: String(article.category || ''),
      topBarClass: 'cat-bar-golf',
      badgeClass: 'bg-paper-subtle text-paper-ink border-paper-border',
      pmAccentClass: 'border-l-signal',
      pmLabelClass: 'text-signal dark:text-signal-dark'
    };

    const score = Number(article.importance_score) || 0;

    if (isTopStory) {
      const heroCard = document.createElement('article');
      heroCard.className = `bg-paper-surface dark:bg-carbon-surface border-2 border-paper-ink dark:border-carbon-ink ${catMeta.topBarClass} p-5 sm:p-7`;

      // 상단 메타 헤더
      const topBar = document.createElement('div');
      topBar.className =
        'flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-paper-border dark:border-carbon-border';

      const leftMeta = document.createElement('div');
      leftMeta.className = 'flex flex-wrap items-center gap-2';

      const idxBadge = document.createElement('span');
      idxBadge.className =
        'font-mono text-xs font-bold text-paper-muted dark:text-carbon-muted tabular-nums';
      idxBadge.textContent = 'NO. 01 // LEAD';

      const catBadge = document.createElement('span');
      catBadge.className = `inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold border ${catMeta.badgeClass}`;
      catBadge.textContent = `${catMeta.symbol} ${catMeta.label}`;

      leftMeta.appendChild(idxBadge);
      leftMeta.appendChild(catBadge);

      topBar.appendChild(leftMeta);
      topBar.appendChild(createScoreMeter(score));
      heroCard.appendChild(topBar);

      // 비대칭 2열 본문 그리드 (좌측: 제목 + 요약 / 우측: PM Strategic Insight 도시에 + 메타)
      const grid = document.createElement('div');
      grid.id = 'top-story-grid';
      grid.className = 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start';

      const leftCol = document.createElement('div');
      leftCol.className = 'lg:col-span-7 space-y-3';

      const korTitle = document.createElement('h2');
      korTitle.className =
        'font-serif text-xl sm:text-2xl lg:text-[28px] font-bold text-paper-ink dark:text-carbon-ink leading-[1.36] tracking-tight';
      korTitle.textContent = article.korean_title || '';

      const origTitle = document.createElement('p');
      origTitle.className =
        'text-xs sm:text-sm italic text-paper-muted dark:text-carbon-muted leading-relaxed';
      origTitle.textContent = article.original_title || '';

      const summaryP = document.createElement('p');
      summaryP.className =
        'text-sm sm:text-[15.5px] text-paper-body dark:text-carbon-body leading-[1.78] pt-1';
      summaryP.textContent = article.summary || '';

      leftCol.appendChild(korTitle);
      leftCol.appendChild(origTitle);
      leftCol.appendChild(summaryP);

      const rightCol = document.createElement('div');
      rightCol.className =
        'lg:col-span-5 bg-paper-dossier dark:bg-carbon-dossier border border-paper-border dark:border-carbon-border p-4 sm:p-5 flex flex-col justify-between h-full';

      const pmWrap = document.createElement('div');
      pmWrap.className = `border-l-4 ${catMeta.pmAccentClass} pl-3.5`;

      const pmHeader = document.createElement('div');
      pmHeader.className = 'flex items-center justify-between gap-2 mb-1.5';

      const pmHeading = document.createElement('p');
      pmHeading.className = `font-mono text-[11px] font-bold uppercase tracking-wider ${catMeta.pmLabelClass}`;
      pmHeading.textContent = 'PM INSIGHT · 제품/사업 시사점';

      pmHeader.appendChild(pmHeading);

      const pmText = document.createElement('p');
      pmText.className =
        'text-xs sm:text-sm text-paper-ink dark:text-carbon-ink leading-[1.72] font-medium';
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
    card.className = `bg-paper-surface dark:bg-carbon-surface border border-paper-border dark:border-carbon-border ${catMeta.topBarClass} p-5 flex flex-col justify-between transition-colors hover:border-paper-borderStrong dark:hover:border-carbon-borderStrong`;

    const bodyWrap = document.createElement('div');

    const topBar = document.createElement('div');
    topBar.className = 'flex items-center justify-between gap-2 mb-3';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'flex items-center gap-1.5 min-w-0';

    const idxSpan = document.createElement('span');
    idxSpan.className =
      'font-mono text-[11px] font-bold text-paper-muted dark:text-carbon-muted shrink-0 tabular-nums';
    idxSpan.textContent = `NO.${String(displayIndex).padStart(2, '0')}`;

    const catLabel = document.createElement('span');
    catLabel.className = `inline-block px-2 py-0.5 text-[11px] font-bold border truncate ${catMeta.badgeClass}`;
    catLabel.textContent = `${catMeta.symbol} ${catMeta.label}`;

    leftGroup.appendChild(idxSpan);
    leftGroup.appendChild(catLabel);

    const scoreBadge = document.createElement('span');
    scoreBadge.className =
      score >= 9
        ? 'shrink-0 px-2 py-0.5 font-mono text-xs font-bold bg-signal text-white tabular-nums'
        : 'shrink-0 px-2 py-0.5 font-mono text-xs font-semibold bg-paper-subtle dark:bg-carbon-subtle text-paper-ink dark:text-carbon-ink border border-paper-border dark:border-carbon-border tabular-nums';
    scoreBadge.textContent = `${score}/10`;

    topBar.appendChild(leftGroup);
    topBar.appendChild(scoreBadge);
    bodyWrap.appendChild(topBar);

    const korTitle = document.createElement('h3');
    korTitle.className =
      'font-serif text-lg sm:text-[19px] font-bold text-paper-ink dark:text-carbon-ink leading-[1.4] mb-1.5';
    korTitle.textContent = article.korean_title || '';
    bodyWrap.appendChild(korTitle);

    const origTitle = document.createElement('p');
    origTitle.className =
      'text-xs italic text-paper-muted dark:text-carbon-muted mb-3.5 leading-relaxed';
    origTitle.textContent = article.original_title || '';
    bodyWrap.appendChild(origTitle);

    const summaryP = document.createElement('p');
    summaryP.className =
      'text-sm text-paper-body dark:text-carbon-body leading-[1.74] mb-4';
    summaryP.textContent = article.summary || '';
    bodyWrap.appendChild(summaryP);

    // PM Insight 박스 — 요약과 시각적으로 명확히 구분 (SPEC.md 3.4)
    const pmBox = document.createElement('div');
    pmBox.className = `bg-paper-dossier dark:bg-carbon-dossier border border-paper-border dark:border-carbon-border border-l-4 ${catMeta.pmAccentClass} p-3.5`;

    const pmHeading = document.createElement('p');
    pmHeading.className = `font-mono text-[11px] font-bold uppercase tracking-wider ${catMeta.pmLabelClass} mb-1`;
    pmHeading.textContent = 'PM INSIGHT · 시사점';

    const pmText = document.createElement('p');
    pmText.className =
      'text-xs sm:text-[13px] text-paper-ink dark:text-carbon-ink leading-[1.68] font-medium';
    pmText.textContent = article.pm_insights || '';

    pmBox.appendChild(pmHeading);
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
    statusText.textContent = `적용된 필터 (${ parts.join(' · ') }) — 총 ${filteredCount}건 표시 중`;
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
      topStoryContainer.replaceChildren(createArticleCard(topArticle, true, 1));
      topStorySection.classList.remove('hidden');
    }

    if (gridContainer && gridSection) {
      gridContainer.replaceChildren();
      if (restArticles.length > 0) {
        restArticles.forEach((article, idx) => {
          gridContainer.appendChild(createArticleCard(article, false, idx + 2));
        });
        if (feedCountLabel) {
          feedCountLabel.textContent = `SHOWING ${restArticles.length} ADDITIONAL ARTICLES`;
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
