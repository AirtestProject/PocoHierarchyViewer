var RpcBase = require('./rpcbase')

class RpcServer extends RpcBase {

    constructor(_server) {
        super()
        this.server = _server
        this.server.onConnection(this.onSocketMessage, this.onSocketError, this.onSocketClose, this)
    }

    onSocketMessage(_self, sock, data) {
        console.log("data from client: " + data)
        let _dict = _self.msg_to_json(data)
        console.log("after parse ", _dict)
        // call(_dcit.)
    }

    onSocketError(_self, sock, _error) {
        console.log("err from client: " + _error)
    }

    onSocketClose(_self, sock, had_error) {
        if (had_error) {
            console.log("close with clent cause error happen!")
        }
        else {
            console.log("client close success!")
        }
    }

    listen(port) {
        this.server.listen(port)
    }

}


module.exports = RpcServer