//TODO EPSG handling in right spot
CityGL.LineLayer = function(){
	CityGL.Layer.apply(this, arguments);
	this.objects = new THREE.Object3D;
	this.flatObjects = [];
	this.flatQueryObjects = [];
	this.hasRealWorldZ = false;
}
CityGL.LineLayer.prototype = new CityGL.Layer();
CityGL.LineLayer.prototype.constructor = CityGL.LineLayer;
CityGL.LineLayer.prototype.addObject3D = function(object3D){
	this.objects.add(object3D);
}
CityGL.LineLayer.prototype.addObject3Ds = function(object3Ds){
	for (var i = 0; i< object3Ds.length; i++){
		this.objects.add(object3Ds[i]);
	}
}
CityGL.LineLayer.prototype.SetVisibility = function(id, visible){
	var obj = this.objects.getObjectByName(id, true);
	obj.visible = visible;
	var desc = [];
	obj.getDescendants(desc);
	for (var i =0; i< desc.length; i++){
		desc[i].visible = visible;
	}
}
CityGL.LineLayer.prototype.UpdateObjects = function(){
	//update only when the objects have been added to the viewport
	var vpParent;
	while (this.flatObjects.length >0){
		var fo= this.flatObjects.pop();
		if (fo.parent !=null){
			vpParent = fo.parent;
			vpParent.remove(fo);
		}
	}
	if (vpParent != null){
		this.GetObject3Ds(false);
		for (var i = 0; i< this.flatObjects.length; i++){
			vpParent.add(this.flatObjects[i]);
		}
	}
	var qParent;
	while (this.flatQueryObjects.length >0){
		var fo= this.flatQueryObjects.pop();
		if (fo.parent !=null){
			qParent =fo.parent;
			qParent.remove(fo);
		}
	}
	if (qParent != null){
		this.GetObject3Ds(true);
		for (var i = 0; i< this.flatQueryObjects.length; i++){
			qParent.add(this.flatQueryObjects[i]);
		}
	}
}
CityGL.LineLayer.prototype.GetIDs = function(){
	var ids = [];
	var desc = [];
	this.objects.getDescendants(desc);
	for (var i = 0; i< desc.length; i++){
		ids[i] = desc[i].id;
	}
	return ids;
}
CityGL.LineLayer.prototype.GetObject3Ds= function(indexColor){
	var needsReprojection = this.viewport.EPSG != this.EPSG;
	var toReturn = [];
    var desc = [];
	this.objects.getDescendants(desc);
	var descMaterialGrouped = [];
	descMaterialGrouped[-1] = [];
	for (var i =0; i< desc.length; i++){
		if (desc[i] instanceof THREE.Mesh && desc[i].material.map != null && !indexColor){
			if (descMaterialGrouped[desc[i].material.id] == undefined){
				descMaterialGrouped[desc[i].material.id] = [desc[i]];
			}
			else{
				descMaterialGrouped[desc[i].material.id].push(desc[i]);
			}
		}
		else{
			descMaterialGrouped[-1].push(desc[i]);
		}
	}
	for (key in descMaterialGrouped) {
		
		var flatobjects = [{
			positionarrays:[],
			colorarrays:[],
			positioncount:0,
			colorcount:0,
			positionitems:0,
			coloritems:0
		}];
		flatindex = 0;
		for (var i = 0; i< descMaterialGrouped[key].length; i++){
			if (descMaterialGrouped[key][i].geometry != null && descMaterialGrouped[key][i].visible){
				flatobjects[flatindex].positionarrays[flatobjects[flatindex].positionarrays.length] = descMaterialGrouped[key][i].geometry.attributes.line.array; flatobjects[flatindex].positioncount+= descMaterialGrouped[key][i].geometry.attributes.line.array.length;flatobjects[flatindex].positionitems +=descMaterialGrouped[key][i].geometry.attributes.line.numItems;
				flatobjects[flatindex].colorarrays[flatobjects[flatindex].colorarrays.length] = descMaterialGrouped[key][i].geometry.attributes.linecolor.array; flatobjects[flatindex].colorcount+= descMaterialGrouped[key][i].geometry.attributes.linecolor.array.length;flatobjects[flatindex].coloritems +=descMaterialGrouped[key][i].geometry.attributes.linecolor.numItems;
			}
		}
		for (var i = 0; i< flatindex+1; i++){
			var g = new THREE.BufferGeometry();
			g.attributes = {
				position:{
					itemSize:3,
					array:new Float32Array(flatobjects[i].positioncount),
					numItems:flatobjects[i].positionitems
				},	
				color:{
					itemSize:3,
					array:new Float32Array(flatobjects[i].colorcount),
					numItems:flatobjects[i].coloritems
				}
			};
			var positionOffset=0; var indexOffset = 0; var uvOffset = 0; var normalOffset = 0; var colorOffset = 0; var idx = 0;
			
			for (var j =0; j< flatobjects[i].positionarrays.length; j++){
				if (needsReprojection){ this.ProjectArray(flatobjects[i].positionarrays[j], this.EPSG, this.viewport.EPSG, this.hasRealWorldZ);}
				var a = this.viewport.FloatArrayWorldToViewPort(flatobjects[i].positionarrays[j]);
				g.attributes.position.array.set(a, positionOffset); positionOffset+=flatobjects[i].positionarrays[j].length;
			}
			if (true){
				for (var j =0; j< flatobjects[i].colorarrays.length; j++){
					g.attributes.color.array.set(flatobjects[i].colorarrays[j], colorOffset); colorOffset+=flatobjects[i].colorarrays[j].length;
				}
			}
			else{
				for (var j =0; j< flatobjects[i].colorarrays.length; j++){
					var color = new THREE.Color(flatobjects[i].idarrays[j]);				
					for (var k = 0; k< flatobjects[i].colorarrays[j].length; k+=3){				
						g.attributes.color.array.set([color.r, color.g, color.b] , colorOffset+k);
					}
					colorOffset+=flatobjects[i].colorarrays[j].length
				}
			}
			
			
			g.computeBoundingBox();
			g.computeBoundingSphere();
			//var newmat = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, vertexColors: THREE.VertexColors} );
			var newmat = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors} );
			delete g.attributes.uv;
			delete g.attributes.index;
			delete g.attributes.normal;
			var material = key==-1? newmat:descMaterialGrouped[key][0].material;
			var mesh =  new THREE.Line( g, material,THREE.LinePieces);
			mesh.name = this.name;
			if(indexColor){this.flatQueryObjects.push(mesh);}
			else{this.flatObjects.push(mesh);}
			toReturn.push(mesh);		
		}
	}
	return toReturn;
}
CityGL.LineLayer.prototype.ProjectArray = function(a, source, target, projectZ){
	var source = new Proj4js.Proj(source);    
	var dest= new Proj4js.Proj(target);
	if (projectZ){
		for (var i =0; i< a.length; i+=3){	
			var p = new Proj4js.Point(a[i], a[i+1], a[i+2]);
			Proj4js.transform(source, dest, p);
			a.set([p.x, p.y, p.z],i);
		}
	}
	else{
		for (var i =0; i< a.length; i+=3){	
			var p = new Proj4js.Point(a[i], a[i+1], a[i+2]);
			Proj4js.transform(source, dest, p);
			a.set([p.x, p.y, 0],i);
		}
	}
}
