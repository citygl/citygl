CityGL.OpenStreetMap = function(options){	
	CityGL.Layer.apply(this, arguments);
	this.type = '.png';
	this.tilemerge = 1;
	this.zoomlevel = 18;
	this.res = 0.597164283;
	this.tileSize = 256;
	this.maxExtent = new CityGL.BoundingBox(new CityGL.Point(-20037508.34,-20037508.34,0),new CityGL.Point(20037508.34,20037508.34,0));		
	this.textureCompressionService = null;
	this.setValues(options);
}
CityGL.OpenStreetMap.prototype = new CityGL.Layer();
CityGL.OpenStreetMap.prototype.constructor = CityGL.OpenStreetMap;
CityGL.OpenStreetMap.prototype.GetObject3Ds = function(){
	var epsg = this.viewport.EPSG;
	var extent =this.viewport.boundingBox;
	var obj3D = new THREE.Object3D();
	var sourceEPSG = 'EPSG:900913';
	var osmurl = 'http://a.tile.openstreetmap.org/';
	var mergeMesh = new THREE.Mesh();
	var mesh = new THREE.Mesh();
	var needsReprojection = epsg != this.sourceEPSG;
	var source = new Proj4js.Proj(epsg);    
	var dest= new Proj4js.Proj(sourceEPSG);
	var sourceExtent = extent;
	if (needsReprojection){ 
		var ll = new Proj4js.Point(extent.lowerLeft.x, extent.lowerLeft.y);	
		Proj4js.transform(source, dest, ll);
		var ur = new Proj4js.Point(extent.upperRight.x, extent.upperRight.y);
		Proj4js.transform(source, dest, ur);
		sourceExtent = new CityGL.BoundingBox(new CityGL.Point(ll.x, ll.y,0),new CityGL.Point( ur.x, ur.y,0));
	}
	var x = Math.round ((sourceExtent.lowerLeft.x - this.maxExtent.lowerLeft.x) / (this.res * this.tileSize));
	var y = Math.round ((this.maxExtent.upperRight.y - sourceExtent.upperRight.y) / (this.res * this.tileSize));
	var originx =this.maxExtent.lowerLeft.x+ x * this.res * this.tileSize;
	var originy = this.maxExtent.upperRight.y- y * this.res * this.tileSize;
	var xgrid = [];
	var ygrid = [];
	var materialArray = [];
	for (var i = originx; i< sourceExtent.upperRight.x; i+=this.res*this.tileSize*this.tilemerge ){ xgrid.push(i);}
	for (var i = originy; i>sourceExtent.lowerLeft.y; i-=this.res*this.tileSize*this.tilemerge ){ygrid.push(i);}
	
	for (var i = 0; i< (xgrid.length); i++){
		for (var j = 0; j< (ygrid.length); j++){
		var xloc = Math.round ((xgrid[i] - this.maxExtent.lowerLeft.x) / (this.res * this.tileSize));
			var yloc = Math.round ((this.maxExtent.upperRight.y - ygrid[j]) / (this.res * this.tileSize));
			var vertices = [{x: xgrid[i], y: ygrid[j] - this.res * this.tileSize*this.tilemerge }, {x:xgrid[i] + this.res * this.tileSize*this.tilemerge , y: ygrid[j] - this.res * this.tileSize*this.tilemerge }, {x: xgrid[i]+this.res * this.tileSize*this.tilemerge ,y: ygrid[j]},{x: xgrid[i], y: ygrid[j]} ];
			var vertArray = [];
			for (var k = 0; k< vertices.length; k++){ 
				Proj4js.transform(dest, source, vertices[k]);
			}
			
			var tile = new CityGL.Tile(vertices);
			
			
			var geometry= tile.getGeometry(this.viewport);
			var urlarray = [];
			for (var k = this.tilemerge-1; k>=0 ; k--){
				for (var l =0; l< this.tilemerge ; l++){
					var tilelocx = Math.round ((xgrid[i]+l*this.res*this.tileSize - (this.maxExtent.lowerLeft.x)) / (this.res * this.tileSize));
					var tilelocy = Math.round ((this.maxExtent.upperRight.y - (ygrid[j]-k*this.res*this.tileSize)) / (this.res * this.tileSize));
					var xyzpath = this.zoomlevel + "/" + tilelocx + "/" + tilelocy + ".png";
					var url = osmurl + xyzpath;
					urlarray.push(url);
				}
			}
			var texture;
			if (this.tilemerge >1 && this.textureCompressionService != null){
				var enc = this.textureCompressionService.getCompressedTextureUrl(urlarray, 1)
				//var urlstring = JSON.stringify({ UrlArray:urlarray ,resize : 1} );
				//var requesturl = this.imageCompressionService+ "images=" + urlstring;
				//var enc = encodeURI(requesturl);
				texture = THREE.ImageUtils.loadCompressedTexture( enc );				
			}
			else{
				texture = THREE.ImageUtils.loadTexture(urlarray[0]);
			}
			var tMaterial	= new THREE.MeshBasicMaterial({
				color	: 0xffffff,
				map	: texture
			});
		
			tMaterial.side = THREE.DoubleSide;
			var mesh	= new THREE.Mesh(geometry, tMaterial);
			obj3D.children.push(mesh);
			
			
		}
	}
	return [obj3D];	
}
