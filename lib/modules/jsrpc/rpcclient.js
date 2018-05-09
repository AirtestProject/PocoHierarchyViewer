const RpcBase = require('./rpcbase')

class RpcClient extends RpcBase {

    constructor(conn) {
        super()
        this.conn = conn
        this.status = "connecting"
        this.conn.setOnErrorCallback(this)
        this.conn.setOnMessageCallback(this)
        this.conn.setOnCloseCallback(this)
    }

    onClose() {
        this.status = "closed"
        console.log("Connection close.")
    }

    onConnection() {
        this.status = "connected"
        console.log("Connected to server.")
    }

    connect(ip, port) {
        return this.conn.connect(ip, port, this)
    }

    call(func, params=[]) {
        let _id = this.get_request_id()
        let res = this.format_message(func, params, _id)
        let msg = res.msg
        let buf = this.get_buffer_from_msg(msg)
        let promise = res.promise
        this.conn.send(buf)
        return promise
    }
}


module.exports = RpcClient
