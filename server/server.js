// require dependencies
var express = require('express');
var http = require('http');
var https = require('https');
var app = express();
var db = require('./db/config.js');
var fs = require('fs');
var port = process.env.PORT || 3000;

// var httpsPort = 8000;

var app = express();
require('./routes')(app, express);

// var options = {
//   key: fs.readFileSync(__dirname + '/ssl/key.pem'),
//   cert: fs.readFileSync(__dirname + '/ssl/cert.pem')
// };

// https.createServer(options, app).listen(httpsPort, function(){
//     console.log('Https server listening on port', httpsPort);
// });

var server = http.createServer(app).listen(port, function() {
  console.log('Server listening on port', port);
});

//Sockets Setup
//io is the overall connection
//Within io you can have many specific channels/pipes which are called sockets
//We listen for specific events on sockets
//We can also send events to ALL sockets via io.emit
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {

  //join to room and save room name
  socket.emit('greeting', 'HELLO WORLD heres some data from sockets!');
  socket.on('join room', function(room) {
    socket.join(room.roomName);
    socket.ROOMPROP = room.roomName;
  });

  socket.on('coords', function(data) {
    socket.to(socket.ROOMPROP).broadcast.emit('coordinates', data);
  });

  socket.on('toggleDrawingMessage', function() {
    socket.to(socket.ROOMPROP).broadcast.emit('toggleDrawingMessage');
  });

  socket.on('clearCanvas', function() {
    socket.to(socket.ROOMPROP).broadcast.emit('clearCanvas');
  });
});

