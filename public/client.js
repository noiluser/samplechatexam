String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, "");
};

var client = new webclient({
	"host" : window.location.host,
	"secured" : 0,
	"withDate" : 0,
	"keepAlive" : 0,
	"onConnect" : function() {		
		document.getElementById("initializer").style.display = "none";
		document.getElementById("room").style.display = "block";
		document.getElementById('input-area').focus();
	},
	"onDisconnect" : function() {
		document.getElementById("name").disabled = false;
		document.getElementById("launch-connection").disabled = false;
		document.getElementById('name').focus();
		
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
		var name = document.getElementById('name').value;
		elem = document.getElementById("users-area");
		while (elem.options.length > 0) {                
			elem.remove(0);
	    } 
		if (elem) {
			users.forEach(function(item, i, arr) {		  
				  var el = document.createElement("option");
				  el.textContent = item;
				  el.value = item;
				  if (item == name) 
					  el.className = "owner";
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
	document.getElementById("name").disabled = "disabled";
	document.getElementById("launch-connection").disabled = "disabled";	
	if (name) {		
		client.setName(name);
		client.connect();
	} else {
		document.getElementById("name").disabled = false;
		document.getElementById("launch-connection").disabled = false;
		alert("Username cannot be empty.");
		document.getElementById('name').focus();
	}
};

window.onbeforeunload = function(e) {
	client.disconnect();
};

document.getElementById('users-area').ondblclick = function() {
	var address = this.value;
	if (address) {
		if (!document.getElementById('input-area').value) 
			document.getElementById('input-area').value = address + ", ";
		document.getElementById('input-area').focus();
	}
};

document.getElementById('name').focus();