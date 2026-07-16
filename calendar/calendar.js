(function() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('calendar/inject.js');

    script.onload = function() {
        script.remove();
    };

    const target = document.head || document.documentElement;
    if (target) {
        target.appendChild(script);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            (document.head || document.documentElement).appendChild(script);
        });
    }
})();