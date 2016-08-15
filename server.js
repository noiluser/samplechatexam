// require express and websockets
var server = require('http').createServer();
var express = require('express');
var WebSocketServer = require('ws').Server;

// creating instances
var wss = new WebSocketServer({ server: server });
var app = express();

// set port
var port = process.env.PORT || 4080;

// Handling static content
app.use('/static', express.static(__dirname + '/public'));

// Show client window at the root
app.get("/", function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

// define broadcasting method for server
wss.broadcast = function broadcast(message) {
	// TODO add to history
	wss.clients.forEach(function each(client) {
		client.send(message);
	});
};

var users = [];
var history = [];
var historyLimit = 99;

// looking for clients
wss.on('connection', function connection(ws) {
	var self = this;
	ws.on('message', function incoming(message) {
		var data = JSON.parse(message);
		var type = data.type;
		var username = data.user;
		var content = data.data;
		// type = {cmd, status, msg}
		if (type == "cmd") {
			if (content.cmd == "verify") { // TODO verify  user = "system"!!!!
				console.log(username + " is trying to log in");
				if (users.indexOf(username) > -1) {
					// user already connected
					data.data.data = 0; 
				} else {
					// connect approved
					users.push(username);
					data.data.data = 1;
					// add line in history
					var time = new Date();
					var broadmsg = {
							"type" : "msg",
							"user" : "",
							"data" : {
								"time" : time.getTime(),
								"data" : username + " connected"
							}
					}
					history.push(broadmsg);
					// broadcast user connected
					self.broadcast(JSON.stringify(broadmsg));
					// broadcast new userlist					
					var broadulist = {
							"user" : "",
							"type" : "cmd",
							"data" : {
								"cmd" : "userlist",
								"data" : users
							}
					}
					self.broadcast(JSON.stringify(broadulist));					
				}
				// send to client verification results: username is correct or not
				ws.send(JSON.stringify(data));
				

			} else if (content.cmd == "history") {
				data.data.data = history;
				ws.send(JSON.stringify(data));
			} else if (content.cmd == "disconnect") {
				console.log(username + " disconnected");
				// connect approved
				var index = users.indexOf(username);
				if (index > -1) {
					users.splice(index, 1);
				} else {
					console.log("user not found");
				}
				// add line in history
				var time = new Date();
				var broadmsg = {
						"type" : "msg",
						"user" : "",
						"data" : {
							"time" : time.getTime(),
							"data" : username + " disconnected"
						}
				}
				history.push(broadmsg);
				// broadcast user connected
				self.broadcast(JSON.stringify(broadmsg));
				// broadcast new userlist					
				var broadulist = {
						"user" : "",
						"type" : "cmd",
						"data" : {
							"cmd" : "userlist",
							"data" : users
						}
				}
				self.broadcast(JSON.stringify(broadulist));	
			}
		} else if (data.type == "msg") {
			var time = new Date();
			data.data.time = time.getTime();
			history.push(data);
			self.broadcast(JSON.stringify(data));
		} else if (data.type == "status") {
			
		} else {
			
		}
		
	});
});

server.on('request', app);
server.listen(port, function () { 
	console.log('Listening on ' + server.address().port); 
});