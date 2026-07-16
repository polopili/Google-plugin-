(function () {
  'use strict';

  // Anti-FOUC：立刻给 <html> 加标记，配合 home.css 隐藏内容区，
  // 直到布局改造完成（或超时兜底）再显示，避免刷新时闪现原始单列布局。
  document.documentElement.classList.add('rangi-loading');
  function reveal() {
    document.documentElement.classList.remove('rangi-loading');
  }

  const INJECT_ID = '__rangi-menu-notifications'; // 通知注入块的唯一标识
  const TWOCOL_ID = '__rangi-two-col';            // 双列容器的唯一标识

  // 通知铃铛图标（heroicons solid bell），与站点其它 h3 图标风格一致
  const BELL_SVG =
    '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" ' +
    'aria-hidden="true" class="inline-block size-5" height="1em" width="1em" ' +
    'xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" ' +
    'd="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" ' +
    'clip-rule="evenodd"></path></svg>';

  /* =============================================================
     按卡片头部 <strong> 文本找到对应卡片容器。
     卡片结构： <div.bg-background> <header data-slot="BoxHeader"><strong>标题</strong></header> <div>正文</div> </div>
     header 的父元素即整张卡片外壳。
  ============================================================= */
  function findCardByTitle(title) {
    const strongs = document.querySelectorAll('header[data-slot="BoxHeader"] strong');
    for (const s of strongs) {
      if (s.textContent.trim() === title) {
        const header = s.closest('header[data-slot="BoxHeader"]');
        return header ? header.parentElement : null;
      }
    }
    return null;
  }

  /* =============================================================
     取 Menu 卡片内 BoxContent 的第二个子 div（My Pages 所在的宽栏）。
  ============================================================= */
  function getMenuSecondColumn(menuCard) {
    const box = menuCard.querySelector('[data-slot="BoxContent"]');
    if (!box) return null;
    const cols = Array.from(box.children).filter((el) => el.tagName === 'DIV');
    return cols.length >= 2 ? cols[1] : null;
  }

  /* =============================================================
     步骤 A：把 Notifications 合并进 Menu 第二栏。
     返回 true 表示已完成（可停止重试），false 表示条件未就绪。
  ============================================================= */
  function mergeNotifications() {
    if (document.getElementById(INJECT_ID)) return true; // 已合并过

    const menuCard = findCardByTitle('Menu');
    const notiCard = findCardByTitle('Notifications');
    if (!menuCard || !notiCard) return false;

    const targetCol = getMenuSecondColumn(menuCard);
    const notiList = notiCard.querySelector('[data-slot="BoxContent"]'); // 含 Available/My Previous eForms 及角标
    if (!targetCol || !notiList) return false;

    const block = document.createElement('div');
    block.id = INJECT_ID;
    block.className = 'w-full px-2';

    const h3 = document.createElement('h3');
    h3.className =
      'text-md text-primary flex h-10 items-center gap-1 truncate border-b font-bold';
    h3.innerHTML = BELL_SVG + 'Notifications';

    block.appendChild(h3);
    block.appendChild(notiList); // ★ 移动原节点（非复制）→ 保留 React 点击（前端跳转）
    targetCol.appendChild(block);

    notiCard.style.setProperty('display', 'none', 'important'); // 隐藏搬空后的原通知卡片
    return true;
  }

  /* =============================================================
     步骤 B：把整页竖向单列改成左右两列。
       左列 = Menu 卡片；右列 = 顶部分栏之后的所有内容（My Dashboard 标题 + 各卡片）。
     返回 true 表示已完成，false 表示条件未就绪。
  ============================================================= */
  function buildTwoColumn() {
    if (document.getElementById(TWOCOL_ID)) return true; // 已改过

    const menuCard = findCardByTitle('Menu');
    if (!menuCard) return false;

    // 顶部分栏容器（Menu 卡片的父级），以及它的父级——整页主容器（竖向单列）
    const split = menuCard.parentElement;                 // flex ... md:flex-row flex-col-reverse
    const mainWrap = split && split.parentElement;        // m-auto max-w-7xl flex-col gap-4
    if (!split || !mainWrap) return false;

    // 安全校验：确认确实命中了预期的两层容器，命中不了就放弃（不乱改布局）
    if (!split.classList.contains('flex-col-reverse')) return false;
    if (!mainWrap.className.includes('max-w-7xl')) return false;

    // 加宽整页内容区：覆盖 max-w-7xl(1280px)，缩小左右两侧空白、让内容更舒展。
    // 数字随意调：想更宽就把 112rem 调大（如 128rem）；想更窄就调小。窄屏用 95vw 自适应。
    mainWrap.style.setProperty('max-width', 'min(95vw, 112rem)', 'important');

    // 收集「顶部分栏之后」的所有兄弟元素（My Dashboard 标题 + 下面所有卡片）
    const rightItems = [];
    for (let n = split.nextElementSibling; n; n = n.nextElementSibling) {
      rightItems.push(n);
    }
    if (rightItems.length === 0) return false; // 右列没内容，暂不改（等渲染完）

    // 两列容器：窄屏上下堆叠，md 以上左右并排。
    // 宽度/对齐由 home.css 的 .rangi-row / .rangi-left / .rangi-right 控制
    //（注入的元素用不了 Tailwind 任意值类名，必须写真实 CSS —— 想调 Menu 宽窄就改 home.css）。
    const row = document.createElement('div');
    row.id = TWOCOL_ID;
    row.className = 'rangi-row flex flex-col gap-4 md:flex-row';

    const leftCol = document.createElement('div');   // Menu 列（窄）
    leftCol.className = 'rangi-left w-full min-w-0 flex flex-col gap-4';
    const rightCol = document.createElement('div');  // Dashboard 列（宽）
    rightCol.className = 'rangi-right w-full min-w-0 flex flex-col gap-4';

    leftCol.appendChild(menuCard);                     // ★ 移动 Menu 卡片到左列
    rightItems.forEach((n) => rightCol.appendChild(n)); // ★ 移动 Dashboard 整块到右列

    row.appendChild(leftCol);
    row.appendChild(rightCol);
    mainWrap.insertBefore(row, split); // 放到原分栏的位置

    split.style.setProperty('display', 'none', 'important'); // 藏掉搬空后的旧分栏（内含隐藏的空侧栏）
    return true;
  }

  /* =============================================================
     步骤 C：把 Menu 内容改成「单列」，顺序为 My Pages → Notifications → Quicklinks。
       原本 BoxContent 是横向两列（左 Quicklinks，右 My Pages+Notifications）。
       这里改成竖向单列：三个区块按指定顺序堆叠，隐藏空掉的两个列包装。
  ============================================================= */
  function tidyMenu() {
    const menuCard = findCardByTitle('Menu');
    if (!menuCard) return false;
    if (menuCard.dataset.rangiTidy) return true; // 幂等

    const box = menuCard.querySelector('[data-slot="BoxContent"]');
    if (!box) return false;

    // 按 h3 文本找到三个区块（每个是包着标题的容器）
    const sectionByTitle = (kw) => {
      const h3 = Array.from(box.querySelectorAll('h3')).find((h) =>
        h.textContent.trim().startsWith(kw)
      );
      return h3 ? h3.parentElement : null;
    };
    const secPages = sectionByTitle('My Pages');
    const secNoti = sectionByTitle('Notifications'); // 需 mergeNotifications 先跑完
    const secQuick = sectionByTitle('Quicklinks');
    if (!secPages || !secNoti || !secQuick) return false; // 还没就绪，稍后重试

    // 所有列表统一竖排（移除多列排版，避免链接左右并排）
    menuCard.querySelectorAll('ul').forEach((ul) => {
      ul.classList.remove('lg:columns-2', 'columns-2');
    });

    // 先记下原来的两个列包装 div（待会儿隐藏）
    const oldCols = Array.from(box.children).filter((el) => el.tagName === 'DIV');

    // BoxContent 改为竖向单列，把三个区块按顺序直接挂到它下面（appendChild 会移动节点）
    box.style.setProperty('flex-direction', 'column');
    [secPages, secNoti, secQuick].forEach((s) => box.appendChild(s));

    // 隐藏已经搬空的原列包装
    oldCols.forEach((c) => c.style.setProperty('display', 'none', 'important'));

    menuCard.dataset.rangiTidy = '1';
    return true;
  }

  /* =============================================================
     步骤 D：把「My Dashboard」标题嵌入下方红色 bar（日历卡片头部），
             并隐藏原来单独的大标题。
     红条头部是 React 日历，翻页会重渲染更新日期；我们把标题作为额外节点
     插到它最前面——React 只管理它自己创建的节点，不会删掉我们插入的节点，
     所以能稳定保留。日期文字是它自己的节点，我们不碰。
  ============================================================= */
  function embedDashboardTitle() {
    const TITLE_ID = '__rangi-dashboard-title';
    if (document.getElementById(TITLE_ID)) return true; // 已嵌入

    // My Dashboard 大标题
    let h2 = null;
    document.querySelectorAll('h2').forEach((el) => {
      if (el.textContent.trim() === 'My Dashboard') h2 = el;
    });
    // 红色 bar 头部（bg-(--fsm-red)）
    let redHeader = null;
    document.querySelectorAll('header[data-slot="BoxHeader"]').forEach((h) => {
      if (h.className.includes('fsm-red')) redHeader = h;
    });
    if (!h2 || !redHeader) return false;

    redHeader.style.setProperty('position', 'relative'); // 作为绝对定位标题的参照系

    const span = document.createElement('span');
    span.id = TITLE_ID; // 居中样式在 home.css（绝对定位到红条正中）
    span.textContent = 'My Dashboard';
    span.className = 'text-lg font-bold whitespace-nowrap'; // 继承红条的白色文字
    redHeader.insertBefore(span, redHeader.firstChild);

    h2.style.setProperty('display', 'none', 'important'); // 隐藏原大标题
    return true;
  }

  function reorderAttendance() {
    
  }


  /* =============================================================
     一次性执行：各步骤都各自幂等；全部完成即停止重试。
  ============================================================= */
  const RETRY_INTERVAL = 200; // 重试间隔（毫秒）
  const MAX_RETRY = 25;        // 最多重试次数（约 5 秒）

  (function attempt(count) {
    const doneA = mergeNotifications();     // A. 通知并入 Menu
    const doneB = buildTwoColumn();         // B. 单列改双列
    const doneC = tidyMenu();               // C. Menu 单列竖排
    const doneD = embedDashboardTitle();    // D. My Dashboard 嵌入红条
    if (doneA && doneB && doneC && doneD) { reveal(); return; } // 全部完成 → 显示并停止
    if (count < MAX_RETRY) {
      setTimeout(() => attempt(count + 1), RETRY_INTERVAL);
    } else {
      reveal(); // 超时兜底：无论改造是否成功都恢复显示，避免页面一直空白
    }
  })(0);
})();
