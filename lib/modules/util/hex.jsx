
const digitArray = new Array('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f');

var pad = (str, len, pad) => {
    var prefix = '';
    for (var i = str.length; i < len; i++) {
        prefix += pad;
    }
    return prefix + str;
};

var toHex = (n) => {
    var result = ''
    var start = true;
    for (var i = 32; i > 0;){
        i -= 4;
        var digit = (n >> i) & 0xf;
        if (!start || digit != 0){
            start = false;
            result += digitArray[digit];
        }
    }
    return (result == '' ? '0' : result);
};

var HexCodec = {
    encode: (str) => {
        var result = "";
        for (var i = 0; i < str.length; i++){
            result += pad(toHex(str.charCodeAt(i) & 0xff), 2, '0');
        }
        return result;
    },

    decode: (str) => {
        str = str.replace(new RegExp("s/[^0-9a-zA-Z]//g"));
        var result = "";
        var nextchar = "";
        for (var i = 0; i < str.length; i++) {
            nextchar += str.charAt(i);
            if (nextchar.length == 2){
                result += ntos(eval('0x' + nextchar));
                nextchar = "";
            }
        }
        return result;
    },
};

module.exports = HexCodec;

