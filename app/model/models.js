var uuid = require('uuid');

var Vec2 = function(x, y){
	this.x = x;
	this.y = y;

	this.debug = function(){
		console.log("("+this.x+", "+this.y+")");
	}
}
exports.Vec2 = Vec2;

var Entity = function(){
	this.id = null;
	this.position = null;
	this.type = null;

	this.new = function(position, type){
		this.id = uuid.v1();
		this.position = position;
		this.type = type;
		return this;
	}

	this.debug = function(){
		console.log("Entity");
		console.log(this.id);
		this.position.debug();
	}
}
exports.Entity = Entity;

/*
	Test
*/

