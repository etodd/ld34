
var Client = function(ws){
	this.ws = ws;

	this.debug = function(){
		console.log("debug");
	}
}
exports.Client = Client;

const TYPE_MOVE_EVENT = "moveEvent";
var ClientEvent = function(type){
	this.type = type;
}
exports.ClientEvent = ClientEvent;
exports.ClientEvent.TYPE_MOVE_EVENT = TYPE_MOVE_EVENT;

var StateUpdate = function(pos){
	this.pos = pos;
}
exports.StateUpdate = StateUpdate;