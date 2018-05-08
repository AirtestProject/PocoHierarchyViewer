
class BaseAgent {

    constructor() {
    }

    wait_result(cb) {
        let res = cb.wait(10000)
        if (res.err) {
            throw new Error(res.err.message, res.err.code)
        }
        else {
            return res.result
        }
    }
}

module.exports = BaseAgent