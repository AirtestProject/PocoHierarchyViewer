
var BaseAgent = require("./baseAgent")

class Dumper extends BaseAgent {

    constructor(client) {
        super()
        this.client = client
    }

    dumpHierarchy(onlyVisibleNode=true) {
        let cb = this.client.call("Dump", [onlyVisibleNode])
        return this.wait_result(cb)
    }

}

module.exports = Dumper