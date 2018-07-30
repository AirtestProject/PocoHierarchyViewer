
const zlib = window.require('zlib')
const Promise = window.require('bluebird')
const Buffer = window.Buffer

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
                        let input = new Buffer(data, 'base64')
                        zlib.inflate(input, (err, infaltedData) => {
                            if (err) {
                                reject({message: err.stack, code: -1})
                                return
                            }
                            let output = infaltedData.toString('base64')
                            console.log('compress rate: ' + input.length / output.length)
                            resolve([output, fmt])
                        })
                    })
                } else {
                    return res
                }
            })
            .catch(err => {
                console.log(err)
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