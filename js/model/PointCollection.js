function PointCollection() {
	this.mousePos = new Vector(0, 0);
	this.points = new Array();
	
	this.newPoint = function(x, y, z) {
		var point = new Point(x, y, z);
		this.points.push(point);
		return point;
	};
	
	this.update = function(friction) {		
		var pointsLength = this.points.length;
		
		for (var i = 0; i < pointsLength; i++) {
			var point = this.points[i];
			
			if (point == null)
				continue;
			
			var dx = this.mousePos.x - point.curPos.x;
			var dy = this.mousePos.y - point.curPos.y;
			var dd = (dx * dx) + (dy * dy);
			var d = Math.sqrt(dd);
			
			if (d < 150) {
				point.targetPos.x = (this.mousePos.x < point.curPos.x) ? point.curPos.x - dx : point.curPos.x - dx;
				point.targetPos.y = (this.mousePos.y < point.curPos.y) ? point.curPos.y - dy : point.curPos.y - dy;
			} else {
				point.targetPos.x = point.originalPos.x;
				point.targetPos.y = point.originalPos.y;
			};
			
			point.update(friction);
		};
	};
	
	this.draw = function(ctx) {
		var pointsLength = this.points.length;
		for (var i = 0; i < pointsLength; i++) {
			var point = this.points[i];
			
			if (point == null)
				continue;

			point.draw(ctx);
		};
	};
};