var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var numaric = require("../utils/numaric.js");
var deepcopy = require('deepcopy');
var imgLoader = require("../utils/imageLoader.js");

var generateGrid = function(size){
	var grid = new models.Grid([], size);
	for (var x = 0; x < size.x; ++x){
		for (var y = 0; y < size.y; ++y){
			var cell = new models.Cell(0, models.Cell.NULL_PLAYER_ID);
			grid.cells.push(cell);
		}
	}
	return grid;
}

var loadLevels = function(output, callback){
	var levelData = [
		{filename: 'webcontent/level0.png', difficulty: 0},
		{filename: 'webcontent/level1.png', difficulty: 1},
		{filename: 'webcontent/level2.png', difficulty: 2},
		{filename: 'webcontent/level0.png', difficulty: 0},
		{filename: 'webcontent/level0.png', difficulty: 0},
	];

	var index = 0;

	var levelDone;
	levelDone = function() {
		if (index < levelData.length) {
			loadLevelFromDisk(levelData[index], output, levelDone);
			index++;
		}
		else {
			console.log('Loaded ' + levelData.length + ' levels.');
			callback(); // all done
		}
	};
	levelDone();
}
exports.loadLevels = loadLevels;

var loadLevelFromDisk = function(levelData, output, callback){
	imgLoader.loadImage(levelData.filename, function(img){
		var grid = new models.Grid(new Array(img.width * img.height), new models.Vec2(img.width, img.height));

		for (var i = 0; i < img.data.length; i++){
			var p = numaric.indexToVec(i, grid.size);
			p.y = (grid.size.y - 1) - p.y;
			var newIndex = numaric.vecToIndex(p, grid.size);

			var pixel = img.data[i];
			if (pixel.a === 0) {
				// empty
				grid.cells[newIndex] = new models.Cell(0, 0);
			} else if (pixel.r === 255 && pixel.g === 255 && pixel.b === 255) {
				// obstacle
				grid.cells[newIndex] = new models.Cell(-1, 0);
			} else {
				// exit
				// r = threshold value required to use the exit
				// g = level difficulty index to teleport to
				grid.cells[newIndex] = new models.Cell(pixel.r, -pixel.g);
			}
		}
		output.push(new models.Level().new(grid, levelData.difficulty));
		callback();
	});
}

var set = function(level, cellPos, cell, stateUpdate){
	var cellId = numaric.vecToIndex(cellPos, level.grid.size);
	var oldCell = level.grid.cells[cellId];
	if (oldCell.value !== cell.value || oldCell.playerId !== cell.playerId) {
		oldCell.playerId = cell.playerId;
		oldCell.value = cell.value;
		stateUpdate.events.push(new webmodels.Event(cellId, -1, cell.playerId, cell.value));
	}
}
exports.set = set;

var move = function(level, player, dir, stateUpdate){
	var count = 0;
	var center = new models.Vec2();
	for (var i = 0; i < level.grid.cells.length; i++) {
		if (level.grid.cells[i].playerId === player.id) {
			var p = numaric.indexToVec(i, level.grid.size);
			center.x += p.x;
			center.y += p.y;
			count++;
		}
	}

	if (count === 0)
		return; // nothing to move
	center.x /= count;
	center.y /= count;
	var movementDir = getDirectionEnum(dir);
	center.x += movementDir.x;
	center.y += movementDir.y;

	var u_dir = getReverse(dir);
	var v_dir = getPerpendicular(u_dir);
	for (var u = 0; u < Math.abs(level.grid.size.get(getPositiveDir(u_dir), level.grid.size)); ++u){
		for (var v = 0; v < Math.abs(level.grid.size.get(getPositiveDir(v_dir), level.grid.size)); ++v){
			var p = new models.Vec2();
			p.set(u_dir, level.grid.size, u);
			p.set(v_dir, level.grid.size, v);
			updateCell(p, player, level.grid, dir, center, stateUpdate);
		}
	}
}
exports.move = move;

var range = 4 * 4;
var isWithinRange = function(center, pos) {
	var dx = pos.x - center.x;
	var dy = pos.y - center.y;
	return (dx * dx) + (dy * dy) < range;
};

var updateCell = function(cellPos, player, grid, dir, center, stateUpdate){
	var cellId = numaric.vecToIndex(cellPos, grid.size);
	if (grid.cells[cellId].playerId === player.id){
		var nextCellPos = cellPos.add(getDirectionEnum(dir));
		if (nextCellPos.x < 0 || nextCellPos.x >= grid.size.x || nextCellPos.y < 0 || nextCellPos.y >= grid.size.y) {
			// out of bounds. do nothing
			// check if we need to deactivate this cell
			if (!isWithinRange(center, cellPos)) {
				grid.cells[cellId].playerId = 0;
				stateUpdate.events.push(new webmodels.Event(cellId, -1, 0, grid.cells[cellId].value));
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

				stateUpdate.events.push(new webmodels.Event(cellId, dir, newPlayerId, newValue));

				if (withinRange)
					assimilateAdjacents(nextCellPos, grid, player, center, stateUpdate);
			}
			else {
				// something is in the way
				if (nextCellValue == cellValue) {
					if (grid.cells[nextCellId].playerId < 0) {
						// map exit; let's go!
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
						stateUpdate.events.push(new webmodels.Event(cellId, dir, newPlayerId, newValue));

						if (withinRange)
							assimilateAdjacents(nextCellPos, grid, player, center, stateUpdate);
					}
				}
				else {
					// can't merge. do nothing
					// check if we need to deactivate this cell
					if (!isWithinRange(center, cellPos)) {
						grid.cells[cellId].playerId = 0;
						stateUpdate.events.push(new webmodels.Event(cellId, -1, 0, grid.cells[cellId].value));
					}
				}
			}
		}
	}
}

var assimilateAdjacents = function(cellPos, grid, player, center, stateUpdate) {
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
				stateUpdate.events.push(new webmodels.Event(adjacentId, -1, player.id, adjacentValue));
			}
		}
	}
};
exports.assimilateAdjacents = assimilateAdjacents;

var moveCell = function(cellId, nextCellId, grid, newGrid){
	var playerId = grid.cells[cellId].playerId;
	var value = grid.cells[cellId].value;

	newGrid.cells[nextCellId].playerId = playerId;
	newGrid.cells[nextCellId].value = value;
}

var getAdjacentCells = function(cellId, grid){
	var cells = [];

	return cells;
}

var getNextCellId = function(cellId, grid, dir){
	var directionVec = getDirectionEnum(dir);
	var v1 = numaric.indexToVec(cellId, grid.size);
	var v2 = v1.add(directionVec);
	var nextCellId = numaric.vecToIndex(v2, grid.size);
	return nextCellId;
}

var directions = [];
directions.push(new models.Vec2(0,-1));
directions.push(new models.Vec2(-1,0));
directions.push(new models.Vec2(0,1));
directions.push(new models.Vec2(1,0));
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
