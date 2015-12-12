var PNG = require('png-js');

var Pixel = function(r, g, b, a){
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;

	this.debug = function(){
		console.log("("+this.r+","+this.g+","+this.b+","+this.a+")");
	}
}

var PNGImage = function(filename){
	this.img = new PNG(filename);
	this.width = img.width;
	this.height = img.height;
	this.bitmap = [];

	this.img.decode(function(pixels) {
    	for (var i = 0; i < pixels.length; ++i){
    		this.bitmap.push(new Pixel(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]));
    	}
	});

	this.debug = function(){
		for (var i = 0; i < this.bitmap.length; ++i){
			this.pixels[i].debug();
		}
	}
}

var image = new PNGImage("test2.png");
//image.debug();