var models = require("../model/models.js");

var vecToIndex = function(vec, size){
	return (vec.y * size.x) + vec.x;
}
exports.vecToIndex = vecToIndex

var indexToVec = function(index, size){
	var y = index / size.x;
	var x = index - (y * size.x);
	return new models.Vec2(x,y);
}
exports.indexToVec = indexToVec;