/**
 * image filter jquery plugin
 * @author raphael marandet
 * 
 * Apply various filters on any image.
 * See README.md for instructions
 * 
 */
(function ($) {
	var PLUGIN_NAME = 'philter';
	var BUSY_VAR = ''; //PLUGIN_NAME + '_busy';
	var oPlugin = {};
	var oFilters = {};
	oPlugin[PLUGIN_NAME] = function(p1, p2) {
		var oDefaults = {
			matrix: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
			bias: 0,
			factor: 1,
			more: false,
			radius: 1,
			level: 50,
			interval: 200,
			sync: true,
			region: {
				left: 0,
				top: 0,
				width: null,
				height: null,
				right: 0,
				bottom: 0
			},
			channels: {
				red: true,
				green: true,
				blue: true,
				alpha: true
			}
		};
		
		var DATA_BACKUP = PLUGIN_NAME + '_imageBackup';
		
		// analyzing parameters
		var s1 = (typeof p1).charAt(0);
		var s2 = (typeof p2).charAt(0);
		var oOptions;
		switch (s1 + s2) {
			case 'su': // one string
				oOptions = {command: p1};
			break;
			
			case 'so': // one string, one object
				oOptions = p2;
				oOptions.command = p1;
			break;
			
			case 'ou': // one object
				oOptions = p1;
			break;
			
			case 'sf': // define new filter
				oFilters[p1] = p2;
				return;
			break;
			
			default:
				throw new Error('bad parameter format');
		}
		if (typeof oOptions.channels === 'string') {
			var s1 = oOptions.channels;
			oOptions.channels = {
				red: s1.indexOf('r') >= 0,
				green: s1.indexOf('g') >= 0,
				blue: s1.indexOf('b') >= 0,
				alpha: s1.indexOf('a') >= 0
			};
		}
		oOptions = $.extend(true, oDefaults, oOptions);

		var now;
		if ('performance' in window) {
			now = function() {
				return performance.now();
			};
		} else {
			now = function() {
				return Date.now();
			};
		}

		
		/**
		 * builds a canvas and copy the given image content inside this canvas
		 * builds a pixel buffer
		 * builds a structure containing references to the image, the canvas
		 * and the pixel buffer
		 * @param oImage DOM Image
		 * @return a structure
		 */
		function buildShadowCanvas(oImage, opt) {
			var $canvas = $('<canvas></canvas>');
			var w = oImage.naturalWidth;
			var h = oImage.naturalHeight;
			var oCanvas = $canvas.get(0);
			oCanvas.width = w;
			oCanvas.height = h;
			var ctx = oCanvas.getContext('2d');
			ctx.drawImage(oImage, 0, 0);
			var imgdata = ctx.getImageData(0, 0, w, h);
			var data = new Uint32Array(imgdata.data.buffer);
			
			var oSC = {
				options: opt,
				image: oImage,
				canvas: oCanvas,
				context: ctx,
				imageData: imgdata,
				pixelData: imgdata.data,
				pixels: data,
				width: w,
				height: h,
				_p: false
			};
			return oSC;
		}
		
		
		function setImageSource(image, sSrc, pDone) {
			var $image = $(image);
			var pLoad;
			pLoad = function(oEvent) {
				$image.off('load', pLoad);
				if (typeof pDone === 'function') {
					pDone(image);
				}
			};
			$image.on('load', pLoad);
			$image.attr('src', sSrc);
		}
		
		
		/**
		 * Copies the pixel data buffer to the original image ;
		 * This operation visually modify the image
		 * @param sc Structure built by buildShadowCanvas()
		 * @param pDone callback function called when the operation is done
		 * (modifying large image sources may be processed asynchronously)
		 */
		function commitShadowCanvas(sc, pDone) {
			if (sc._p) {
				sc.context.putImageData(sc.imageData, 0, 0);
			}
			var oImage = sc.image;
			var $image = $(oImage);
			if ($image.is('img')) {
				setImageSource(oImage, sc.canvas.toDataURL(), function() {
					pDone(sc);
				});
			} else {
				var ctx = oImage.getContext('2d');
				ctx.drawImage(sc.canvas, 0, 0);
				if (typeof pDone === 'function') {
					pDone(sc);
				}
			}
		}

		/**
		 * Change pixel value
		 * @param sc Shadow Canvas structure
		 * @param x pixel x
		 * @param y pixel y
		 * @param c Color structure {r: int, g: int, b: int, a: int}
		 */
		function setPixel(sc, x, y, c) {
			if (x >= 0 && y >= 0 && x < sc.width && y < sc.height) {
				var n = y * sc.width + x;
				sc.pixels[n] = c.r | (c.g << 8) | (c.b << 16) | (c.a << 24);
				sc._p = true;
			}
		}
		
		function getImageOptions(sc) {
			return sc.options;
		}

		function getRegion(sc) {
			var r = getImageOptions(sc).region;
			var xs = r.left;
			var ys = r.top;
			var xe = r.width !== null ? xs + r.width - 1 : null;
			var ye = r.height !== null ? ys + r.height - 1 : null;
			xe = xe !== null ? xe : sc.width - r.left - 1;
			ye = ye !== null ? ye : sc.height - r.right - 1;
			return {
				xs: xs,
				ys: ys,
				xe: xe,
				ye: ye
			};
		}
		
		/**
		 * Get a color structure of the given pixel
		 * if a color structure is specified, the function will fill this
		 * structure with pixel color values. this will prevent from
		 * building a new object each time a pixel is read,
		 * and will potentially increase overall performances
		 * in all cases, the color structure is also returned
		 * @param sc Shadow Canvas structure
		 * @param x pixel x
		 * @param y pixel y
		 * @param oResult optional Color structure {r: int, g: int, b: int, a: int}
		 * @return Color structure
		 */
		function getPixel(sc, x, y, oResult) {
			if (oResult === undefined) {
				oResult = {};
			}
			if (x >= 0 && y >= 0 && x < sc.width && y < sc.height) {
				var n = y * sc.width + x;
				var p = sc.pixels[n];
				oResult.r = p & 255;
				oResult.g = (p >> 8) & 255;
				oResult.b = (p >> 16) & 255;
				oResult.a = (p >> 24) & 255;
				return oResult;
			} else {
				return null;
			}
		}

		function pixelProcess(sc, pFunc, pDone, oAsyncContext) {
			var x, y, p = {}, r = {};
			if (!oAsyncContext) {
				oAsyncContext = {
					xs: 0,
					ys: 0,
					resume: function() {
						pixelProcess(sc, pFunc, pDone, oAsyncContext);
					}
				};
			}
			var opt = getImageOptions(sc);
			var w = sc.width;
			var h = sc.height;
			var Ch = opt.channels;
			var bChr = Ch.red;
			var bChg = Ch.green;
			var bChb = Ch.blue;
			var bCha = Ch.alpha;
			var factor = opt.factor;
			var bias = opt.bias;
			var nTimeStart = now();
			var nTime8;
			var nInterval = opt.interval;
			var r = getRegion(sc);
			var bSync = opt.sync;
			for (y = Math.max(r.ys, oAsyncContext.ys); y <= r.ye; ++y) {
				for (x = Math.max(r.xs, oAsyncContext.xs); x <= r.xe; ++x) {
					getPixel(sc, x, y, p);
					pFunc(sc, x, y, p);
					if (bChr) {
						r.r = Math.min(255, Math.max(0, factor * p.r + bias)) | 0;
					}
					if (bChg) {
						r.g = Math.min(255, Math.max(0, factor * p.g + bias)) | 0;
					}
					if (bChb) {
						r.b = Math.min(255, Math.max(0, factor * p.b + bias)) | 0;
					}
					if (bCha) {
						r.a = Math.min(255, Math.max(0, factor * p.a + bias)) | 0;
					}
					setPixel(sc, x, y, r);
				}
				if (!bSync && !(y & 7)) {
					nTime8 = now() - nTimeStart;
					if (y === 0 || nTime8 >= nInterval) {
						oAsyncContext.ys = y + 1;
						var f = (y - r.ys) / (r.ye - r.ys);
						$(sc.image).trigger(PLUGIN_NAME + '.progress', {
							filter: opt.command,
							f: f
						});
						requestAnimationFrame(oAsyncContext.resume);
						return;
					}
				}
			}
			if (typeof pDone === 'function') {
				pDone(sc);
			}
		}
		
		function filterContrast(sc, pDone) {
			var opt = getImageOptions(sc);
			var c = opt.level;
			var f = (259 * (c + 255)) / (255 * (259 - c));
			pixelProcess(sc, function(sc, x, y, p) {
				p.r = f * (p.r - 128) + 128;
				p.g = f * (p.g - 128) + 128;
				p.b = f * (p.b - 128) + 128;
			}, pDone);
		}

		function filterNegate(sc, pDone) {
			pixelProcess(sc, function(sc, x, y, p) {
				p.r = 255 - p.r;
				p.g = 255 - p.g;
				p.b = 255 - p.b;
			}, pDone);
		}
		
		function filterColor(sc, pDone) {
			var opt = getImageOptions(sc);
			var m = opt.matrix;
			if (m.length < 3) {
				throw new Error('color matrix must be 3x3 sized');
			}
			if (m[0].length < 3 || m[1].length < 3 || m[2].length < 3) {
				throw new Error('color matrix must be 3x3 sized');
			}
			pixelProcess(sc, function(sc, x, y, p) {
				var r = (p.r * m[0][0] + p.g * m[0][1] + p.b * m[0][2]);
				var g = (p.r * m[1][0] + p.g * m[1][1] + p.b * m[1][2]);
				var b = (p.r * m[2][0] + p.g * m[2][1] + p.b * m[2][2]);
				p.r = r;
				p.g = g;
				p.b = b;
			}, pDone);
		}
		
		function filterNoise(sc, pDone) {
			var opt = getImageOptions(sc);
			var nAmount = opt.level;
			pixelProcess(sc, function(sc, x, y, p) {
				var nb = nAmount * (Math.random() - 0.5);
				p.r = Math.min(255, Math.max(0, p.r + nb)) | 0;
				p.g = Math.min(255, Math.max(0, p.g + nb)) | 0;
				p.b = Math.min(255, Math.max(0, p.b + nb)) | 0;
			}, pDone);
		}
		
		
		/**
		 * filter: convolution
		 * applies a convolution matrix on the image
		 * used options:
		 * 	- matrix
		 *  - factor
		 * 	- bias
		 */
		function convolutionProcess(scs, pDone, oAsyncContext) {
			var x, y, p = {}, nc = {}, xyf;
			var scd;
			if (!oAsyncContext) {
				scd = buildShadowCanvas(scs.image);
				oAsyncContext = {
					scd: scd,
					xs: 0,
					ys: 0,
					resume: function() {
						convolutionProcess(scs, pDone, oAsyncContext);
					}
				};
			} else {
				scd = oAsyncContext.scd;
			}
			var ySave = oAsyncContext.ys;
			var opt = getImageOptions(scs);
			var w = scs.width;
			var h = scs.height;
			var factor = opt.factor;
			var bias = opt.bias;
			var xf, yf;
			var aMatrix = opt.matrix;
			var xm, ym;
			var yfCount = aMatrix.length;
			var xfCount = yfCount > 0 ? aMatrix[0].length : 0;
			var Ch = opt.channels;
			var bChr = Ch.red;
			var bChg = Ch.green;
			var bChb = Ch.blue;
			var nTimeStart = now();
			var nTime8;
			var r = getRegion(scs);
			var nInterval = opt.interval;
			var bSync = opt.sync;
			console.time('convo');
			for (y = Math.max(r.ys, oAsyncContext.ys); y <= r.ye; ++y) {
				for (x = Math.max(r.xs, oAsyncContext.xs); x <= r.xe; ++x) {
					getPixel(scs, x, y, nc);
					if (bChr) {
						nc.r = 0;
					}
					if (bChg) {
						nc.g = 0;
					}
					if (bChb) {
						nc.b = 0;
					}
					for (yf = 0; yf < yfCount; ++yf) {
						for (xf = 0; xf < xfCount; ++xf) {
							xm = (x - (xfCount >> 1) + xf + w) % w;
							ym = (y - (yfCount >> 1) + yf + h) % h;
							if (getPixel(scs, xm, ym, p)) {
								xyf = aMatrix[yf][xf];
								if (bChr) {
									nc.r += p.r * xyf;
								}
								if (bChg) {
									nc.g += p.g * xyf;
								}
								if (bChb) {
									nc.b += p.b * xyf;
								}
							}
						}
					}
					if (bChr) {
						nc.r = Math.min(255, Math.max(0, factor * nc.r + bias)) | 0;
					}
					if (bChg) {
						nc.g = Math.min(255, Math.max(0, factor * nc.g + bias)) | 0;
					}
					if (bChb) {
						nc.b = Math.min(255, Math.max(0, factor * nc.b + bias)) | 0;
					}
					setPixel(scd, x, y, nc);
				}
				oAsyncContext.xs = 0;
				if (!bSync && !(y & 7)) {
					nTime8 = now() - nTimeStart;
					if (nTime8 >= nInterval) {
						nTimeStart += nTime8;
						oAsyncContext.ys = y + 1;
						var f = (y - r.ys) / (r.ye - r.ys);
						$(scs.image).trigger(PLUGIN_NAME + '.progress', {
							filter: opt.command,
							f: f
						});
						requestAnimationFrame(oAsyncContext.resume);
						console.log(y - ySave);
						console.timeEnd('convo');
						return;
					}
				}
			}
			if (typeof pDone === 'function') {
				pDone(scd);
			}
			console.timeEnd('convo');
		}
		
		/**
		 * filter: resize
		 * resize the image
		 * used options:
		 * 	- width
		 *  - height
		 */
		function filterResize(sc, pDone) {
			var opt = getImageOptions(sc);
			var w = opt.width;
			var h = opt.height;
			var scd = buildShadowCanvas(sc.image);
			var r = w.toString().match(/^([0-9]+)%$/);
			if (r) {
				scd.canvas.width = sc.width * (r[1] | 0) / 100 | 0;
			} else {
				scd.canvas.width = w;
			}
			r = h.toString().match(/^([0-9]+)%$/);
			if (r) {
				scd.canvas.height = sc.height * (r[1] | 0) / 100 | 0;
			} else {
				scd.canvas.height = h;
			}
			scd.context = scd.canvas.getContext('2d');
			scd.context.drawImage(sc.image, 0, 0, sc.width, sc.height, 0, 0, scd.canvas.width, scd.canvas.height);
			scd.width = scd.canvas.width;
			scd.height = scd.canvas.height;
			if (typeof pDone === 'function') {
				pDone(scd);
			}
		}
		
		function buildGaussianBlurMatrix(phi) {
			var nSize = Math.max(1, Math.ceil(phi * 3));
			var a = [], row;
			var y, x;
			for (y = -nSize; y <= nSize; ++y) {
				row = [];
				for (x = -nSize; x <= nSize; ++x) {
					row.push((1 / (2 * Math.PI * phi * phi)) * Math.exp(-(x * x + y * y) / (2 * phi * phi)));
				}
				a.push(row);
			}
			return a;
		}
		
		function restore(sc, pDone) {
			var oImage = sc.image;
			var $img = $(oImage);
			var sSrc = $img.data(DATA_BACKUP);
			if (sSrc) {
				setImageSource(oImage, sSrc, pDone);
			}
		}

		function save(sc, pDone) {
			var $img = $(sc.image);
			$img.data(DATA_BACKUP, $img.attr('src'));
			if (typeof pDone === 'function') {
				pDone(sc);
			}
		}
		
		function jpeg(sc, pDone) {
			var opt = getImageOptions(sc);
			var sJPEG = sc.canvas.toDataURL('image/jpeg', opt.factor);
			setImageSource(sc.image, sJPEG, pDone);
		}
		
		function sample(sc, pDone) {
			var aStat = {};
			pixelProcess(sc, function(sc, x, y, p) {
				var aKey = [(p.r < 16 ? '0' : '') + p.r.toString(16), (p.g < 16 ? '0' : '') + p.g.toString(16), (p.b < 16 ? '0' : '') + p.b.toString(16)];
				var sKey = '#' + aKey.join('');
				if (!(sKey in aStat)) {
					aStat[sKey] = [sKey, 0];
				}
				++aStat[sKey][1];
			}, function(sc) {
				var aResult = [];
				for (var sStat in aStat) {
					aResult.push(aStat[sStat]);
				}
				aResult.sort(function(a, b) {
					return b[1] - a[1];
				});
				if (typeof sc.options.result === 'function') {
					sc.options.result(sc.image, aResult);
				}
				pDone(sc);
			});
		}
		
		function filterHSL(sc, pDone) {
			/**
			 * Converts an RGB color value to HSL. Conversion formula
			 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
			 * Assumes r, g, and b are contained in the set [0, 255] and
			 * returns h, s, and l in the set [0, 1].
			 *
			 * @param   Number  r       The red color value
			 * @param   Number  g       The green color value
			 * @param   Number  b       The blue color value
			 * @return  Array           The HSL representation
			 */
			function rgbToHsl(r, g, b){
				r /= 255, g /= 255, b /= 255;
				var max = Math.max(r, g, b), min = Math.min(r, g, b);
				var h, s, l = (max + min) / 2;

				if (max == min){
					h = s = 0; // achromatic
				} else {
					var d = max - min;
					s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
					switch(max){
						case r: h = (g - b) / d + (g < b ? 6 : 0); break;
						case g: h = (b - r) / d + 2; break;
						case b: h = (r - g) / d + 4; break;
					}
					h /= 6;
				}

				return [h, s, l];
			}

			// utility function used by hslToRgb
			function hue2rgb(p, q, t){
				if (t < 0) {
					++t;
				}
				if (t > 1) {
					--t;
				}
				if (t < 1 / 6) {
					return p + (q - p) * 6 * t;
				}
				if (t < 1 / 2) {
					return q;
				}
				if (t < 2 / 3) {
					return p + (q - p) * (2/3 - t) * 6;
				}
				return p;
			}
			
			/**
			 * Converts an HSL color value to RGB. Conversion formula
			 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
			 * Assumes h, s, and l are contained in the set [0, 1] and
			 * returns r, g, and b in the set [0, 255].
			 *
			 * @param   Number  h       The hue
			 * @param   Number  s       The saturation
			 * @param   Number  l       The lightness
			 * @return  Array           The RGB representation
			 */
			function hslToRgb(h, s, l) {
				var r, g, b;

				if (s === 0){
					r = g = b = l; // achromatic
				} else {
					var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
					var p = 2 * l - q;
					r = hue2rgb(p, q, h + 1/3);
					g = hue2rgb(p, q, h);
					b = hue2rgb(p, q, h - 1/3);
				}
				return [r * 255, g * 255, b * 255];
			}
			var opt = sc.options;
			var hue = opt.hue || 0;
			var saturation = opt.saturation || 0;
			var lightness = opt.lightness || 0;

			pixelProcess(sc, function(sc, x, y, pixel) {
				var hsl = rgbToHsl(pixel.r, pixel.g, pixel.b);
				var h = (hsl[0] + hue + 1) % 1;
				var s = Math.min(1, Math.max(0, hsl[1] + saturation));
				var l = Math.min(1, Math.max(0, hsl[2] + lightness));
				h += hue;
				var rgb = hslToRgb(h, s, l);
				pixel.r = rgb[0];
				pixel.g = rgb[1];
				pixel.b = rgb[2];
			}, pDone);
		}

		function debug() {
			console.log.apply(console, arguments);
		}
		
		function process(oImage, opt) {
			var nStartTime = now();
			var $image = $(oImage);
			$image.data(PLUGIN_NAME + '_busy', true);
			debug(opt.command, ': starting filter');
			if (!$image.is('img, canvas')) {
				debug(opt.command, ': this is neither an image nor a canvas'); 
				return;
			}
			var sc = buildShadowCanvas(oImage, opt);
			var sFilter = opt.command;
			$image.trigger(PLUGIN_NAME + '.start', {filter: sFilter});
			function triggerComplete() {
				var nLeft = $image.queue(BUSY_VAR).length;
				debug(opt.command, ': complete.' , nLeft , 'filter(s) left');
				$image.trigger(PLUGIN_NAME + '.complete', {filter: sFilter, n: $image.queue(BUSY_VAR).length, time: now() - nStartTime});
				$image.data(PLUGIN_NAME + '_busy', false);
				$image.dequeue(BUSY_VAR);
			}
			function commit(scx) {
				debug(opt.command, ': committing canvas modifications');
				commitShadowCanvas(scx, triggerComplete);
			}
			switch (sFilter) {
				case 'blur':
					if (opt.radius < 2) {
						opt.matrix = [
							[0.0, 0.2, 0.0],
							[0.2, 0.2, 0.2],
							[0.0, 0.2, 0.0]
						];
					} else {
						opt.matrix = buildGaussianBlurMatrix(Math.max(2, opt.radius) / 3);
					}
					convolutionProcess(sc, commit);
				break;

				case 'sharpen':
					if (opt.more) {
						opt.matrix = [
							[1,  1,  1], 
							[1, -7,  1], 
							[1,  1,  1] 
						];
					} else {
						opt.matrix = [
							[-1, -1, -1, -1, -1], 
							[-1,  2,  2,  2, -1], 
							[-1,  2,  8,  2, -1], 
							[-1,  2,  2,  2, -1], 
							[-1, -1, -1, -1, -1]
						];
						opt.factor = 1/8;
					}
					convolutionProcess(sc, commit);
				break;
				
				case 'edges':
					opt.matrix = [
						[-1, -1, -1], 
						[-1,  8, -1], 
						[-1, -1, -1] 
					];
					convolutionProcess(sc, commit);
				break;
				
				case 'emboss':
					if (opt.more) {
						opt.matrix = [
							[-2, -1,  0], 
							[-1,  1,  1], 
							[ 0,  1,  2]
						];
					} else {
						opt.matrix = [
							[-1, -1,  0], 
							[-1,  1,  1], 
							[ 0,  1,  1]
						];
					}
					convolutionProcess(sc, commit);
				break;

				case 'grayscale':
					opt.matrix = [
						[0.30, 0.59, 0.11], 
						[0.30, 0.59, 0.11], 
						[0.30, 0.59, 0.11]
					];
					filterColor(sc, commit);
				break;
				
				case 'sepia':
					opt.matrix = [
						[0.393, 0.769, 0.189],
						[0.349, 0.686, 0.168],
						[0.272, 0.534, 0.131]
					];
					filterColor(sc, commit);
				break;

				case 'color':
					filterColor(sc, commit);
				break;
				
				case 'noise':
					filterNoise(sc, commit);
				break;
				
				case 'matrix':
					convolutionProcess(sc, commit);
				break;
				
				case 'resize':
					filterResize(sc, commit);
				break;
				
				case 'brightness':
					opt.matrix = [
						[0, 0, 0], 
						[0, 1, 0], 
						[0, 0, 0]
					];
					convolutionProcess(sc, commit);
				break;
				
				
				case 'contrast':
					filterContrast(sc, commit);
				break;

				case 'negate':
					filterNegate(sc, commit);
				break;

				/**
				 * Save the image src attribute value
				 * Usefull in combination with the 'restore' command
				 * to undo any changes
				 */
				case 'save':
					save(sc, triggerComplete);
				break;

				/**
				 * Restore the image src attribute value
				 * Must be called after a 'save' operation
				 */
				case 'restore':
					restore(sc, triggerComplete);
				break;
				
				/**
				 * Convert the image in JPEG format
				 * use 'factor' to set the quality level between 0 and 1
				 */
				case 'jpeg':
					jpeg(sc, triggerComplete);
				break;
				
				
				case 'sample':
					sample(sc, triggerComplete);
				break;
				
				case 'mean':
					opt.matrix = [
						[1, 1, 1], 
						[1, 1, 1], 
						[1, 1, 1]
					];
					opt.factor = 1/9;
					convolutionProcess(sc, commit);
				break;
				
				case 'hsl':
					filterHSL(sc, commit);
				break;
				
				default:
					var oPublicMethods = {
						buildShadowCanvas: buildShadowCanvas,
						setImageSource: setImageSource,
						setPixel: setPixel,
						getPixel: getPixel,
						getRegion: getRegion,
						pixelProcess: pixelProcess,
						convolutionProcess: convolutionProcess,
						commit: commit
					}
					if (sFilter in oFilters) {
						oFilters[sFilter](sc, oPublicMethods);
					}
				break;
			}
		}
		
		/**
		 * main function
		 * analyzes options.command and run the corresponding filter
		 */
		function main() {
			var oImage = this;
			var $image = $(oImage);
			var bBusy = $image.queue(BUSY_VAR).length > 0;
			debug(oOptions.command, ': queueing filter');
			$image.queue(BUSY_VAR, function() {
				process(oImage, oOptions);
			});
			if (!bBusy) {
				$image.dequeue(BUSY_VAR);
			}
		};

		return this.each(main);
	};
	$.fn.extend(oPlugin);
})(jQuery);
