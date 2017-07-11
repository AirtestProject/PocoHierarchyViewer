
var TagUtil = {
    valueToTags: (val) => {
        var rawtags = val.trim().split(' ');
        var color = {
            '#r': 'red',
            '#g': 'green',
            '#b': 'blue',
            '#y': 'yellow',
        };
        return $.map(rawtags, (rawtag, _) => {
            if (rawtag.length > 0) {
                var tagcolor = 'default';
                var tagcontent = rawtag;
                if (rawtag[0] === '#') {
                    tagcolor = color[rawtag.substr(0, 2).toLowerCase()] || tagcolor;
                    tagcontent = rawtag.substr(2);
                }
                if (tagcontent.length > 0) {
                    return {color: tagcolor, content: tagcontent};
                }
            }
        });
    },

    tagsToValue: (tags) => {
        var tagstr = '';
        var color = {
            'red': '#r',
            'green': '#g',
            'blue': '#b',
            'yellow': '#y',
        };
        for (var i in tags) {
            tagstr += (color[tags[i].color] || '') + tags[i].content + ' ';
        }
        return tagstr;
    },
};

module.exports = TagUtil;

