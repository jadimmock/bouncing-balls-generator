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