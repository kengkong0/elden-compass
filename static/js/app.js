// ============================================================
// 艾尔登法环·褪色者探索罗盘 (Elden Compass) - 交互与渲染引擎
// ============================================================

const state = {
  currentPage: 21,
  totalPages: 199,
  chapters: [],
  currentTab: 'guide',
  checklist: {},
  opacity: 90,
  fontSize: 14,
  isMini: false,
  isClickThrough: false,
  searchQuery: ''
};

// DOM 引用
const elements = {
  body: document.body,
  headerChapterPill: document.getElementById('headerChapterPill'),
  navTabs: document.querySelectorAll('.nav-tab'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  
  // 抽屉目录
  drawerSidebar: document.getElementById('drawerSidebar'),
  drawerScrim: document.getElementById('drawerScrim'),
  drawerTriggerBtn: document.getElementById('drawerTriggerBtn'),
  drawerCloseBtn: document.getElementById('drawerCloseBtn'),
  chapterList: document.getElementById('chapterList'),
  searchInput: document.getElementById('searchInput'),
  
  // 阅读区
  currentTitle: document.getElementById('currentTitle'),
  pageCounter: document.getElementById('pageCounter'),
  highlightsBanner: document.getElementById('highlightsBanner'),
  hlTagsList: document.getElementById('hlTagsList'),
  guideArticle: document.getElementById('guideArticle'),
  fontDecBtn: document.getElementById('fontDecBtn'),
  fontIncBtn: document.getElementById('fontIncBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  footerChapterPicker: document.getElementById('footerChapterPicker'),
  footerChapterText: document.getElementById('footerChapterText'),
  
  // 窗口控制
  dragHandle: document.getElementById('dragHandle'),
  opacitySlider: document.getElementById('opacitySlider'),
  opacityVal: document.getElementById('opacityVal'),
  clickthroughBtn: document.getElementById('clickthroughBtn'),
  clickthroughBadge: document.getElementById('clickthroughBadge'),
  miniBtn: document.getElementById('miniBtn'),
  minBtn: document.getElementById('minBtn'),
  closeBtn: document.getElementById('closeBtn'),
  
  // 灯箱
  lightboxModal: document.getElementById('lightboxModal'),
  lightboxImg: document.getElementById('lightboxImg'),

  // 地图刷新
  mapReloadBtn: document.getElementById('mapReloadBtn'),
  mapIframe: document.getElementById('mapIframe')
};

// 防抖计时器
let saveTimer = null;

// ============================================================
// 初始化应用
// ============================================================
async function initApp() {
  console.log("法环探索罗盘启动中...");

  // 1. 读取保存的用户状态
  await loadUserState();

  // 2. 加载章节目录
  await loadChapters();

  // 3. 渲染全收集与避坑指南
  renderChecklist();
  renderTips();

  // 4. 加载当前章节攻略
  loadGuidePage(state.currentPage);

  // 5. 事件绑定
  bindEvents();
}

// ============================================================
// 数据同步与防抖持久化
// ============================================================
async function loadUserState() {
  try {
    const res = await fetch('/api/user_state');
    if (res.ok) {
      const data = await res.json();
      if (data.currentPage) state.currentPage = data.currentPage;
      if (data.opacity) state.opacity = data.opacity;
      if (data.fontSize) state.fontSize = data.fontSize;
      if (data.checklist) state.checklist = data.checklist;
      if (data.currentTab) state.currentTab = data.currentTab;
      if (data.isMini !== undefined) state.isMini = data.isMini;

      // 应用字号
      applyFontSize(state.fontSize);

      // 应用透明度滑块
      if (elements.opacitySlider) {
        elements.opacitySlider.value = state.opacity;
        elements.opacityVal.textContent = `${state.opacity}%`;
        applyOpacity(state.opacity, false);
      }

      // 恢复 Tab
      switchTab(state.currentTab);
    }
  } catch (err) {
    console.warn("读取配置失败，使用默认状态:", err);
  }
}

function debouncedSaveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fetch('/api/user_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPage: state.currentPage,
          opacity: state.opacity,
          fontSize: state.fontSize,
          isMini: state.isMini,
          checklist: state.checklist,
          currentTab: state.currentTab
        })
      });
    } catch (err) {
      console.warn("保存状态异常:", err);
    }
  }, 350);
}

// ============================================================
// 章节数据与抽屉侧栏渲染
// ============================================================
async function loadChapters() {
  try {
    const res = await fetch('/api/chapters');
    if (res.ok) {
      state.chapters = await res.json();
      state.totalPages = state.chapters.length || 199;
      renderDrawerChapters();
    }
  } catch (err) {
    console.error("加载目录失败:", err);
  }
}

function renderDrawerChapters() {
  elements.chapterList.innerHTML = '';

  const groups = {};
  state.chapters.forEach(c => {
    const reg = c.region || '探索';
    if (!groups[reg]) groups[reg] = [];
    groups[reg].push(c);
  });

  const query = state.searchQuery.trim().toLowerCase();
  const numQuery = query.replace(/^p/i, '');

  for (const [region, items] of Object.entries(groups)) {
    const filtered = query
      ? items.filter(it => 
          it.title.toLowerCase().includes(query) || 
          region.toLowerCase().includes(query) ||
          (numQuery && String(it.page) === numQuery) ||
          ("p" + it.page).includes(query)
        )
      : items;

    if (filtered.length === 0) continue;

    const groupTitle = document.createElement('div');
    groupTitle.className = 'region-title';
    groupTitle.innerHTML = `<span>📜</span> <span>${region}</span>`;
    elements.chapterList.appendChild(groupTitle);

    filtered.forEach(it => {
      const item = document.createElement('div');
      item.className = `chapter-item ${it.page === state.currentPage ? 'active' : ''}`;
      item.dataset.page = it.page;
      item.innerHTML = `
        <span class="c-num">P${it.page}</span>
        <span class="c-text">${it.title}</span>
      `;
      item.addEventListener('click', () => {
        loadGuidePage(it.page);
        closeDrawer();
      });
      elements.chapterList.appendChild(item);
    });
  }
}

function highlightActiveChapter(pageNum) {
  const prev = elements.chapterList.querySelector('.chapter-item.active');
  if (prev) prev.classList.remove('active');

  const curr = elements.chapterList.querySelector(`.chapter-item[data-page="${pageNum}"]`);
  if (curr) {
    curr.classList.add('active');
    curr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function openDrawer() {
  elements.drawerSidebar.classList.add('open');
  elements.drawerScrim.classList.add('active');
  // 聚焦搜索框
  setTimeout(() => elements.searchInput.focus(), 100);
}

function closeDrawer() {
  elements.drawerSidebar.classList.remove('open');
  elements.drawerScrim.classList.remove('active');
}

// 安全调用 pywebview 原生接口辅助函数
function callPywebviewApi(method, ...args) {
  try {
    if (window.pywebview && window.pywebview.api && typeof window.pywebview.api[method] === 'function') {
      window.pywebview.api[method](...args);
    }
  } catch (err) {
    console.warn(`[pywebview API] ${method} error:`, err);
  }
}

// ============================================================
// 攻略正文加载
// ============================================================
async function loadGuidePage(pageNum) {
  if (pageNum < 1) pageNum = 1;
  if (pageNum > state.totalPages) pageNum = state.totalPages;
  state.currentPage = pageNum;

  // 更新顶栏状态
  elements.currentTitle.textContent = `P${pageNum} 加载中...`;
  elements.headerChapterPill.textContent = `P${pageNum}...`;
  elements.pageCounter.textContent = `${pageNum}/${state.totalPages}`;
  elements.footerChapterText.textContent = `P${pageNum} / ${state.totalPages}`;

  elements.prevBtn.disabled = pageNum <= 1;
  elements.nextBtn.disabled = pageNum >= state.totalPages;

  elements.guideArticle.innerHTML = `
    <div style="text-align: center; padding: 40px 10px; color: var(--gold-primary);">
      <div style="font-size: 26px; animation: spin 1.2s linear infinite;">⚜️</div>
      <p style="margin-top: 10px; font-size: 12px; color: var(--gold-light);">正在调阅游民全探索档案...</p>
    </div>
  `;

  highlightActiveChapter(pageNum);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`/api/page/${pageNum}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const title = data.title || `第 ${pageNum} 节`;
      elements.currentTitle.textContent = title;
      elements.currentTitle.title = title;
      elements.headerChapterPill.textContent = title;

      // 渲染速览横幅
      renderHighlights(data.highlights);

      // 注入正文
      elements.guideArticle.innerHTML = data.html || "<p>本节无内容</p>";
      elements.guideArticle.scrollTop = 0;

      // 绑定大图预览
      bindLightbox();

      // 防抖保存进度
      debouncedSaveState();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    elements.currentTitle.textContent = `P${pageNum} 加载未完成`;
    elements.guideArticle.innerHTML = `
      <div class="error-box" style="padding: 30px 10px; text-align: center;">
        <p style="color: var(--gold-light); font-weight: 600; font-size: 13px;">⚠️ 攻略加载稍慢或网络波动</p>
        <p style="color: var(--text-muted); font-size: 11px; margin: 6px 0 12px 0;">游民星空服务器可能响应超时，请点击下方重试</p>
        <button class="footer-nav-btn prev" style="margin: 0 auto;" onclick="window.navigateChapter(0)">🔄 点击重新加载</button>
      </div>
    `;
  }
}

function renderHighlights(highlights) {
  elements.hlTagsList.innerHTML = '';
  if (highlights && highlights.length > 0) {
    elements.highlightsBanner.style.display = 'flex';
    highlights.forEach(h => {
      const chip = document.createElement('span');
      chip.className = 'hl-chip';
      chip.textContent = h;
      elements.hlTagsList.appendChild(chip);
    });
  } else {
    elements.highlightsBanner.style.display = 'none';
  }
}

function bindLightbox() {
  const figures = elements.guideArticle.querySelectorAll('figure.guide-figure');
  figures.forEach(fig => {
    fig.addEventListener('click', () => {
      const img = fig.querySelector('img.guide-img');
      if (img) {
        elements.lightboxImg.src = img.dataset.full || img.src;
        elements.lightboxModal.classList.add('active');
      }
    });
  });
}

// 暴露全局翻页接口，供后端全局热键（Alt+Left / Alt+Right）直接调用
window.navigateChapter = function(direction) {
  loadGuidePage(state.currentPage + direction);
};

// ============================================================
// 字号调节
// ============================================================
function applyFontSize(size) {
  state.fontSize = Math.max(12, Math.min(20, size));
  elements.guideArticle.style.fontSize = `${state.fontSize}px`;
  debouncedSaveState();
}

// ============================================================
// 透明度调节 (解决双重透明度叠加 Bug)
// ============================================================
function applyOpacity(val, doSave = true) {
  state.opacity = val;
  elements.opacityVal.textContent = `${val}%`;

  // 如果是在 pywebview 环境，仅调 Win32 窗口透明度，绝不调 body 样式！
  if (window.pywebview) {
    callPywebviewApi('set_opacity', val);
  } else {
    // 纯浏览器运行环境兜底
    document.body.style.opacity = val / 100.0;
  }

  if (doSave) debouncedSaveState();
}

// ============================================================
// 全收集与防断支线清单渲染
// ============================================================
function renderChecklist() {
  const clData = window.ELDEN_DATA;
  if (!clData) return;

  const container = document.getElementById('checklistContainer');
  container.innerHTML = '';

  // 1. 顶部四大核心收集品统计
  const statGrid = document.createElement('div');
  statGrid.className = 'progress-grid';

  const stats = [
    { key: 'sacredTears', icon: '🍷', title: '圣杯滴露', total: clData.collections.sacredTears.length },
    { key: 'goldenSeeds', icon: '🌰', title: '黄金种子', total: clData.collections.goldenSeeds.length },
    { key: 'talismanPouches', icon: '🎒', title: '护符皮袋', total: clData.collections.talismanPouches.length },
    { key: 'memoryStones', icon: '🔮', title: '记忆石', total: clData.collections.memoryStones.length }
  ];

  stats.forEach(s => {
    let checkedCount = 0;
    clData.collections[s.key].forEach(item => {
      if (state.checklist[item.id]) checkedCount++;
    });
    const percent = Math.round((checkedCount / s.total) * 100);

    const card = document.createElement('div');
    card.className = 'stat-card';
    card.id = `stat-card-${s.key}`;
    card.innerHTML = `
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-title">${s.title}</div>
      <div class="stat-num"><span id="cnt-${s.key}">${checkedCount}</span> / ${s.total}</div>
      <div class="stat-bar"><div class="stat-fill" id="bar-${s.key}" style="width: ${percent}%;"></div></div>
    `;
    statGrid.appendChild(card);
  });
  container.appendChild(statGrid);

  // 2. 收集品详情列表
  for (const [key, items] of Object.entries(clData.collections)) {
    const sec = document.createElement('div');
    sec.className = 'cl-section';

    const sInfo = stats.find(s => s.key === key);
    sec.innerHTML = `
      <div class="cl-section-header">
        <div class="cl-section-title">
          <span>${sInfo.icon}</span> <span>${sInfo.title}</span>
        </div>
        <div class="cl-badge">${items.length} 个点位</div>
      </div>
    `;

    const list = document.createElement('div');
    list.className = 'cl-list';
    items.forEach(it => {
      const isChecked = !!state.checklist[it.id];
      const row = document.createElement('div');
      row.className = `cl-item ${isChecked ? 'checked' : ''}`;
      row.innerHTML = `
        <input type="checkbox" class="cl-checkbox" ${isChecked ? 'checked' : ''}>
        <div class="cl-item-body">
          <div class="cl-item-title">
            <span>${it.name}</span>
            <span class="cl-item-region">${it.region}</span>
          </div>
          <div class="cl-item-desc">${it.desc}</div>
        </div>
      `;
      row.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const cb = row.querySelector('.cl-checkbox');
          cb.checked = !cb.checked;
        }
        toggleCheck(it.id, row.querySelector('.cl-checkbox').checked, sInfo.key);
        row.classList.toggle('checked', row.querySelector('.cl-checkbox').checked);
      });
      list.appendChild(row);
    });
    sec.appendChild(list);
    container.appendChild(sec);
  }

  // 3. 支线防断任务树
  const qHead = document.createElement('div');
  qHead.style.cssText = 'font-size: 13px; font-weight: 700; color: var(--gold-light); margin-top: 10px; display: flex; align-items: center; gap: 6px;';
  qHead.innerHTML = `<span>👑</span> <span>重要不可逆支线防断追踪器</span>`;
  container.appendChild(qHead);

  clData.questlines.forEach(q => {
    const qSec = document.createElement('div');
    qSec.className = 'cl-section';
    qSec.style.borderLeft = `3px solid ${q.color || 'var(--gold-primary)'}`;
    qSec.innerHTML = `
      <div class="cl-section-header">
        <div class="cl-section-title" style="color: ${q.color || 'var(--gold-light)'};">
          <span>✨</span> <span>${q.title}</span>
        </div>
        <div class="cl-badge" style="border-color: ${q.color}; color: ${q.color};">${q.badge}</div>
      </div>
    `;

    const qList = document.createElement('div');
    qList.className = 'cl-list';
    q.steps.forEach(st => {
      const isChecked = !!state.checklist[st.id];
      const sRow = document.createElement('div');
      sRow.className = `cl-item ${isChecked ? 'checked' : ''}`;
      sRow.innerHTML = `
        <input type="checkbox" class="cl-checkbox" ${isChecked ? 'checked' : ''}>
        <div class="cl-item-body">
          <div class="cl-item-desc" style="color: ${isChecked ? 'var(--text-dim)' : 'var(--text-main)'}; font-size: 12px;">${st.text}</div>
        </div>
      `;
      sRow.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const cb = sRow.querySelector('.cl-checkbox');
          cb.checked = !cb.checked;
        }
        toggleCheck(st.id, sRow.querySelector('.cl-checkbox').checked);
        sRow.classList.toggle('checked', sRow.querySelector('.cl-checkbox').checked);
      });
      qList.appendChild(sRow);
    });
    qSec.appendChild(qList);
    container.appendChild(qSec);
  });
}

function toggleCheck(id, isChecked, statKey) {
  state.checklist[id] = isChecked;
  debouncedSaveState();

  if (statKey) {
    const clData = window.ELDEN_DATA;
    const total = clData.collections[statKey].length;
    let cnt = 0;
    clData.collections[statKey].forEach(it => {
      if (state.checklist[it.id]) cnt++;
    });
    const cntEl = document.getElementById(`cnt-${statKey}`);
    const barEl = document.getElementById(`bar-${statKey}`);
    if (cntEl) cntEl.textContent = cnt;
    if (barEl) barEl.style.width = `${Math.round((cnt / total) * 100)}%`;
  }
}

// ============================================================
// 避坑速查表渲染
// ============================================================
function renderTips() {
  const clData = window.ELDEN_DATA;
  if (!clData) return;

  const container = document.getElementById('tipsContainer');
  container.innerHTML = `
    <div class="tips-card">
      <h3 style="font-size: 13px; color: var(--gold-light);">📊 区域推荐探索等级 & 武器强化对照</h3>
      <table class="tips-table">
        <thead>
          <tr>
            <th>区域</th>
            <th>推荐等级</th>
            <th>强化建议</th>
            <th>备注说明</th>
          </tr>
        </thead>
        <tbody>
          ${clData.levelGuides.map(g => `
            <tr>
              <td style="font-weight: 700; color: var(--gold-light);">${g.region}</td>
              <td>${g.level}</td>
              <td>${g.weapon}</td>
              <td style="color: var(--text-muted);">${g.note}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="tips-card">
      <h3 style="font-size: 13px; color: var(--gold-light);">🗡️ 开荒强力武器/护符逃课速拿</h3>
      ${clData.starterGems.map(g => `
        <div class="gem-item">
          <div class="gem-header">
            <span class="gem-name">${g.name}</span>
            <span class="gem-type">${g.type}</span>
          </div>
          <div class="gem-loc">📍 ${g.loc}</div>
          <div class="gem-desc">${g.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
// 模式与功能切换
// ============================================================
function switchTab(tabName) {
  state.currentTab = tabName;
  elements.navTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  elements.tabPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabName}Pane`);
  });

  if (tabName === 'map' && elements.mapIframe && !elements.mapIframe.src) {
    elements.mapIframe.src = 'https://www.gamersky.com/tools/map/eldenring/';
  }

  debouncedSaveState();
}

function toggleMiniMode() {
  state.isMini = !state.isMini;
  elements.body.classList.toggle('mini-mode', state.isMini);
  elements.miniBtn.classList.toggle('active', state.isMini);

  callPywebviewApi('toggle_mini', state.isMini);
  debouncedSaveState();
}

function toggleClickThrough() {
  state.isClickThrough = !state.isClickThrough;
  updateClickThroughUI(state.isClickThrough);

  callPywebviewApi('toggle_clickthrough', state.isClickThrough);
}

function updateClickThroughUI(active) {
  elements.clickthroughBtn.classList.toggle('active', active);
  elements.clickthroughBadge.classList.toggle('active', active);
}

// 监听后端派发的热键穿透变化事件
window.addEventListener('clickthrough-changed', (e) => {
  state.isClickThrough = e.detail;
  updateClickThroughUI(state.isClickThrough);
});

// ============================================================
// 事件绑定
// ============================================================
function bindEvents() {
  // 顶栏窗口原生平滑拖拽
  if (elements.dragHandle) {
    elements.dragHandle.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // 仅响应鼠标左键
        callPywebviewApi('drag_window');
      }
    });
  }

  // Tab 点击
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // 抽屉展开与关闭
  elements.drawerTriggerBtn.addEventListener('click', openDrawer);
  elements.footerChapterPicker.addEventListener('click', openDrawer);
  elements.drawerCloseBtn.addEventListener('click', closeDrawer);
  elements.drawerScrim.addEventListener('click', closeDrawer);

  // 搜索过滤
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderDrawerChapters();
  });

  // 拦截攻略内超链接，防止 WebView 页面被跳转离开罗盘
  if (elements.guideArticle) {
    elements.guideArticle.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && a.href) {
        e.preventDefault();
        const match = a.href.match(/pageNum=(\d+)/i);
        if (match) {
          loadGuidePage(parseInt(match[1], 10));
        } else if (a.href.startsWith('http')) {
          callPywebviewApi('open_external', a.href);
        }
      }
    });
  }

  // 翻页
  elements.prevBtn.addEventListener('click', () => loadGuidePage(state.currentPage - 1));
  elements.nextBtn.addEventListener('click', () => loadGuidePage(state.currentPage + 1));

  // 字号
  elements.fontDecBtn.addEventListener('click', () => applyFontSize(state.fontSize - 1));
  elements.fontIncBtn.addEventListener('click', () => applyFontSize(state.fontSize + 1));

  // 透明度滑动（高频实时应用，松手或防抖落盘）
  elements.opacitySlider.addEventListener('input', (e) => {
    applyOpacity(parseInt(e.target.value, 10));
  });

  // 模式与穿透
  elements.miniBtn.addEventListener('click', toggleMiniMode);
  elements.clickthroughBtn.addEventListener('click', toggleClickThrough);

  // 地图刷新
  if (elements.mapReloadBtn) {
    elements.mapReloadBtn.addEventListener('click', () => {
      elements.mapIframe.src = 'https://www.gamersky.com/tools/map/eldenring/';
    });
  }

  // 灯箱关闭
  elements.lightboxModal.addEventListener('click', () => {
    elements.lightboxModal.classList.remove('active');
  });

  // 窗口最小化与关闭
  elements.minBtn.addEventListener('click', () => {
    callPywebviewApi('minimize');
  });

  elements.closeBtn.addEventListener('click', () => {
    if (window.pywebview) {
      callPywebviewApi('close');
    } else {
      window.close();
    }
  });

  // 键盘快捷键监听 (当罗盘在焦点时)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.lightboxModal.classList.remove('active');
      closeDrawer();
      return;
    }

    if (e.target.tagName !== 'INPUT') {
      if (e.key === '[' || e.key === 'PageUp') {
        loadGuidePage(state.currentPage - 1);
      } else if (e.key === ']' || e.key === 'PageDown') {
        loadGuidePage(state.currentPage + 1);
      }
    }
  });
}

// 监听 pywebview 原生桥梁准备就绪事件
window.addEventListener('pywebviewready', () => {
  // 桥接就绪：清除纯浏览器端兜底的 body opacity，切换为操作系统底层硬件级半透明
  document.body.style.opacity = '';
  callPywebviewApi('set_opacity', state.opacity);
});

document.addEventListener('DOMContentLoaded', initApp);
