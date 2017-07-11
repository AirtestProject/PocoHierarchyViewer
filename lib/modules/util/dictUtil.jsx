
var DictUtil = {
    CheckEqualByKeys: (keys, obj1, obj2) => {
        for (var i in keys) {
            var k = keys[i];
            if (obj1[k] !== obj2[k]) {
                return false;
            }
        }
        return true;
    },
    values: (obj) => {
        var ret = [];
        for (var k in obj) {
            ret.push(obj[k]);
        }
        return ret;
    },
};

module.exports = DictUtil;

