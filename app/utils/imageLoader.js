var getPixels = require("get-pixels")

var Pixel = function(r,g,b,a){
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
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

var img = new ImageLoader("test.png");