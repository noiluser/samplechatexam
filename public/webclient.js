Number.prototype.padLeft = function(base,chr){
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}

function webclient(settings) {
	this.status = "ready";
	this.msg = {};
	this.elem = {};
	this.cb = {};
	
	if (settings.hasOwnProperty("keepAlive"))
		this.keepAlive = settings.keepAlive;
	else 
		this.keepAlive = 0;
	
	if (settings.hasOwnProperty("secured"))
		this.secured = settings.secured;
	else 
		this.secured = 0;
	
	if (settings.hasOwnProperty("withDate"))
		this.withDate = settings.withDate;
	else 
		this.withDate = 0;

	if (settings.hasOwnProperty("host"))
		this.host = settings.host;
	else 
		this.host = "";
	
	if (settings.hasOwnProperty("name"))
		this.setName(settings.name);

	
	if (settings.hasOwnProperty("historyEl"))
		this.elem.history = settings.historyEl;
	if (settings.hasOwnProperty("usersEl"))
		this.elem.users = settings.usersEl;

	if (settings.hasOwnProperty("onConnect"))
		this.cb.onConnect = settings.onConnect;
	if (settings.hasOwnProperty("onDisconnect"))
		this.cb.onDisconnect = settings.onDisconnect;
	if (settings.hasOwnProperty("onMessageReceived"))
		this.cb.onMessageReceived = settings.onMessageReceived;	
	if (settings.hasOwnProperty("onMessageSent"))
		this.cb.onMessageSent = settings.onMessageSent;	
	if (settings.hasOwnProperty("onStatusUpdate"))
		this.cb.onStatusUpdate = settings.onStatusUpdate;
	if (settings.hasOwnProperty("onUserlist"))
		this.cb.onUserlist = settings.onUserlist;

	this.startupCmd = ["verify", "history", "ping"];
	
	this.msg.connectStart = ["Verifying username", "Fetching history", "Online"];
	this.msg.connectEnd = ["Username verified", "History loaded", "Online"];
	this.msg.connectFail = ["Username is used by someone else", "Can't load history"];
	this.msg.connectEstablish = "Establishing connection";
	this.msg.connectionError = "The problem occured while websocket tries to set connection. Please try again.";
	this.msg.emptyName = "Username cannot be empty. Please set username first";
	this.msg.nameExists = "The username you specified is already exists.";
	this.msg.serverUnavailable = "Server not responding. Connection problem.";
	
	this.startState = 0;
	this.connected = 0;
}

webclient.prototype.connect = function() {
	var self = this;
	
	if (self.name) { 
		self.status = "fetching";
		self.updateStatus(self.msg.connectEstablish);
		
		if (self.secured)
			connection = new WebSocket("wss://" + window.location.host);
		else 
			connection = new WebSocket("ws://" + window.location.host);
		self.connection = connection;
		connection.onerror = function(err) {
			alert(self.msg.connectionError);
		};
		connection.onclose = function() {
			self.status = "ready";
			self.updateStatus("Disconnected");
		};
		connection.onopen = function() { self.afterConnect(); };
		connection.onmessage  = function(msg) { self.receivedMsg(msg.data); };	
	} else {
		this.status = "error";
		this.updateStatus(this.msg.emptyName);
	}
}

webclient.prototype.afterConnect = function() {
	var self = this;
	if (self.startState < 3) {
		self.updateStatus(self.msg.connectStart[self.startState]);
		var request = {
			"type" : "cmd",
			"user" : self.name,
			"data" : {
				"cmd" : self.startupCmd[self.startState]
			}
		}
		self.connection.send(JSON.stringify(request));
	} else {
		if(self.cb.hasOwnProperty('onConnect')) {
			self.cb.onConnect();
			self.ping();
		}
	}
}

webclient.prototype.updateStatus = function(status) {
	this.status = status;
	if(this.cb.hasOwnProperty('onStatusUpdate'))
		this.cb.onStatusUpdate(status);	
}

webclient.prototype.setName = function(name) {
	if (name)
		this.name = name;
}

webclient.prototype.receivedMsg = function(msg) {
	var self = this;
	var failed = 0;
	var response = JSON.parse(msg);
	if (response.type == "cmd") {
		if ((response.data.cmd == self.startupCmd[self.startState]) && (self.startState < 3)) {
			if (self.startState == 0) {
				if (response.data.data == 1) {
					failed = 0;
				} else {
					alert(self.msg.nameExists);
					failed = 1;
				}
			} else if (self.startState == 1) {
				self.onMessages(response.data.data, 0);
				failed = 0;
			} 
			
			if (failed == 0) {
				self.updateStatus(self.msg.connectEnd[self.startState]);
				self.startState++;
				self.afterConnect();
			} else {
				self.updateStatus(self.msg.connectFail[self.startState]);
				self.disconnect(1);
			}
		} else if (response.data.cmd == "userlist") {
			self.onUserList(response.data.data);
		} else if ((response.data.cmd == "ping")&&(response.data.data == "pong")) {
			self.ping();
		}
	} else if (response.type == "msg" && (self.startState >= 2)) {
		self.onMessages([response], 1);
	} 
}

webclient.prototype.dateToString = function(date) {
	var dateObj = new Date(date);
	var dateStr = [ ( dateObj.getMonth()+1 ).padLeft(), dateObj.getDate().padLeft(), dateObj.getFullYear() ].join('.') + ' ' +
    [ dateObj.getHours().padLeft(), dateObj.getMinutes().padLeft(), dateObj.getSeconds().padLeft()].join(':');
	return dateStr;
}

webclient.prototype.onMessages = function(lines, append) {
	var self = this;
	var messages = [];
	lines.forEach(function(item, i, arr) {
		  var user = item.user;
		  var msg = item.data.data;
		  var prefix = "";
		  if (self.withDate) {
			  prefix = "[" + self.dateToString(item.data.time) + "] ";
		  }
		  var message = "";
		  if (user)
			  message = prefix + user + ": " + msg;
		  else
			  message = prefix + ">> " + msg;
		  messages.push(message);
	});		
	if(this.cb.hasOwnProperty('onMessageReceived'))
		this.cb.onMessageReceived(messages, append);
}

webclient.prototype.onUserList = function(users) {
	if (this.cb.onUserlist)
		this.cb.onUserlist(users);
}

webclient.prototype.sendMessage = function(msg) {
	var self = this;
	if (msg) {
		var data = {
				"type" : "msg",
				"user" : self.name,
				"data" : {
					"data" : msg
				}
		}
		self.connection.send(JSON.stringify(data));
		if(this.cb.hasOwnProperty('onMessageSent'))
			this.cb.onMessageSent();
	}
}

webclient.prototype.disconnect = function(saveName) {
	var self = this;
	if (!saveName) {
		var request = {
			"type" : "cmd",
			"user" : self.name,
			"data" : {
				"cmd" : "disconnect"
			}
		}
		self.connection.send(JSON.stringify(request));
	}
	self.startState = 0;
	self.connection.close();
	self.updateStatus("Disconnected");
	if(this.cb.hasOwnProperty('onDisconnect'))
		this.cb.onDisconnect();
}

webclient.prototype.ping = function() {
	var self = this;
	if (self.keepAlive) {
		if (self.pongId)
			clearTimeout(self.pongId);
		var ping = setTimeout(function() { 
				var pingRequest = {
						"type" : "cmd",
						"user" : self.name,
						"data" : {
							"cmd" : "ping"
						}
				}
				self.connection.send(JSON.stringify(pingRequest));
				var pong = setTimeout(function() { 
					alert(self.msg.serverUnavailable)
					self.disconnect();
				}, 10000);				
				self.pongId = pong;
			}, 2000);
		self.pingId = ping;	
	}
}