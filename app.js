var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var redisClient = redis.createClient();

var messages = [];

var storeMessage = function(name, data) {
	var message = JSON.stringify({name: name, data: data});

	redisClient.lpush('messages', message, function() {
		redisClient.ltrim('messages', 0, 9);
	});
	// messages.push({name: name, data: data});
	// if (messages.length > 10) {
	// 	messages.shift();
	// }
};

io.on('connection', function(client) {
	// Estos logs van a la consola del servidor.
	console.log('Client connected...');
	client.on('join', function(name) {
		redisClient.lrange('messages', 0, -1, function(err, messages) {
			messages = messages.reverse();
			messages.forEach(function(message) {
				message = JSON.parse(message); 
				client.emit('message', message.name + ': ' + message.data);
			})
		});
		client.nickname = name;
		// Cuendo otro cliente se conecte, recibirá los mensajes anteriores.
	});

	client.on('message', function(data) {
		var nickname = client.nickname;

		// Broadcast: para todos menos el que lo envia.
		client.broadcast.emit("message", nickname + ": " + data);
		console.log(data);

		client.emit('message', nickname + ": " + data);
		storeMessage(nickname, data);
	});
	
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

server.listen(8080);