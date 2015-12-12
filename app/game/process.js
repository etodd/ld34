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

var updateGrid = function(level, player, dir){
	var newGrid = generateGrid(level.grid.size);
	var blocked = true;
	for (var i = 0; i < level.grid.cells.length; ++i){
		blocked = updateCell(i, player, level.grid, newGrid, dir, blocked);
	}
	level.grid = newGrid;
}
exports.updateGrid = updateGrid;

var updateCell = function(cellId, player, grid, newGrid, dir, blocked){
	var blocked = false;

	if (grid.cells[cellId].playerId == player.id){
		var nextCellId = getNextCellId(cellId, grid, dir);
		if (nextCellId < grid.size.x * grid.size.y && nextCellId >= 0 && blocked){

			if (grid.cells[nextCellId].value == 0 || grid.cells[nextCellId].playerId == player.id){ //can move because next cell is empty
				moveCell(cellId, nextCellId, grid, newGrid);
				
			} else if (grid.cells[nextCellId].value == grid.cells[cellId].value){
				
			}

		} else {
			newGrid.cells[cellId].playerId = grid.cells[cellId].playerId;
			newGrid.cells[cellId].value = grid.cells[cellId].value;
			blocked = true;
		}

	} else if (grid.cells[cellId].value != 0) {
		newGrid.cells[cellId].playerId = grid.cells[cellId].playerId;
		newGrid.cells[cellId].value = grid.cells[cellId].value;
	}
	return blocked;
}

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