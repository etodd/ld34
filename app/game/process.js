var models = require("../model/models.js");
var numaric = require("../utils/numaric.js");

var generateGrid = function(size){
	var grid = new models.Grid([], size);
	for (var x = 0; x < size.x; ++x){
		for (var y = 0; y < size.y; ++y){
			var cell = new models.Cell(numaric.vecToIndex(new models.Vec2(x,y), size), models.Cell.NULL_PLAYER_ID);
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
	var grid = generateGrid(new models.Vec2(50,50));
	var level1 = new models.Level().new(grid);
	levels.push(level1);

	return levels;
}
exports.loadLevels = loadLevels;

/*

*/