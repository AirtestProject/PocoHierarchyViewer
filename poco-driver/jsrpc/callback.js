
class Callback {

    constructor(rid, agent) {
        this.rid = rid
        this.agent = agent
        this.result_callback = null
        this.error_callback = null
        this.result = null
        this.error = null
        this.status = "WAITING"
    }

    on_result(func) {
        this.result_callback = func
    }

    on_error(func) {
        this.error_callback = func
    }

    rpc_result(data) {
        this.result = data
        try {
            if (this.result_callback) {
                this.result_callback(data)
            }
        }
        catch(err) {
            console.log(err)
        }
        this.status = "RESULT"
    }

    rpc_error(data) {
        this.error = data
        try {
            if (this.error_callback) {
                this.error_callback(data)
            }
        }
        catch(err) {
            console.log(err)
        }
        this.status = "ERROR"
    }

    wait(timeout=null) {
        let start_time = Date.now()
        // console.log("start waiting....")
        while(true) {
            if (this.status == "WAITING") {
                let now_time = Date.now()
                if ( timeout && now_time-start_time>timeout) {
                    throw new Error("Time out")
                }
                require('deasync').sleep(500)
            }
            else {
                break
            }
        }
        return {err: this.error, result: this.result}
    }
}

module.exports = Callback