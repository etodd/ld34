var webmodels = require("../model/webmodels.js");
var process = require("./process.js");

var Game = function(){
	this.clients = [];

	this.handleClientConnect = function(ws){
		var client = new webmodels.Client(ws);
		this.clients.push(client);
		console.log("opened Client amnt: " + this.clients.length);
	}

	this.handleClientClose = function(ws){
		this.removeClientWithWS(ws);
		console.log("closed Client amnt: " + this.clients.length);
	}

	this.handleClientEvent = function(ws, event){
		var client = this.clients[this.getClientIndexWithWS(ws)];
		if (event.type == webmodels.ClientEvent.TYPE_MOVE_EVENT){
			console.log("client move event");
		}
		this.sendStateUpdate(new webmodels.StateUpdate("hi"));
	}

	this.update = function(){

	}



	this.removeClientWithWS = function(ws){
		this.clients.splice(this.getClientIndexWithWS(ws),1);
	}

	this.getClientIndexWithWS = function(ws){
		for (var i = 0; i < this.clients.length; ++i){
			if (ws == this.clients[i].ws){ 
				return i;
			}
		}
		console.error("Error: client index not found");
		return -1;
	}

	this.sendStateUpdate = function(stateUpdate){
		var stateUpdateStr = JSON.stringify(stateUpdate);
		for (var i = 0; i < this.clients.length; ++i){
			this.clients[i].ws.send(stateUpdateStr);
		}
	}
}
exports.Game = Game;