function Point(x, y, z, size, colour) {
	this.colour = colour;
	this.curPos = new Vector(x, y, z);
	this.originalPos = new Vector(x, y, z);
	this.radius = size;
	this.size = size;
	this.springStrength = 0.1;
	this.targetPos = new Vector(x, y, z);
	this.velocity = new Vector(0.0, 0.0, 0.0);
	
	this.update = function(friction) {
		var dx = this.targetPos.x - this.curPos.x;
		var ax = dx * this.springStrength;
		this.velocity.x += ax;
		this.velocity.x *= 1 - friction;
		this.curPos.x += this.velocity.x;
		
		var dy = this.targetPos.y - this.curPos.y;
		var ay = dy * this.springStrength;
		this.velocity.y += ay;
		this.velocity.y *= 1 - friction;
		this.curPos.y += this.velocity.y;
		
		var dox = this.originalPos.x - this.curPos.x;
		var doy = this.originalPos.y - this.curPos.y;
		var dd = (dox * dox) + (doy * doy);
		var d = Math.sqrt(dd);
		
		this.targetPos.z = d/100 + 1;
		var dz = this.targetPos.z - this.curPos.z;
		var az = dz * this.springStrength;
		this.velocity.z += az;
		this.velocity.z *= 1 - friction;
		this.curPos.z += this.velocity.z;
		
		this.radius = this.size*this.curPos.z;
		if (this.radius < 1) this.radius = 1;
	};
	
	this.draw = function(ctx) {
		ctx.fillStyle = this.colour;
		ctx.beginPath();
		ctx.arc(this.curPos.x, this.curPos.y, this.radius, 0, Math.PI*2, true);
		ctx.fill();
	};
};