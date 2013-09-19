CityGL.Tile = function(a){
	this.vertices = a;
	
}
CityGL.Tile.prototype = { 
	constructor : CityGL.Point,
	getGeometry: function(viewport){
		var triangles		= 2;
		var vertexIdxArray	= new Int16Array(triangles * 3);
		var k	= 0;
		vertexIdxArray[k+0]	= 0;
		vertexIdxArray[k+1]	= 1;
		vertexIdxArray[k+2]	= 2;
		vertexIdxArray[k+3]	= 3;
		vertexIdxArray[k+4]	= 4;	
		vertexIdxArray[k+5]	= 5;
		k	+= 3;
		
		var vertexPosArray	= new Float32Array(triangles * 3 * 3);
		var k	= 0;
		vertexPosArray[k+0]	=this.vertices[0].x;
		vertexPosArray[k+1]	= this.vertices[0].y;
		vertexPosArray[k+2]	= 0;
		k	+= 3;
		vertexPosArray[k+0]	= this.vertices[1].x;
		vertexPosArray[k+1]	= this.vertices[1].y;
		vertexPosArray[k+2]	= 0;
		k	+= 3;
		vertexPosArray[k+0]	= this.vertices[2].x;
		vertexPosArray[k+1]	= this.vertices[2].y;
		vertexPosArray[k+2]	=0;
		k	+= 3;			
		vertexPosArray[k+0]	=this.vertices[0].x;
		vertexPosArray[k+1]	= this.vertices[0].y;
		vertexPosArray[k+2]	= 0;
		k	+= 3;
		vertexPosArray[k+0]	= this.vertices[2].x;
		vertexPosArray[k+1]	= this.vertices[2].y;
		vertexPosArray[k+2]	= 0;
		k	+= 3;
		vertexPosArray[k+0]	= this.vertices[3].x;
		vertexPosArray[k+1]	= this.vertices[3].y;
		vertexPosArray[k+2]	=0;
		k	+= 3;
		vertexPosArray = viewport.FloatArrayWorldToViewPort(vertexPosArray);

		var uvArray		= new Float32Array(triangles * 3 * 2);
		var k	= 0;
		uvArray[k+0]	= 0;
		uvArray[k+1]	= 0;
		k	+= 2;
		uvArray[k+0]	= 1;
		uvArray[k+1]	= 0;
		k	+= 2;
		uvArray[k+0]	= 1;
		uvArray[k+1]	= 1;
		k	+= 2;
		
		uvArray[k+0]	= 0;
		uvArray[k+1]	= 0;
		k	+= 2;
		uvArray[k+0]	= 1;
		uvArray[k+1]	= 1;
		k	+= 2;
		uvArray[k+0]	= 0;
		uvArray[k+1]	= 1;
		k	+= 2;			
		var normalArray = new Float32Array( triangles * 3 * 3 );
		for (var k = 0; k<  triangles * 3 * 3 ; k++){
			normalArray[k]=1;k++;
			normalArray[k]=1;k++;
			normalArray[k]=1;
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
				array	: uvArray,
				numItems: uvArray.length
			},
			normal: {
				itemSize: 3,
				array:normalArray,
				numItems: normalArray.length
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
		geometry.computeVertexNormals();
		geometry.dynamic= true;
		return geometry;
	}
}