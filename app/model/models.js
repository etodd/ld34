var uuid = require('uuid');

var Vec2 = function(x, y){
	this.x = x;
	this.y = y;

	this.debug = function(){
		console.log("("+this.x+", "+this.y+")");
	}
}
exports.Vec2 = Vec2;

const NULL_PLAYER_ID = 0;
var Cell = function(id, playerId){
	this.id = id;
	this.playerId = playerId;

	this.debug = function(){
		console.log("ID: "+this.id+" playerId: "+this.playerId);
	}
}
exports.Cell = Cell;
exports.Cell.NULL_PLAYER_ID = NULL_PLAYER_ID;

var Player = function(){
	this.id = null;
	this.currentLevelIndex = 0;

	this.new = function(id, levelIndex){
		this.id = id;
		this.levelIndex = levelIndex;
		return this;
	}

	this.debug = function(){
		console.log("Player");
		console.log(this.userName);
		this.entity.debug();
	}
}
exports.Player = Player;

var Grid = function(cells, size){
	this.size = size;
	this.cells = cells;

	this.debug = function(){
		for (var i = 0; i < this.cells.length; ++i){
			this.cells[i].debug();
		}
	}
}
exports.Grid = Grid;

var Level = function(){
	this.id = null;
	this.grid = null;

	this.new = function(initalGrid){
		this.id = uuid.v1();
		this.grid = initalGrid;
		return this;
	}

	this.debug = function(){
		this.grid.debug();
	}
}
exports.Level = Level;

/*
	Test
*/

