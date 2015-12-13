var getPixels = require("get-pixels")

const STAIR_CONNECTOR = -1;
const OBSTICLE = -2;
const VERT_LINES = -3;
const ROCKS = -4;
const TREES = -5;
const SPAWN_LOCATION = -6;
const RANDOM_SPAWN = -7;
var Pixel = function(r,g,b,a){
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}

Pixel.prototype.getType = function(){
	if (this.a == 0)
		return 0;

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
		return 0;
	}
};

var loadImage = function(filename, callback) {
	getPixels(filename, function(err, pixels) {
  		if (err) {
    		console.log('Error reading image ' + filename);
    		return;
  		}
  		var result = {
  			data: [],
  			width: pixels.shape[0],
  			height: pixels.shape[1],
  		};
  		for (var i = 0; i < pixels.data.length; i += 4){
			var r = pixels.data[i];
			var g = pixels.data[i+1];
			var b = pixels.data[i+2];
			var a = pixels.data[i+3];
			result.data.push(new Pixel(r,g,b,a));
		}
		callback(result);
	});
}
exports.loadImage = loadImage;
