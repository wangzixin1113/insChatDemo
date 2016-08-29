var http = require('http')
var express = require('express')
var socketio = require('socket.io')

var app = express()
var server = http.createServer(app)
    //express
app.use(express.static(__dirname + '/public'))
    .get('/', function(req, res) {
        // res.sendFile(__dirname + '/public/index.html')
    })
    //http server
server.listen(8765)
    .on('error', function(err) {
        console.log(err)
    })
    //socket.io server
var sioServer = socketio.listen(server)
console.log('insChat listning on port 8765')
var users = []
var numUsers = 0
var addedUser = false
sioServer.on('connection', function(socket) {
    socket.on('enter chat room', function(name) {
        for (var i = 0; i < users.length; i++) {
            if (users[i] == name) {
                socket.emit('user name duplicate')
                return
            }
        }
        addedUser = true
        socket.user = { name: name }
        users.push(name)
        numUsers++
        // socket.emit('add user', name)
        sioServer.emit('user joined', { username: name, numUsers: numUsers })
        sioServer.emit('sync user list', users)
    })
    socket.on('chat', function(data) {
        sioServer.emit('chat', data)
    })
    socket.on('typing', function(data) {
        sioServer.emit('typing', data)
    })
    socket.on('stop typing', function(data) {
        sioServer.emit('stop typing', data)
    })
    socket.on('disconnect', function() {
        if (addedUser) {
            numUsers--
            sioServer.emit('user left', {
                username: socket.user.name,
                numUsers: numUsers
            })
            sioServer.emit('sync user list', users)
            users.splice(socket.user.name, 1)
        }
    })
})