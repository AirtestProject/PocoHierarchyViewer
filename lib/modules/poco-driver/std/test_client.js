

var RpcClient =  require('../../jsrpc/rpcclient')
var clientSocket = require('../../jsrpc/transport')
var Screen = require('./screen')
var Dumper = require('./dumper')

client_s = new clientSocket.ClientSocket()
client = new RpcClient(client_s)
client.connect('10.254.49.179', 5001)
.then(() => {
//    console.log("write something++++++++++++++++++")
    var screen = new Screen(client)

    return screen.getScreen(500)
}).then(function(data) {
    console.log(data)
})
