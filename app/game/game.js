var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var process = require("./process.js");
var numaric = require("../utils/numaric.js");

var Game = function(){
	this.clients = [];
	this.clientIdCounter = 2;
	this.levels = [];

	process.loadLevels(this.levels);

	this.handleClientConnect = function(ws) {
		var newPlayer = new models.Player().new(this.clientIdCounter, 0);
		this.clientIdCounter++;
		var client = new webmodels.Client(ws, newPlayer);

		//give client init state with a level
		var currentLevel = this.levels[client.player.currentLevelIndex];

		var stateUpdate = new webmodels.StateUpdate(client.player.currentLevelIndex, []);
		var spawnPoint = new models.Vec2(5, 5);
		process.set(currentLevel, spawnPoint, new models.Cell(2, newPlayer.id), stateUpdate);
		process.assimilateAdjacents(spawnPoint, currentLevel.grid, newPlayer, stateUpdate);
		this.sendStateUpdate(stateUpdate);

		this.clients.push(client);

		var initState = new webmodels.State(currentLevel, client.player);
		client.ws.send(JSON.stringify(initState));
	}

	this.handleClientClose = function(ws){
		var client = this.clients[this.getClientIndexWithWS(ws)];
		var level = this.levels[client.player.currentLevelIndex];
		var stateUpdate = new webmodels.StateUpdate(client.player.currentLevelIndex, []);
		for (var i = 0; i < level.grid.cells.length; i++) {
			var cell = level.grid.cells[i];
			if (cell.playerId === client.player.id && cell.value > 0) // set the cell as dead
				process.set(level, numaric.indexToVec(i, level.grid.size), new models.Cell(cell.value, 1), stateUpdate);
		}
		this.removeClientWithWS(ws);
		this.sendStateUpdate(stateUpdate);
	}

	this.handleClientEvent = function(ws, event){
		var client = this.clients[this.getClientIndexWithWS(ws)];
		if (event.type == webmodels.ClientEvent.TYPE_MOVE_EVENT){
			var level = this.levels[client.player.currentLevelIndex];

			var stateUpdate = new webmodels.StateUpdate(client.player.currentLevelIndex, []);
			process.move(level, client.player, event.dir, stateUpdate);
			this.sendStateUpdate(stateUpdate);
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
		if (stateUpdate.events.length > 0) {
			var stateUpdateStr = JSON.stringify(stateUpdate);
			for (var i = 0; i < this.clients.length; ++i){
				if (this.clients[i].player.currentLevelIndex === stateUpdate.level_id)
					this.clients[i].ws.send(stateUpdateStr);
			}
		}
	}

	this.randomSpawn = function() {
		for (var i = 0; i < this.levels.length; ++i){
			var stateUpdate = new webmodels.StateUpdate(i, []);
			var level = this.levels[i];
			var grid = level.grid;
			var emptyCells = 0;
			var filledCells = 0;
			for (var j = 0; j < grid.cells.length; j++) {
				var value = grid.cells[j].value;
				if (value > 0)
					filledCells++;
				else if (value == 0)
					emptyCells++;
			}

			if (filledCells > emptyCells * 0.5)
				continue;

			var tries = 0;
			for (var j = 0; j < 1; j++) { // spawn x many at a time
				var cellId = Math.floor(Math.random() * grid.cells.length);
				var cellPos = numaric.indexToVec(cellId, grid.size);

				var canSpawn = true;

				if (grid.cells[cellId].value !== 0)
					canSpawn = false;
				else {
					// check adjacent cells
					for (var k = 0; k < process.directions.length; k++) {
						var adjacent = cellPos.add(process.directions[k]);
						if (adjacent.x >= 0 && adjacent.x < grid.size.x && adjacent.y >= 0 && adjacent.y < grid.size.y) {
							var adjacentValue = grid.cells[numaric.vecToIndex(adjacent, grid.size)].value;
							if (adjacentValue > 0) {
								// we're adjacent to something, don't spawn here
								canSpawn = false;
								break;
							}
						}
					}
				}

				if (canSpawn)
					process.set(level, cellPos, new models.Cell(1, 0), stateUpdate);
				else {
					tries++;
					if (tries > 10)
						break;
					j--; // try again
				}
			}
			this.sendStateUpdate(stateUpdate);
		}
	};
	setInterval(this.randomSpawn.bind(this), 1000);
}
exports.Game = Game;
