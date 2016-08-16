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

var usersActivity = {};
var history = [];
var historyLimit = 9999;

// looking for clients
wss.on('connection', function connection(ws) {
	var self = this;
	ws.on('message', function incoming(message) {
		var data = JSON.parse(message);
		var type = data.type;
		var username = data.user;
		var content = data.data;
		// type = {cmd, msg}
		if (type == "cmd") {
			if (content.cmd == "verify") {
				if (username) {
					console.log(username + " is trying to log in");
					if (username in usersActivity) {
						// user already connected
						data.data.data = 0; 
					} else {
						var time = new Date();
						// connect approved
						usersActivity[username] = time.getTime();
						data.data.data = 1;
						// add line in history
						
						var broadmsg = {
								"type" : "msg",
								"user" : "",
								"data" : {
									"time" : time.getTime(),
									"data" : username + " connected"
								}
						}
						history.push(broadmsg);
						if (history.length > historyLimit) 
							history.shift();
						// broadcast user connected
						self.broadcast(JSON.stringify(broadmsg));
						// broadcast new userlist	
						var users = [];
						for (var key in usersActivity) {
							users.push(key);
						}
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
				} else {
					ws.close();
				}
			} else if (content.cmd == "history") {
				data.data.data = history;
				ws.send(JSON.stringify(data));
			} else if (content.cmd == "disconnect") {
				console.log(username + " goes offline");
				// disconnect approved
				delete usersActivity[username];
				// add line in history
				var time = new Date();
				var broadmsg = {
						"type" : "msg",
						"user" : "",
						"data" : {
							"time" : time.getTime(),
							"data" : username + " disconnected (leaves)"
						}
				}
				history.push(broadmsg);
				if (history.length > historyLimit) 
					history.shift();
				// broadcast user disconnected
				self.broadcast(JSON.stringify(broadmsg));
				// broadcast new userlist	
				var users = [];
				for (var key in usersActivity) {
					users.push(key);
				}
				var broadulist = {
						"user" : "",
						"type" : "cmd",
						"data" : {
							"cmd" : "userlist",
							"data" : users
						}
				}
				self.broadcast(JSON.stringify(broadulist));	
			} else if (content.cmd == "ping") {
				// keep connection alive
				var username = data.user;
				var time = new Date();
				usersActivity[username] = time.getTime();
				data.data.data = "pong";
				ws.send(JSON.stringify(data));
			}
		} else if (data.type == "msg") {
			var time = new Date();
			data.data.time = time.getTime();
			// save message and broadcast it for everybody
			history.push(data);
			if (history.length > historyLimit) 
				history.shift();
			self.broadcast(JSON.stringify(data));
		} 		
	});
});

setInterval(function checkUsers() {
	var time = new Date();
	for (var key in usersActivity) {
	    var uTime = new Date(usersActivity[key]);
	    uTime = uTime.getTime();
	    if ((time - uTime) > 10000) {
	    	// client disconnected. update userlist
	    	var username = key;
	    	delete usersActivity[username];
			console.log(username + " terminated by the server");
			// add line in history
			var time = new Date();
			var broadmsg = {
					"type" : "msg",
					"user" : "",
					"data" : {
						"time" : time.getTime(),
						"data" : username + " disconnected (connection timed out)"
					}
			}
			history.push(broadmsg);
			if (history.length > historyLimit) 
				history.shift();
			// broadcast user disconnected
			wss.broadcast(JSON.stringify(broadmsg));
			// broadcast new userlist
			var users = [];
			for (var key in usersActivity) {
				users.push(key);
			}
			var broadulist = {
					"user" : "",
					"type" : "cmd",
					"data" : {
						"cmd" : "userlist",
						"data" : users
					}
			}
			wss.broadcast(JSON.stringify(broadulist));	
	    }
	}
}, 2000)

server.on('request', app);
server.listen(port, function () { 
	console.log('Listening on ' + server.address().port); 
});