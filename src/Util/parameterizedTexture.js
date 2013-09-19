CityGL.ParameterizedTexture = function(url){
	this.targets = [];
	this.url = url;
	
}
CityGL.ParameterizedTexture.prototype = { 
	constructor : CityGL.ParameterizedTexture,
	clone: function(){
		var c = new CityGL.ParameterizedTexture(this.url);
		for(var i = 0; i< this.targets.length; i++){
			c.targets[i] = this.targets[i].clone();
		}
		return c;
	},
	getMaterial: function(){		
		var texture = THREE.ImageUtils.loadTexture( this.url);
		var material = new THREE.MeshBasicMaterial( { map: texture, vertexColors: new THREE.Color( 0xffffff ) } );
		material.side = THREE.DoubleSide;
		material.url = this.url;
		material.targets = this.targets;
		return material;
	},
	getCompressedMaterial: function(resize, textureCompressionService){
		//var urlstring = JSON.stringify({ UrlArray:[this.url.replace("\\","/")], resize:resize } );
		//var requesturl = serviceUrl +'images='+ urlstring;
		//var enc = encodeURI(requesturl);
		var enc = textureCompressionService.getCompressedTextureUrl([this.url], resize);
		var texture = THREE.ImageUtils.loadCompressedTexture( enc );
		var material = new THREE.MeshBasicMaterial( { map: texture, vertexColors: new THREE.Color( 0xffffff ) } );
		material.side = THREE.DoubleSide;
		material.url = this.url;
		material.targets = this.targets;
		return material;
	}
}