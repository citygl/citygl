CityGL.Layer = function(options){
	this.name = "defaultname";
	this.viewport = null;
	this.EPSG="EPSG:900913";
	this.setValues(options);
}
CityGL.Layer.prototype = { 
	constructor : CityGL.Layer,
	setViewport: function(v){
		this.viewport = v;
	},
	ProjectArray : function(a, source, target, projectZ){
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

	}
}

