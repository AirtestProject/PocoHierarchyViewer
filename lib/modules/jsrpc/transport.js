
const net = window.require("net")
var Promise = require("bluebird")

class ClientSocket {
    constructor() {
        this.socket = new net.Socket()
    }

    setOnMessageCallback(func) {
        this.socket.on("data", function(data) {
            func(data)
        })
    }

    setOnErrorCallback(func) {
        this.socket.on("error", function(err) {
            func(err)
        })
    }

    setOnCloseCallback(func) {
        this.socket.on("close", function() {
            func()
        })
    }

    connect(ip, port, func) {
        let _client = this
        return new Promise((resolve, reject) => {
                console.log(ip, port)
                _client.socket.connect(port, ip, function() {
                    resolve()
                })
            }).timeout(10000)
        this.socket.connect(port, ip, function() {
            agent.onConnection()
        })
    }

    send(msg) {
        this.socket.write(msg)
    }
}


class ServerSocket {

    constructor() {
        this.server = net.createServer()
    }

    onConnection(data_func, error_func, close_func, server) {
        this.server.on("connection", function(sock) {
            console.log("One clinet connect " + sock.remoteAddress)
            sock.on("data", function(data) {
                data_func(server, sock, data)
            })
            sock.on("error", function(err) {
                error_func(server, sock, err)
            })
            sock.on("close", function(had_error) {
                close_func(server, sock, had_error)
            })
        })
    }

    listen(port, func) {
        this.server.listen({
            port: port
        }, function() {
            console.log(" Server opened ")
        })
    }
}


module.exports = {ServerSocket: ServerSocket, ClientSocket: ClientSocket}
