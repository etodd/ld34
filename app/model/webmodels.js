
var Client = function(ws){
	this.ws = ws;

	this.debug = function(){
		console.log("debug");
	}
}
exports.Client = Client;