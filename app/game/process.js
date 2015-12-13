var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var numaric = require("../utils/numaric.js");
var deepcopy = require('deepcopy');

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

/*

*/

var loadLevels = function(){
	var levels = [];
	//TODO load from some file
	var grid = generateGrid(new models.Vec2(8,8));
	var level1 = new models.Level().new(grid);
	levels.push(level1);

	return levels;
}
exports.loadLevels = loadLevels;

/*

*/

var updateGrid = function(level, player, dir, stateUpdate){
	var u_dir = getReverse(dir);
	var v_dir = getPerpendicular(u_dir);
	for (var u = 0; u < Math.abs(level.grid.size.get(getPositiveDir(u_dir), level.grid.size)); ++u){
		for (var v = 0; v < Math.abs(level.grid.size.get(getPositiveDir(v_dir), level.grid.size)); ++v){
			var p = new models.Vec2();
			p.set(u_dir, level.grid.size, u);
			p.set(v_dir, level.grid.size, v);
			updateCell(p, player, level.grid, dir, stateUpdate);
		}
	}
}
exports.updateGrid = updateGrid;

var updateCell = function(cellPos, player, grid, dir, stateUpdate){
	var cellId = numaric.vecToIndex(cellPos, grid.size);
	if (grid.cells[cellId].playerId === player.id){
		var nextCellPos = cellPos.add(getDirectionEnum(dir));
		if (nextCellPos.x < 0 || nextCellPos.x >= grid.size.x || nextCellPos.y < 0 || nextCellPos.y >= grid.size.y) {
			// out of bounds. do nothing
		}
		else{
			var nextCellId = numaric.vecToIndex(nextCellPos, grid.size);
			var cellValue = grid.cells[cellId].value;
			var nextCellValue = grid.cells[nextCellId].value;
			if (nextCellValue > 0) {
				// something is in the way
				if (nextCellValue == cellValue) {
					// merge into
					var newValue = cellValue + 1;
					grid.cells[nextCellId].value = newValue;
					grid.cells[nextCellId].playerId = player.id;
					grid.cells[cellId].value = 0;
					grid.cells[cellId].playerId = 0;
					stateUpdate.events.push(new webmodels.Event(cellId, dir, player.id, newValue));

					assimilateAdjacents(nextCellPos, grid, player, stateUpdate);
				}
				else {
					// can't merge. do nothing
				}
			}
			else {
				// nothing in the way. move there
				grid.cells[nextCellId].value = cellValue;
				grid.cells[nextCellId].playerId = player.id;

				grid.cells[cellId].value = 0;
				grid.cells[cellId].playerId = 0;

				stateUpdate.events.push(new webmodels.Event(cellId, dir, player.id, cellValue));

				assimilateAdjacents(nextCellPos, grid, player, stateUpdate);
			}
		}
	}
}

var assimilateAdjacents = function(cellPos, grid, player, stateUpdate) {
	for (var i = 0; i < directions.length; i++) {
		var adjacent = cellPos.add(directions[i]);
		if (adjacent.x >= 0 && adjacent.x < grid.size.x && adjacent.y >= 0 && adjacent.y < grid.size.y) {
			var adjacentId = numaric.vecToIndex(adjacent, grid.size);
			var adjacentValue = grid.cells[adjacentId].value;
			if (grid.cells[adjacentId].playerId === 0
				&& adjacentValue > 0) {
				// pick up adjacent cell
				grid.cells[adjacentId].playerId = player.id;
				stateUpdate.events.push(new webmodels.Event(adjacentId, -1, player.id, adjacentValue));
			}
		}
	}
};

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
