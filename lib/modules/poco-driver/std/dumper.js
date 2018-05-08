
var BaseAgent = require("./baseAgent")

class Dumper extends BaseAgent {

    constructor(client) {
        super()
        this.client = client
    }

    dumpHierarchy(onlyVisibleNode=true) {
        return this.client.call("Dump", [onlyVisibleNode]).then()
            .catch( function(err) {
                throw new Error(err.message, err.code)
            })
    }

}

module.exports = Dumper