var uuid = require('uuid');
var numaric = require('../utils/numaric.js');

var Vec2 = function(x, y){
	if (typeof x === 'undefined')
		this.x = this.y = 0;
	else {
		this.x = x;
		this.y = y;
	}
}
exports.Vec2 = Vec2;
Vec2.prototype.debug = function(){
	console.log("("+this.x+", "+this.y+")");
}

Vec2.prototype.add = function(vec){
	return new Vec2(this.x+vec.x, this.y+vec.y);
}

Vec2.prototype.get = function(dir, size){
	switch (dir){
		case 0:
			return (size.y - 1) - this.y;
		case 1:
			return (size.x - 1) - this.x;
		case 2:
			return this.y;
		case 3:
			return this.x;
	}
};

Vec2.prototype.set = function(dir, size, value){
	switch (dir){
		case 0:
			this.y = (size.y - 1) - value;
			break;
		case 1:
			this.x = (size.x - 1) - value;
			break;
		case 2:
			this.y = value;
			break;
		case 3:
			this.x = value;
			break;
	}
};

const NULL_PLAYER_ID = 0;
var Cell = function(value, playerId){
	this.value = value;
	this.playerId = playerId;
}
Cell.prototype.debug = function(){
	console.log("ID: "+this.value+" playerId: "+this.playerId);
}
exports.Cell = Cell;
exports.Cell.NULL_PLAYER_ID = NULL_PLAYER_ID;

var Player = function(){
	this.id = null;
	this.currentLevelIndex = 0;
	this.highestValue = 1;
}
Player.prototype.new = function(id){
	this.id = id;
	return this;
}
Player.prototype.debug = function(){
	console.log("Player");
	console.log(this.userName);
	this.entity.debug();
}
exports.Player = Player;

var Grid = function(cells, size){
	this.size = size;
	this.cells = cells;
}
Grid.prototype.stats = function() {
	var result = { totalPlayable: 0, filled: 0 };
	for (var j = 0; j < this.cells.length; j++) {
		var value = this.cells[j].value;
		if (value > 0)
			result.filled++;
		if (value >= 0)
			result.totalPlayable++;
	}
	return result;
};
Grid.prototype.debug = function(){
	for (var y = this.size.y - 1; y >= 0; --y){
		var line = "";
		for (var x = 0; x < this.size.x; ++x){
			var i = numaric.vecToIndex(new Vec2(x,y), this.size);
			line += this.cells[i].value + " ";
		}
		console.log(line);
	}
}
exports.Grid = Grid;

var Level = function(){
	this.difficulty = 0; //numaric aka 0(lvl1), 1(lvl2), 2(lcl3)
	this.maxPlayers = 1;
	this.grid = null;
}
Level.prototype.new = function(initalGrid, difficulty, maxPlayersPer){
	this.difficulty = difficulty;
	this.grid = initalGrid;
	this.maxPlayers = maxPlayersPer;
	return this;
}
Level.prototype.debug = function(){
	this.grid.debug();
}
exports.Level = Level;
