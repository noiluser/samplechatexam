Number.prototype.padLeft = function(base,chr){
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}

function webclient(settings) {
	this.status = "ready";
	this.msg = {};
	this.elem = {};
	this.cb = {};
	
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
	if (settings.hasOwnProperty("name"))
		this.name = settings.name;
	
	if (settings.hasOwnProperty("historyEl"))
		this.elem.history = settings.historyEl;
	if (settings.hasOwnProperty("usersEl"))
		this.elem.users = settings.usersEl;
	if (settings.hasOwnProperty("statusEl"))
		this.elem.indicator = settings.statusEl;
	/*if (settings.hasOwnProperty("inputEl"))
		this.elem.indicator = settings.statusEl;*/
	
	if (settings.hasOwnProperty("onDisconnect"))
		this.cb.onDisconnect = settings.onDisconnect;
	if (settings.hasOwnProperty("onConnect"))
		this.cb.onConnect = settings.onConnect;	
	if (settings.hasOwnProperty("onStatusUpdate"))
		this.cb.onStatusUpdate = settings.onStatusUpdate;	
	if (settings.hasOwnProperty("onMessageSent"))
		this.cb.onMessageSent = settings.onMessageSent;	
	if (settings.hasOwnProperty("onMessageReceived"))
		this.cb.onMessageReceived = settings.onMessageReceived;	
	
	this.startupCmd = ["verify", "history"];
	
	this.msg.connectStart = ["Verifying username", "Fetching history"];
	this.msg.connectEnd = ["Username verified", "History loaded"];
	this.msg.connectFail = ["Username is used by someone else", "Can;t load history"];
	this.msg.connectEstablish = "Establishing connection";
	this.msg.emptyName = "username cannot be empty";
	this.msg.connectSuccess = "Online";
	
	this.startState = 0;
	this.connected = 0;
	
}

webclient.prototype.connect = function() {
	var self = this;
	self.status = "fetching";
	self.updateStatus(self.msg.connectEstablish);
	if (self.secured)
		connection = new WebSocket("wss://" + window.location.host);
	else 
		connection = new WebSocket("ws://" + window.location.host);
	
	//connection.onerror = self.error;
	connection.onopen = function() { 
		self.afterConnect();
		if(self.cb.hasOwnProperty('onConnect'))
			self.cb.onConnect();
	};
	connection.onmessage  = function(msg) { self.receivedMsg(msg.data); };
	self.connection = connection;
}

webclient.prototype.afterConnect = function() {
	var self = this;
	if (self.startState < 2) {
		self.updateStatus(self.msg.connectStart[self.startState]);
		var request = {
			"type" : "cmd",
			"user" : self.name,
			"data" : {
				"cmd" : self.startupCmd[self.startState]
			}
		}
		self.connection.send(JSON.stringify(request));
	}
	if (self.startState == 2) {
		self.status = "online";
		this.updateStatus(self.msg.connectSuccess);
	}
}

webclient.prototype.updateStatus = function(status) {
	this.status = status;
	if(this.cb.hasOwnProperty('onStatusUpdate'))
		this.cb.onStatusUpdate(status);
	else 
		console.log(this.status);	
}

webclient.prototype.setName = function(name) {
	if (name)
		this.name = name;
	else {
		this.status = "error";
		this.updateStatus(this.msg.emptyName);
	}
}

webclient.prototype.receivedMsg = function(msg) {
	var self = this;
	var failed = 1;
	var data = JSON.parse(msg);
	if (data.type == "cmd") {
		if ((data.data.cmd == self.startupCmd[self.startState]) && (self.startState < 2)) {
			if (self.startState == 0) {
				if (data.data.data == 1) {
					failed = 0;
				} else {
					// TODO username fail
					failed = 1;
				}
			} else if (self.startState == 1) {
				self.onMessages(data.data.data, 0);
				failed = 0;
			} else {
				
			}
			
			if (failed == 0) {
				self.updateStatus(self.msg.connectEnd[self.startState]);
				self.startState++;
				self.afterConnect();
			} else {
				self.updateStatus(self.msg.connectFail[self.startState]);
				self.disconnect();
			}
		} else if (data.data.cmd == "userlist") {
			self.onUserList(data.data.data);
		}
	} else if (data.type == "msg" && (self.startState >= 2)) {
		self.onMessages([data], 1);
	} 
}

// OK
webclient.prototype.dateToString = function(date) {
	var dateObj = new Date(date);
	var dateStr = [ ( dateObj.getMonth()+1 ).padLeft(), dateObj.getDate().padLeft(), dateObj.getFullYear() ].join('.') + ' ' +
    [ dateObj.getHours().padLeft(), dateObj.getMinutes().padLeft(), dateObj.getSeconds().padLeft()].join(':');
	return dateStr;
}

// OK
webclient.prototype.onMessages = function(lines, append) {
	var self = this;
	var elem;
	if (self.elem.history) {
		elem = document.getElementById(self.elem.history);
		if (!append)
			elem.value = "";
	} 
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
		  if (elem) {
			 elem.value += message + "\r\n";
		  } else {
			  console.log("history", message);
		  }
	});	
	if(this.cb.hasOwnProperty('onMessageReceived'))
		this.cb.onMessageReceived();
}

webclient.prototype.onUserList = function(users) {
	var self = this;
	var elem;
	if (self.elem.users) {
		elem = document.getElementById(self.elem.users);
		while (elem.options.length > 0) {                
			elem.remove(0);
	    } 
	} 
	users.forEach(function(item, i, arr) {		  
		  if (elem) {
			  var el = document.createElement("option");
			  el.textContent = item;
			  el.value = item;
			  elem.appendChild(el);
		  } else {
			  console.log("user-list", item);
		  }
	});	
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

webclient.prototype.disconnect = function() {
	var self = this;
	var request = {
		"type" : "cmd",
		"user" : self.name,
		"data" : {
			"cmd" : "disconnect"
		}
	}
	self.connection.send(JSON.stringify(request));
	self.connection.close();
	if(this.cb.hasOwnProperty('onDisconnect'))
		this.cb.onDisconnect();
}