var models = require("../model/models.js");
var webmodels = require("../model/webmodels.js");
var numaric = require("../utils/numaric.js");

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
	var grid = generateGrid(new models.Vec2(16,16));
	var level1 = new models.Level().new(grid);
	levels.push(level1);

	return levels;
}
exports.loadLevels = loadLevels;

/*

*/

var updateGrid = function(level, player, dir){
	for (var i = 0; i < level.grid.cells.length; ++i){
		updateCell(i, level.grid, dir);
	}
}
exports.updateGrid = updateGrid;

var updateCell = function(cellId, grid, dir){
	getNextCellId(cellId, grid, dir);
}

var getNextCellId = function(cellId, grid, dir){
	var directionVec = getDirectionEnum(dir);
	console.log(directionVec);
	var nextCellId = grid.get(numaric.vecToIndex(numaric.indexToVec(cellId, grid.size).add(directionVec)), grid.size);
	return nextCellId;
}

/*

*/