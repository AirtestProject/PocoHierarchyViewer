
var ArrayUtil = {
    localeSorter: (fn=null) => {
        return (a, b) => {
            if (fn) {
                return fn(a).localeCompare(fn(b));
            } else {
                return a.localeCompare(b);
            }
        }
    },
};

module.exports = ArrayUtil;

