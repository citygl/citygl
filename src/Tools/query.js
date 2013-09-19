CityGL.Query = function(viewport){	
	this.objects = [];
	this.viewport = viewport;
	this.object3d = new THREE.Object3D();
	this.layers = [];
	this.pickingScene = new THREE.Scene();
	this.pickingScene.add( this.object3d);
	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setClearColor(0xffffff);
	this.renderer.sortObjects = false;
	this.objectsToLayer = [];
}
CityGL.Query.prototype = { 
	constructor : CityGL.Query,
	AddLayer: function(layer){
		//test whether layer exists
		for (var i = 0; i< this.layers.length; i++){
			if (layers[i] == layer.name){
				throw "layer already exists in Query";
			}
		}
		this.layers.push(layer.name);
		var object3ds = layer.GetObject3Ds(true);
		for (var i = 0; i< object3ds.length; i++){
			this.object3d.add(object3ds[i]);
		}
		var idsFromLayer = layer.GetIDs();
		for (var i = 0; i< idsFromLayer.length; i++){
			this.objectsToLayer[idsFromLayer[i]] = layer.name;
		}
	},
	Query: function (x,y){
		var size = this.viewport.GetSize();
		var pickingTexture = new THREE.WebGLRenderTarget( size.width, size.height );
		pickingTexture.generateMipmaps = false;
		this.renderer.setSize( size.width, size.height );		
		this.renderer.render(this.pickingScene, this.viewport.camera, pickingTexture );
		var gl = this.renderer.getContext();
		var pixelBuffer = new Uint8Array( 4 );
		gl.readPixels( x, pickingTexture.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer );
		var debugBuffer = new Uint8Array( 4 * size.width* size.height );
		gl.readPixels( 0, 0, size.width, size.height, gl.RGBA, gl.UNSIGNED_BYTE, debugBuffer );
		var id = ( pixelBuffer[0] << 16 ) | ( pixelBuffer[1] << 8 ) | ( pixelBuffer[2] );
		var layername = this.objectsToLayer[id];
		var layer = this.viewport.GetLayerByName(layername);
		if (layer != undefined){
			return layer.objects.getObjectById(id,true);
		}
	},
	ProcessObject3D: function(o, layer){
		if (o instanceof THREE.Mesh){
			var id= this.objects.length;		
			var color = new THREE.Color(id);
			var name = o.name;
			if (o.geometry instanceof THREE.Geometry){
				var material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide });
				var mesh = new THREE.Mesh( o.geometry, material );
				this.object3d.add(mesh);
			}
			else if (o.geometry instanceof THREE.BufferGeometry){
				var r = color.r; var b = color.b; var g = color.g;
				for (var i = 0; i< o.geometry.attributes.color.array.length; i+=3){
					o.geometry.attributes.color.array[i] = r;o.geometry.attributes.color.array[i+1] = g;o.geometry.attributes.color.array[i+2] = b;
				}
				var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.VertexColors} );
				var mesh = new THREE.Mesh( o.geometry, material );
				this.object3d.add(mesh);
			}
			var qo = new CityGL.QueryObject(name, layer);
			this.objects[id] = qo;
		}
		else if (o instanceof THREE.Object3D){
			for(var i = 0; i< o.children.length; i++){
				this.ProcessObject3D(o.children[i]);
			}
		}
	}
}
CityGL.QueryObject = function(id, layer){
	this.id = id;
	this.layer = layer;
}
CityGL.QueryObject.prototype = { 
	constructor : CityGL.QueryObject
}