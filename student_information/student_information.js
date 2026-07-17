(function() {
    const url = chrome.runtime.getURL("profilePic.jpg");

    const style = document.createElement("style");
    style.textContent = `
    #img_srch_student { content: url("${url}"); }
    .text-left img { content: url("${url}"); }
    `;
    document.head.appendChild(style);   
})();