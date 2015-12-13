var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var process = require("./process.js");
var numaric = require("../utils/numaric.js");

var Game = function(){
	this.clients = [];
	this.clientIdCounter = 1;
	this.levels = [];

	this.init = function(){
		this.levels = process.loadLevels();
	}

	this.handleClientConnect = function(ws){
		var newPlayer = new models.Player().new(this.clientIdCounter, 0);
		this.clientIdCounter++;
		var client = new webmodels.Client(ws, newPlayer);

		//give client init state with a level
		var currentLevel = this.levels[client.player.currentLevelIndex];

		var stateUpdate = new webmodels.StateUpdate([]);
		var cell = new models.Cell(2, newPlayer.id);
		process.set(currentLevel, client.player, new models.Vec2(5, 5), cell, stateUpdate);
		process.set(currentLevel, client.player, new models.Vec2(5, 4), cell, stateUpdate);
		this.sendStateUpdate(stateUpdate);

		this.clients.push(client);

		var initState = new webmodels.State(currentLevel, client.player);
		client.ws.send(JSON.stringify(initState));
	}

	this.handleClientClose = function(ws){
		this.removeClientWithWS(ws);
	}

	this.handleClientEvent = function(ws, event){
		var client = this.clients[this.getClientIndexWithWS(ws)];
		if (event.type == webmodels.ClientEvent.TYPE_MOVE_EVENT){
			var level = this.levels[client.player.currentLevelIndex];

			var stateUpdate = new webmodels.StateUpdate([]);
			process.move(level, client.player, event.dir, stateUpdate);
			this.sendStateUpdate(stateUpdate);
		}
	}

	this.update = function(){
		for (var levelIndex = 0; levelIndex < this.levels.length; ++levelIndex){
			var level = this.levels[levelIndex];
		}
	}

	this.removeClientWithWS = function(ws){
		this.clients.splice(this.getClientIndexWithWS(ws),1);
	}

	this.getClientIndexWithWS = function(ws){
		for (var i = 0; i < this.clients.length; ++i){
			if (ws == this.clients[i].ws){ 
				return i;
			}
		}
		console.error("Error: client index not found");
		return -1;
	}

	this.sendStateUpdate = function(stateUpdate){
		var stateUpdateStr = JSON.stringify(stateUpdate);
		for (var i = 0; i < this.clients.length; ++i){
			this.clients[i].ws.send(stateUpdateStr);
		}
	}

	this.init();
}
exports.Game = Game;

var game = new Game();
