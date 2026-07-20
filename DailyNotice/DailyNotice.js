import { fetchNoticeIndex } from './noticeIndex.js';
import { parseNotice, BULLET_RE } from './noticeParser.js';

const els = {
    list: document.getElementById('date-list'),
    output: document.getElementById('output'),
    date: document.getElementById('current-date'),
    weekday: document.getElementById('current-weekday'),
    pdf: document.getElementById('open-pdf'),
    toggle: document.getElementById('toggle-sidebar'),
    root: document.querySelector('.layout'),
    sidebar: document.querySelector('.sidebar'),
};

let entries = [];
let current = -1;

const cache = new Map();      // key -> blocks
const inFlight = new Map();   // key -> Promise<blocks> 

let renderSeq = 0;

let layout = null;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = MONTH_NAMES.map(m => m.slice(0, 3));

init();

async function init() {
    els.toggle.addEventListener('click', () => {
        const hidden = els.root.classList.toggle('sidebar-hidden');
        els.toggle.setAttribute('aria-expanded', String(!hidden));
        els.toggle.title = hidden ? 'Show list' : 'Hide list';
        els.toggle.textContent = hidden ? '\u00BB' : '\u00AB';
        els.sidebar.toggleAttribute('inert', hidden);
    });

    // wait for the animation to finnish
    els.sidebar.addEventListener('transitionend', e => {
        if (e.propertyName === 'margin-left') applyLayout();
    });

    // 窗口宽度变了，栏数可能跟着变，重排一次。防抖免得拖动边框时狂重排。
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyLayout, 150);
    });

    document.addEventListener('keydown', e => {
        if (e.target.matches('input, textarea')) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(+1); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    });

    await loadIndex();
}

async function loadIndex() {
    els.list.innerHTML = '<p class="sidebar-hint">Fetching…</p>';

    try {
        entries = await fetchNoticeIndex();
    } catch (err) {
        console.error(err);
        els.list.innerHTML = '';
        els.list.appendChild(message('error', "Can't load the date list", err.message));
        showState('error', "Can't load the date list", 'Fetching the notices index page failed.');
        return;
    }

    renderDateList();
    select(pickDefault());
}

// 默认打开今天。今天没有（周末、假期、还没上传）就退到最新的一份 —— 注意是
// 「最新」不是「最近的过去」：假期里学校会提前把开学那天的通知放上去，那份才是
// 学生想看的，退回到上学期最后一天没意义。
function pickDefault() {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const exact = entries.findIndex(e => e.key === todayKey);
    return exact === -1 ? 0 : exact;   // entries 倒序，0 就是最新的
}

// ---- 侧边栏 ------------------------------------------------------------

// 按学期分组，每组可折叠。97 个日期全铺开滚不动，
// 默认全收起，再由 markActive 把当前日期所在的那组打开。
function renderDateList() {
    els.list.innerHTML = '';
    let items = null;
    let lastGroup = '';

    entries.forEach((entry, i) => {
        const d = entry.date;
        // 学生本来就是按 Term 记事的，比按自然月贴合
        const label = entry.term ? `Term ${entry.term} ${entry.year}` : String(entry.year);
        if (label !== lastGroup) {
            items = openGroup(label);
            lastGroup = label;
        }

        const btn = document.createElement('button');
        btn.className = 'date-item';
        btn.dataset.index = i;
        // 分组标题里不带月份，所以日期项要自己写上
        btn.innerHTML =
            `<span class="date-day">${d.getDate()} ${MONTH_SHORT[d.getMonth()]}</span>` +
            `<span class="date-weekday">${WEEKDAYS[d.getDay()]}</span>`;
        btn.addEventListener('click', () => select(i));
        items.appendChild(btn);
    });
}

// 造一个折叠组，返回装日期的容器
function openGroup(label) {
    const group = document.createElement('div');
    group.className = 'group collapsed';

    const head = document.createElement('button');
    head.className = 'group-label';
    head.setAttribute('aria-expanded', 'false');
    head.innerHTML = `<span class="chev">▾</span><span>${label}</span>`;

    const items = document.createElement('div');
    items.className = 'group-items';

    head.addEventListener('click', () => {
        const collapsed = group.classList.toggle('collapsed');
        head.setAttribute('aria-expanded', String(!collapsed));
    });

    group.append(head, items);
    els.list.appendChild(group);
    return items;
}

function markActive() {
    els.list.querySelectorAll('.date-item').forEach(b => {
        const on = Number(b.dataset.index) === current;
        b.classList.toggle('active', on);
        if (!on) return;

        // 用 ←/→ 翻到别的学期时，那一组可能是收着的，先展开再滚过去。
        // 只管开、不管关，用户自己展开的组不要被合上。
        const group = b.closest('.group');
        if (group?.classList.contains('collapsed')) {
            group.classList.remove('collapsed');
            group.querySelector('.group-label')?.setAttribute('aria-expanded', 'true');
        }
        b.scrollIntoView({ block: 'nearest' });
    });
}

function step(delta) {
    const next = current + delta;
    if (next >= 0 && next < entries.length) select(next);
}

// ---- 加载某一天 --------------------------------------------------------

async function select(index) {
    if (index < 0 || index >= entries.length) return;

    current = index;
    const entry = entries[index];
    const seq = ++renderSeq;

    // 先把头部和侧边栏切过去，别等 PDF 解析完才有反馈
    els.date.textContent = formatDate(entry.date);
    els.weekday.textContent = [
        WEEKDAYS[entry.date.getDay()],
        entry.term ? `Term ${entry.term}` : null,
        entry.cycleDay ? `Day ${entry.cycleDay}` : null,
    ].filter(Boolean).join(' ');
    els.pdf.href = entry.url;
    els.pdf.hidden = false;
    markActive();

    if (cache.has(entry.key)) {
        renderBlocks(cache.get(entry.key));
        return;
    }

    showState('loading', 'Parsing notice…', entry.url.split('/').pop());

    try {
        const blocks = await loadBlocks(entry);
        if (seq !== renderSeq) return;   // 已经切到别的日期了，丢弃
        renderBlocks(blocks);
    } catch (err) {
        console.error(err);
        if (seq !== renderSeq) return;
        showState('error', "Can't open this day's notice", err.message);
    }
}

function loadBlocks(entry) {
    if (inFlight.has(entry.key)) return inFlight.get(entry.key);

    const p = parseNotice(entry.url)
        .then(blocks => {
            cache.set(entry.key, blocks);
            return blocks;
        })
        .finally(() => inFlight.delete(entry.key));

    inFlight.set(entry.key, p);
    return p;
}

// ---- 渲染 --------------------------------------------------------------

// PDF 里出来的是一条扁平的块序列，但内容其实是有层级的：
//   红横幅 → 栏目标题(h1，如 SENIORS/SPORT) → 单条通知标题(h3) → 正文/图
// 重新按这个层级组装：栏目是一个 section，每条通知是一张卡片。
// 卡片放进多栏流里 —— 每日通知都是互相独立的短条目，多栏才不浪费横向空间。
function renderBlocks(blocks) {
    if (!blocks.length) {
        showState('empty', 'Nothing in this notice', 'The PDF parsed to an empty document.');
        return;
    }

    // 页眉的红块和蓝字块，各自可能被解析成好几段，最后要合成一个元素
    const bannerParts = [];
    const metaParts = [];
    const sections = [];    // [{ title: 元素|null, cards: [元素] }]
    let section = null;
    let card = null;

    // 开一个新栏目。title 为空表示「横幅之后、第一个栏目标题之前」那批内容，
    // 它们没有归属的栏目，但一样要有地方放。
    const openSection = titleBlock => {
        let title = null;
        if (titleBlock) {
            title = document.createElement('h2');
            title.className = 'section-title';
            fillSegments(title, titleBlock.segments);
        }
        section = { title, cards: [] };
        sections.push(section);
        card = null;
    };

    const openCard = titleBlock => {
        if (!section) openSection(null);

        // 当前卡里只有一张图、还没有标题和正文 —— 那多半是下面这条通知的配图
        // （海报常常排在自己的文字前面），接着用这张卡，别让图孤零零占一张。
        const reuse = card && !card.querySelector('.card-title, .notice-body');
        if (!reuse) {
            card = document.createElement('article');
            card.className = 'card';
            section.cards.push(card);
        }

        if (titleBlock) {
            const h = document.createElement('h3');
            h.className = 'card-title';
            fillSegments(h, titleBlock.segments);
            card.insertBefore(h, card.firstChild);   // 标题排到图前面
        }
    };

    // 正文/图没有标题也得有卡片装，否则没地方放
    const body = () => (card || (openCard(null), card));

    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];

        if (b.kind === 'image') {
            // 只有当这张图正好卡在两条通知的分界上，才谈得上归属问题；图后面还是
            // 同一条通知的话（比如 Ignite 那条「图 + 一句教室码」），别拆。
            // 确实在分界上时，用 parser 量的上下距离决定它跟哪一条走。
            const next = blocks[i + 1];
            const nextIsNewItem = next && next.kind === 'text' && (next.newItem || next.tag === 'h3');
            if (b.attachNext && nextIsNewItem && card && card.childNodes.length) openCard(null);

            const img = document.createElement('img');
            img.src = b.dataUrl;
            img.className = 'notice-' + b.imageKind;
            img.alt = { table: 'Table', framed: 'Boxed content', image: 'Image' }[b.imageKind];
            // 按它在 PDF 正文里占的宽度比例显示，小图标不至于被撑成整栏宽
            img.style.width = (b.widthRatio * 100).toFixed(1) + '%';
            if (b.width && b.height) {
                img.width = Math.round(b.width);
                img.height = Math.round(b.height);
            }
            body().appendChild(img);
            continue;
        }

        // ★ 页眉在 PDF 里是并排两块：左边红底的 DAILY NOTICES / TE PANUI，
        //   右边蓝字的 DAY N / TE RA N / Duty Deputy Principal。原样还原，
        //   而且这两块内部的分行要留着 —— 拼成一长行就把毛利语那行和值日主任
        //   那行糊在一起了，等于丢了信息。
        if (b.banner) { bannerParts.push(b); continue; }
        if (b.tag === 'h2') { metaParts.push(b); continue; }

        if (b.tag === 'h1') { openSection(b); continue; }

        // ★ 卡片边界只由「前面空了一行」决定，不由粗体决定。
        //   整段加粗（h3）只说明它长得像标题，但通知中间也常有整句加粗的强调，
        //   比如「Our meetings are held every Monday at lunchtime in M2.」——
        //   拿它另起一张卡，一条通知就被劈成两半了。
        if (b.tag === 'h3' && (b.newItem || !card || !card.childNodes.length)) {
            openCard(b);
            continue;
        }

        // 没标题但和上一条隔了一个空行 —— 那是另一条通知，另起一张卡。
        // 光靠 h3 分的话，没写标题的通知会被塞进上一条里。
        if (b.newItem && card && card.childNodes.length) openCard(null);

        // 走到这里的 h3 是「通知内部的加粗行」，当正文渲染，加粗保留
        appendBody(body(), b.segments);
    }

    const head = [];
    if (bannerParts.length) head.push(buildHeadPart('notice-banner', bannerParts));
    if (metaParts.length) head.push(buildHeadPart('notice-meta', metaParts));

    layout = { head, sections };
    applyLayout();
    els.output.scrollTop = 0;
}

// ★ 页眉的每一块都必须合成单个元素：.notice-head 是 flex 容器，多一个子元素
//   就多一栏。而「DAY 6 / TE RA 6 / Duty Deputy Principal」这三行是不是被解析成
//   同一段，取决于它们的长短 —— 所以有的日期堆成三行、有的摊成横着的三栏。
//   在这里统一合并，就跟解析怎么切无关了。
function buildHeadPart(cls, blocks) {
    const el = document.createElement('div');
    el.className = cls;
    blocks.forEach((b, i) => {
        if (i > 0) el.appendChild(document.createElement('br'));
        fillSegments(el, b.segments, { lineBreaks: true });
    });
    return el;
}

// ★ 分栏为什么自己写而不用 CSS multi-column：
//   multi-column 是按总高度均分的，碰上一张不能拆的高卡片就平衡不了，
//   会在某一栏底部留一大块空白。这里按「哪栏最矮就往哪栏放」来分，
//   也就是瀑布流，底部才齐。
function applyLayout() {
    if (!layout) return;

    const inner = document.createElement('div');
    inner.className = 'notice-inner';
    if (layout.head.length) {
        const head = document.createElement('header');
        head.className = 'notice-head';
        layout.head.forEach(el => head.appendChild(el));
        inner.appendChild(head);
    }

    // 先挂上去再量宽度，否则拿不到实际可用宽度
    els.output.innerHTML = '';
    els.output.appendChild(inner);

    // 正文 16.2px 时一栏 440 左右最好读；再窄字挤，再宽一行太长扫不动
    const MIN_COL = 440, GAP = 22.5;
    const avail = inner.clientWidth;
    // 封顶 4 栏：再多每栏就细得读不下去了。收起侧栏时正好能排到 4 栏，
    // 而不是把多出来的宽度摊给 3 栏、让每行变成 600 多像素。
    const n = Math.max(1, Math.min(4, Math.floor((avail + GAP) / (MIN_COL + GAP))));

    for (const sec of layout.sections) {
        const el = document.createElement('section');
        el.className = 'section';
        if (sec.title) el.appendChild(sec.title);

        const wrap = document.createElement('div');
        wrap.className = 'cards';
        const cols = [];
        for (let i = 0; i < n; i++) {
            const c = document.createElement('div');
            c.className = 'col';
            wrap.appendChild(c);
            cols.push(c);
        }
        el.appendChild(wrap);
        inner.appendChild(el);

        // 一张一张放：每次挑当前最矮的那栏。图片已经带 width/height 属性，
        // 所以这时候量到的高度就是最终高度，不会等图解码完再跳。
        for (const c of sec.cards) {
            let best = cols[0];
            for (const col of cols) if (col.offsetHeight < best.offsetHeight) best = col;
            best.appendChild(c);
        }
    }
}

// strong：只有正文才把粗体片段包成 <strong>，标题本身就是粗的。
// lineBreaks：页眉那种要保留 PDF 里的分行；正文让它自己按容器宽度回流。
function fillSegments(el, segments, { strong = false, lineBreaks = false } = {}) {
    segments.forEach((seg, i) => {
        if (lineBreaks && seg.nl && i > 0) el.appendChild(document.createElement('br'));
        const text = lineBreaks && seg.nl ? seg.str.replace(/^ /, '') : seg.str;

        let node = el;
        if (strong && seg.bold) {
            node = document.createElement('strong');
            el.appendChild(node);
        }

        // seg.url 来自 PDF 的 Link 注解（「Click HERE」那种，URL 不在文字里）。
        // 没有注解时再退回去扫文字里的 http:// 网址。
        if (seg.url) {
            const a = document.createElement('a');
            a.href = seg.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'notice-link';
            a.textContent = text;
            node.appendChild(a);
        } else {
            appendTextWithLinks(node, text);
        }
    });
}

// 把一段正文放进卡片。段里可能夹着项目符号列表，要还原成真正的 <ul>，
// 否则五个 bullet 会被拼成「• X-rays • CT • Ultrasound …」一长行。
function appendBody(parent, segments) {
    let list = null;   // 当前正在收的 <ul>
    let para = null;   // 当前正在收的 <p>

    const flushPara = () => { para = null; };

    for (const seg of segments) {
        if (seg.li) {
            // 新的一条列表项
            flushPara();
            if (!list) {
                list = document.createElement('ul');
                list.className = 'notice-list';
                parent.appendChild(list);
            }
            const item = document.createElement('li');
            // bullet 字形本身不要，圆点交给 CSS 画
            const rest = seg.str.replace(BULLET_RE, '');
            if (rest.trim()) fillSegments(item, [{ ...seg, str: rest.trimStart() }], { strong: true });
            list.appendChild(item);
            continue;
        }

        // 列表项后面同一行的内容，接到刚才那个 <li> 上
        if (list && !seg.nl) {
            const li = list.lastElementChild;
            // 悬挂缩进在 PDF 里是靠留白做的，别把它带成正文里的空格
            const text = li.childNodes.length ? seg.str : seg.str.trimStart();
            fillSegments(li, [{ ...seg, str: text }], { strong: true });
            continue;
        }

        // 换了一行又没有 bullet —— 列表到此为止
        list = null;
        if (!para) {
            para = document.createElement('p');
            para.className = 'notice-body';
            parent.appendChild(para);
        }
        fillSegments(para, [seg], { strong: true });
    }
}

function showState(kind, title, detail) {
    layout = null;   // 加载/出错时没有卡片可重排
    // 内容统一塞进居中的定宽容器里 —— 滚动条要留在窗口最右边，
    // 不能让 max-width 把滚动条也一起缩到中间。
    els.output.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'notice-inner';
    inner.appendChild(message(kind, title, detail));
    els.output.appendChild(inner);
}

function message(kind, title, detail) {
    const box = document.createElement('div');
    box.className = 'state state-' + kind;
    if (kind === 'loading') {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        box.appendChild(spinner);
    }

    const h = document.createElement('p');
    h.className = 'state-title';
    h.textContent = title;
    box.appendChild(h);

    if (detail) {
        const p = document.createElement('p');
        p.className = 'state-detail';
        p.textContent = detail;
        box.appendChild(p);
    }
    return box;
}

function formatDate(d) {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function appendTextWithLinks(parent, text) {
    // to match url start with https
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        // the text before url 
        if (match.index > lastIndex) {
            parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const a = document.createElement('a');
        a.href = match[0];
        a.textContent = match[0];
        a.target = '_blank';      // open in new page
        a.className = 'notice-link';
        parent.appendChild(a);

        lastIndex = urlRegex.lastIndex;
    }
    // the text behind the url
    if (lastIndex < text.length) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
}