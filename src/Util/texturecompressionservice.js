CityGL.TextureCompressionService = function(url){
	this.url = url;
}
CityGL.TextureCompressionService.prototype = { 
	constructor : CityGL.TextureCompressionService,
	getCompressedTextureUrl: function(array, resize){
		var urlArray = [];
		for (var i =0; i< array.length; i++){
			urlArray[i] = array[i].replace("\\","/");
		}
		var urlstring = JSON.stringify({ UrlArray:urlArray, resize:resize } );
		var requesturl = this.url +'images='+ escape(urlstring);
		return requesturl;
	}	
}