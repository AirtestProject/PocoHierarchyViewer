
// for react-treebeard

let TreeUtil = {

    // path         ->  like 'a/b/file.ext'
    // dir          ->  like 'b'
    // delimiter    ->  like '/' or '.'
    // pathList     ->  like ['a', 'b', '...']

    getPathList: (path, delimiter='/') => {
        var pathList = null;
        if (path.length > 0) {
            pathList = path.split(delimiter);
        } else {
            pathList = [];
        }
        return pathList;
    },

    seek: (node, path, delimiter='/') => {},
    addChild: (node, name, path) => {},
    add: (tree, path, delimiter='/') => {},
    removeFromParent: (node) => {},
};

TreeUtil.seek = (node, path, delimiter='/') => {
    // 以某个node为起点，寻找向下寻找，直到找不到了
    // 找到则返回某个node，否则返回null
    
    // 已经找到了这个node
    if (path.length === 0) {
        return node;
    }

    if (!node) {
        return null;
    }
    
    // 分割pathlist后取出第一个dir
    var pathlist = TreeUtil.getPathList(path, delimiter);
    var dir = pathlist.shift();
    if (dir === '' || dir === '.') {
        return TreeUtil.seek(node, pathlist.join(delimiter), delimiter);
    }
    // 某个节点都没有children那肯定不能搜索下去了，所以找不到
    if (!node.children) {
        return null;
    }    
    // 在孩子节点里寻找，找到的话则继续下一层
    for (var c in node.children) {
        var child = node.children[c];
        if (child.name === dir) {
            return TreeUtil.seek(child, pathlist.join(delimiter), delimiter);
        }
    }

    // 如果在children中遍历完了都找不到，那就说明没有了
    return null;
};

TreeUtil.addChild = (node, name, path) => {
    node.children = node.children || [];
    var child = {name: name, path: path, parent: node};
    node.children.push(child);
    node.children.sort((a, b) => {return a.name.localeCompare(b.name)})
    return child;
};


TreeUtil.add = (tree, path, delimiter='/', addCallback=null) => {
    var prev = tree; 
    var node = tree;
    var pathList = TreeUtil.getPathList(path, delimiter);
    var curPath = '';
    for (var i in pathList) {
        var p = pathList[i];
        curPath += curPath.length > 0 ? (delimiter + p) : p;  // build the entire path
        prev = node;
        node = TreeUtil.seek(prev, p, delimiter);
        if (!node) {
            node = TreeUtil.addChild(prev, p, curPath);
            if (addCallback) {
                addCallback(node)
            }
        }
    }
    // return the new added node
    return node;
};

TreeUtil.removeFromParent = (node) => {
    var parent = node.parent;
    node.parent = null;
    parent.children.splice(parent.children.indexOf(node), 1);
};

TreeUtil.traverse = (root, func, childIndex=0) => {
    func(root, parseInt(childIndex))
    if (root.children) {
        for (let c in root.children) {
            let child = root.children[c]
            TreeUtil.traverse(child, func, c)
        }
    }
}

// react-tree helper method
TreeUtil.expand = (node, level, _currentLevel=0) => {
    if (_currentLevel < level) {
        node.toggled = true
        for (let c in node.children) {
            TreeUtil.expand(node.children[c], level, _currentLevel + 1)
        }
    }
}

TreeUtil.expandNode = node => {
    while (true) {
        node.toggled = true
        node = node.parent
        if (!node) {
            break
        }
    }
}

module.exports = TreeUtil