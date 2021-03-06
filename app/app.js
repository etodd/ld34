var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var gameLib = require('./game/game.js');

var game = new gameLib.Game();

app.use(express.static('webcontent'));

app.ws("/event", function(ws, req){
	game.handleClientConnect(ws);
	
	ws.on('message', function(msg){
		game.handleClientEvent(ws, JSON.parse(msg));
	});

	ws.on('close', function(msg){
		game.handleClientClose(ws);
	});

	ws.on('error', function(msg){
		game.handleClientClose(ws);
	});
});

var server = app.listen(3000, function (){
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
