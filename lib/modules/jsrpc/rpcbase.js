
class RpcBase {

    constructor() {
        this._id = 0
        this.id_to_resolve = {}
        this.id_to_reject = {}
        this._data = window.Buffer(0)
        this.msg_len = -1
    }

    format_message(method, params, _id) {
        let req = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: _id
        }
        let promise = new Promise((resolve, reject) => {
            this.id_to_resolve[_id] = resolve
            this.id_to_reject[_id] = reject
        })
        return {promise: promise, msg: JSON.stringify(req)}
    }

    msg_to_json(_str) {
        return JSON.parse(_str)
    }

    get_request_id() {
        this._id += 1
        return this._id
    }

    get_buffer_from_msg(msg) {
        let len = msg.length
        let buf_msg = window.Buffer(len)
        buf_msg.write(msg, 0, len)
        let buf_len = window.Buffer(4)
        buf_len.writeUInt8(len, 0, 4 )
        let buf = window.Buffer.concat([buf_len, buf_msg])
        return buf
    }

    onMessage(data) {
        if (this.msg_len != -1) {
            this._data = window.Buffer.concat([this._data, data])
        }
        else {
            let buf_len = data.slice(0,4)
            let p = 0
            for (let i=3; i>=0; i--) {
                p = p * 256 + buf_len.readUInt8(i)
            }
            this.msg_len = p
            this._data = data
        }
        if (this._data.length - 4 < this.msg_len) {
            console.log("need read more msg....")
            return
        }
        else if (this._data.length - 4 > this.msg_len) {
            this._data = this._data.slice(0, this.msg_len + 4)
        }

        console.log(this._data.length, this.msg_len)
        let _str = this._data.toString("utf8", 4)
        var _result = this.msg_to_json(_str)

        let _id = _result.id
        this.msg_len = -1
        this._data = window.Buffer(0)
        if (_result.hasOwnProperty("result")) {
            this.id_to_resolve[_id](_result.result)
        }
        else {
            this.id_to_reject[_id](_result.result)
        }
    }

    onError( _error) {
        console.error("Socket error!" + _error)
    }
}


module.exports = RpcBase
