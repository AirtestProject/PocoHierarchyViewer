
var MiscUtil = {
    getGreetings: (username) => {
        var now = new Date().getHours();
        var greeting = '';
        if (now <= 11) {
            greeting = '早上好，';
        } else if (now <= 13) {
            greeting = '中午好，';
        } else if (now <= 18) {
            greeting = '下午好，';
        } else {
            greeting = '晚上好，';
        }
        return greeting + username + '。';
    },
    getQueryString: () => {
        // This function is anonymous, is executed immediately and 
        // the return value is assigned to QueryString!
        var query_dict = {};
        var query = window.location.search.slice(1) 
        var vars = query.split("&");
        for (var i in vars) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_dict[pair[0]] === "undefined") {
                query_dict[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
            } else if (typeof query_dict[pair[0]] === "string") {
                var arr = [query_dict[pair[0]], decodeURIComponent(pair[1])];
                query_dict[pair[0]] = arr;
            // If third or later entry with this name
            } else {
                query_dict[pair[0]].push(decodeURIComponent(pair[1]));
            }
        } 
        return query_dict;
    },
    setQueryString: (name, value) => {
        let {hash, origin, pathname} = window.location
        if (!name) {
            window.history.pushState("", document.title, origin + pathname + hash) 
        } else {
            window.history.pushState("", document.title, `${origin}${pathname}?${name}=${encodeURIComponent(value)}${hash}`)
        }
    },

    copyToClipboard: elem => {
        // create hidden text element, if it doesn't already exist
        var targetId = "_hiddenCopyText_";
        var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
        var origSelectionStart, origSelectionEnd;
        if (isInput) {
            // can just use the original source element for the selection and copy
            target = elem;
            origSelectionStart = elem.selectionStart;
            origSelectionEnd = elem.selectionEnd;
        } else {
            // must use a temporary form element for the selection and copy
            target = document.getElementById(targetId);
            if (!target) {
                var target = document.createElement("textarea");
                target.style.position = "absolute";
                target.style.left = "-9999px";
                target.style.top = "0";
                target.id = targetId;
                document.body.appendChild(target);
            }
            target.textContent = elem.textContent;
        }
        // select the content
        var currentFocus = document.activeElement;
        target.focus();
        target.setSelectionRange(0, target.value.length);
        
        // copy the selection
        var succeed;
        try {
              succeed = document.execCommand("copy");
        } catch(e) {
            succeed = false;
        }
        // restore original focus
        if (currentFocus && typeof currentFocus.focus === "function") {
            currentFocus.focus();
        }
        
        if (isInput) {
            // restore prior selection
            elem.setSelectionRange(origSelectionStart, origSelectionEnd);
        } else {
            // clear temporary content
            target.textContent = "";
        }
        return succeed;
    },
};

module.exports = MiscUtil;

