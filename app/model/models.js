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
	this.value = null;

	this.new = function(position, value){
		this.id = uuid.v1();
		this.position = position;
		this.value = value;
		return this;
	}

	this.debug = function(){
		console.log("Entity");
		console.log(this.id);
		this.position.debug();
	}
}
exports.Entity = Entity;

var Player = function(){
	this.entity = null;
	this.userName = null;

	this.new = function(userName, entity){
		this.userName = userName;
		this.entity = entity;
		return this;
	}

	this.debug = function(){
		console.log("Player");
		console.log(this.userName);
		this.entity.debug();
	}
}

var Level = function(){
	this.entities = [];

	this.new = function(bitmap){
		//TODO
		return this;
	}
}

/*
	Test
*/

