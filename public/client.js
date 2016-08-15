/*var connection;

var printLog = function(message) {
	document.getElementById('status').innerHTML = message;
}

var printMessage = function(message, append) {
	//var el = document.getElementById('active-area').value;
	console.log(message);
}

document.getElementById('launch-connection').onclick = function() {
	var name = document.getElementById('name').value;
	if (name) {
		printLog("connecting...");
		connection = new WebSocket("ws://" + window.location.host);
		connection.onmessage = function(response) {
			var data = JSON.parse(response.data);
			if (data.type == "cmd") {
				if (data.data.cmd == "verify") {
					if (data.data.data == 1)
						printLog("connected");
					else {
						connection.close();
						printLog("disconnected");
						alert("the username is already in use");
					}
				}
			}
			//console.log(data);
		};
		
		connection.onopen = function() {
			var msg = {
				"type" : "cmd",
				"user" : name,
				"data" : {"cmd" : "verify"}
			};
			connection.send(JSON.stringify(msg));
		};

	} else {
		alert("name is empty");
	}
};

*/
// connection.onclose = function() { alert("Connection closed...") };
// connection.onmessage = function(evt) { $("#msg").append("<p>"+evt.data+"</p>"); };
// connection.close(); - close connection
// connection.send('Hey server, whats up?'); - send message
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, "");
};

var client = new webclient({
	"host" : window.location.host,
	"secured" : 1,
	"withDate" : 0,
	"keepAlive" : 1,
	"onConnect" : function() {
		document.getElementById("initializer").style.display = "none";
		document.getElementById("room").style.display = "block";
		document.getElementById('input-area').focus();
	},
	"onDisconnect" : function() {
		document.getElementById("room").style.display = "none";
		document.getElementById("initializer").style.display = "block";
	},
	"onStatusUpdate": function(message) {
		document.getElementById('status').innerHTML = message;
	},
	"onMessageSent": function() {
		document.getElementById('input-area').value = "";
		document.getElementById('input-area').focus();
	},
	"onMessageReceived": function(messages, append) {
		var textarea = document.getElementById('active-area');
		
		if (!append)
			textarea.value = "";
		messages.forEach(function(item, i, arr) {
			textarea.value += item + "\r\n";
		});
		
		textarea.scrollTop = textarea.scrollHeight;
	},
	"onUserlist": function(users) {
		var self = this;
		elem = document.getElementById("users-area");
		while (elem.options.length > 0) {                
			elem.remove(0);
	    } 
		if (elem) {
			users.forEach(function(item, i, arr) {		  
				  var el = document.createElement("option");
				  el.textContent = item;
				  el.value = item;
				  elem.appendChild(el);
			});	
		}
	}
});

var sendMessage = function(elem) {
	var message = document.getElementById(elem).value;
	client.sendMessage(message.trim());
}

document.getElementById('input-area').onkeypress = function(e) {
	if (e.ctrlKey && (event.which == 13 || event.keyCode == 13 || event.which == 10 || event.keyCode == 10)) 
		sendMessage('input-area');
};

document.getElementById('send-message').onclick = function() {
	sendMessage('input-area');
};

document.getElementById('launch-connection').onclick = function() {
	var name = document.getElementById('name').value;
	if (name) {
		client.setName(name);
		client.connect();
	} else {
		alert("name is empty");
	}
};

window.onbeforeunload = function(e) {
	client.disconnect();
};

document.getElementById('users-area').ondblclick = function() {
	var address = this.value + ", ";
	if (!document.getElementById('input-area').value) 
		document.getElementById('input-area').value = address;
	document.getElementById('input-area').focus();
};