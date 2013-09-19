CityGL.GML = function(doc){
	this.doc = doc;
	this.gml = 'http://www.opengis.net/gml';
	this.zOffset = .01;
}
CityGL.GML.prototype = {
	constructor : CityGL.GML,
	Read: function(){
		
	},	
	ParseExtent: function(element){
		var boundedby = element.getElementsByTagNameNS(this.gml, 'boundedBy');
		var envelope = boundedby[0].getElementsByTagNameNS(this.gml, 'Envelope');
		var srs = envelope[0].attributes.getNamedItem('srsName').value;
		var dims = envelope[0].attributes.getNamedItem('srsDimension').value;
		var extent = [];
		var lowerCorner = this.ParsePos(envelope[0].getElementsByTagNameNS(this.gml, 'lowerCorner')[0]);
		var upperCorner = this.ParsePos(envelope[0].getElementsByTagNameNS(this.gml, 'upperCorner')[0]);
		return {SRS: srs, lowerCorner: lowerCorner, upperCorner: upperCorner};
	},
	ParseMultiSurface: function(multisurface, materials){
		var dims = multisurface.hasAttribute('srsDimension') ? parseInt(multisurface.attributes.getNamedItem('srsDimension').value):3;
		var object3ds = [];
		var surfaces = multisurface.getElementsByTagNameNS(this.gml, 'surfaceMember');
		for (var i = 0; i< surfaces.length; i++){
			var polygons = surfaces[i].getElementsByTagNameNS(this.gml,'Polygon');
			for (var j =0; j<polygons.length;j++){
				var g = this.ParsePolygon(polygons[j], materials);
				if (g != null){
					object3ds = object3ds.concat(g);
				}
			}
		}
		return object3ds;
	},
	ParsePos: function(pos){
		var a = pos.childNodes[0].nodeValue.split(' ');
		for (var i = 0; i< a.length;i++){a[i] = parseFloat(a[i]);}
		return a;
	},
	ParsePosList: function(poslist){
		var a = poslist.childNodes[0].nodeValue.split(' ');
		for (var i = 0; i<a.length;i++){a[i] = parseFloat(a[i]);}
		return a;
	},
	ParseLinearRing: function(ring){
		var id = ring.attributes.getNamedItemNS(this.gml,'id').value;
		var posItems = [];
		var pos = ring.getElementsByTagNameNS(this.gml, 'pos');
		for (var i = 0; i< pos.length; i++){posItems = posItems.concat(this.ParsePos(pos[i]));}
		var posList= ring.getElementsByTagNameNS(this.gml, 'posList');		
		if (posList.length >0){posItems = posItems.concat(this.ParsePosList(posList[0]));}
		var l = posItems.length;
		if (posItems[0] == posItems[l-3] && posItems[1] == posItems[l-2] && posItems[2] == posItems[l-1]){posItems  = posItems.slice(0,l-3);}
		return {id: id, coordinates: posItems};
	},
	ParseLine: function(polygon, materials, dims, z){
		
	},
	ParsePolygon: function(polygon, materials,dims, z){
		var toReturn = null;
		var id = polygon.attributes.getNamedItemNS(this.gml,'id').value;
		if (id === '831e5f02-48de-498f-be2e-561c126e0898'){
			var condBreak = 'test';
		}
		var ext = polygon.getElementsByTagNameNS(this.gml, 'exterior')[0].getElementsByTagNameNS(this.gml,'LinearRing')[0];
		var exterior = this.ParseLinearRing(ext);
		var interiors = polygon.getElementsByTagNameNS(this.gml, 'interior');
		var interiorrings = [];
		for (var i = 0; i< interiors.length; i++){
			interiorrings[i] = this.ParseLinearRing(interiors[i].getElementsByTagNameNS(this.gml,'LinearRing')[0]);
		}
		//extrude via shape		TODO!
		if (dims ==2 ){
			if (z ==  undefined){z=3;}
			var points=  [];
			for(var i =0; i< exterior.coordinates.length; i++){point.push(new THREE.Vector2 ( exterior.coordinates[i], exterior.coordinates[i++] ));}
			var shape = new THREE.Shape( points );
			for (var i = 0; i< interiorrings.length; i++){
				var holePoints = [];
				for (var j= 0; j< interiorrings[i].length; i++){holePoints.push(new THREE.Vector2 ( interiorrings[i].coordinates[j], interiorrings[i].coordinates[j++] ));}
				shape.holes[i]=new THREE.Shape( holePoints );
			}
			var extrudeSettings = { amount: z , bevelEnabled: false}; 
			var g =  new THREE.ExtrudeGeometry(shape,extrudeSettings);
			g.id = id;
			g.ringId = exterior.id;
			toReturn = g;
		}
		else{			
			var zx=1, zy= 1;
			var xmin,xminindex,xmax,xmaxindex;
			xmin = Number.MAX_VALUE;
			xmax = Number.MIN_VALUE;
			for (var i = 0; i< exterior.coordinates.length; i++){
				if (exterior.coordinates[i] <xmin){xminindex = i; xmin = exterior.coordinates[i];}
				if (exterior.coordinates[i] >xmax){xmaxindex = i; xmax = exterior.coordinates[i];}
				i+=2;
			}
			if (exterior.coordinates[xminindex+1] <exterior.coordinates[xmaxindex+1]){zy = -1;}
			
			var ring2D = this.Convert3Dto2D(exterior,zx,zy);
			if (ring2D.ring.length <3){return null;} else{
				try
				{
					var pointindex = [];
					var color = new THREE.Color( 0xff0000 );
					var uvIndex=[];
					var materialIndex = 0;
					var index = '#'+id;
					
					
					for (var i = materials.index[index].a; i< materials.materials.length; i++){
						for (var j= materials.index[index].t; j <materials.materials[i].targets.length  ; j++){
							if (materials.materials[i].targets[j].uri =='#'+id){
								if (materials.materials[i].targets[j].hasOwnProperty('textureCoordinates')){
									uvIndex = materials.materials[i].targets[j].textureCoordinates;
								}
								color = materials.materials[i].color;
								materialIndex = i;
								i = materials.length;
								break;
							}
						}
					}
					
					//parse the linearray before the swctx, because swctx messes with the point order
					var lineArray = new Float32Array(ring2D.ring.length * 6 );
					var lineColorArray = new Float32Array(ring2D.ring.length * 6 );
					
					for (var i =0;i< ring2D.ring.length;i++){
						var p = ring2D.ring[i];
						var p2 = i+1< ring2D.ring.length?ring2D.ring[i+1]:ring2D.ring[0];
						lineArray.set([p.x- p.z*zx,p.y-p.z*zy,p.z+this.zOffset,p2.x- p2.z*zx,p2.y-p2.z*zy,p2.z+this.zOffset], i*6);
						lineColorArray.set([color.r,color.g,color.b,color.r,color.g,color.b], i*6);
					}
					
					var swctx = new poly2tri.SweepContext(ring2D.ring);
					for (var i = 0; i< interiorrings.length; i++){
						var intRing = this.Convert3Dto2D(interiorrings[i],zx,zy);
						swctx.addHole(intRing.ring);
					}
					swctx.triangulate();
					var triangles = swctx.getTriangles();
					
					var vertexIdxArray	= new Int16Array(triangles.length * 3);
					var vertexPosArray	= new Float32Array(swctx.pointCount() * 3 );
					var uvArray		= new Float32Array(swctx.pointCount() * 2);
					var normalArray = new Float32Array( swctx.pointCount() * 3 );
					var colorArray = new Float32Array( swctx.pointCount()  * 3 );
					
					if (uvIndex.length >0){
						for (var i = 0; i<uvIndex.length&& i*2< uvArray.length; i++){
							uvArray.set([uvIndex[i].x, uvIndex[i].y], i*2);
						}
					}
					for (var i = 0; i< swctx.points_.length;i++){
						var index = i*3; var indexp = i*3+1; var indexpp = i*3+2;
						vertexPosArray[index] = swctx.points_[i].x- swctx.points_[i].z*zx;
						vertexPosArray[indexp] =swctx.points_[i].y-swctx.points_[i].z*zy;
						vertexPosArray[indexpp] =swctx.points_[i].z+this.zOffset;
						pointindex[swctx.points_[i].id] = i;
						
						colorArray[index] = color.r;
						colorArray[indexp] = color.g;
						colorArray[indexpp] = color.b;
						if (uvIndex.length >0){
						var uvPosition = parseInt(swctx.points_[i].id.replace(exterior.id+'_',''));
							uvArray.set([uvIndex[uvPosition].x, uvIndex[uvPosition].y], i*2);
						}
						
					}
					
					
					for (var i = 0; i< triangles.length; i++){
						var a = pointindex[triangles[i].points_[0].id], b = pointindex[triangles[i].points_[1].id], c = pointindex[triangles[i].points_[2].id];
						if(a != undefined && b != undefined && c != undefined){	
							var pA = new THREE.Vector3(triangles[i].points_[0].x,triangles[i].points_[0].y,triangles[i].points_[0].z);
							var pB = new THREE.Vector3(triangles[i].points_[1].x,triangles[i].points_[1].y,triangles[i].points_[1].z);
							var pC = new THREE.Vector3(triangles[i].points_[2].x,triangles[i].points_[2].y,triangles[i].points_[2].z);
							var cb = new THREE.Vector3();
							var ab = new THREE.Vector3();

							cb.subVectors( pC, pB );
							ab.subVectors( pA, pB );
							cb.cross( ab );

							cb.normalize();
							
							normalArray[a*3] = cb.x;
							normalArray[a*3+1] = cb.y;
							normalArray[a*3+2] = cb.z;
							normalArray[b*3] = cb.x;
							normalArray[b*3+1] = cb.y;
							normalArray[b*3+2] = cb.z;
							normalArray[c*3] = cb.x;
							normalArray[c*3+1] = cb.y;
							normalArray[c*3+2] = cb.z;
							
							vertexIdxArray[i*3]  =a;
							vertexIdxArray[i*3+1] = b;
							vertexIdxArray[i*3+2] = c;
						}
					}
					var attributes = {
						position	: {
							itemSize: 3,
							array	: vertexPosArray,
							numItems: vertexPosArray.length
						},
						index		: {
							itemSize: 1,
							array	: vertexIdxArray,
							numItems: vertexIdxArray.length
						},
						uv	: {
							itemSize: 2,
							array	: uvIndex.length>0?uvArray:new Float32Array(0),
							numItems: 0
						},
						normal: {
							itemSize: 3,
							array:normalArray,
							numItems: normalArray.length
						},
						color: {
							itemSize: 3,
							array: colorArray,
							numItems: colorArray.length
						},
						line: {
							itemSize: 3,
							array: lineArray,
							numItems: lineArray.length
						},
						linecolor: {
							itemSize: 3,
							array: lineColorArray,
							numItems: lineColorArray.length
						}
					};

					var geometry		= new THREE.BufferGeometry();
					geometry.attributes	= attributes;
					geometry.offsets	= [{
						start	: 0,
						count	: vertexIdxArray.length,
						index	: 0
					}];
					geometry.computeBoundingBox();
					geometry.computeBoundingSphere();
					geometry.dynamic= true;
					var toReturn =  new THREE.Mesh( geometry, materials.materials[materialIndex] );
					toReturn.name = id;			
				}
				catch(err){
					console.log(id);
					return null;
				}
			}
		}
		return toReturn;
	},
	Convert3Dto2D: function (linearring, zx, zy){
		var ring = linearring.coordinates;
		var ring2D = {doublePositions:[], ring:[]};
		for (var i = 0; i< ring.length; i++){
			var isdouble = false;
			for (var j = i+3; j< ring.length;j++){						
				if (ring[i] == ring[j] && ring[i+1]== ring[j+1]&& ring[i+2] == ring[j+2]){
					isdouble  =true;
					if (linearring.id == 'bbe68caf-bac5-4264-acd8-f336bacf241c_0'){
						isdouble =true;
					}
					console.log(linearring.id + ":"+j );
					break;
				}
				j+=2;
			}
			if(!isdouble){ring2D.ring.push({x:ring[i]+ring[i+2]*zx, y: ring[i+1]+ring[i+2]*zy, z: ring[i+2], id :linearring.id+'_'+i/3});}
			else if (i>0){
				ring2D.doublePositions.push(i/3);
			}
			i+=2;
		}
		return ring2D;
	},
	CreateBuffergeometry: function(geometry){
		var buffergeometry;
		
		return buffergeometry;
	}
}