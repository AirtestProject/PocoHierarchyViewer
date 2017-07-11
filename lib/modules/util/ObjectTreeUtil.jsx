
export let ObjectTreeUtil = {}

// build Object structuralized tree from a list of paths
ObjectTreeUtil.structuralize = (flat, delimiter='/') => {
    // flat: path -> object

    let ret = {}
    for (let p in flat) {
        let val = flat[p]
        let pathList = p.split(delimiter)
        let cursor = ret
        let _isLeaf = false
        for (let j in pathList) {
            if (parseInt(j) === pathList.length - 1) {
                _isLeaf = true
            }
            let name = pathList[j] || '/'
            cursor[name] = cursor[name] || (_isLeaf ? {'.': val} : {}) 
            cursor = cursor[name]
        }
    }
    return ret
}

ObjectTreeUtil.seek = (node, path, delimiter='/') => {
    let ret = node
    let pathList = path.split(delimiter)
    pathList[0] = pathList[0] || '/'
    for (let p of pathList) {
        if (p === '') {
            continue
        }
        ret = ret[p]
        if (!ret) {
            break
        }
    }
    return ret
}

