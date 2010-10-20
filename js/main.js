$(function() {
	
	var canvas = $('#c'),
		friction = 0.8,
		defaultFriction = 0.2,
		
		pointCollection,
		canvasHeight,
		canvasWidth;
	
	(function init() {
		if (Modernizr.canvas) {
			updateCanvasDimensions();
			preloadImages();
			
			// Setup default parameters then override 
			// with values in page fragment
			setupParameters();
			setupFromPageFragment();
			setup($('#url').val() || 'images/'+$('#image').val());
			
			initEventListeners();
			timeout();
		} else {
			$('#canvasNotSupportedMessage').show();
		}
	})();
	
	/**
	 * Generates an ImagePointCollection from the given image
	 * source.
	 * 
	 * @param img A string representing the image source. 
	 */
	function setup(img) {
		// Work out an offset to centre the image on the canvas
		var xOrigin = ($(canvas).width() + 250) / 2,
			yOrigin = $(canvas).height() / 2;
		
		pointCollection = new ImagePointCollection(img, $('#imageSize').val(), xOrigin, yOrigin, {
			ballSize: parseInt($('#ballSize').val(), 10),
		    spacing: parseInt($('#spacing').val(), 10),
		    variance: parseInt($('#variance').val(), 10)
		});
	};
	
	/**
	 * Sets up event listeners for mouse movement and
	 * updates to the controls.
	 */
	function initEventListeners() {
		$(window).bind('mousemove', onMove);
        
        canvas[0].ontouchmove = onTouchMove;
        canvas[0].ontouchend = onTouchEnd;
        canvas[0].ontouchstart = function(e) {
            e.preventDefault();
        };
		
		$('#imageForm').submit(function(e) {
			var urlVal = $('#url').val(),
				imageVal = $('#image').val();
			
			location.hash = (urlVal && 'url' || 'image') + '=' + (urlVal || imageVal);
			setupParameters();
			setup(urlVal || 'images/' + imageVal);
			e.preventDefault();
		});
		
		$('#controls input.redraw').change(function() {
			// Work out an offset to centre the image on the canvas
			var xOrigin = ($(canvas).width() + 250) / 2,
				yOrigin = $(canvas).height() / 2;
			
			updatePageFragment(this.id, $(this).val());
			pointCollection.maxLength = $('#imageSize').val();
			pointCollection.updateOptions({
				ballSize: parseInt($('#ballSize').val(), 10),
			    spacing: parseInt($('#spacing').val(), 10),
			    variance: parseInt($('#variance').val(), 10)
			});
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
		var el = $('#image option:selected');
		
		$('#imageSize').val(el.attr('data-imageSize'));
		$('#spacing').val(el.attr('data-spacing'));
		$('#ballSize').val(el.attr('data-ballSize'));
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
		canvasWidth = $(canvas).width();
		canvasHeight = $(canvas).height();
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
    
    function onTouchMove(e) {
    	e.preventDefault();
        if (pointCollection)
            pointCollection.mousePos.set(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
    };
    
    function onTouchEnd(e) {
    	e.preventDefault();
        if (pointCollection)
            pointCollection.mousePos.set(0, 0);
    };
	
	function timeout() {
		draw();
		update(friction);
		setTimeout(function() { timeout(); }, 30);
	};
	
	function draw() {
		var tmpCanvas = canvas[0];
		if (tmpCanvas.getContext && pointCollection) {
			var ctx = tmpCanvas.getContext('2d');
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			pointCollection.draw(ctx);
		}
	};
	
	function update() {		
		if (pointCollection)
			pointCollection.update(friction);
	};
});