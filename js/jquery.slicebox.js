;( function( $, window, undefined ) {
	
	'use strict';

	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {

			var context = this,
				args = arguments,
				dispatch = function() {

					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 50
	};
    

	var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

	$.fn.imagesLoaded = function( callback ) {
		var $this = this,
			deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
			hasNotify = $.isFunction(deferred.notify),
			$images = $this.find('img').add( $this.filter('img') ),
			loaded = [],
			proper = [],
			broken = [];

		if ($.isPlainObject(callback)) {
			$.each(callback, function (key, value) {
				if (key === 'callback') {
					callback = value;
				} else if (deferred) {
					deferred[key](value);
				}
			});
		}

		function doneLoading() {
			var $proper = $(proper),
				$broken = $(broken);

			if ( deferred ) {
				if ( broken.length ) {
					deferred.reject( $images, $proper, $broken );
				} else {
					deferred.resolve( $images );
				}
			}

			if ( $.isFunction( callback ) ) {
				callback.call( $this, $images, $proper, $broken );
			}
		}

		function imgLoaded( img, isBroken ) {
	
			if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
				return;
			}

			loaded.push( img );

			if ( isBroken ) {
				broken.push( img );
			} else {
				proper.push( img );
			}

			$.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

			if ( hasNotify ) {
				deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
			}

			if ( $images.length === loaded.length ){
				setTimeout( doneLoading );
				$images.unbind( '.imagesLoaded' );
			}
		}

		if ( !$images.length ) {
			doneLoading();
		} else {
			$images.bind( 'load.imagesLoaded error.imagesLoaded', function( event ){

				imgLoaded( event.target, event.type === 'error' );
			}).each( function( i, el ) {
				var src = el.src;

				var cached = $.data( el, 'imagesLoaded' );
				if ( cached && cached.src === src ) {
					imgLoaded( el, cached.isBroken );
					return;
				}

				if ( el.complete && el.naturalWidth !== undefined ) {
					imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
					return;
				}

				if ( el.readyState || el.complete ) {
					el.src = BLANK;
					el.src = src;
				}
			});
		}

		return deferred ? deferred.promise( $this ) : $this;
	};

	var $window = $( window ),
		Modernizr = window.Modernizr;

	$.Slicebox = function( options, element ) {
		
		this.$el = $( element );
		this._init( options );
		
	};

	$.Slicebox.defaults = {
		orientation : 'v',

		perspective : 1200,

		cuboidsCount : 5,

		cuboidsRandom : false,

		maxCuboidsCount : 5,

		disperseFactor : 0,

		colorHiddenSides : '#222',

		sequentialFactor : 150,

		speed : 600,

		easing : 'ease',

		autoplay : false,
	
		interval: 3000,

		fallbackFadeSpeed : 300,

		onBeforeChange : function( position ) { return false; },
		onAfterChange : function( position ) { return false; },
		onReady : function() { return false; }
	};

	$.Slicebox.prototype = {

		_init : function( options ) {
			
			this.options = $.extend( true, {}, $.Slicebox.defaults, options );

			this._validate();

			this.$items = this.$el.children( 'li' );

			this.itemsCount = this.$items.length;

			if(this.itemsCount === 0 ) {

				return false;

			};

			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;
			
			this.current = 0;
			
			this.isAnimating = false;
			
			this.isReady = false;
			
			var self = this;
			this.$el.imagesLoaded( function() {

				var $current = self.$items.eq( self.current ).css( 'display', 'block' ).addClass( 'sb-current' );

				var i = new Image();
				i.src = $current.find( 'img' ).attr( 'src' );
				self.realWidth = i.width;

				self._setSize();
				self._setStyle();
				self._initEvents();

				self.options.onReady();
				self.isReady = true;

				if( self.options.autoplay ) {
					
					self._startSlideshow();

				}

			});

		},
		_validate			: function( options ) {

			if( this.options.cuboidsCount < 0 ){

				this.options.cuboidsCount = 1;

			}
			else if( this.options.cuboidsCount > 15 ) {

				this.options.cuboidsCount = 15;

			}
			else if( this.options.cuboidsCount %2 === 0 ) {

				++this.options.cuboidsCount;

			}
			
			if( this.options.maxCuboidsCount < 0 ){

				this.options.maxCuboidsCount = 1;

			}
			else if( this.options.maxCuboidsCount > 15 ) {

				this.options.maxCuboidsCount = 15;

			}
			else if( this.options.maxCuboidsCount %2 === 0 ) {

				++this.options.maxCuboidsCount;

			}
			
			if( this.options.disperseFactor < 0 ) {

				this.options.disperseFactor = 0;

			}
			
			if( this.options.orientation !== 'v' && this.options.orientation !== 'h' && this.options.orientation !== 'r' ) {

				this.options.orientation = 'v';

			}

		},
		_setSize : function() {

			var $visible = this.$items.eq( this.current ).find( 'img' );

			this.size = {
				width	: $visible.width(),
				height	: $visible.height()
			};

		},
		_setStyle : function() {

			this.$el.css( {
				'max-width' : this.realWidth
			} );

		},
		_initEvents : function() {

			var self = this;

			$window.on( 'debouncedresize.slicebox', function( event ) {

				self._setSize();

			} );

		},
		_startSlideshow: function() {

			var self = this;

			this.slideshow = setTimeout( function() {

				self._navigate( 'next' );

				if ( self.options.autoplay ) {

					self._startSlideshow();

				}

			}, this.options.interval );

		},
		_stopSlideshow: function() {

			if ( this.options.autoplay ) {

				clearTimeout( this.slideshow );
				this.isPlaying = false;
				this.options.autoplay = false;

			}

		},
		_navigate : function( dir, pos ) {

			if( this.isAnimating || !this.isReady || this.itemsCount < 2 ) {

				return false;

			}

			this.isAnimating = true;
			
			this.prev = this.current;

			if( pos !== undefined ) {

				this.current = pos;

			}
            
			else if( dir === 'next' ) {

				this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;

			}
			else if( dir === 'prev' ) {

				this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;

			}


			this.options.onBeforeChange( this.current );

			if( !this.support ) {
				
				this._fade( dir );

			}
			else {

				this._layout( dir );
				this._rotate();
			
			}

		},
		_fade : function( dir ) {

			var self = this,
				$visible = this.$items.eq( this.prev ),
				h = $visible.find( 'img' ).height();

			this.$el.css( 'height', h );
			this.$items.css( 'position', 'absolute' );
			
			this.$items.eq( this.current ).fadeIn( this.options.fallbackFadeSpeed, function() {

				$( this ).css( 'display', 'block' ).addClass( 'sb-current' );
				self.$el.css( 'height', 'auto' );
				self.$items.css( 'position', 'relative' );
				self.isAnimating = false;

			} );
			self.$items.eq( self.prev ).removeClass( 'sb-current' ).fadeOut( this.options.fallbackFadeSpeed );

		},
		_layout : function( dir ) {

			var orientation = this.options.orientation;

			if( orientation === 'r' ) {

				orientation = Math.floor( Math.random() * 2 ) === 0 ? 'v' : 'h';

			}

			if( this.options.cuboidsRandom ) {

				this.options.cuboidsCount = Math.floor( Math.random() * this.options.maxCuboidsCount + 1 );
			
			}
			
			this._validate();
			
			var boxStyle = {
					'width' : this.size.width,
					'height' : this.size.height,
					'perspective' : this.options.perspective + 'px'
				},
				config = $.extend( this.options, {
					size : this.size,
					items : this.$items,
					direction : dir,
					prev : this.prev,
					current : this.current,
					o : orientation
				} ),
				self = this;

			this.$box = $('<div>').addClass( 'sb-perspective' ).css( boxStyle ).appendTo( this.$el );

			this.cuboids = [];

			this.$el.css( 'overflow', 'visible' );

			for( var i = 0; i < this.options.cuboidsCount; ++i ) {

				var cuboid = new $.Cuboid( config, i );
				
				this.$box.append( cuboid.getEl() );

				this.cuboids.push( cuboid );

			}

		},
		_rotate : function() {
            
			this.$items.eq( this.prev ).removeClass( 'sb-current' ).hide();

			for( var i = 0; i < this.options.cuboidsCount; ++i ) {

				var cuboid = this.cuboids[ i ],
					self = this;

				cuboid.rotate( function( pos ) {

					if( pos === self.options.cuboidsCount - 1 ) {

						self.$el.css( 'overflow', 'hidden' );
						self.isAnimating = false;
						self.$box.remove();
						var $current = self.$items.eq( self.current );
						$current.css( 'display', 'block' ); 
						setTimeout(function() {
							$current.addClass( 'sb-current' );
						} , 0 );
						self.options.onAfterChange( self.current );

					}

				});

			}

		},
		_destroy : function( callback ) {
			
			this.$el.off( '.slicebox' ).removeData( 'slicebox' );
			$window.off( '.slicebox' );
			callback.call();

		},
	
		add : function( $items, callback ) {

			this.$items = this.$items.add( $items );
			this.itemsCount = this.$items.length;

			if ( callback ) {

				callback.call( $items );

			}

		},
	
		next : function() {

			this._stopSlideshow();
			this._navigate( 'next' );

		},

		previous : function() {

			this._stopSlideshow();
			this._navigate( 'prev' );

		},

		jump : function( pos ) {

			pos -= 1;

			if( pos === this.current || pos >= this.itemsCount || pos < 0 ) {

				return false;

			}

			this._stopSlideshow();
			this._navigate( pos > this.current ? 'next' : 'prev', pos );

		},

		play : function() {

			if( !this.isPlaying ) {

				this.isPlaying = true;

				this._navigate( 'next' );
				this.options.autoplay = true;
				this._startSlideshow();

			}

		},

		pause : function() {

			if( this.isPlaying ) {

				this._stopSlideshow();

			}

		},
	
		isActive : function() {

			return this.isAnimating;

		},

		destroy : function( callback ) {

			this._destroy( callback );
		
		}

	};

	$.Cuboid = function( config, pos ) {

		this.config = config;
		this.pos = pos;
		this.side = 1;
		this._setSize();
		this._configureStyles();

	};

	$.Cuboid.prototype = {

		_setSize : function() {

			this.size = {
				width : this.config.o === 'v' ? Math.floor( this.config.size.width / this.config.cuboidsCount ) : this.config.size.width,
				height : this.config.o === 'v' ? this.config.size.height : Math.floor( this.config.size.height / this.config.cuboidsCount )
			};

			this.extra = this.config.o === 'v' ? this.config.size.width - ( this.size.width * this.config.cuboidsCount ) : this.config.size.height - ( this.size.height * this.config.cuboidsCount );

		},
		_configureStyles : function() {

			var middlepos = Math.ceil( this.config.cuboidsCount / 2 ),
				positionStyle = this.pos < middlepos ? {
					zIndex : ( this.pos + 1 ) * 100,
					left : ( this.config.o === 'v' ) ? this.size.width * this.pos : 0,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height * this.pos
				} : {
					zIndex : (this.config.cuboidsCount - this.pos) * 100,
					left : ( this.config.o === 'v' ) ? this.size.width * this.pos : 0,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height * this.pos
				};

			this.disperseFactor = this.config.disperseFactor * ( ( this.pos + 1 ) - middlepos );

			this.style = $.extend( {
				'-webkit-transition' : '-webkit-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'-moz-transition' : '-moz-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'-o-transition' : '-o-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'-ms-transition' : '-ms-transform ' + this.config.speed + 'ms ' + this.config.easing,
				'transition' : 'transform ' + this.config.speed + 'ms ' + this.config.easing
			}, positionStyle, this.size );

			this.animationStyles = {
				side1 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px )' },
				side2 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px ) rotate3d( 1, 0, 0, -90deg )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px ) rotate3d( 0, 1, 0, -90deg )' },
				side3 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px ) rotate3d( 1, 0, 0, -180deg )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px ) rotate3d( 0, 1, 0, -180deg )' },
				side4 : ( this.config.o === 'v' ) ? { 'transform' : 'translate3d( 0, 0, -' + ( this.size.height / 2 ) + 'px ) rotate3d( 1, 0, 0, -270deg )' } : { 'transform' : 'translate3d( 0, 0, -' + ( this.size.width / 2 ) + 'px ) rotate3d( 0, 1, 0, -270deg )' }
			};

			var measure = ( this.config.o === 'v' ) ? this.size.height : this.size.width;

			this.sidesStyles = {
				frontSideStyle : {
					width : ( this.config.o === 'v' ) ? this.size.width + this.extra : this.size.width,
					height : ( this.config.o === 'v' ) ? this.size.height : this.size.height + this.extra,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, 0deg ) translate3d( 0, 0, ' + ( measure / 2 ) + 'px )'
				},
				backSideStyle : {
					width : this.size.width,
					height : this.size.height,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, 180deg ) translate3d( 0, 0, ' + ( measure / 2 ) + 'px ) rotateZ( 180deg )'
				},
				rightSideStyle : {
					width : measure,
					height : ( this.config.o === 'v' ) ? this.size.height : this.size.height + this.extra,
					left : ( this.config.o === 'v' ) ? this.size.width / 2 - this.size.height / 2 : 0,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, 90deg ) translate3d( 0, 0, ' + ( this.size.width / 2 ) + 'px )'
				},
				leftSideStyle : {
					width : measure,
					height : ( this.config.o === 'v' ) ? this.size.height : this.size.height + this.extra,
					left : ( this.config.o === 'v' ) ? this.size.width / 2 - this.size.height / 2  : 0,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 0, 1, 0, -90deg ) translate3d( 0, 0, ' + ( this.size.width / 2 ) + 'px )'
				},
				topSideStyle : {
					width : ( this.config.o === 'v' ) ? this.size.width + this.extra : this.size.width,
					height : measure,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height / 2 - this.size.width / 2,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 1, 0, 0, 90deg ) translate3d( 0, 0, ' + ( this.size.height / 2 ) + 'px )'
				},
				bottomSideStyle : {
					width : ( this.config.o === 'v' ) ? this.size.width + this.extra : this.size.width,
					height : measure,
					top : ( this.config.o === 'v' ) ? 0 : this.size.height / 2 - this.size.width / 2,
					backgroundColor : this.config.colorHiddenSides,
					transform : 'rotate3d( 1, 0, 0, -90deg ) translate3d( 0, 0, ' + ( this.size.height / 2 ) + 'px )'
				}
			};

		},
		getEl : function() {

			this.$el = $('<div/>').css( this.style )
					.css( this.animationStyles.side1 )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.frontSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.backSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.rightSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.leftSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.topSideStyle ) )
					.append( $('<div/>').addClass('sb-side').css( this.sidesStyles.bottomSideStyle ) );
			
			this._showImage( this.config.prev );
			
			return this.$el;

		},
		_showImage : function( imgPos ) {

			var sideIdx,
				$item = this.config.items.eq( imgPos ),
				imgParam = {
					'background-size' : this.config.size.width + 'px ' + this.config.size.height + 'px'
				};

			imgParam.backgroundImage = 'url(' + $item.find( 'img' ).attr('src') + ')';
			
			switch( this.side ) {

				case 1 : sideIdx = 0; break;
				case 2 : sideIdx = ( this.config.o === 'v' ) ? 4 : 2; break;
				case 3 : sideIdx = 1; break;
				case 4 : sideIdx = ( this.config.o === 'v' ) ? 5 : 3; break;

			};

			imgParam.backgroundPosition = ( this.config.o === 'v' ) ? - ( this.pos * this.size.width ) + 'px 0px' : '0px -' + ( this.pos * this.size.height ) + 'px';
			this.$el.children().eq( sideIdx ).css( imgParam );

		},
		rotate : function( callback ) {

			var self = this, animationStyle;

			setTimeout(function() {

				if( self.config.direction === 'next' ) {

					switch( self.side ) {
						case 1 : animationStyle = self.animationStyles.side2; self.side = 2; break;
						case 2 : animationStyle = self.animationStyles.side3; self.side = 3; break;
						case 3 : animationStyle = self.animationStyles.side4; self.side = 4; break;
						case 4 : animationStyle = self.animationStyles.side1; self.side = 1; break;
					};
				
				}
				else {

					switch( self.side ) {
						case 1 : animationStyle = self.animationStyles.side4; self.side = 4; break;
						case 2 : animationStyle = self.animationStyles.side1; self.side = 1; break;
						case 3 : animationStyle = self.animationStyles.side2; self.side = 2; break;
						case 4 : animationStyle = self.animationStyles.side3; self.side = 3; break;
					};

				}
				
				self._showImage( self.config.current );
				
				var animateOut 	= {}, animateIn	= {};
				
				if( self.config.o === 'v' ) {

					animateOut.left = '+=' + self.disperseFactor + 'px';
					animateIn.left = '-=' + self.disperseFactor + 'px';
				
				}
				else if( self.config.o === 'h' ) {

					animateOut.top = '+=' + self.disperseFactor + 'px';
					animateIn.top = '-=' + self.disperseFactor + 'px';
				
				}

				self.$el.css( animationStyle ).animate( animateOut, self.config.speed / 2 ).animate( animateIn, self.config.speed / 2 , function() {
					
					if( callback ) {

						callback.call( self, self.pos );

					}

				});

			}, this.config.sequentialFactor * this.pos + 30 );

		}

	};
	
	var logError = function( message ) {

		if ( window.console ) {

			window.console.error( message );
		
		}

	};
	
	$.fn.slicebox = function( options ) {

		var self = $.data( this, 'slicebox' );
		
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			
			this.each(function() {
			
				if ( !self ) {

					logError( "cannot call methods on slicebox prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				
				}
				
				if ( !$.isFunction( self[options] ) || options.charAt(0) === "_" ) {

					logError( "no such method '" + options + "' for slicebox self" );
					return;
				
				}
				
				self[ options ].apply( self, args );
			
			});
		
		} 
		else {
		
			this.each(function() {
				
				if ( self ) {

					self._init();
				
				}
				else {

					self = $.data( this, 'slicebox', new $.Slicebox( options, this ) );
				
				}

			});
		
		}
		
		return self;
		
	};
	
} )( jQuery, window );
