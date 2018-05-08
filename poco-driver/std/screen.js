
var BaseAgent = require("./baseAgent")

class Screen extends BaseAgent {

    constructor(client) {
        super()
        this.client = client
    }

    getScreen(width) {
        let cb = this.client.call("Screenshot", [width])
        return this.wait_result(cb)
    }

    getPortSize() {
        let cb = this.client.call("GetScreenSize")
        return this.wait_result(cb)
    }
}

module.exports = Screen