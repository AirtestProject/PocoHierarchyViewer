
class Dumper {

    constructor(client) {
        this.client = client
    }

    dumpHierarchy(onlyVisibleNode=true) {
        return this.client.call("Dump", [onlyVisibleNode])
            .catch(err => {
                throw new Error(err.message, err.code)
            })
    }

}

module.exports = Dumper