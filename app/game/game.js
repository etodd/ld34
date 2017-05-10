var Models = require("../model/models.js");
var process = require("./process.js");
var numaric = require("../utils/numaric.js");
var ws = require('ws');

var Game = function(){
	this.clients = [];
	this.clientIdCounter = 2;
	this.levels = [];

	var that = this;
	process.loadLevels(this, function() {
		that.randomSpawn(20);
	});

	this.handleClientConnect = function(w) {
		if (w.readyState === ws.OPEN) {
			var newPlayer = new Models.Player().new(this.clientIdCounter);
			this.clientIdCounter++;
			var client = new Models.Client(w, newPlayer);

			var levelIndex = this.findCompatibleLevel_withDifficulty(0);
			if (levelIndex == -1){
				client.ws.close();
				return;
			} else {
				var initState = this.clientEnterLevel(client, levelIndex);
				ws.client = client;
				this.clients.push(client);
				client.ws.send(JSON.stringify(initState));
			}
		}
	}

	this.clientEnterLevel = function(client, levelId) {
		// give client init state with a level
		client.player.currentLevelIndex = levelId;
		var level = this.levels[levelId];

		var stateUpdate = new Models.StateUpdate(levelId, []);
		this.spawnPlayer(level, client.player, stateUpdate);
		this.sendStateUpdate(stateUpdate);

		return new Models.State(level, client.player);
	}

	this.spawnPlayer = function(level, player, stateUpdate) {
		// find a spawn point
		var spawnPoint = null;
		var p = new Models.Vec2(0, 0);
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
			spawnPoint = new Models.Vec2(0, 0);

		// spawn a block
		process.set(level, spawnPoint, new Models.Cell(player.highestValue, player.id), stateUpdate);
		process.assimilateAdjacents(spawnPoint, level.grid, player, spawnPoint, stateUpdate);
	}

	this.handleClientClose = function(ws){
		if (ws.client){
			var client = ws.client;
			var stateUpdate = new Models.StateUpdate(client.player.currentLevelIndex, []);
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
			var empty = new Models.Cell(0, 0);
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
					process.set(level, numaric.indexToVec(i, level.grid.size), new Models.Cell(cell.value, 1), stateUpdate);
			}
		}
	};

	this.handleClientEvent = function(ws, event){
		if (ws.client){
			var client = ws.client;
			if (event.type == Models.ClientEvent.TYPE_MOVE_EVENT){
				var level = this.levels[client.player.currentLevelIndex];
	
				var stateUpdate = process.move(level, client.player, event.dir);

				if (client.player.nextLevel !== null) {
					var levelIndex = this.findCompatibleLevel_withDifficulty(client.player.nextLevel);
					client.player.nextLevel = null;
					if (levelIndex !== -1) {
						this.deactivatePlayer(client.player, stateUpdate);
						var initState = this.clientEnterLevel(client, levelIndex);
						if (client.ws.readyState === ws.OPEN)
							client.ws.send(JSON.stringify(initState));
					}
				}
				this.sendStateUpdate(stateUpdate);

			} else if (event.type == Models.ClientEvent.TYPE_RESPAWN){
				var level = this.levels[client.player.currentLevelIndex];
	
				// first, make sure the player has no cells, so we know it's safe to spawn
				var spawn = true;
				for (var i = 0; i < level.grid.cells.length; i++) {
					if (level.grid.cells[i].playerId === client.player.id) {
						spawn = false;
						break;
					}
				}
					
				if (spawn) {
					var stateUpdate = new Models.StateUpdate(client.player.currentLevelIndex, []);
					this.spawnPlayer(level, client.player, stateUpdate);
					this.sendStateUpdate(stateUpdate);
				}

			} else if (event.type == Models.ClientEvent.TYPE_RELOAD){
				var time = new Date().getTime();
				if (client.lastRespawn + 30000 <= time){
					client.lastRespawn = time;

					var levelId = client.player.currentLevelIndex;
					var level = this.levels[client.player.currentLevelIndex];
					client.player.highestValue = 1;

					var stateUpdate = new Models.StateUpdate(levelId, []);
					this.deactivatePlayer(client.player, stateUpdate);
					this.spawnPlayer(level, client.player, stateUpdate);
					this.sendStateUpdate(stateUpdate);
				}
			}
		}
	}

	this.removeClientWithWS = function(ws){
		if (ws.client) {
			for (var i = 0; i < this.clients.length; i++) {
				if (this.clients[i] === ws.client) {
					this.clients.splice(i, 1);
					break;
				}
			}
		}
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
			var stateUpdate = new Models.StateUpdate(i, []);
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
					process.set(level, cellPos, new Models.Cell(1, 0), stateUpdate);
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
		var levelClientCount = new Array(this.levels.length).fill(0);
		for (var i = 0; i < this.clients.length; ++i){
			levelClientCount[this.clients[i].player.currentLevelIndex]++;
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
