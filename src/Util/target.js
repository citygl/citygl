CityGL.Target = function(uri){
	this.uri = uri;
	this.textureCoordinates = [];
}
CityGL.Target.prototype = { 
	constructor : CityGL.Target,
	clone: function(){
		var c = new CityGL.Target(this.uri);
		for(var i = 0; i< this.textureCoordinates.length; i++){
			c.textureCoordinates[i] = this.textureCoordinates[i];
		}
		return c;
	}
}