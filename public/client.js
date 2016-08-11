var connection = new WebSocket("ws://" + window.location.host);

connection.onopen = function () {
	console.log("openned");
};

connection.onmessage = function (message) {
	console.log(message);
};