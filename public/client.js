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

var client = new webclient({
	"host" : window.location.host,
	"secured" : 0,
	"historyEl" : "active-area",
	"usersEl" : "users-area"
});

document.getElementById('launch-connection').onclick = function() {
	var name = document.getElementById('name').value;
	if (name) {
		client.setName(name);
		client.connect();
	} else {
		alert("name is empty");
	}
};
