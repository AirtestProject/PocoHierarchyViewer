

var RpcClient = require('./rpcclient')
var clientSocket = require('./socket')
var Screen = require('../std/screen')
var Dumper = require('../std/dumper')

client_s = new clientSocket.ClientSocket()
client = new RpcClient(client_s, '10.254.49.179', 5001)
try {
    client.wait_for_connected()
} catch(err) {
    console.log(err)
}

var dumper = new Dumper(client)

p = dumper.dumpHierarchy()
console.log(p)
