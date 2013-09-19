CityGL.GeometryLayer = function(){
	CityGL.Layer.apply(this, arguments);
	this.objects = new THREE.Object3D;
	this.flatObjects = [];
	this.flatQueryObjects = [];
	this.hasRealWorldZ = false;
}
CityGL.GeometryLayer.prototype = new CityGL.Layer();
CityGL.GeometryLayer.prototype.constructor = CityGL.GeometryLayer;
CityGL.GeometryLayer.prototype.addObject3D = function(object3D){
	this.objects.add(object3D);
}
CityGL.GeometryLayer.prototype.addObject3Ds = function(object3Ds){
	for (var i = 0; i< object3Ds.length; i++){
		this.objects.add(object3Ds[i]);
	}
}
CityGL.GeometryLayer.prototype.SetVisibility = function(id, visible){
	var desc = [];
	var obj = this.objects.getObjectByName(id, true);
	if (id == "" && obj ==undefined){
		this.objects.visible = visible;
		this.objects.getDescendants(desc);
	}
	else{
		if(obj !=undefined){
		obj.visible = visible;
		obj.getDescendants(desc);
		}
	}
	for (var i =0; i< desc.length; i++){
		desc[i].visible = visible;
	}
}
CityGL.GeometryLayer.prototype.UpdateObjects = function(){
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
CityGL.GeometryLayer.prototype.GetIDs = function(){
	var ids = [];
	var desc = [];
	this.objects.getDescendants(desc);
	for (var i = 0; i< desc.length; i++){
		ids[i] = desc[i].id;
	}
	return ids;
}
CityGL.GeometryLayer.prototype.GetObject3Ds= function(indexColor){
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
			uvarrays:[],
			positionarrays:[],
			indexarrays:[],
			normalarrays:[],
			colorarrays:[],
			idarrays:[],
			uvcount:0,
			positioncount:0,
			indexcount:0,
			normalcount:0,
			colorcount:0,
			indexmax:0,
			uvitems:0,
			positionitems:0,
			indexitems:0,
			normalitems:0,
			coloritems:0
		}];
		flatindex = 0;
		for (var i = 0; i< descMaterialGrouped[key].length; i++){
			if (descMaterialGrouped[key][i].geometry != null && descMaterialGrouped[key][i].visible){
				//analyse the indexmax first
				if (flatobjects[flatindex].indexmax + descMaterialGrouped[key][i].geometry.attributes.position.array.length > 65535){
					flatobjects.push({uvarrays:[],positionarrays:[],indexarrays:[],normalarrays:[],colorarrays:[],idarrays:[],uvcount:0,positioncount:0,indexcount:0,normalcount:0,colorcount:0,indexmax:0,uvitems:0,positionitems:0,indexitems:0,normalitems:0,coloritems:0});
					flatindex++;
				}
				flatobjects[flatindex].uvarrays[flatobjects[flatindex].uvarrays.length] = descMaterialGrouped[key][i].geometry.attributes.uv.array; flatobjects[flatindex].uvcount+= descMaterialGrouped[key][i].geometry.attributes.uv.array.length; flatobjects[flatindex].uvitems +=descMaterialGrouped[key][i].geometry.attributes.uv.numItems;
				flatobjects[flatindex].positionarrays[flatobjects[flatindex].positionarrays.length] = descMaterialGrouped[key][i].geometry.attributes.position.array; flatobjects[flatindex].positioncount+= descMaterialGrouped[key][i].geometry.attributes.position.array.length;flatobjects[flatindex].positionitems +=descMaterialGrouped[key][i].geometry.attributes.position.numItems;
				flatobjects[flatindex].indexarrays[flatobjects[flatindex].indexarrays.length] = descMaterialGrouped[key][i].geometry.attributes.index.array; flatobjects[flatindex].indexcount+= descMaterialGrouped[key][i].geometry.attributes.index.array.length;flatobjects[flatindex].indexitems +=descMaterialGrouped[key][i].geometry.attributes.index.numItems;
				flatobjects[flatindex].normalarrays[flatobjects[flatindex].normalarrays.length] = descMaterialGrouped[key][i].geometry.attributes.normal.array; flatobjects[flatindex].normalcount+= descMaterialGrouped[key][i].geometry.attributes.normal.array.length;flatobjects[flatindex].normalitems +=descMaterialGrouped[key][i].geometry.attributes.normal.numItems;
				flatobjects[flatindex].colorarrays[flatobjects[flatindex].colorarrays.length] = descMaterialGrouped[key][i].geometry.attributes.color.array; flatobjects[flatindex].colorcount+= descMaterialGrouped[key][i].geometry.attributes.color.array.length;flatobjects[flatindex].coloritems +=descMaterialGrouped[key][i].geometry.attributes.color.numItems;
				flatobjects[flatindex].indexmax += descMaterialGrouped[key][i].geometry.attributes.position.numItems / 3;
				flatobjects[flatindex].idarrays[flatobjects[flatindex].idarrays.length] = descMaterialGrouped[key][i].id;
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
				index:{
					itemSize:1,
					array:new Uint16Array(flatobjects[i].indexcount),
					numItems:flatobjects[i].indexitems
				},
				uv:{
					itemSize:2,
					array:new Float32Array(flatobjects[i].uvcount),
					numItems:flatobjects[i].uvitems
				},
				normal:{
					itemSize:3,
					array:new Float32Array(flatobjects[i].normalcount),
					numItems:flatobjects[i].normalitems
				},
				color:{
					itemSize:3,
					array:new Float32Array(flatobjects[i].colorcount),
					numItems:flatobjects[i].coloritems
				}
			};
			var positionOffset=0; var indexOffset = 0; var uvOffset = 0; var normalOffset = 0; var colorOffset = 0; var idx = 0;
			for (var j =0; j< flatobjects[i].uvarrays.length; j++){
				g.attributes.uv.array.set(flatobjects[i].uvarrays[j], uvOffset); uvOffset+=flatobjects[i].uvarrays[j].length;
			}		
			for (var j =0; j< flatobjects[i].indexarrays.length; j++){
				var oldOffset = indexOffset;
				g.attributes.index.array.set(flatobjects[i].indexarrays[j], indexOffset); indexOffset+=flatobjects[i].indexarrays[j].length;
				if (oldOffset >0){
					idx +=flatobjects[i].positionarrays[j-1].length / 3;
					for (var k = oldOffset; k< indexOffset; k++){
						g.attributes.index.array[k] = g.attributes.index.array[k] +idx;
					}
				}
			}
			for (var j =0; j< flatobjects[i].positionarrays.length; j++){
				if (needsReprojection){ this.ProjectArray(flatobjects[i].positionarrays[j], this.EPSG, this.viewport.EPSG, this.hasRealWorldZ);}
				var a = this.viewport.FloatArrayWorldToViewPort(flatobjects[i].positionarrays[j]);
				g.attributes.position.array.set(a, positionOffset); positionOffset+=flatobjects[i].positionarrays[j].length;
			}
			for (var j =0; j< flatobjects[i].normalarrays.length; j++){
				g.attributes.normal.array.set(flatobjects[i].normalarrays[j], normalOffset); normalOffset+=flatobjects[i].normalarrays[j].length;
			}
			if (!indexColor){
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
			
			g.offsets	= [{
				start	: 0,
				count	: indexOffset,
				index	: 0
			}];
			g.computeBoundingBox();
			g.computeBoundingSphere();
			var material = key==-1? new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, vertexColors: THREE.VertexColors} ):descMaterialGrouped[key][0].material;
			var mesh =  new THREE.Mesh( g, material);
			mesh.name = this.name;
			if(indexColor){this.flatQueryObjects.push(mesh);}
			else{this.flatObjects.push(mesh);}
			toReturn.push(mesh);		
		}
	}
	return toReturn;
}
CityGL.GeometryLayer.prototype.ProjectArray = function(a, source, target, projectZ){
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
