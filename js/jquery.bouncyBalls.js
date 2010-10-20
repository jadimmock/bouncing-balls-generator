/*!
 * A jQuery plugin to replace all matched <img> elements with its 
 * bouncy balls implementation. 
 * 
 * Based on the Google's 'bouncy balls' doodle and Rob Hawkes' canvas 
 * implementation (http://goo.gl/fbPt). For more information please
 * see the blog post (http://goo.gl/4OEC).
 * 
 * Usage: $('#myImg').bouncyBalls();
 * 
 * Options: 		
 * 		ballSize: The size of each point / ball.
 *		spacing: The amount of spacing between each point / ball.
 *		variance: The variance in ball size (0-1).
 *		friction: The amount of friction (0-1).
 *		zIndex: The z-index of the canvas onto which the balls
 *			are rendered. While it is transparent, if it is above
 *			the content you won't be able to click / select anything.
 *			The pointer position is detected on mousemove over the
 *			body, so will work irrespective of the canvas z-index. 
 */
(function($) {
	
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
	
	/**
	 * Represents a PointCollection generated from an image. Extends 
	 * PointCollection.
	 * 
	 * @param src The source of the image to generate the PointCollection
	 * 		from.
	 * @param maxLength: The length of the longest size of the bouncy balls
	 * 		image (in px).
	 * @param xOrigin: The origin of the bouncy balls image along the x
	 * 		axis.
	 * @param yOrigin: The origin of the bouncy balls image along the y
	 * 		axis.
	 * @param options An object literal containing:
	 * 			ballSize: The target size of each point.
	 * 			spacing: The amount of spacing (in px) between points.
	 * 			variance: The level of variance allowed from the requested
	 * 					size of each ball.
	 */
	function ImagePointCollection(src, maxLength, xOrigin, yOrigin, options) {
		
		var dataUriService = 'http://jadimmock.com/services/datauriservice/';
		
		this.src = src;
		this.img = new Image();
		this.maxLength = maxLength || 200;
		this.xOrigin = xOrigin;
		this.yOrigin = yOrigin;
		
		this.ballSize = options && options.ballSize || 3;
		this.spacing = options && options.spacing || 14;
		this.variance = options && options.variance || 0;
		
		// Once the image has loaded, generate the set of points
	    this.img.onload = onImageReady(this);
	    
	    // Load the image (handles local and remote files)
		loadImage(this.img, this.src);
		
		/**
		 * Updates the options on this ImagePointCollection
		 * and regenerates the points based on the specified
		 * values.
		 * 
		 * @param options An object literal containing:
		 * 			ballSize: The target size of each point.
		 * 			spacing: The amount of spacing (in px) between points.
	 	 * 			variance: The level of variance allowed from the requested
	 	 * 					size of each ball.
		 */
		this.updateOptions = function(options) {
			this.ballSize = options && options.ballSize || this.ballSize;
			this.spacing = options && options.spacing || this.spacing;
			this.variance = options && options.variance || this.variance;
			onImageReady(this).call(this);
		};
	    
		/**
		 * Returns a function to be executed when the image
		 * has loaded. The returned function creates the set
		 * of points from the image data and options specified
		 * on the ImagePointCollection passed in.
		 * 
		 * @param col The ImagePointCollection to be populated,
		 * 		with the appropriate config values set.
		 * @return A function to generate the points once the
		 * 		image has loaded.
		 */
	    function onImageReady(col) {
	    	var img = col.img,
	    		maxLength = col.maxLength,
	    		ballSize = col.ballSize,
	    		variance = col.variance,
	    		spacing = col.spacing;
	    	
	    	return function() {
	    		
		    	var arr = new Array(),
			    	// Work out the scaled dimensions
					dims = getDimensions(img, maxLength, spacing),
					// Get the pixel data for the image
		    		data = getImageData(img, dims),
		    		// Work out the left and top offset
		    		leftMargin = (col.xOrigin || (spacing * dims.width)) - (spacing * dims.width / 2),
		    		topMargin = (col.yOrigin || (spacing * dims.width)) - (spacing * dims.height / 2),
		    		// Variables for the loop
		    		color, x, y, r, g, b, a;
		      
				// Now iterate over the pixels and create a point
				// for each pixel
				for (var i=0, len=data.length; i < len; i+=4) {
					r = data[i];
					g = data[i+1];
					b = data[i+2];
					a = data[i+3];
		    	  
					// Don't create a pixel if it's barely visible
					// (to improve performance)
		    		if (r < 250 || g < 250 || b < 250) {
		    			color = "rgba("+r+","+g+","+b+", "+a+")";
		    			// Original x and y position * spacing between balls + offset to position on screen
		    			x = leftMargin + ((i/4)%dims.width + 0.5) * spacing;
			    	  	y = topMargin + (Math.floor(i/(4*dims.width)) + 0.5) * spacing;
			    	  	// Randomise the size of the balls based on the specified variance
			    	  	varSize = ballSize + (Math.random() * variance / 100 * ballSize);
			    	    
			    	  	// Now we have a location, size and colour, add it to the array
		    			arr.push(new Point(x, 
							y,
							0.0,
							varSize,
							color));
		    		}
				}
				
				// Now set the points on the pointCollection
				col.points = arr;
	    	};
	    };
		
	    /**
	     * Sets the src of the image object to be the given value. 
	     * If the src is not the same origin as the document, calls
	     * a web service to get the data URI encoding of the image,
	     * and sets the src accordingly.
	     *  
	     * @param img The img HTML element to load the data into.
	     * @param src The URI representing the location of the image
	     * 		file to load.
	     */
		function loadImage(img, src) {
			if (isSameOrigin(src)) {
				img.src = src;
			} else {
				jQuery.getJSON(dataUriService + '?url=' + src + '&jsoncallback=?', function(data) {
					img.width = data.width;
					img.height = data.height;
					img.src = data.data;
				});
			}
		};
		
		/**
		 * Tests whether the given URI is the same origin as the current
		 * document. That is, does it have the same domain name, application
		 * layer protocol and tcp port.
		 * 
		 * @param uri The uri to test.
		 */
		function isSameOrigin(uri) {
			var thisProtocol = location.protocol,
				thisDomain = location.host,
				thisPort = location.port,
				thisOrigin = new RegExp(thisProtocol + '//' + thisDomain + thisPort),
				isLocal = !(new RegExp('^http[s]?\:')).test(uri);
			
			return isLocal || thisOrigin.test(uri);
		};
		
		/**
		 * Draws the given image onto a canvas in the given
		 * dimensions and returns the associated ImageData.
		 * 
		 * @param img A loaded Image object to draw onto the canvas.
		 * 		Does not have to be the same size as the given
		 * 		target dimensions.
		 * @param dims An object literal with 'width' and 'height'
		 * 		keys corresponding to the target dimensions.
		 * @return an ImageData object with the data for the given image
		 * 		having been drawn onto the canvas.
		 */
		function getImageData(img, dims) {
	    	var srcCanvas = document.createElement('canvas'),
	    		ctx = srcCanvas.getContext('2d');

	    	if (!dims.width || !dims.height) {
	    		return [];
	    	}
		    
	    	srcCanvas.width = dims.width;
	    	srcCanvas.height = dims.height;
			ctx.drawImage(img, 0, 0, dims.width, dims.height);
			return ctx.getImageData(0, 0, dims.width, dims.height).data;
		};
		
		/**
		 * Calculates the width and height of an image after it is scaled.
		 */
		function getDimensions(img, maxLength, spacing) {
			var numBalls = Math.floor(maxLength / spacing),
				mult = numBalls / Math.max(img.width, img.height);
			
			return {
				width: Math.floor(img.width * mult),
				height: Math.floor(img.height * mult)
			};
		};
	};

	ImagePointCollection.prototype = new PointCollection();
	
	$.fn.bouncyBalls = function(options) {
		
		var canvas,
			friction = options.friction || 0.2,
			pointCollections = [],
			canvasHeight,
			canvasWidth;
		
		$(window).bind('mousemove', onMove);
		createCanvas();
		timeout();
		
		return this.each(function() {
			if (this.tagName.toLowerCase() === 'img') {
				var offset = $(this).offset(),
					width = $(this).width(),
					height = $(this).height(),
					xOrigin = offset.left + (width / 2),
					yOrigin = offset.top + (height / 2);
				
				if (width > 70 && height > 70) {
					try {
						pointCollections.push(new ImagePointCollection(
								this.src, Math.max(height, width), xOrigin, yOrigin));
						$(this).css('visibility','hidden');
					} catch(e) { }
				}
			}
		});
		
		function onMove(e) {
			for (var i=0, len=pointCollections.length; i<len; i++) {
				pointCollections[i].mousePos.set(e.pageX, e.pageY);
			}
		};
		
		function timeout() {
			draw();
			update(friction);
			setTimeout(function() { timeout(); }, 30);
		};
		
		function draw() {
			var tmpCanvas = canvas[0];
			if (tmpCanvas.getContext) {
				var ctx = tmpCanvas.getContext('2d');
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);
				
				for (var i=0, len=pointCollections.length; i<len; i++) {
					pointCollections[i].draw(ctx);
				}
			}
		};
		
		function update() {
			for (var i=0, len=pointCollections.length; i<len; i++) {
				pointCollections[i].update(friction);
			}
		};
		
		function createCanvas() {
			canvas = $(document.createElement('canvas'))
				.css({
					'position': 'absolute',
					'top': 0
				})
				.attr({
					height: $(document.body).height(), 
					width: $(document.body).width()
				});
			
			if (options.zIndex) {
				canvas.css('z-index', options.zIndex);
			}
			
			$(document.body).append(canvas);
			
			canvasWidth = $(canvas).width();
			canvasHeight = $(canvas).height();
		};
		
	};
	
})(jQuery);