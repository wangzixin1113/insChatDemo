var http = require('http')
var express = require('express')
var socketio = require('socket.io')
var fs = require('fs')
var url = require('url')

var app = express()
var server = http.createServer(app)

var dirSysemo = '/emoji/sysemo'

app.use(express.static(__dirname + '/public'))
app.get('/', function(req, res) {
        // var request = url.parse(req.url, true);
        // var action = request.pathname;
        // // res.writeHead(200, { 'Content-Type': 'image/gif' })
        // res.end()
        // console.log(action)
        // console.log('in /')
    })
    .get(dirSysemo, function(req, res) {
        var request = url.parse(req.url, true);
        var filename = request.pathname
        fs.readFile(filename, function(err, gif) {
            res.writeHead(200, { 'Content-Type': 'image/gif' })
            res.end(gif)
        })
        console.log(filename)
    })

server.listen(3000).on('error', function(err) { console.log(err) })

console.log(__filename)
console.log(__dirname)
console.log(__dirname + '/public')
console.log('/public')

var sysemoUrls = fs.readdir(dirSysemo, function() {

})

//socket.io server
var sioServer = socketio.listen(server)
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
        sioServer.emit('user joined', { username: name, numUsers: numUsers })
        sioServer.emit('sync user list', users)
    })
    socket.on('chat', function(data) {
        data.emoji = true
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