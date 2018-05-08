

var RpcClient = require('./rpcclient')
var clientSocket = require('./socket')
var Screen = require('../poco-driver/std/screen')
var Dumper = require('../poco-driver/std/dumper')

client_s = new clientSocket.ClientSocket()
client = new RpcClient(client_s)
client.connect('10.254.49.179', 5001)
.then(() => {
//    console.log("write something++++++++++++++++++")
    var screen = new Screen(client)

    p = screen.getScreen(500)
    p.then(function(data) {
//        console.log(data)
    })
})
