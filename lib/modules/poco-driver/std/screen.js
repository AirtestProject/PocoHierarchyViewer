
class Screen {

    constructor(client) {
        this.client = client
    }

    getScreen(width) {
        return this.client.call("Screenshot", [width])
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