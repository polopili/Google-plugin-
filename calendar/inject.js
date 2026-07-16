(function() {
    // check if func exist
    if (!window.Calendar || !window.Calendar.PopulateCalendar) return;

    // save original func
    var originalPopulate = window.Calendar.PopulateCalendar;

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
            
        details.open = boxes.length === 1 ? true : false; // default close when length > 1

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
        var boxes = td.querySelectorAll(':scope > .calendar_content_box');
        if (boxes.length === 0) return;

        // sort by Type 
        var groups = {};   
        var order = [];
        boxes.forEach(function(box) {
            var ref = box.getAttribute('data-id');
            var note = Calendar.objCalendar.Notes[ref];
            var typeCode = note ? note.Type : '_unknown';
            if (!groups[typeCode]) {
                groups[typeCode] = { meta: getTypeMeta(typeCode), boxes: [] };
                order.push(typeCode);
            }
            groups[typeCode].boxes.push(box);
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
})();
