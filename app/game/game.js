var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var process = require("./process.js");
var numaric = require("../utils/numaric.js");
var ws = require('ws');

var Game = function(){
	this.clients = [];
	this.clientIdCounter = 2;
	this.levels = [];

	var that = this;
	process.loadLevels(this.levels, function() {
		that.randomSpawn(20);
	});

	this.handleClientConnect = function(ws) {
		var newPlayer = new models.Player().new(this.clientIdCounter);
		this.clientIdCounter++;
		var client = new webmodels.Client(ws, newPlayer);

		var levelIndex = this.findCompatibleLevel_withDifficulty(0);
		console.log("Loading level " + levelIndex);
		if (levelIndex == -1){
			console.log("no more levels with that difficulty");
			return;
		} else {
			var initState = this.clientEnterLevel(client, levelIndex);
			this.clients.push(client);
			client.ws.send(JSON.stringify(initState));
		}
	}

	this.clientEnterLevel = function(client, levelId) {
		// give client init state with a level
		client.player.currentLevelIndex = levelId;
		var level = this.levels[levelId];

		this.spawnPlayer(level, client.player);

		return new webmodels.State(level, client.player);
	}

	this.spawnPlayer = function(level, player) {
		// find a spawn point
		var spawnPoint = null;
		var p = new models.Vec2(0, 0);
		for (var i = 0; i < level.grid.cells.length; i++) {
			var candidateId = Math.floor(Math.random() * level.grid.cells.length);
			var candidate = numaric.indexToVec(candidateId, level.grid.size);

			if (level.grid.cells[candidateId].value !== 0)
				continue; // can't spawn here, something in the way
			else if (spawnPoint === null)
				spawnPoint = candidate;

			// check if there's room around the spawn area
			var conflict = false;
			for (p.x = Math.max(0, candidate.x - 4); p.x < Math.min(candidate.x + 5, level.grid.size.x); p.x++) {
				for (p.y = Math.max(0, candidate.y - 4); p.y < Math.min(candidate.y + 5, level.grid.size.y); p.y++) {
					var cell = level.grid.cells[numaric.vecToIndex(p, level.grid.size)];
					if (cell.playerId !== 0 || cell.id < 0) {
						conflict = true;
						break;
					}
				}
				if (conflict)
					break;
			}

			if (!conflict) {
				spawnPoint = candidate;
				break;
			}
		}

		if (spawnPoint === null) // this should never ever happen
			spawnPoint = new models.Vec2(0, 0);

		// spawn a block
		var stateUpdate = new webmodels.StateUpdate(player.currentLevelIndex, []);

		process.set(level, spawnPoint, new models.Cell(player.highestValue, player.id), stateUpdate);
		process.assimilateAdjacents(spawnPoint, level.grid, player, spawnPoint, stateUpdate);
		this.sendStateUpdate(stateUpdate);
	}

	this.handleClientClose = function(ws){
		var clientIndex = this.getClientIndexWithWS(ws);
		if (clientIndex != -1){
			var client = this.clients[clientIndex];
			var stateUpdate = new webmodels.StateUpdate(client.player.currentLevelIndex, []);
			this.deactivatePlayer(client.player, stateUpdate);
			this.removeClientWithWS(ws);
			this.sendStateUpdate(stateUpdate);
		}
	}

	this.deactivatePlayer = function(player, stateUpdate) {
		var level = this.levels[player.currentLevelIndex];
		var stats = level.grid.stats();
		if (stats.filled > stats.totalPlayable * 0.2) {
			// too crowded. delete the cells
			var empty = new models.Cell(0, 0);
			for (var i = 0; i < level.grid.cells.length; i++) {
				var cell = level.grid.cells[i];
				if (cell.playerId === player.id && cell.value > 0) // delete the cell
					process.set(level, numaric.indexToVec(i, level.grid.size), empty, stateUpdate);
			}
		}
		else {
			// we have room. leave the cells
			for (var i = 0; i < level.grid.cells.length; i++) {
				var cell = level.grid.cells[i];
				if (cell.playerId === player.id && cell.value > 0) // set the cell as dead
					process.set(level, numaric.indexToVec(i, level.grid.size), new models.Cell(cell.value, 1), stateUpdate);
			}
		}
	};

	this.handleClientEvent = function(ws, event){
		var clientIndex = this.getClientIndexWithWS(ws);
		if (clientIndex != -1){
			var client = this.clients[clientIndex];
			if (event.type == webmodels.ClientEvent.TYPE_MOVE_EVENT){
				var level = this.levels[client.player.currentLevelIndex];
	
				var stateUpdate = new webmodels.StateUpdate(client.player.currentLevelIndex, []);
				process.move(level, client.player, event.dir, stateUpdate);
				if (client.player.nextLevel !== null) {
					var levelIndex = this.findLeastPopulatedLevel_withDifficulty(client.player.nextLevel);
					client.player.nextLevel = null;
					if (levelIndex !== -1) {
						this.deactivatePlayer(client.player, stateUpdate);
						var initState = this.clientEnterLevel(client, levelIndex);
						client.ws.send(JSON.stringify(initState));
					}
				}
				this.sendStateUpdate(stateUpdate);

			} else if (event.type == webmodels.ClientEvent.TYPE_RESPAWN){
				var level = this.levels[client.player.currentLevelIndex];
	
				// first, make sure the player has no cells, so we know it's safe to spawn
				var spawn = true;
				for (var i = 0; i < level.grid.cells.length; i++) {
					if (level.grid.cells[i].playerId === client.player.id) {
						spawn = false;
						break;
					}
					
					if (spawn)
						this.spawnPlayer(level, client.player);
				}
			}
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
				if (this.clients[i].player.currentLevelIndex === stateUpdate.level_id) {
					var clientWs = this.clients[i].ws;
					if (clientWs.readyState === ws.OPEN)
						clientWs.send(stateUpdateStr);
				}
			}
		}
	}

	this.randomSpawn = function(count) {
		if (typeof count === 'undefined')
			count = 2;
		for (var i = 0; i < this.levels.length; ++i){
			var stateUpdate = new webmodels.StateUpdate(i, []);
			var level = this.levels[i];
			var grid = level.grid;
			var stats = grid.stats();

			if (stats.filled > stats.totalPlayable * 0.3)
				continue;

			var tries = 0;
			for (var j = 0; j < count; j++) { // spawn x cells
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
	setInterval(this.randomSpawn.bind(this), 2000);

	this.findCompatibleLevel_withDifficulty = function(difficulty){
		var levelClientCount = [];
		for (var i = 0; i < this.levels.length; ++i){ levelClientCount.push(0); }
		for (var i = 0; i < this.clients.length; ++i){
			levelClientCount[this.clients[i].player.currentLevelIndex] += 1;
		}

		for (var i = 0; i < this.levels.length; ++i){

			if (this.levels[i].difficulty == difficulty){

				var levelClientAmnt = levelClientCount[i];
				if (levelClientAmnt+1 <= this.levels[i].maxPlayers){
					return i;
				}
			}
		}
		return -1;
	}
}
exports.Game = Game;
