(function() {
    // check if func exist
    if (!window.Calendar || !window.Calendar.PopulateCalendar) return;

    // save original func
    var originalPopulate = window.Calendar.PopulateCalendar;

    // types that skip grouping: laid out bare, always ahead of every group
    var BARE_TYPES = { HD: true };   // HD = Holiday


    // use createElement to build
    function el(tag, opts) {
        var node = document.createElement(tag);
        opts = opts || {};
        if (opts.className) node.className = opts.className;
        if (opts.text != null) node.textContent = opts.text;   // textContent 天然防 XSS
        if (opts.style) Object.keys(opts.style).forEach(function(k) { node.style[k] = opts.style[k]; });
        return node;
    }

    // get the color of inside element 
    function getTypeMeta(typeCode) {
        var meta = { name: typeCode, color: 'CCCCCC', sort: 0 };
        var t = (Calendar.objTypes && Calendar.objTypes[typeCode]) ||
                (Calendar.objCalendar.Types && Calendar.objCalendar.Types[typeCode]) || null;
        if (t) {
            if (t.Name) meta.name = t.Name;
            if (t.Color) meta.color = t.Color;
            if (t.SortOrder != null) meta.sort = t.SortOrder;
        }
        return meta;
    }

    // create a details board to place all the element 
    function buildGroup(meta, boxes) {
        var details = el('details', { className: 'cal_group' });
            
        details.open = true; // default open

        var summary = el('summary', { className: 'cal_group_summary' });
        summary.appendChild(el('span', { className: 'cal_group_dot', style: { background: '#' + meta.color } }));
        summary.appendChild(el('span', { className: 'cal_group_name', text: meta.name }));
        summary.appendChild(el('span', { className: 'cal_group_count', text: String(boxes.length) }));
        details.appendChild(summary);

        var body = el('div', { className: 'cal_group_body' });
        boxes.forEach(function(box) { body.appendChild(box); });   // move the box element in 
        details.appendChild(body);

        return details;
    }

    // sort the info blocks inside a day block
    function groupCell(td) {
        // .cal_bare marks a box this func already handled, so a re-run skips it
        var boxes = td.querySelectorAll(':scope > .calendar_content_box:not(.cal_bare)');
        if (boxes.length === 0) return;

        // sort by Type
        var bare = [];
        var groups = {};
        var order = [];
        boxes.forEach(function(box) {
            var ref = box.getAttribute('data-id');
            var note = Calendar.objCalendar.Notes[ref];
            var typeCode = note ? note.Type : '_unknown';
            if (BARE_TYPES[typeCode]) { bare.push(box); return; }
            if (!groups[typeCode]) {
                groups[typeCode] = { meta: getTypeMeta(typeCode), boxes: [] };
                order.push(typeCode);
            }
            groups[typeCode].boxes.push(box);
        });

        // bare first: re-appending only these leaves them ahead of the groups below
        bare.forEach(function(box) {
            box.classList.add('cal_bare');
            td.appendChild(box);
        });

        order.sort(function(a, b) { return groups[a].meta.sort - groups[b].meta.sort; });
        order.forEach(function(typeCode) {
            td.appendChild(buildGroup(groups[typeCode].meta, groups[typeCode].boxes));
        });
    }

    // let the original func build first then run the personal func 
    window.Calendar.PopulateCalendar = function() {
        originalPopulate.apply(this, arguments);

        // get cells 
        var cells = document.querySelectorAll(
            'div.calendar_preview div.calendar_pane table.table-calendar tbody td'
        );

        cells.forEach(groupCell);

        console.log('=== grouped (wrapper) ===');
    };

    var POPOVER_W = 380;
    var GAP = 8;
    var EDGE = 10;      // keep this far off the viewport edges

    // what the site's delegated handlers open the day popup from
    var ANCHORS = 'div.calendar_content_box, div.calendar_pane table.table-calendar tbody td h3';

    var anchor = null;
    document.addEventListener('click', function(e) {
        anchor = e.target.closest ? e.target.closest(ANCHORS) : null;
    }, true);

    function place(dialog) {
        if (!anchor) return;
        var r = anchor.getBoundingClientRect();

        var left = r.right + GAP;
        if (left + POPOVER_W > window.innerWidth - EDGE) left = r.left - POPOVER_W - GAP;  // flip
        left = Math.max(EDGE, Math.min(left, window.innerWidth - POPOVER_W - EDGE));

        var top = Math.min(r.top, window.innerHeight - dialog.offsetHeight - EDGE);

        dialog.style.left = left + 'px';
        dialog.style.top = Math.max(EDGE, top) + 'px';
    }

    var popup = null, dialog = null;

    function isOpen() {
        return popup && popup.classList.contains('cal_popover') &&
               popup.classList.contains('active');
    }

    var originalLoader = window.showDynamicLoader;
    if (typeof originalLoader === 'function') {
        window.showDynamicLoader = function() {
            if (anchor) return;   
            return originalLoader.apply(this, arguments);   // reopens for everything else
        };
    }

    var originalShowModal = window.showModalPopupOnScreen;
    if (typeof originalShowModal === 'function') {
        window.showModalPopupOnScreen = function(id) {
            originalShowModal.apply(this, arguments);

            if (id !== 'day_calendar_popup') {
                var day = document.querySelector('div.day_calendar_popup');
                if (day) day.classList.remove('cal_popover');
                return;
            }

            popup = document.querySelector('div.day_calendar_popup');
            dialog = popup && popup.querySelector('.modal-dialog');
            if (!dialog) return;

            popup.classList.toggle('cal_popover', !!anchor);
            if (!anchor) { dialog.style.left = dialog.style.top = ''; return; }

            place(dialog);
            if (window.ResizeObserver && !dialog._calRO) {
                dialog._calRO = new ResizeObserver(function() {
                    if (isOpen()) place(dialog);
                });
                dialog._calRO.observe(dialog);
            }
        };
    }

    document.addEventListener('click', function(e) {
        if (!isOpen()) return;
        if (e.target.closest('.modal-dialog')) return;
        if (e.target.closest(ANCHORS)) return;   
        if (typeof window.hideModalPopupOnScreen === 'function') {
            window.hideModalPopupOnScreen('day_calendar_popup');
        }
    });

})();