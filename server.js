// require express and websockets
var server = require('http').createServer();
var express = require('express');
var WebSocketServer = require('ws').Server;

// creating instances
var wss = new WebSocketServer({ server: server });
var app = express();

// set port
var port = 4080;

// Handling static content
app.use('/static', express.static(__dirname + '/public'));

// Show client window at the root
app.get("/", function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

// define broadcasting mathed for webSocketServer
wss.broadcast = function broadcast(message) {
	wss.clients.forEach(function each(client) {
		client.send(message);
	});
};

// looking for clients
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: ' + message);
	});

	ws.send('welcome');
	this.broadcast("another client connected");
});

server.on('request', app);
server.listen(port, function () { 
	console.log('Listening on ' + server.address().port); 
});