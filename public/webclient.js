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
	
	if (settings.hasOwnProperty("onDisconnect"))
		this.cb.onDisconnect = settings.onDisconnect;	
	
	this.startupCmd = ["verify", "history"];
	
	this.msg.connectStart = ["Verifying username", "Fetching history"];
	this.msg.connectEnd = ["Username verified", "History loaded"];
	this.msg.connectFail = ["Username is used by someone else", "Can;t load history"];
	this.msg.connectEstablish = "Establishing connection";
	this.msg.emptyName = "username cannot be empty";
	
	this.startState = 0;
	
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
	connection.onopen = function() { self.afterConnect(); };
	//connection.onclose = self.afterConnect;
	connection.onmessage  = function(msg) { self.receivedMsg(msg.data); };
	self.connection = connection;
/*	
	connection.onerror = function(error) {
		self.status = "error";
		console.log(error.message);
	}
	connection.onopen = function() {
		self.status = "connected";
		console.log("success");
	}
*/	
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
	}
}

webclient.prototype.updateStatus = function(status) {
	this.status = status;
	if (this.elem.indicator) {
		
	} else {
		console.log(this.status);
	}	
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

webclient.prototype.disconnect = function() {
	this.connection.close();
	if(this.hasOwnProperty('onDisconnect'))
		this.onDisconnect();
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
		  var message = "";
		  if (user == "system") 
			  message = "[" + self.dateToString(item.data.time) + "] " + msg;
		  else 
			  message = "[" + self.dateToString(item.data.time) + "] " + user + ":\t" + msg;
		  
		  if (elem) {
			 elem.value += message + "\r\n";
		  } else {
			  console.log("history", message);
		  }
	});	
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