
const zlib = window.require('zlib')
const Promise = window.require('bluebird')

class Screen {

    constructor(client) {
        this.client = client
    }

    getScreen(width) {
        return this.client.call("Screenshot", [width])
            .then(res => {
                let [data, fmt] = res
                if (fmt.endsWith('.deflate')) {
                    fmt = fmt.slice(0, fmt.length - '.deflate'.length)
                    return new Promise((resolve, reject) => {
                        zlib.unzip(data, (err, infaltedData) => {
                            if (err) {
                                throw new Error(err.messagem, err.code)
                            }
                            infaltedData = infaltedData.toString()
                            resolve([infaltedData, fmt])
                        })
                    })
                } else {
                    return res
                }
            })
            .catch(err => {
                throw new Error(err.message, err.code)
            })
    }

    getPortSize() {
        return this.client.call("GetScreenSize")
            .catch(err => {
                throw new Error(err.message, err.code)
            })
    }
}

module.exports = Screen