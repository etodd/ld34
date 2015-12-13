var getPixels = require("get-pixels")

const STAIR_CONNECTOR_LVL_1 = -2;
const STAIR_CONNECTOR_LVL_2 = -3;
//ect...
const OBSTICLE = -1;
var Pixel = function(r,g,b,a){
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}

Pixel.prototype.getType = function(){
	if (this.a == 0)
		return 0;

	if (this.r == 255 && this.g == 255 && this.b == 255){
		return OBSTICLE;

	} else {
		return STAIR_CONNECTOR_LVL_1;
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
