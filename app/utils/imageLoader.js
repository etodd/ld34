var getPixels = require("get-pixels")

const OBSTACLE = -1;

var Pixel = function(r,g,b,a){
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}

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
