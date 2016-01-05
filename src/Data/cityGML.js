CityGL.CityGML = function(doc, documentUrl, options){
	this.doc = doc;
	this.documentURL = documentUrl;
	this.textureCompressionFactor = 1;
	this.textureCompressionService = null;
	this.bldg = 'http://www.opengis.net/citygml/building/1.0';
	this.core = 'http://www.opengis.net/citygml/1.0';
	this.app='http://www.opengis.net/citygml/appearance/1.0';
	this.gen="http://www.opengis.net/citygml/generics/1.0";
	this.setValues(options);	
}
CityGL.CityGML.prototype = new CityGL.GML();
CityGL.CityGML.prototype.constructor = CityGL.CityGML;
CityGL.CityGML.prototype.Read= function(){
		var object3Ds = [];		
		var extent = this.ParseExtent(this.doc);
		//get the appearances
		var apps =  this.doc.getElementsByTagNameNS(this.app, 'appearance');
		if (0 == apps.length) {
			apps =  this.doc.getElementsByTagNameNS(this.app, 'appearanceMember');
		}
		var appearances = this.ParseAppearance(apps);
		var buildings = this.doc.getElementsByTagNameNS(this.bldg, 'Building');
		
		for (var i = 0; i< buildings.length; i++){
			object3Ds.push(this.ParseBuilding(buildings[i], appearances));
		}
		return object3Ds;
	}
CityGL.CityGML.prototype.parseAttributeNode=  function(node, obj){
	obj.userData[node.localName] = node.childNodes[0] !=undefined ?node.childNodes[0].nodeValue:"";
}
CityGL.CityGML.prototype.parseStringAttribute=  function(node, obj){
	var nodename = node.attributes.getNamedItem('name').value
	var value = node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0] !=undefined ? node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0].nodeValue : "";
	obj.userData[nodename] = value;
}
CityGL.CityGML.prototype.parseDoubleAttribute=  function(node, obj){
	var nodename = node.attributes.getNamedItem('name').value
	var value = node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0] !=undefined ? node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0].nodeValue : "";
	obj.userData[nodename] = parseFloat(value);
}
CityGL.CityGML.prototype.parseIntAttribute=  function(node, obj){
	var nodename = node.attributes.getNamedItem('name').value
	var value = node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0] !=undefined ? node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0].nodeValue : "";
	obj.userData[nodename] = parseInt(value);
}
CityGL.CityGML.prototype.parseDateAttribute=  function(node, obj){
	var nodename = node.attributes.getNamedItem('name').value
	var value = node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0] !=undefined ? node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0].nodeValue : "";
	obj.userData[nodename] = value;
}
CityGL.CityGML.prototype.parseUriAttribute= function(node, obj){
	var nodename = node.attributes.getNamedItem('name').value
	var value = node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0] !=undefined ? node.getElementsByTagNameNS(this.gen, 'value')[0].childNodes[0].nodeValue : "";
	obj.userData[nodename] = value;
}
CityGL.CityGML.prototype.ParseAsAttribute = function(node, buildingObject3D){
	if (node.localName =='description' && node.namespaceURI == this.gml){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='name' && node.namespaceURI == this.gml){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='creationDate' && node.namespaceURI == this.core){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='class' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='function' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='usage' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='yearOfConstruction' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='roofType' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='measuredHeight' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='storeysAboveGround' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='storeysBelowGround' && node.namespaceURI == this.bldg){this.parseAttributeNode(node,buildingObject3D);}
	else if (node.localName =='doubleAttribute' && node.namespaceURI == this.gen){this.parseDoubleAttribute(node,buildingObject3D);}
	else if (node.localName =='stringAttribute' && node.namespaceURI == this.gen){this.parseStringAttribute(node,buildingObject3D);}
	else if (node.localName =='intAttribute' && node.namespaceURI == this.gen){this.parseIntAttribute(node,buildingObject3D);}
	else if (node.localName =='dateAttribute' && node.namespaceURI == this.gen){this.parseDateAttribute(node,buildingObject3D);}
	else if (node.localName =='uriAttribute' && node.namespaceURI == this.gen){this.parseUriAttribute(node,buildingObject3D);}
}
CityGL.CityGML.prototype.ParseBuilding= function(building, appearances){
	var buildingObject3D = new THREE.Object3D();// fill with outershell and rooms as Mesh with MeshFaceMaterial, each object will get name and properties
	buildingObject3D.name = building.attributes.getNamedItemNS(this.gml,'id') != null ?building.attributes.getNamedItemNS(this.gml,'id').value : "";
	var appearances;//this.ParseAppearance(building.getElementsByTagNameNS(this.app, 'appearance')[0].getElementsByTagNameNS(this.app, 'Appearance')[0]);
	
	//outer shell
	//	var mergeMesh = new THREE.Mesh();
	//get appearances for building alone
	/*for (var i = 0; i< building.childNodes.length; i++){
		var node = building.childNodes[i];
		if (node.localName =='appearance' && node.namespaceURI == this.app){
			builingMaterials = this.ParseAppearance(node);
		}
	}*/
	for (var i =0; i< building.childNodes.length; i++){
		var node = building.childNodes[i];
		this.ParseAsAttribute(node, buildingObject3D);
		if (node.localName =='boundedBy' && node.namespaceURI == this.bldg){
			var walls = node.getElementsByTagNameNS(this.bldg, 'WallSurface');
			for (var j = 0; j< walls.length; j++){
				var multiSurfaceObject3Ds =this.ParseLODMultiSurface(walls[j], appearances);
				this.AddObject3DArray(buildingObject3D,multiSurfaceObject3Ds);
			}
			var roofs = node.getElementsByTagNameNS(this.bldg, 'RoofSurface');
			for (var j = 0; j< roofs.length; j++){
				var multiSurfaceObject3Ds =this.ParseLODMultiSurface(roofs[j], appearances);
				this.AddObject3DArray(buildingObject3D,multiSurfaceObject3Ds);
			}
			var floors = node.getElementsByTagNameNS(this.bldg, 'FloorSurface');
			for (var j = 0; j< floors.length; j++){
				var multiSurfaceObject3Ds =this.ParseLODMultiSurface(floors[j], appearances);
				this.AddObject3DArray(buildingObject3D,multiSurfaceObject3Ds);
			}
			var ceilings = node.getElementsByTagNameNS(this.bldg, 'CeilingSurface');
			for (var j = 0; j< ceilings.length; j++){
				var multiSurfaceObject3Ds =this.ParseLODMultiSurface(ceilings[j], appearances);
				this.AddObject3DArray(buildingObject3D,multiSurfaceObject3Ds);
			}
		}
		else if(node.localName =='interiorRoom' && node.namespaceURI == this.bldg){
			var roomObject3D  = new THREE.Object3D();
			var room  = node.getElementsByTagNameNS(this.bldg, 'Room')[0];
			roomObject3D.name = room.attributes.getNamedItemNS(this.gml,'id').value;
			var roomMaterials;
			for (var j = 0; j< room.childNodes.length; j++){				
				this.ParseAsAttribute(room.childNodes[j], roomObject3D);
			}
			var roomboundedbys = room.getElementsByTagNameNS(this.bldg, 'boundedBy');
			for (var j = 0; j< roomboundedbys.length; j++){
				var interiorWalls = roomboundedbys[j].getElementsByTagNameNS(this.bldg, 'InteriorWallSurface');
				var walls = roomboundedbys[j].getElementsByTagNameNS(this.bldg, 'WallSurface');
				for (var k = 0; k< interiorWalls.length; k++){
					var multiSurfaceObject3Ds =this.ParseLODMultiSurface(interiorWalls[k], appearances);
					this.AddObject3DArray(roomObject3D,multiSurfaceObject3Ds);
				}
				for (var k = 0; k< walls.length; k++){
					var multiSurfaceObject3Ds =this.ParseLODMultiSurface(walls[k], appearances);
					this.AddObject3DArray(roomObject3D,multiSurfaceObject3Ds);
				}
				var ceilings = roomboundedbys[j].getElementsByTagNameNS(this.bldg, 'CeilingSurface');
				for (var k = 0; k< ceilings.length; k++){
					var multiSurfaceObject3Ds =this.ParseLODMultiSurface(ceilings[k],appearances);
					this.AddObject3DArray(roomObject3D,multiSurfaceObject3Ds);
				}
				var floors = roomboundedbys[j].getElementsByTagNameNS(this.bldg, 'FloorSurface');
				for (var k = 0; k< floors.length; k++){
					var multiSurfaceObject3Ds =this.ParseLODMultiSurface(floors[k],appearances);
					this.AddObject3DArray(roomObject3D,multiSurfaceObject3Ds);
				}	
			}		
			buildingObject3D.add(roomObject3D);
		}
	}
	return buildingObject3D;
}
CityGL.CityGML.prototype.ParseLODMultiSurface= function(lodsurface, materials){
	var object3ds = [];
	var s= lodsurface.getElementsByTagNameNS(this.gml, 'MultiSurface');
	for(var i = 0; i< s.length; i++){
		object3ds = object3ds.concat( this.ParseMultiSurface(s[i], materials));		
	}
	return object3ds;
}
CityGL.CityGML.prototype.ParseAppearance = function(apps){
	var appearances = [];
	for (var k = 0; k< apps.length; k++){
		var surfaceDataMembers =apps[k].getElementsByTagNameNS(this.app, 'surfaceDataMember');
		for (var i =0; i< surfaceDataMembers.length; i++){
			var x3Dmaterials = surfaceDataMembers[i].getElementsByTagNameNS(this.app, 'X3DMaterial');
			for (var j =0; j< x3Dmaterials.length; j++){
				appearances.push(this.ParseX3DMaterial(x3Dmaterials[j]));}
			var parameterizedTextures = surfaceDataMembers[i].getElementsByTagNameNS(this.app,'ParameterizedTexture');
			for (var j =0; j< parameterizedTextures.length; j++){
				appearances.push(this.ParseParameterizedTexture(parameterizedTextures[j]));}			
		}
	}
	//optimize for double images
	var index = [];
	var optimizedAppearances = [];
	for (var i =0; i< appearances.length; i++){
		if (appearances[i].hasOwnProperty('url')){
			var j = 0;
			for (j = 0; j< optimizedAppearances.length; j++){
				if(optimizedAppearances[j].hasOwnProperty('url')){
					if (appearances[i].url == optimizedAppearances[j].url){
						for (var k = 0; k< appearances[i].targets.length; k++){
							optimizedAppearances[j].targets.push(appearances[i].targets[k].clone());
							index[appearances[i].targets[0].uri] = {a: j, t:optimizedAppearances[j].targets.length-1};
						}
						break;
					}
				}				
			}
			if(j == optimizedAppearances.length){//no matching url found, now make a texture and material from the parameterizedtexture
				if (this.textureCompressionService != null){
					optimizedAppearances.push(appearances[i].getCompressedMaterial(this.textureCompressionFactor,this.textureCompressionService));
				}
				else{
					optimizedAppearances.push(appearances[i].getMaterial());
				}
				index[appearances[i].targets[0].uri] = {a: optimizedAppearances.length-1, t:0};		
			}
		}
		else{			
			optimizedAppearances.push(appearances[i]);
			index[appearances[optimizedAppearances.length-1].targets[0].uri] = {a: optimizedAppearances.length-1, t:0};			
		}		
	}
	return {materials: optimizedAppearances, index: index};
}
CityGL.CityGML.prototype.ParseX3DMaterial = function(x3DMaterial){
	var diffuseColor = x3DMaterial.getElementsByTagNameNS(this.app, 'diffuseColor').length >0 ?this.ParseColor(x3DMaterial.getElementsByTagNameNS(this.app, 'diffuseColor')[0]): new THREE.Color( 0xffffff ) ;
	var emissiveColor =x3DMaterial.getElementsByTagNameNS(this.app, 'emissiveColor').length >0 ? this.ParseColor(x3DMaterial.getElementsByTagNameNS(this.app, 'emissiveColor')[0]): new THREE.Color( 0xffffff );
	var specularColor =x3DMaterial.getElementsByTagNameNS(this.app, 'specularColor').length >0 ? this.ParseColor(x3DMaterial.getElementsByTagNameNS(this.app, 'specularColor')[0]): new THREE.Color( 0xffffff );
	var targets = [];
	var tg = x3DMaterial.getElementsByTagNameNS(this.app, 'target');
	for (var i =0; i< tg.length; i++){
		var target = tg[i].childNodes[0].nodeValue;
		targets.push({uri:target});
	}
	var material = new THREE.MeshBasicMaterial();
	material.side = THREE.DoubleSide;
	material.color = diffuseColor;
	material.emissive = emissiveColor;
	material.specular = specularColor;
	material.targets = targets;
	material.vertexColors= THREE.VertexColors;
	return material;
}
CityGL.CityGML.prototype.ParseColor = function(color){
	var c = new THREE.Color();
	var colorString = color.childNodes[0].nodeValue.split(' ');
	c.setRGB(parseFloat(colorString[0]), parseFloat(colorString[1]), parseFloat(colorString[2]));
	return c;
}
CityGL.CityGML.prototype.ParseParameterizedTexture = function(pt){
	var url = pt.getElementsByTagNameNS(this.app, 'imageURI')[0].childNodes[0].nodeValue;	
	url = this.documentURL + url;
	var targets = [];
	var tg = pt.getElementsByTagNameNS(this.app, 'target');
	for (var i = 0; i< tg.length; i++){
		var uri = tg[i].attributes.getNamedItem('uri').value;
		var target = new CityGL.Target(uri);
		var texcoordlist = tg[i].getElementsByTagNameNS(this.app, 'TexCoordList')[0];
		var texturecoordinates = texcoordlist.getElementsByTagNameNS(this.app, 'textureCoordinates')[0].childNodes[0].nodeValue.split(' ');
		for (var j = 0; j< texturecoordinates.length; j+=2){
			target.textureCoordinates.push({x: parseFloat(texturecoordinates[j]), y: parseFloat(texturecoordinates[j+1])});
		}
		targets.push(target);
	}
	var pt =  new CityGL.ParameterizedTexture(url);
	pt.targets = targets;
	return pt;
}
CityGL.CityGML.prototype.AddObject3DArray = function(object3d, a){
	for (var i = 0; i< a.length; i++){
		object3d.add(a[i]);
	}
}

CityGL.CityGML.prototype.setValues =  function ( values ) {

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

	}
	
	
	
