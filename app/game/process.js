var Models = require("../model/models.js");
var numaric = require("../utils/numaric.js");
var deepcopy = require('deepcopy');
var imgLoader = require("../utils/imageLoader.js");

var generateGrid = function(size){
	var grid = new Models.Grid([], size);
	for (var x = 0; x < size.x; ++x){
		for (var y = 0; y < size.y; ++y){
			var cell = new Models.Cell(0, Models.Cell.NULL_PLAYER_ID);
			grid.cells.push(cell);
		}
	}
	return grid;
}

var loadLevels = function(game, callback){
	var levelData = [];

	var levelInstanceCount = 20;
	var levels = [
		{filename: 'webcontent/level0.png', difficulty: 0, maxPlayers: 4},
		{filename: 'webcontent/level1.png', difficulty: 1, maxPlayers: 4},
		{filename: 'webcontent/level2.png', difficulty: 2, maxPlayers: 4},
		{filename: 'webcontent/Level3.png', difficulty: 3, maxPlayers: 4},
		{filename: 'webcontent/Level4.png', difficulty: 4, maxPlayers: 4},
		{filename: 'webcontent/Level5.png', difficulty: 5, maxPlayers: 4},
		{filename: 'webcontent/Level6.png', difficulty: 6, maxPlayers: 4},
		{filename: 'webcontent/Level7.png', difficulty: 7, maxPlayers: 4},
		{filename: 'webcontent/Level8.png', difficulty: 8, maxPlayers: 4},
		{filename: 'webcontent/Level9.png', difficulty: 9, maxPlayers: 4},
		{filename: 'webcontent/Level10.png', difficulty: 10, maxPlayers: 4},
	];

	for (var i = 0; i < levelInstanceCount; i++) {
		for (var j = 0; j < levels.length; j++) {
			levelData.push(levels[j]);
		}
	}
	var index = 0;

	(function loadNext() {
		if (index < levelData.length) {
			loadLevelFromDisk(levelData[index], game, loadNext);
			index++;

		} else {
			console.log('Loaded ' + levelData.length + ' levels.');
			callback(); // all done
		}
	})();
}
exports.loadLevels = loadLevels;

var loadLevelFromDisk = function(levelData, game, callback){
	imgLoader.loadImage(levelData.filename, function(img){
		var grid = new Models.Grid(new Array(img.width * img.height), new Models.Vec2(img.width, img.height));

		for (var i = 0; i < img.data.length; i++){
			var p = numaric.indexToVec(i, grid.size);
			p.y = (grid.size.y - 1) - p.y;
			var newIndex = numaric.vecToIndex(p, grid.size);

			var pixel = img.data[i];
			if (pixel.a === 0) {
				// empty
				grid.cells[newIndex] = new Models.Cell(0, 0);
			} else if (pixel.r === 255 && pixel.g === 255 && pixel.b === 255) {
				// obstacle
				grid.cells[newIndex] = new Models.Cell(-1, 0);
			} else {
				// exit
				// r = threshold value required to use the exit
				// g = level difficulty index to teleport to
				grid.cells[newIndex] = new Models.Cell(pixel.r, -pixel.g);
			}
		}
		game.levels.push(new Models.Level().new(grid, levelData.difficulty, levelData.maxPlayers));
		callback();
	});
}

var set = function(level, cellPos, cell, stateUpdate){
	var cellId = numaric.vecToIndex(cellPos, level.grid.size);
	var oldCell = level.grid.cells[cellId];
	if (oldCell.value !== cell.value || oldCell.playerId !== cell.playerId) {
		oldCell.playerId = cell.playerId;
		oldCell.value = cell.value;
		stateUpdate.events.push(new Models.Event(cellId, -1, cell.playerId, cell.value));
	}
}
exports.set = set;

var move = function(level, player, dir){
	var stateUpdate = new Models.StateUpdate(player.currentLevelIndex);
	var playerCenter = getPlayerCenter(level, player);
	if (!playerCenter){ // nothing to move
		return stateUpdate;
	}

	var movementDir = getDirectionEnum(dir);
	playerCenter.addToSelf(movementDir);

	var u_dir = getReverse(dir);
	var v_dir = getPerpendicular(u_dir);
	for (var u = 0; u < Math.abs(level.grid.size.get(getPositiveDir(u_dir), level.grid.size)); ++u){
		for (var v = 0; v < Math.abs(level.grid.size.get(getPositiveDir(v_dir), level.grid.size)); ++v){
			var position = new Models.Vec2();
			position.set(u_dir, level.grid.size, u);
			position.set(v_dir, level.grid.size, v);
			stateUpdate.merge( updateCell(position, player, level.grid, dir, playerCenter) );
		}
	}
	return stateUpdate;
}
exports.move = move;

var range = 4 * 4;
var isWithinRange = function(center, pos) {
	var dx = pos.x - center.x;
	var dy = pos.y - center.y;
	return (dx * dx) + (dy * dy) < range;
};

var updateCell = function(cellPos, player, grid, dir, center){
	var stateUpdate = new Models.StateUpdate(player.currentLevelIndex);
	var cellId = numaric.vecToIndex(cellPos, grid.size);

	if (grid.cells[cellId].playerId === player.id){
		var nextCellPos = cellPos.add(getDirectionEnum(dir));
		if (nextCellPos.x < 0 || nextCellPos.x >= grid.size.x || nextCellPos.y < 0 || nextCellPos.y >= grid.size.y) {
			// out of bounds. do nothing
			// check if we need to deactivate this cell
			if (!isWithinRange(center, cellPos)) {
				grid.cells[cellId].playerId = 0;
				stateUpdate.events.push(new Models.Event(cellId, -1, 0, grid.cells[cellId].value));
			}
		}
		else{
			var nextCellId = numaric.vecToIndex(nextCellPos, grid.size);
			var cellValue = grid.cells[cellId].value;
			var nextCellValue = grid.cells[nextCellId].value;
			if (nextCellValue === 0) {
				// nothing in the way. move there
				var withinRange = isWithinRange(center, nextCellPos);
				var newValue = cellValue;
				var newPlayerId = withinRange ? player.id : 0;

				grid.cells[nextCellId].value = newValue;
				grid.cells[nextCellId].playerId = newPlayerId;

				grid.cells[cellId].value = 0;
				grid.cells[cellId].playerId = 0;

				stateUpdate.events.push(new Models.Event(cellId, dir, newPlayerId, newValue));

				if (withinRange)
					stateUpdate.merge( assimilateAdjacents(nextCellPos, grid, player, center) );
			}
			else {
				// something is in the way
				if (nextCellValue == cellValue) {
					if (grid.cells[nextCellId].playerId < 0) {
						// map exit; let's go!
						player.nextLevel = -grid.cells[nextCellId].playerId;
					}
					else {
						// merge into next cell
						var withinRange = isWithinRange(center, nextCellPos);
						var newValue = cellValue + 1;
						var newPlayerId = withinRange ? player.id : 0;
						player.highestValue = Math.max(player.highestValue, newValue);
						grid.cells[nextCellId].value = newValue;
						grid.cells[nextCellId].playerId = newPlayerId;
						grid.cells[cellId].value = 0;
						grid.cells[cellId].playerId = 0;
						stateUpdate.events.push(new Models.Event(cellId, dir, newPlayerId, newValue));

						if (withinRange)
							stateUpdate.merge( assimilateAdjacents(nextCellPos, grid, player, center) );
					}
				}
				else {
					// can't merge. do nothing
					// check if we need to deactivate this cell
					if (!isWithinRange(center, cellPos)) {
						grid.cells[cellId].playerId = 0;
						stateUpdate.events.push(new Models.Event(cellId, -1, 0, grid.cells[cellId].value));
					}
				}
			}
		}
	}
	return stateUpdate;
}

var assimilateAdjacents = function(cellPos, grid, player, center) {
	var stateUpdate = new Models.StateUpdate(player.currentLevelIndex);

	for (var i = 0; i < directions.length; i++) {
		var adjacent = cellPos.add(directions[i]);
		if (adjacent.x >= 0 && adjacent.x < grid.size.x && adjacent.y >= 0 && adjacent.y < grid.size.y
			&& isWithinRange(center, adjacent)) {
			var adjacentId = numaric.vecToIndex(adjacent, grid.size);
			var adjacentValue = grid.cells[adjacentId].value;
			if (grid.cells[adjacentId].playerId === 0
				&& adjacentValue > 0) {
				// pick up adjacent cell
				player.highestValue = Math.max(player.highestValue, adjacentValue);
				grid.cells[adjacentId].playerId = player.id;
				stateUpdate.events.push(new Models.Event(adjacentId, -1, player.id, adjacentValue));
			}
		}
	}
	return stateUpdate;
}
exports.assimilateAdjacents = assimilateAdjacents;

var directions = [];
directions.push(new Models.Vec2(0,-1));
directions.push(new Models.Vec2(-1,0));
directions.push(new Models.Vec2(0,1));
directions.push(new Models.Vec2(1,0));
exports.directions = directions;
var getDirectionEnum = function(dir){
	return directions[dir];
}
var getPerpendicular = function(dir){
	switch (dir){
		case 0:
			return 1;
		case 1:
			return 0;
		case 2:
			return 3;
		case 3:
			return 2;
	}
}
var getReverse = function(dir){
	switch (dir){
		case 0:
			return 2;
		case 1:
			return 3;
		case 2:
			return 0;
		case 3:
			return 1;
	}
}
var getPositiveDir = function(dir){
	switch (dir){
		case 0:
			return 2;
		case 1:
			return 3;
		case 2:
			return 2;
		case 3:
			return 3;
	}
}

var getPlayerCenter = function(level, player){
	var count = 0;
	var center = new Models.Vec2();
	
	for (var i = 0; i < level.grid.cells.length; i++) {
		if (level.grid.cells[i].playerId === player.id) {
			var position = numaric.indexToVec(i, level.grid.size);
			center.x += position.x;
			center.y += position.y;
			count++;
		}
	}

	if (count === 0)
		return null; // nothing to move
	center.x /= count;
	center.y /= count;
	return center;
}
