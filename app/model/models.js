var uuid = require('uuid');
var numaric = require('../utils/numaric.js');

var Vec2 = function(x, y){
	this.x = x;
	this.y = y;

	this.debug = function(){
		console.log("("+this.x+", "+this.y+")");
	}

	this.add = function(vec){
		return new Vec2(this.x+vec.x, this.y+vec.y);
	}
}
exports.Vec2 = Vec2;

const NULL_PLAYER_ID = 0;
var Cell = function(value, playerId){
	this.value = value;
	this.playerId = playerId;

	this.debug = function(){
		console.log("ID: "+this.value+" playerId: "+this.playerId);
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

