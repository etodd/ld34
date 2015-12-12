var webmodels = require("../model/webmodels.js");

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

	this.handleClientEvent = function(ws, data){
		var client = this.clients[this.getClientIndexWithWS(ws)];
		console.log("client Event: " + data);
	}



	this.removeClientWithWS = function(ws){
		var clientIndex = this.getClientIndexWithWS(ws);
		if (clientIndex != -1){
			this.clients.splice(clientIndex,1);
		} else {
			console.log("ERROR: client did not exit in this game");
		}
	}

	this.getClientIndexWithWS = function(ws){
		for (var i = 0; i < this.clients.length; ++i){
			if (ws == this.clients[i].ws){
				return i;
			}
		}
		return -1;
	}
}
exports.Game = Game;