

var FileUtil = {
    // From http://stackoverflow.com/questions/14967647/ (continues on next line)
    // encode-decode-image-with-base64-breaks-image (2013-04-21)
    fixBinary: (bin) => {
        var length = bin.length;
        var buf = new ArrayBuffer(length);
        var arr = new Uint8Array(buf);
        for (var i = 0; i < length; i++) {
            arr[i] = bin.charCodeAt(i);
        }
        return buf;
    },
    
    // deprecated
    localDownload: (fileName, content, mimetype) => {
        var aLink = document.createElement('a');
        var blob = new Blob([content], {type: mimetype});
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", false, false);  //initEvent 不加后两个参数在FF下会报错, 感谢 Barret Lee 的反馈
        aLink.download = fileName;
        aLink.href = URL.createObjectURL(blob);
        aLink.dispatchEvent(evt);
    },

    urlDownload: (fileName, url) => {
        var aLink = document.createElement('a');
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", false, false);  //initEvent 不加后两个参数在FF下会报错, 感谢 Barret Lee 的反馈
        aLink.download = fileName;
        aLink.href = url; 
        aLink.dispatchEvent(evt);
    },

    arrayBufferToBase64: (buffer) => {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },
};

module.exports = FileUtil;

