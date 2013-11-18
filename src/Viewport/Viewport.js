CityGL.ViewPort = function(div, boundingBox, options){
	this.boundingBox  =boundingBox;
	this.EPSG = 'EPSG:28992';
	this.isAnimating = false;
	this.div = document.getElementById(div);
	this.camera = new THREE.PerspectiveCamera( 50, this.div.scrollWidth / this.div.scrollHeight, 1, 30000 );
	this.camera.position.set( 0, 150, 400 );
	this.scene = new THREE.Scene();
	this.clock = new THREE.Clock();
	this.controls = new CityGL.FlyControls( this.camera);
    this.texturedGeometries = [];
	this.colorBufferGeometry = new THREE.BufferGeometry();
	this.colorBufferGeometry.attributes = {position:{itemSize:3,array:new Float32Array(0),numItems:0},index:{itemSize:1,array:new Int16Array(0),numItems:0},uv:{itemSize:2,array:new Float32Array(0),numItems:0},normal:{itemSize:3,array:new Float32Array(0),numItems:0},color:{itemSize:3,array:new Float32Array(0),numItems:0}};
	this.colorGeometry = new THREE.Geometry();
	this.controls.movementSpeed = 50;
	this.controls.domElement = this.div;
	this.controls.rollSpeed = Math.PI / 24;
	this.controls.autoForward = false;
	this.controls.dragToLook = true;
	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 0, 1 );
	this.scene.add( light );
	this.layers = [];
	this.objects = new THREE.Object3D();
	this.scene.add(this.objects);
	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setSize( this.div.scrollWidth , this.div.scrollHeight );
	this.div.appendChild( this.renderer.domElement );
	this.stats = new Stats();
	this.stats.domElement.style.position = 'absolute';
	this.stats.domElement.style.top = '0px';
	this.div.appendChild( this.stats.domElement );
	this.onResize = function () {	var windowHalfX = div.scrollWidth / 2;var windowHalfY = div.scrollHeight / 2;	this.camera.aspect =div.scrollWidth  / div.scrollHeight;		this.camera.updateProjectionMatrix();			this.renderer.setSize( div.scrollWidth,div.scrollHeight );			}
	this.div.addEventListener( 'resize', this.onResize, false );
	this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1.25 );
	this.hemiLight.color.setHSL( 0.6, 1, 0.75 );
	this.hemiLight.groundColor.setHSL( 0.1, 0.8, 0.7 );
	this.scene.add( this.hemiLight );
    this.skyDome = this.CreateSkyDome();
	this.scene.add(this.skyDome );
	
	this.setValues(options);
}
CityGL.ViewPort.prototype = {
	constructor : CityGL.ViewPort,
	GetSize: function(){
		return {width: this.div.scrollHeight, height: this.div.scrollHeight};
	},
	MoveTo: function(p,l){
		p = this.WorldToViewPort(p);
		l = this.WorldToViewPort(l);
		this.camera.up.z= 1;
		this.camera.up.y= 0;
		this.camera.position = new THREE.Vector3( p.x, p.y, p.z );
		this.camera.lookAt( new THREE.Vector3( l.x, l.y, l.z ));
	},
	FlyTo: function(p, t){
		p = this.WorldToViewPort(p);
		this.camera.up.z= 1;
		this.camera.up.y= 0;
		var self = this;
		var spline =  new THREE.SplineCurve3([this.camera.position.clone(),new THREE.Vector3(p.x,p.y,p.z)]);
		var tube  =new THREE.TubeGeometry(spline, 50, 2, 3, true, false);
		var tubeMesh = THREE.SceneUtils.createMultiMaterialObject( tube, [
				new THREE.MeshLambertMaterial({
					color: 0xff00ff,
					opacity: geometry.debug ? 0.2 : 0.8,
					transparent: true
				}),
				new THREE.MeshBasicMaterial({
					color: 0x000000,
					opacity: 0.5,
					wireframe: true
			})]);
		this.scene.add(tubeMesh);
		var flyControl = {
			tempcontrol : self.controls,
			starttime: Date.now(),
			update: function(){
				if(Date.now()- this.starttime <t){
					var a = (Date.now() - this.starttime) / t;
					var pos = tube.path.getPointAt( a );
					self.camera.position = pos;
					var lookAt = tube.path.getPointAt( ( a + 30 / tube.path.getLength() ) % 1 );
					self.camera.lookAt(lookAt);
					self.camera.rotation.setEulerFromRotationMatrix( self.camera.matrix, self.camera.eulerOrder );
				}
				else{
					this.onfinish();
				}
			},
			onfinish: function(){
				self.controls = this.tempcontrol;
			}
		}
		this.controls = flyControl;
	},
	AddLayer: function(layer){
		layer.setViewport(this);
		var object3ds = layer.GetObject3Ds(false);
		for (var i = 0; i< object3ds.length; i++){
			this.objects.add(object3ds[i]);
		}	
		this.layers.push(layer);
		
	},
	/*
	UpdateLayer: function(layer){
		var obj = this.objects.getObjectByName(layer.name);
		this.objects.remove(obj);
		
		
	},*/
	GetLayerByName: function(name){
		for (var i = 0; i< this.layers.length; i++){
			if (this.layers[i].name == name){return this.layers[i];}
		}
	},	
	Animate: function(){
		var self = this;
		var f = function (){
			self.Animate();
		}
		if(this.isAnimating){
			requestAnimationFrame( function(){
				f();
			} );
			this.controls.update( this.clock.getDelta() );
			this.renderer.render( this.scene, this.camera );
			this.stats.update();
		}
	},
	StartAnimating: function(){
		if(!this.isAnimating){
			this.isAnimating = true;
			this.Animate();
			}		
	},
	StopAnimating: function(){
		this.isAnimating = false;
	},
	Object3DToViewPort: function(object3d){
		if (object3d instanceof THREE.Mesh){ this.MeshToViewPort(object3d);}
		else
		{
			for (var i = 0; i< object3d.children.length; i++){
				var c = object3d.children[i]
				if (c instanceof THREE.Mesh){
					this.MeshToViewPort(object3d.children[i]);
				}
				else{
					this.Object3DToViewPort(object3d.children[i]);
				}
			}
		}		
	},
	MeshToViewPort: function(mesh){
		var g = mesh.geometry;
		if (g instanceof THREE.BufferGeometry ){
			for (var i = 0; i< g.attributes.position.array.length; i++){
				var p = this.WorldToViewPort({x:g.attributes.position.array[i],y:g.attributes.position.array[i+1],z:g.attributes.position.array[i+2]});
				g.attributes.position.array[i] = p.x;i++;
				g.attributes.position.array[i] = p.y;i++;
				g.attributes.position.array[i] = p.z;
			}			
		}
		else{
			for(var i = 0; i< mesh.geometry.vertices.length; i++){
					mesh.geometry.vertices[i] = this.WorldToViewPort(mesh.geometry.vertices[i] );
			}
		}
	},
	WorldToViewPort: function(p){
		var precision = .1; //metric system 
		var xDist = p.x - this.boundingBox.lowerLeft.x - (this.boundingBox.upperRight.x - this.boundingBox.lowerLeft.x) / 2;
		var yDist = p.y - this.boundingBox.lowerLeft.y - (this.boundingBox.upperRight.y - this.boundingBox.lowerLeft.y) / 2;
		var zDist = p.z - this.boundingBox.lowerLeft.z;
		p.x =  xDist/precision;
		p.y = yDist/precision;
		p.z = zDist/precision;
		return p;
	},
	FloatArrayWorldToViewPort: function(a){
		var precision = .1; //metric system 
		var xTotal = this.boundingBox.upperRight.x - this.boundingBox.lowerLeft.x;
		var yTotal = this.boundingBox.upperRight.y - this.boundingBox.lowerLeft.y;
		var zTotal = this.boundingBox.upperRight.z - this.boundingBox.lowerLeft.z;
		var p = new Float32Array(a.length);
		for (var i = 0; i< p.length; i+=3){
			p.set([(a[i] - this.boundingBox.lowerLeft.x -  xTotal / 2)/precision,(a[i+1] - this.boundingBox.lowerLeft.y -  yTotal / 2)/precision,(a[i+2] - this.boundingBox.lowerLeft.z)/precision],i);
		}
		return p;
	},
	setValues: function ( values ) {
		if ( values === undefined ) return;
		for ( var key in values ) {
			var newValue = values[ key ];
			if ( newValue === undefined ) {				
				continue;
			}
			if ( key in this ) {
			this[ key ] = newValue;
			}
		}
	},
	CreateSkyDome: function (){
		//copied from three.js example mrdoob
		var fragmentShader = 'uniform vec3 topColor;uniform vec3 bottomColor;uniform float offset;uniform float exponent;varying vec3 vWorldPosition;void main() {float h = normalize( vWorldPosition + offset ).z;gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );}';
		var vertexShader = 'varying vec3 vWorldPosition;void main() {vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vWorldPosition = worldPosition.xyz;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}';
		var uniforms = {
			topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) },
			bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
			offset:		 { type: "f", value: 400 },
			exponent:	 { type: "f", value: 0.6 }
		}
		uniforms.topColor.value.copy( this.hemiLight.color );
		var skyGeo = new THREE.SphereGeometry( 20000, 32, 15 );
	
		//var skyGeo  = this.CreateSphereGeometry( 10000, 32, 15 );
		var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
		var sky = new THREE.Mesh( skyGeo, skyMat );
		return sky;
	}
	
}