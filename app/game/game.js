var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var process = require("./process.js");
var numaric = require("../utils/numaric.js");

var Game = function(){
	this.clients = [];
	this.levels = [];

	this.init = function(){
		this.levels = process.loadLevels();
	}

	this.handleClientConnect = function(ws){
		var newPlayer = new models.Player().new(12, 0);
		var client = new webmodels.Client(ws, newPlayer);
		this.clients.push(client);

		//give client init state with a level
		var currentLevel = this.levels[client.player.currentLevelIndex];
		currentLevel.debug();
		var initState = new webmodels.State(currentLevel, client.player);
		client.ws.send(JSON.stringify(initState));

		console.log("opened Client amnt: " + this.clients.length);
	}

	this.handleClientClose = function(ws){
		this.removeClientWithWS(ws);
		console.log("closed Client amnt: " + this.clients.length);
	}

	this.handleClientEvent = function(ws, event){
		var client = this.clients[this.getClientIndexWithWS(ws)];
		if (event.type == webmodels.ClientEvent.TYPE_MOVE_EVENT){
			var client = this.getClientIndexWithWS(ws);
			var level = this.levels[client.player.currentLevelIndex];

			process.updateGrid(level, client.player, event.dir);

			console.log("client move event");
		}
		//this.sendStateUpdate(new webmodels.StateUpdate("hi"));
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
var newPlayer = new models.Player().new(12, 0);
var client = new webmodels.Client(null, newPlayer);
game.clients.push(client);

//player
game.levels[0].grid.cells[numaric.vecToIndex(new models.Vec2(5,5), new models.Vec2(8,8))] = new models.Cell(2,12);
game.levels[0].grid.cells[numaric.vecToIndex(new models.Vec2(5,4), new models.Vec2(8,8))] = new models.Cell(1,12);

game.levels[0].grid.cells[numaric.vecToIndex(new models.Vec2(3,2), new models.Vec2(8,8))] = new models.Cell(2,0);
game.levels[0].grid.cells[numaric.vecToIndex(new models.Vec2(4,2), new models.Vec2(8,8))] = new models.Cell(2,0);

game.levels[0].grid.debug();
//process.updateGrid(game.levels[0], newPlayer, 1);
//process.updateGrid(game.levels[0], newPlayer, 0);
process.updateGrid(game.levels[0], newPlayer, 3);
console.log("---------------------------------------");
game.levels[0].grid.debug();