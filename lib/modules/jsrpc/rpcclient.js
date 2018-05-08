const RpcBase = require('./rpcbase')

class RpcClient extends RpcBase {

    constructor(conn, ip, port) {
        super()
        this.conn = conn
        this.status = "connecting"
        this.conn.onError(this)
        this.conn.onMessage(this)
        this.conn.onClose(this)
    }

    onClose() {
        this.status = "closed"
        console.log("Connection close.")
    }

    connect(ip, port) {
        return this.conn.connect(ip, port, this)
    }

    call(func, params=[]) {
        let _id = this.get_rpc_id()
        let res = this.format_message(func, params, _id)
        let msg = res.msg
        let buf = this.get_buffer_by_msg(msg)
        let promise = res.promise
        this.conn.send(buf)
        return promise
    }
}


module.exports = RpcClient
