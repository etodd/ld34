var models = require("./models.js");

var Client = function(ws, player){
	this.ws = ws;
	this.player = player;
}
exports.Client = Client;


/*
	Messages to client
*/
const TYPE_MOVE_EVENT = "moveEvent";
const TYPE_INIT_STATE = "initState";
const TYPE_STATE_UPDATE = "stateUpdate";

var ClientEvent = function(type){
	this.type = type;
}
exports.ClientEvent = ClientEvent;
exports.ClientEvent.TYPE_MOVE_EVENT = TYPE_MOVE_EVENT;



var StateUpdate = function(pos){
	this.type = TYPE_STATE_UPDATE;
	this.pos = pos;
}
exports.StateUpdate = StateUpdate;
exports.StateUpdate.TYPE_STATE_UPDATE = TYPE_STATE_UPDATE;


var State = function(level, player){
	this.type = TYPE_INIT_STATE;
	this.level = level;
	this.player = player;
}
exports.State = State;
exports.State.TYPE_INIT_STATE = TYPE_INIT_STATE;