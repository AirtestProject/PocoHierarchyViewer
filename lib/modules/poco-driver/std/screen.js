
var BaseAgent = require("./baseAgent")

class Screen extends BaseAgent {

    constructor(client) {
        super()
        this.client = client
    }

    getScreen(width) {
        return this.client.call("Screenshot", [width]).then()
            .catch( function(err) {
                throw new Error(err.message, err.code)
            })
    }

    getPortSize() {
        return this.client.call("GetScreenSize").then()
            .catch( function(err) {
                throw new Error(err.message, err.code)
            })
    }
}

module.exports = Screen