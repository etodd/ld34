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

var ClientEvent = function(type, dir){
	this.type = type;
	this.dir = dir;
}
exports.ClientEvent = ClientEvent;
exports.ClientEvent.TYPE_MOVE_EVENT = TYPE_MOVE_EVENT;


var Event = function(cellId, dir, playerId, value){
	this.cellId = cellId;
	this.dir = dir;
	this.playerId = playerId;
	this.value = value;
}
exports.Event = Event;

var StateUpdate = function(level_id, events){
	this.level_id = level_id;
	this.type = TYPE_STATE_UPDATE;
	this.events = events;
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
