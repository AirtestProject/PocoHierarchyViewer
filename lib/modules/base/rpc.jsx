
class RpcObject { 
    constructor(socket, dev, uri) {
        this.socket = socket
        this.dev = dev
        this.uri = uri
    }

    invoke(methodName, params=[]) {
        let devid = this.dev.id
        let session_id = ''
        let id = ''
        let calcArgs = []
        for (let p of params) {
            calcArgs.push(['', p])
        }
        let method = [
            ['getattr', methodName],
            ['call', calcArgs],
        ]
        this.socket.emit('rpc', {devid, session_id, id, uri: this.uri, method})
    }
}

export class RpcClient {
    constructor(socket, dev) {
        this.socket = socket
        this.dev = dev
    }
    
    getObject(uri) {
        return new RpcObject(this.socket, this.dev, uri)
    }
}

