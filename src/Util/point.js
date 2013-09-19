CityGL.Point = function(a,b,c){
	this.x = a;
	this.y = b;
	this.z=c;
}
CityGL.Point.prototype = { 
	constructor : CityGL.Point,
	clone: function(){
		return new CityGL.Point(this.x, this.y, this.z);
	}
}