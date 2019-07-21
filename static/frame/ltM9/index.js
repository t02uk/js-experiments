(function() {

	var d = new DCore();

	var fallingTime = 5;
	// 
	var __DEBUG__ = false;

	var seTick = new Audio("http://dl.dropbox.com/u/3589634/resource/se/s-002.mp3");
	var seBlight = new Audio("http://dl.dropbox.com/u/3589634/resource/se/computer-pipipi_mono.mp3");
	seBlight.volume = 0.7;
	var seInvert = new Audio("http://dl.dropbox.com/u/3589634/resource/se/electric2_mono.mp3");

	var invert = false;

	// debug
	var getDate = (function() {
		if(__DEBUG__) {
			var startDt = new Date();
			return function() {
				var now = new Date();
				var elapsed = now - startDt;
				var ret = now;
				ret.setHours(22);
				ret.setMinutes(20);
				ret.setSeconds(1);
				ret.setMilliseconds(345);
				return new Date((+ret) + elapsed * 1);
			};
		} else {
			return function() {
				return new Date();
			}
		}
	})();

	// setup form of shape
	// note that the letter ";" means backslash :<
	var numberShapes = (function() {
		var raw = [
			// 0
			"  -   " +
			"|   | " +
			"|   | " +
			"|   | " +
			"  -   " ,
			// 1
			"- |   " +
			"  |   " +
			"  |   " +
			"  |   " +
			"- - - " ,
			// 2
			"- -   " +
			"    | " +
			"  -   " +
			"|     " +
			"  - - " ,
			// 3
			"- -   " +
			"    | " +
			"  -   " +
			"    | " +
			"- -   " ,
			// 4
			"    | " +
			"|   | " +
			"| - | " +
			"    | " +
			"    | " ,
			// 5
			"  - - " +
			"|     " +
			"  -   " +
			"    | " +
			"- -   " ,
			// 6
			"  -   " +
			"|     " +
			"| -   " +
			"|   | " +
			"  -   " ,
			// 7
			"- -   " +
			"|   | " +
			"    | " +
			"    | " +
			"  /   " ,
			// 8
			"  -   " +
			"|   | " +
			"  -   " +
			"|   | " +
			"  -   " ,
			// 9
			"  -   " +
			"|   | " +
			"  -   " +
			"    | " +
			"  -   " ,
			// :b
		];

		// then compile above raw document
		var compiled = raw.map(function(shape) {

			// a table for convert a character to rotation
			var c2a = {
				'-': 0.000.toRadian(),
				';': 0.125.toRadian(),
				'|': 0.250.toRadian(),
				'/': 0.375.toRadian(),
				' ': undefined, // will be ignored
			};
			var r = shape.split("").zipWithIndex().filter(function(x) {
				// skip
				return x[1] % 2 == 0;
			}).map(function(e) {
				//
				var c = e[0];
				var i = e[1] / 2;
				var a = c2a[c];
				var x = i % 3;
				var y = ~~(i / 3);
				return {x: x, y: y, rotation: a};
			}).filter(function(x) {
				//
				return x.rotation !== undefined;
			});

			return r;
		});

		return compiled;
	})();

	// letter class
	function LetterTexture(text) {
		this.text = text;
		var width = 32;
		var height = 32;

		var texture = d.subTexture(width, height);

		this.texture1 = texture;
		texture
		 .rgb(0x00, 0x00, 0x00)
		 .font("Cursive", 1.0)
		 .textAlign("center")
		 .textBaseline("middle")
		 .fillText(text, [0.5, 0.5])
		 .fill()
		;

		var texture = d.subTexture(width, height);
		this.texture2 = texture;
		texture
		 .rgb(0xff, 0xff, 0xff)
		 .font("Cursive", 1.0)
		 .textAlign("center")
		 .textBaseline("middle")
		 .fillText(text, [0.5, 0.5])
		 .fill()
		;
	}
	LetterTexture.prototype = {
		draw: function() {
			if(!invert) {
				d
				 .drawImage(this.texture1)
				;
			} else {
				d
				 .drawImage(this.texture2)
				;
			}
		},
	};


	// Letter
	function Letter(text, timing) {
		var proto = Letter.prototype;
		this.texture = proto.letter(text);
		this.timing = text;
		this.fRad = 100.0.randf();
		this.blightCnt = 0;
	}
	Letter.prototype = {
		startState: function(p, rotation) {
			this.p = p;
			this.rotation = rotation;
		},
		endState: function(p, rotation, rotateAxis) {
			if(this.pEnd) {
				this.p = this.pEnd;
				this.rotation = this.rotationEnd;
			}
			this.pEnd = p;
			this.rotationEnd = rotation;
			this.rotateAxis = [1.0.randf(), 1.0.randf(), 1.0.randf()].normalize();
		},
		act: function() {
		},
		blightAfter: function(a) {
			this.blightAfterCnt = a;
			this.blightCnt = 64;
		},
		draw: function(seconds, millis) {

			var sm = (seconds * 1000) + millis;

			// 0(s)  ->  seconds  -> $1  ->  $2  ->  seconds + 10(s)  ->  $3  ->  60(s)
			//  $n means this.timing
			// condition
			//  $1 -> use start state
			//  $2 -> falling (calculate)
			//  $3 -> use end state
			//
			if(seconds < fallingTime && (60 - this.timing) < fallingTime) {
				return
			}
			if(0 <= seconds && seconds < this.timing) {
				var p = this.p;
			} else if(this.timing <= seconds && seconds < this.timing + fallingTime) {
				var delta = (sm - this.timing * 1000) / (fallingTime * 1000);
				var deltaR = 1 - delta;
				var p = this.p.mul(deltaR).add(this.pEnd.mul(delta));
				var rotateA = (((this.timing % 11) - 5) * delta).toRadian();
				if(!rotateA) {
					var rotateA = (((this.timing % 10) - 5) * delta).toRadian();
				}
				// wind (?)
				p = p.add([Math.sin(delta.toRadian()) * 0.1, 0, 0].rotatey(sm * 0.000001));
			} else {
				var p = this.pEnd;
			}


			var proto = Letter.prototype;
			if(!proto.fromTempl) {
				proto.fromTempl = Geo.rect();
			}
			var from = proto.fromTempl;

			if(!proto.toTempl) {
				var rect = Geo.rect(true).map(function(e) {
					return [e[0], 0, e[1]];
				});
				proto.toTempl = rect.scale([-0.03, 1, 0.03]);
			}
			var to = proto.toTempl;
			to = to.invoke("rotatey", this.rotation);
			if(rotateA) {
				to = to.invoke("rotatea", rotateA, this.rotateAxis);
			}
			to = to.translate(p);

			var self = this;
			d
			 .transformTo(from, to, function(d) {
				if(self.blightAfterCnt < 0) {
					if(self.blightCnt > 0) {
						d
						 .alpha(0.5)
						 .rgb(0x99, 0x99, 0x99)
						 .quads(Geo.rect())
						 .fill()
						 .alpha(1)
						;
					}
				}
				self.texture.draw();
			 })
			self.blightAfterCnt--;
			self.blightCnt--;

			// draw emit effect
			if(this.timing === seconds) {
				if(millis < 500) {
					var ps = millis * 0.001;
					var m = 32;
					var ps = $R(0, m).map(function(x) {
						var r = (1 - Math.sin(ps.toRadian() / 6)) * (0.01 + Math.cos(ps * $R(0.5, 1).randf() * 3) * 0.03);
						var sp = [0, 0, r].rotatey(x.toRadian() / m * 1);
						return sp.add(self.p);
					});
					console.info(ps.inspect());
					console.info = function(){};

					d
					 .alpha(0.5)
					 .rgb(invert ? [0xff, 0xff, 0xff] : [0x00, 0x00, 0x00])
					 .line(ps)
					 .stroke()
					 .alpha(1.0)
					;
				}
			}
		},
		letter: function(x) {
			var proto = Letter.prototype;
			if(proto.lettersCache === undefined) {
				proto.lettersCache = [];
			}
			if(proto.lettersCache[x] === undefined) {
				proto.lettersCache[x] = new LetterTexture(x);
			}
			return proto.lettersCache[x];
		},
	};


	// funtion for camera animation (bezier)
	var bezier = function(p1, p2, p3, p4) {
		return function(t) {
			var u = 1 - t;
			return p1.mul(u * u * u)
				.add(p2.mul(u * u * t * 3))
				.add(p3.mul(u * t * t * 3))
				.add(p4.mul(t * t * t));
		};
	};

	// funtion for camera animation (linear)
	var linear = function(p1, p4) {
		return bezier(p1, p1, p4, p4);
	};

	function Camera(geta) {
		this.c = 0;
		this.p = 0;
		this.g = 0;
		this.geta = geta;
		this.by = 0;
	}

	Camera.prototype = {
		obtainInfo: function(elapsed, now, layer) {
			this.lastNow = this.now;
			this.elapsed = elapsed;
			this.now = now;
			this.layer = layer;
			this.vizLayer = layer;
			if(!this.layerP || !(this.layerP && this.now.getSeconds() >= 50 || this.now.getSeconds() < 10)) {
				this.layerP = [0, layer, 0];
			}
		},
		// update animation function
		updateAnimator: function(pa, ga, ua) {
			this.pAnimator = pa;
			this.gAnimator = ga;
			this.uAnimator = ua;
		},
		// apply animation and move camera
		move: function(t) {
			if(this.pAnimator) this.p = this.pAnimator(t).add(this.layerP);
			if(this.gAnimator) this.g = this.gAnimator(t).add(this.layerP);
			if(this.uAnimator) this.u = this.uAnimator(t).add(this.layerP);
		},
		act: function() {
			var t = this.elapsed + this.geta;
			var m = (+this.now) % 10000;
			if(this.now.getSeconds() >= 50 || this.now.getSeconds() < 10) {
				this.updateAnimator(
					bezier([-3.0, +0.3, +0.5], [-0.3, +0.9, +0.5], [-0.0, +0.9, +0.9], [-0.0, -0.5, -0.5]),
					linear([+0.0, +0.0, +0.0], [+0.0, +0.0, +0.0])
				);
				this.move((((this.now.getSeconds() + 10) % 60) * 1000 + this.now.getMilliseconds()) / (20 * 1000));
			} else {
				if(this.lastNow == undefined
				|| (this.now.getSeconds() != this.lastNow.getSeconds() && this.now.getSeconds() % 10 == 0)) {
					var mode = 6..rand();
					switch(mode) {
						case 0:
						case 1:
							var r = function() {
								return [$R(-0.7, 0.7).randf(), $R(-0.0, 0.9).randf() ,$R(-0.7, +0.7).randf()];
							};
							this.updateAnimator(
								linear(r(), r()),
								linear(r(), [+0.0, -10.0, +0.0])
							);
							break;
						case 2:
							this.updateAnimator(
								bezier([-0.5, +1.0, +0.2], [-0.0, +0.1, -0.5], [-0.5, +0.3, +0.8], [-0.5, +0.9, +0.2]),
								linear([+0.0, +0.0, +0.0], [+0.3, -0.0, +0.0])
							);
							break;
						case 3:
							this.updateAnimator(
								bezier([+0.5, +0.0, +0.2], [-0.0, +0.1, +0.2], [-0.5, +0.3, +0.8], [-1.0, +0.9, -0.8]),
								linear([+0.0, +0.0, +0.0], [+0.0, -0.0, +0.0])
							);
							break;
						case 4:
							this.updateAnimator(
								bezier([+0.5, +0.5, +0.0], [+0.0, +0.5, +0.5], [-0.5, +0.5, +0.0], [+0.0, +0.5, -0.5]),
								linear([+0.0, +0.0, +0.0], [+0.0, +1.0, +0.0])
							);
							break;
						case 5:
							this.updateAnimator(
								linear([+0.5, +0.5, +0.0], [+0.0, +0.8, +0.5]),
								linear([+0.0, +1.0, +0.0], [+0.0, -0.0, +0.0])
							);
							break;
					}
				}
				this.move(m / (10 * 1000));
			}

			d
			 .gazeFrom(this.p, this.g, this.u)
			;

			// !!change global variable
			if((~~this.p[1] - 100) % 2) {
				invert = true;
			} else {
				invert = false;
			}
			this.vizLayer = ~~this.p[1];
		}
	};

	(function() {
		var startDate = getDate();
		// initialize state full variables and function

		// letters object
		var letters = $R(0, 59).map(function(x) {
			return new Letter(x, x);
		});

		// camera
		var geta = 0
		geta = startDate.getSeconds();
		geta = (geta * 1000) + startDate.getMilliseconds();
		var camera = new Camera(geta);

		var mapping = function(times, by, setupMethod) {

			// shuffle and allocate to randomly
			var tail = [];
			for(var i = 0; i < fallingTime; i++) {
				tail.push(letters[letters.length - i - 1]);
				tail.push(letters[i]);
			}
			var len = tail.length;
			var shuffledLetters = letters.slice(fallingTime, - fallingTime).shuffle();
			for(var i = 0; i < len ; i++) {
				var x = tail.pop();
				shuffledLetters.push(x);
			}

			var mapped = times.zipWithIndex(function(t, digit) {
				var shape = numberShapes[t];
				return shape.map(function(s) {

					var x = -(s.x * 0.03 + 0.03 + digit * 0.25 - 0.5);
					var y = by;
					var z = s.y * 0.04 - 0.03;
					var p = [x, y, z];

					var a = s.rotation + 0.25.toRadian() + (2..rand() * 0.5.toRadian() + $R(-0.3, 0.3).randf());
					var letter = shuffledLetters.shift();
					letter.regular = true;

					setupMethod.call(letter, p, a);

					return letter;
				});
			});

			var remain = shuffledLetters;

			remain.each(function(e) {
				var x = $R(-0.5, 0.5).randf();
				var y = by;
				var z = $R(-0.5, 0.5).randf();
				var p = [x, y, z];
				var a = $R(-1, 1).randf();
				e.regular = false;
				setupMethod.call(e, p, a);
			});

			var r = mapped.flatten().concat(remain);
			return r;
		};

		// devide Date object into [hh, mm]
		var hhmm = function(date) {
			var minutes = date.getMinutes();
			var hours = date.getHours();

			var hours2 = ~~(hours / 10);
			var hours1 = hours % 10;
			var minutes2 = ~~(minutes / 10);
			var minutes1 = minutes % 10;

			return [hours2, hours1, minutes2, minutes1];
		};
		var past = new Date(getDate() -  60 * 1000);
		var now = getDate();
		var mappedLetters = mapping(hhmm(now), 0, Letter.prototype.startState);


		// here is main loop :b
		var layer = 0;
		var oldInvert = invert;
		var invertCount = 0;
		var beatCnt = 0;
		var main = function() {

			var now = getDate();
			var next = new Date(+getDate() + 60 * 1000);
			var elapsed = now - startDate;

			// seconds is changed
			if(now.getSeconds() !== past.getSeconds()) {
				if(seTick.currentTime) {
					seTick.pause();
					seTick.currentTime = 0;
				}
				beatCnt += 4;
				seTick.play();
			}

			// minutes is changed
			if(now.getMinutes() !== past.getMinutes()) {
				layer--;
				if(now.getSeconds() == 0) {

					if(seBlight.currentTime) {
						seBlight.pause();
						seBlight.currentTime = 0;
					}
					seBlight.play();

					var ms = now.getMilliseconds();
					var p = ~~(mappedLetters.length * (1 - ms / 1000));

					mappedLetters.select(function(x) {
						return x.regular;
					}).zipWithIndex(function(x, i) {
						x.blightAfter(~~(i * mappedLetters.length * 0.016));
					});
				}
				mappedLetters = mapping(hhmm(next), layer, Letter.prototype.endState);
			}

			past = now;

			// initialize background
			d
			 .rgb(invert ? [0x00, 0x00, 0x00] : [0xff, 0xff, 0xff])
			 .fillBack()
			;

			// beat
			var s = Math.sin(beatCnt.toRadian() / 32) * 0.07 + 0.1;
			var q = Geo.polygon(32).map(function(x) {
				return [x[0] * s, 0, x[1] * s];
			});

			9..times(function(i) {
				var x = ((i % 3) - 1) * 0.5;
				var z = ((~~(i / 3)) - 1) * 0.5;
				d
				 .rgb(invert ? [0x11, 0x11, 0x11] : [0xee, 0xee, 0xee])
				 .quads(q.translate([x, camera.vizLayer - 1, z]))
				 .fill()
				;
			});

			if(beatCnt > 0) {
				beatCnt--;
			}

			d
			 .rgb(invert ? [0xff, 0xff, 0xff] : [0x00, 0x00, 0x00])
			 .fillText(now, [0.0, 0.0])
			;

			// camera
			camera.obtainInfo(elapsed, now, layer);
			camera.act();

			// draw letters
			var seconds = now.getSeconds();
			var millis = now.getMilliseconds();

			mappedLetters.each(function(x) {
				x.draw(seconds, millis);
			});

			// inver effect
			if(invert !== oldInvert) {
				if(seInvert.currentTime) {
					seInvert.pause();
					seInvert.currentTime = 0;
				}
				seInvert.play();

				d
				 .alpha(0.5)
				 .drawImage(d, [0.2, 0.2])
				 .alpha(1)
				;
			}
			oldInvert = invert;

		};
		window.setInterval(main, 33);
	})();


})();