
var RpcServer =  require('./rpcserver')
var serverSocket = require('./socket')

// ServerSocket = serverSocket.ServerSocket
// RpcServer = rpcServer.RpcServer

server_s = new serverSocket.ServerSocket()
server = new RpcServer(server_s)

server.listen(8889)