CityGL.DemoControl = function(camera, points, loopTime){
	this.camera = camera;
	this.camera.up.z= 1;
	this.camera.up.y= 0;
	this.points =[];
	for(var i = 0; i< points.length; i++){
		this.points.push(new THREE.Vector3(points[i].x,points[i].y,points[i].z));
	}
	this.spline= new THREE.SplineCurve3( points	);
	this.tube = new THREE.TubeGeometry(this.spline, 100, 2, 3, true, false);
	this.loopTime = loopTime;

}
CityGL.DemoControl.prototype = { 
	constructor : CityGL.DemoControl,
	addPoint: function(p){
		this.points.push(new THREE.Vector3(p.x,p.y,p.z));
		this.spline.dispose();
		this.spline = new THREE.SplineCurve3( this.points);
		this.tube.dispose();
		this.tube = new THREE.TubeGeometry(this.spline, 10000, 2, 3, true, false);
	},
	update: function(e){
		// Try Animate Camera Along Spline
		var t = e;
			var time = Date.now();
			var t = ( time % this.loopTime ) / this.loopTime;

			var pos = this.tube.path.getPointAt( t );
			var scale = 1;
			pos.multiplyScalar( scale );

			// interpolation
			var segments = this.tube.tangents.length;
			var pickt = t * segments;
			var pick = Math.floor( pickt );
			var pickNext = ( pick + 1 ) % segments;
			var binormal = new THREE.Vector3();
			var normal = new THREE.Vector3();
			binormal.subVectors( this.tube.binormals[ pickNext ], this.tube.binormals[ pick ] );
			binormal.multiplyScalar( pickt - pick ).add( this.tube.binormals[ pick ] );


			var dir = this.tube.path.getTangentAt( t );

			var offset = 15;

			normal.copy( binormal ).cross( dir );

			// We move on a offset on its binormal
			//pos.add( normal.clone().multiplyScalar( offset ) );

			this.camera.position = pos;
			//cameraEye.position = pos;


			// Camera Orientation 1 - default look at
			// splineCamera.lookAt( lookAt );

			// Using arclength for stablization in look ahead.
			var lookAt = this.tube.path.getPointAt( ( t + 30 / this.tube.path.getLength() ) % 1 ).multiplyScalar( scale );

			// Camera Orientation 2 - up orientation via normal
			
			//lookAt.copy( pos ).add( dir );
			this.camera.lookAt(lookAt);
			this.camera.rotation.setEulerFromRotationMatrix( this.camera.matrix, this.camera.eulerOrder );

			//cameraHelper.update();

			//parent.rotation.y += ( targetRotation - parent.rotation.y ) * 0.05;
	}	
}