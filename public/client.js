var connection;

var printLog = function(message) {
	document.getElementById('status').innerHTML = message;
}

var printMessage = function(message, append) {
	//var el = document.getElementById('active-area').value;
}

document.getElementById('launch-connection').onclick = function() {
	var name = document.getElementById('name').value;
	if (name) {
		printLog("connecting...");
		connection = new WebSocket("ws://" + window.location.host);
		connection.onmessage = function(response) {
			var data = JSON.parse(response.data);
			if (data.type == "command") {
				if (data.data.cmd == "verified") {
					console.log(data.data.data);
				}
			}
			//console.log(data);
		};
		
		connection.onopen = function() {
			var msg = {
				"type" : "command",
				"data" : {"cmd" : "verify", "data" : name}
			};
			connection.send(JSON.stringify(msg));
		};

	} else {
		alert("name is empty");
	}
};



// connection.onclose = function() { alert("Connection closed...") };
// connection.onmessage = function(evt) { $("#msg").append("<p>"+evt.data+"</p>"); };
// connection.close(); - close connection
// connection.send('Hey server, whats up?'); - send message