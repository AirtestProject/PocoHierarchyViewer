
var CookieUtil = {
    get: key => {
        for (let cookiepair of document.cookie.split('; ')) {
            let [k, v] = cookiepair.split('=')
            if (key === k) {
                return v
            }
        }
        return null 
    }
}

module.exports = CookieUtil

