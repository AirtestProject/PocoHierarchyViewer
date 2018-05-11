
class StdPocoAgent {

    constructor(client) {
        this.client = client
    }

    getDebugProfiling_data() {
        return this.client.call("GetDebugProfilingData")
            .catch(err => {
                throw new Error(err.message, err.code)
            })
    }

    getSdkVersion() {
        return this.client.call("GetSDKVersion")
            .catch(err => {
                throw new Error(err.message, err.code)
            })
    }
}

module.exports = StdPocoAgent