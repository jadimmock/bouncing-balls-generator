function Vector(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
	
	this.addX = function(x) {
		this.x += x;
	};
	
	this.addY = function(y) {
		this.y += y;
	};
	
	this.addZ = function(z) {
		this.z += z;
	};

	this.set = function(x, y, z) {			
		this.x = x; 
		this.y = y;
		this.z = z;
	};
};