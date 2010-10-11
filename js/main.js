$(function() {
	
	var canvas = $("#c"),
		friction = 0.8,
		defaultFriction = 0.2,
		leftMargin = 250,
		
		pointCollection,
		canvasHeight,
		canvasWidth,
		ctx;
	
	function init() {
		if (Modernizr.canvas) {
			updateCanvasDimensions();
			preloadImages();
			
			// Setup default parameters then override 
			// with values in page fragment
			setupParameters();
			setupFromPageFragment();
			setup('images/'+$('#image').val());
			
			initEventListeners();
			timeout();
		} else {
			$('#canvasNotSupportedMessage').show();
		}
	};
	
	/**
	 * Generates a PointCollection from the given image
	 * source and sets the pointCollection variable above 
	 * once generated.
	 * 
	 * @param img A string representing the image source. 
	 */
	function setup(img) {
		PointCollection.fromImage(img, function(imgPointCollection) {
			pointCollection = imgPointCollection;
		},{
			size: parseInt($('#ballSize').val(), 10),
		    spacing: parseInt($('#spacing').val(), 10),
		    maxLength: parseInt($('#maxLength').val(), 10),
		    variance: parseInt($('#variance').val(), 10)
		});
	};
	
	/**
	 * Sets up event listeners for mouse movement and
	 * updates to the controls.
	 */
	function initEventListeners() {
		$(window).bind('mousemove', onMove);
		
		$('#controls input.redraw').change(function() {
			updatePageFragment(this.id, $(this).val());
			setup('images/'+$('#image').val());
		});
		
		$('#controls select').change(function() {
			location.hash = this.id+'='+$(this).val();
			setupParameters();
			setup('images/'+$('#image').val());
		});
		
		$('#friction').change(function() {
			var rounded = Math.round(parseFloat($(this).val()) * 10) / 10;
			updatePageFragment(this.id, rounded);
			friction = parseFloat($(this).val());
		});
	};
	
	/**
	 * Sets up the controls according to the parameters
	 * in the page fragment. Called on dom:load to provide
	 * support for bookmarking.
	 */
	function setupFromPageFragment() {
		var hash = location.hash,
			params = hash.replace('#','').split('&');
		
		if (hash) {
			for (var i=0, len=params.length, param; i < len; i++) {
				param = params[i].split('=');
				$('#'+param[0]).val(param[1]);
			}

			friction = parseFloat($('#friction').val());
			if (hash.match(/#image=[\.0-9a-zA-Z]+$/)) {
				setupParameters();
			}
		}
	};
	
	/**
	 * Sets up the controls according to the data-* attributes
	 * on the selected image option.
	 */
	function setupParameters() {
		var el = $('#controls select option:selected');
		
		$('#maxLength').val(el.attr('data-maxLength'));
		$('#spacing').val(el.attr('data-spacing'));
		$('#ballSize').val(el.attr('data-size'));
		$('#variance').val(el.attr('data-variance') || 0);
		$('#friction').val(defaultFriction);
		
		friction = defaultFriction;
	};
	
	/**
	 * Sets the given key-value pair in the page fragment (hash).
	 * Replaces the key value if already present, else appends.
	 * 
	 * @param key The key to use.
	 * @param value The value to assign to the key.
	 */
	function updatePageFragment(key, value) {
		var hash = location.hash,
			reg = new RegExp(key + '=[\.0-9a-zA-Z]+'),
			param = key+'='+value;
		
		location.hash = hash.match(reg) ? hash.replace(reg, param) : hash + (hash ? '&' : '') + param;
	};
	
	/**
	 * Resizes the canvas according to the window size.
	 */
	function updateCanvasDimensions() {
		canvas.attr({height: $(window).height(), width: $(window).width()});
		canvasWidth = canvas.width();
		canvasHeight = canvas.height();
		draw();
	};
	
	/**
	 * Preloads all images in the image select.
	 */
	function preloadImages() {
		$('#controls option').each(function() {
			(new Image()).src = 'images/'+$(this).val();
		});
	};
	
	function onMove(e) {
		if (pointCollection)
			pointCollection.mousePos.set(e.pageX, e.pageY);
	};
	
	function timeout() {
		draw();
		update();
		
		setTimeout(function() { timeout() }, 30);
	};
	
	function draw() {
		var tmpCanvas = canvas.get(0);

		if (tmpCanvas.getContext == null) {
			return; 
		};
		
		ctx = tmpCanvas.getContext('2d');
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		
		if (pointCollection)
			pointCollection.draw();
	};
	
	function update() {		
		if (pointCollection)
			pointCollection.update();
	};
	
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
	
	function PointCollection() {
		this.mousePos = new Vector(0, 0);
		this.points = new Array();
		
		this.newPoint = function(x, y, z) {
			var point = new Point(x, y, z);
			this.points.push(point);
			return point;
		};
		
		this.update = function() {		
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
				
				point.update();
			};
		};
		
		this.draw = function() {
			var pointsLength = this.points.length;
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;

				point.draw();
			};
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
		
		this.update = function() {
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
		
		this.draw = function() {
			ctx.fillStyle = this.colour;
			ctx.beginPath();
			ctx.arc(this.curPos.x, this.curPos.y, this.radius, 0, Math.PI*2, true);
			ctx.fill();
		};
	};
	
	/**
	 * A static factory method to generate a PointCollection from
	 * the pixel data in the given image.
	 * 
	 * @param src The source of the image to generate the PointCollection
	 * 		from.
	 * @param callback A function to be called once the PointCollection has
	 * 		finished loading. The pointCollection will be passed as the first
	 * 		argument.
	 * @param options An object literal containing:
	 * 			size: The target size of each Point.
	 * 			spacing: The amount of spacing between each point.
	 * 			maxLength: The target length of the longest side of
	 * 					the generated PointCollection, measured in Points.
	 * 			variance: The level of variance allowed from the requested
	 * 					size of each ball.
	 */
	PointCollection.fromImage = function(src, callback, options) {
		var img = new Image();
	
		// Setup an event listener to set the points on the
		// PointCollection and call the callback once the image 
		// has loaded.
	    img.onload = function(){
	    	
	    	// Setup some default options
	    	options = $.extend({
				size: 4,
			    spacing: 14,
			    maxLength: 24,
			    variance: 0
	    	}, options);
	    	
		    var arr = new Array(),
		    	// Work out the scaled dimensions
				dims = getDimensions(img.width, img.height, options.maxLength),
				// Get the pixel data for the image
	    		data = getImageData(img, dims),
	    		// Work out an offset to centre the image on the canvas
	    		offsetLeft = dims.width * options.spacing,
				offsetTop = dims.height * options.spacing,
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
	    			// Original x and y position * spacing between balls + offset to centre on screen
	    			x = (i/4)%dims.width * options.spacing + (canvasWidth + leftMargin - offsetLeft) / 2;
		    	  	y = Math.floor(i/(4*dims.width)) * options.spacing + (canvasHeight - offsetTop) / 2;
		    	  	// Randomise the size of the balls based on the specified variance
		    	  	varSize = options.size + (Math.random() * options.variance / 100 * options.size);
		    	    
		    	  	// Now we have a location, size and colour, add it to the array
	    			arr.push(new Point(x, 
						y,
						0.0,
						varSize,
						color));
	    		}
			}
			
			// Now set the points on the pointCollection and call the callback
			var pointCollection = new PointCollection()
			pointCollection.points = arr;
			callback.call(this, pointCollection);
		};
		
	    img.src = src;
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
	    
    	srcCanvas.width = dims.width;
    	srcCanvas.height = dims.height;
		ctx.drawImage(img, 0, 0, dims.width, dims.height);
		return ctx.getImageData(0, 0, dims.width, dims.height).data;
	};
	
	/**
	 * Calculates the width and height of an image after it is scaled
	 * such that the longest edge === maxLength.
	 * 
	 * @param imgWidth The current width of the image.
	 * @param imgHeight The curent height of the image.
	 * @param maxLength The maximum length of the scaled dimensions.
	 * @return An object literal:
	 * 			width: The scaled width.
	 * 			height: The scaled height.
	 */
	function getDimensions(imgWidth, imgHeight, maxLength) {
		var mult = maxLength / Math.max(imgWidth, imgHeight);
		return {
			width: Math.floor(imgWidth * mult),
			height: Math.floor(imgHeight * mult)
		};
	};
	
	init();
});