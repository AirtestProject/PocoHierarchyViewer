
const RpcBase = require('./rpcbase')

class RpcClient extends RpcBase {

    constructor(conn, ip, port) {
        super()
        this.conn = conn
        this.status = "connecting"
        this.conn.connect(ip, port, this)
        this.conn.onError(this)
        this.conn.onMessage(this)
        this.conn.onClose(this)
    }

    onClose() {
        this.status = "closed"
        console.log("Connection close.")
    }

    onConnection() {
        this.status = "connected"
        console.log("Connected to server.")
    }

    wait_for_connected() {
        for (let i=0; i<10; i++) {
            if (this.status == "connected") {
                return true
            }
            else if (this.status == "connecting") {
                console.log("waiting for connection... ", i)
            }
            else {
                throw new Error("Connection error")
            }
            require('deasync').sleep(500)
        }
        throw new Error("Connection timeout")
    }

    call(func, params=[]) {
        let _id = this.get_rpc_id()
        let res = this.format_message(func, params, _id)
        let msg = res.msg
        let cb = res.cb
        let buf = this.get_buffer_by_msg(msg)
        this.conn.send(buf)
        return cb
    }
}


module.exports = RpcClient
