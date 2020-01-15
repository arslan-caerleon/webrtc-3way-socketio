//requires
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var roomList = [];

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/',(req, res) => {
    res.render('index');
})

function checkroom (item, index, arr) {
    var myRoom = io.sockets.adapter.rooms[item] || { length: 0 };
    var numClients = myRoom.length;

    if (numClients == 0) {
        arr.splice(index, 1);
    }
}

// signaling
io.on('connection', function (socket) {
    roomList.forEach(checkroom);
    console.log('a user connected');
    socket.username = "Anonymous";

    socket.on('new_message', (data) => {
        io.sockets.emit('new_message', {message: data.message, username: socket.username});
    })
    
    socket.emit('roomlist', roomList);

    socket.on('create or join', function (room) {
        console.log('create or join to room ', room);
        
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
        var numClients = myRoom.length;

        console.log(room, ' has ', numClients, ' clients');

        if (numClients == 0) {
            socket.join(room);
            roomList.push(room);
            socket.emit('created', room);
        } else if (numClients <= 2) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('candidate2', function (event){
        socket.broadcast.to(event.room).emit('candidate2', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('offer2', function(event){
        socket.broadcast.to(event.room).emit('offer2',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

    socket.on('answer2', function(event){
        socket.broadcast.to(event.room).emit('answer2',event.sdp);
    });

});

// listener
http.listen(port || 3000, function () {
    console.log('listening on', port);
});