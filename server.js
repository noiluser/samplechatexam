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
		var data = JSON.parse(message);
		// type = {command, status, message}
		if (data.type == "command") {
			if (data.data.cmd == "verify") {
				// check username. if okey, send history. if not - send error
				var name = data.data.data;
				console.log(name + " is trying to log in");
				// success:
				data.data.cmd = "verified";
				data.data.data = "history here";
				// fail:
				/*data.data.cmd = "notverified";
				data.data.data = "";*/	
				// send response
				ws.send(JSON.stringify(data));
			}
		} else if (data.type == "status") {
			
		} else if (data.type == "message") {
			
		}
		
	});

// state = {request, response}
	//ws.send('welcome');
	//this.broadcast("another client connected");
});

server.on('request', app);
server.listen(port, function () { 
	console.log('Listening on ' + server.address().port); 
});