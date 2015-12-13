var getPixels = require("get-pixels")

const STAIR_CONNECTOR = -2;
const OBSTICLE = -3;
const VERT_LINES = -4;
const ROCKS = -5;
const TREES = -6;
const SPAWN_LOCATION = -7;
const RANDOM_SPAWN = 2;
var Pixel = function(r,g,b,a){
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;

	this.getType = function(){
		if (this.r == 0 && this.g == 0 && this.b == 0){
			return STAIR_CONNECTOR;

		} else if (this.r == 255 && this.g == 255 && this.b == 255){
			return OBSTICLE;

		} else if (this.r == 255 && this.g == 0 && this.b == 246){
			return VERT_LINES;

		} else if (this.r == 255 && this.g == 0 && this.b == 0){
			return ROCKS;

		} else if (this.r == 30 && this.g == 255 && this.b == 0){
			return TREES;

		} else if (this.r == 0 && this.g == 54 && this.b == 255){
			return SPAWN_LOCATION;

		} else if (this.r == 0 && this.g == 54 && this.b == 255){
			return RANDOM_SPAWN;

		} else {
			return RANDOM_SPAWN;
		}
	}
}

var ImageLoader = function(filename){
	this.data = [];
	this.width = 0;
	this.height = 0;

	var that = this;
	getPixels(filename, function(err, pixels) {
  		if(err) {
    		console.log("Error reading image");
    		return;
  		}
  		for (var i = 0; i < pixels.data.length; i += 4){
			var r = pixels.data[i];
			var g = pixels.data[i+1];
			var b = pixels.data[i+2];
			var a = pixels.data[i+3];
			that.data.push(new Pixel(r,g,b,a));
		}
		that.width = pixels.shape[0];
		that.height = pixels.shape[1];
	});
}
exports.ImageLoader = ImageLoader;