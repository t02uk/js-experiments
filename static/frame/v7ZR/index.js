window.onload = function() {


	// Create draw object
	var d = new DCore();

	var bgm = new Audio();
	bgm.src = "http://dl.dropbox.com/u/3589634/resource/bgm/drumn_010.mp3";
	bgm.loop = true;
	var bindSe = new Audio();
	bindSe.src = "http://dl.dropbox.com/u/3589634/resource/se/b_005.mp3";
	var damageSe = new Audio();
	damageSe.src = "http://dl.dropbox.com/u/3589634/resource/se/se05.ogg"
	var timeRemSe = new Audio();
	timeRemSe.src = "http://dl.dropbox.com/u/3589634/resource/se/b_052.mp3";
	var goalSe = new Audio();
	goalSe.src = "http://dl.dropbox.com/u/3589634/resource/se/b_046.mp3";
    
    	start();
	function start() {
		bgm.play();

		var keys = [];
		window.addEventListener("keydown", function(e) {
			keys[e.keyCode] = true;
			if(37 <= e.keyCode && e.keyCode <= 40) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
			}
		}, false);
		window.addEventListener("keyup", function(e) {
			keys[e.keyCode] = false;
			if(37 <= e.keyCode && e.keyCode <= 40) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
			}
		}, false);

		// Star (fall object)
		function Star() {
			Star.prototype.initialize.apply(this, $A(arguments));
		};
		Star.prototype = {
			initialize: function() {
				this.p = [0.5, 0.1];
				this.s = [0, -0.01];
				this.bound = false;
				this.binder = undefined;
				this.rotates = $R(-.1, .1).randf();
				this.rotatep = $R(0, 100).randf();
				this.h = $R(0, 1).randf();
			},
			act: function() {
				// on bound
				if(this.bound) {
					this.binder.act();
				}
				else {
					this.p = this.p.add(this.s);
					this.s = this.s.mul(0.95);
					this.s = this.s.add([0, 0.0007 + lv * 0.0001]);
					this.rotates *= 1.001;
				}
				if(this.p[0] > 1) {
					if(this.bound) {
						//this.binder.rads *= -1.0;
					} else {
						this.s[0] *= -0.9
						this.p[0] = 1;
					}
				}
				if(this.p[0] < 0) {
					if(this.bound) {
						//this.binder.rads *= -1.0;
					} else {
						this.s[0] *= -0.9
						this.p[0] = 0;
					}
				}

				// register particle
				if(this.s.abs() > 0.01) {
					var particle = new Particle(this.p, [0, 0.02 + this.s.abs() / 10].rotate($R(0, 100).randf()), this.h);
					particles.push(particle);
				}

				var self = this;
				structures.each(function(e) {
					if((self.p[1] - e.p1[1]).abs() < 0.05 && !e.honwaka) {
						if( e.p1[0] < self.p[0] && self.p[0] < e.p2[0]
						 || e.p2[0] < self.p[0] && self.p[0] < e.p1[0]) {
							e.honwaka = true;
							damaged = true;
							time -= 3;
							damageSe.play();
						}
					}
				});

				this.rotatep += this.rotates;
			},
			bind: function(sign) {
				if(!this.bound) {
					bindSe.play();
					this.binder = new Binder(this, sign);
					this.bound = true;
				}
			},
			release: function() {
				this.binder.release();
				this.bound = false;
				this.rotates *= 1.1;
				var self = this;
				10.0.times(function() {
					var particle = new Particle(self.p, [0, 0.02 + self.s.abs() / 2].rotate($R(0, 100).randf()), self.h);
					particles.push(particle);
				});
			},
			draw: function() {
				// form
				var form = $R(0, 4).map(function(i) {
					return [0.02, 0].rotate(i.toRadian() / 5 * 2);
				}).rotate(this.rotatep).translate(this.p);

				// draw
				d
				 .quads(form)
				 .hsv(this.h, 0.3, 0.9)
				 .fill()
				 .hsv(this.h, 0.9, 0.45)
				 .stroke()
				;

				// draw line from binder to this
				if(this.bound) {
					d
					 .rgb(0x99, 0x99, 0x99)
					 .line([this.p, this.binder.p])
					 .stroke()
					;
					this.binder.draw();
				}
			}
		};

		// Binder (maru)
		function Binder(bindee, sign) {
			this.bindee = bindee;
			var bp = bindee.p;
			var bs = bindee.s;
			var nbs = bs.normalize(0.2);
			this.sign = sign;
			this.p = bp.add([-sign * nbs[1], sign * nbs[0]]);
			this.pl = bp.distance(this.p);
			this.sl = bs.abs();
			var np = bp.sub(this.p);
			this.radp = Math.atan2(np[1], np[0]);
			this.rads = sign * (this.sl / this.pl);
		};

		Binder.prototype = {
			act: function() {
				var t = this.bindee;
				this.radp += this.rads;
				var op = t.p.clone();
				t.p = this.p.add([this.pl, 0].rotate(this.radp));
				t.s = t.p.sub(op);
				if(Math.cos(this.radp) > 0) {
					this.rads += 0.003;
				} else {
					this.rads -= 0.003;
				}

				t.rotates = this.rads;
			},
			release: function() {
				var t = this.bindee;
				t.rotates *= $R(0.9, 4.0).randf();
				t.s = t.s.mul(1.1);
			},
			draw: function() {
				d
				 .rgb(0x66, 0x66, 0x66)
				 .circle(this.p, 0.01)
				 .stroke()
				;
			}
		};

		function Structurer(p1, p2) {
			this.p1 = p1;
			this.p2 = p2;
		}
		Structurer.prototype = {
			draw: function() {
				d
				 .quads([
					 this.p1.translate([0, -0.01]), 
					 this.p2.translate([0, -0.01]),
					 this.p2.translate([0,  0.01]),
					 this.p1.translate([0,  0.01])
				 ])
				 .rgb(0xee, 0xee, 0xee)
				 .fill()
				 .rgb(0x99, 0x99, 0x99)
				 .fill()
				;
			}
		};

		Camera = {
			follow: function(y) {
				var self = Camera;
				var bottom = self.py + self.height;
				var dy = y - bottom;
				if(dy > 0) {
					self.py += dy * 0.2;
				}
			},
			py: 0.0,
			height: 0.3,
		}

		function Particle(p, s, h) {
			this.p = p;
			this.s = s;
			this.rotatep = $R(0, 100).randf();
			this.rotates = $R(-0.5, 0.5).randf();
			this.h = h;
		}
		Particle.prototype = {
			act: function() {
				this.p = this.p.add(this.s);
				this.s = this.s.mul(0.90);
				this.rotatep += this.rotates;
			},
			draw: function() {
				var form = $R(0, 2).map(function(i) {
					return [0.01, 0].rotate(i.toRadian() / 3);
				}).rotate(this.rotatep).translate(this.p);

				var s = this.s.abs() * 40;

				d
				 .quads(form)
				 .blend("source-over")
				 .alpha(s)
				 .hsv(this.h, 0.75, 0.7)
				 .fill()
				 .alpha(1.0)
				;
			}
		};

		Notifiler = function(p, msg, rgb) {
			this.p = p;
			this.msg = msg;
			this.count = 0;
			this.rgb = rgb
		}
		Notifiler.prototype = {
			act: function() {
				 this.p[1] += $R(-0.01, 0.02).randf();
				 this.p[0] += $R(-0.02, 0.02).randf();
				 this.count++;
			},
			draw: function() {
				if(this.count < 32) {
					d
					 .blend("source-over")
					 .alpha(1 - this.count / 32)
					 .rgb(this.rgb)
					 .font("monospace", 0.1, "bold")
					 .fillText(this.msg, this.p)
					;
				}
			}
		}


		var stars = [new Star(0)];
		var particles = [];
		var sd = d.subTexture();
		var structures = [];
		var structuresMadeY = 1;
		var structuresMadeC = 0;
		var cnt = 0;
		var damaged = false;
		var lv = 1;
		var time = 60.0;
		var not = new Notifiler([0, 0], "");
		
		var prevKeys = keys.clone();
		var prevDate = +new Date();
		var goalY = 15;
		var score = 0;

		(function() {


			var now = new Date();
			var timeSpan = now - prevDate;
			time -= timeSpan * 0.001;

			score++;

			// left key pressed
			if(keys[37] && !prevKeys[37]) {
				stars[0].bind(1);
			}
			if(keys[39] && !prevKeys[39]) {
				stars[0].bind(-1);
			}
			if((!keys[37] && prevKeys[37]) ||
			   (!keys[39] && prevKeys[39])) {
				stars[0].release();
			}
			prevKeys = keys.clone();

			// make Structurer
			(function() {
				if(structuresMadeY < Camera.py) {
					var s = 0.5 + $R(0, 0.2).randf();
					structuresMadeY += s;
					structuresMadeC++;

					var y = Camera.py + 1.0;
					var sign = [-1, 1][structuresMadeC % 2];
					var p1 = [0.5 + sign * 0.5, y];
					var p2 = [0.5 - sign * $R(0, 0.4 - 0.25 / lv).randf(), y];

					var structure = new Structurer(p1, p2);
					structures.push(structure)
				}
			})();
			structures = structures.select(function(e) {
				return e.p1[1] > Camera.py - 3;
			});

			stars.each(function(e) {
				e.act();
			});

			particles = particles.select(function(e) {
				return e.s.abs() > 0.001;
			});
			particles.each(function(e) {
				e.act();
			});


			var bottomBallY = stars.max(function(e) {
				return e.p[1];
			});
			Camera.follow(bottomBallY);

			// initialize background
			d
			 .blend("source-over")
			 .rgb(damaged ? [0xff, 0xee, 0xee] : [0xff, 0xff, 0xff])
			 .fillBack()
			 .blend("source-over")
			 .alpha(1)
			;

			d.save();
			d.translate([0, -Camera.py]);


			// fill back bubble

			var random = function() {
			  var x = 1;
			  return function() {
				x = (x * 22695477 + 1) & 0xffffff;
				return (x >> 16) & 0x7fff;
			  };
			}();
			$R(0, 11).each(function(i) {
				var offy = (~~(Camera.py * 10) / 10);
				var y = offy + i / 10;
				var x = (~~(y * (y + 4.5) * (y + 3.8)) % 10) / 10;
				var w = (y * y * y) % 0.1;
				var hue = (y * y * (y * 1.5)) % 1;
				d
				 .circle([x, y], w)
				 .hsv(hue, 0.1, 0.98)
				 .fill()
				;
			});

			// goal
			(function() {
				d
				 .rgb(0x99, 0xff, 0x99)
				 .quads(Geo.rect().scale([1.0, 0.05]).translate([0, goalY]))
				 .fill()
				;
				if(goalY < stars[0].p[1]) {
					not = new Notifiler(stars[0].p, "Time Reset!", [0x00, 0x00, 0xff])
					goalSe.play();
					score += ~~time * 10 * lv;
					time = 45;
					goalY += 15 + lv;
					lv++;
				}
			})();


			particles.each(function(e) {
				e.draw();
			});

			stars.each(function(e) {
				e.draw();
			});

			structures.each(function(e) {
				e.draw();
			});

			var rr = 0;
			if(time < 10) {
				if(~~(prevDate / 1000) != ~~(now / 1000)) {
					timeRemSe.play();
					rr = 0.03;
				}
			}


			// time
			d
			 .rgb(0x00, 0x00, 0x00)
			 .blend("source-over")
			 .alpha(0.5)
			 .quads(Geo.rect().scale([1.0, 0.05]).translate([0, Camera.py]))
			 .fill()
			 .rgb(damaged ? [0xff, 0x00, 0x00] : [0xff, 0xff, 0xff])
			 .font("monospace", 0.05, "bold")
			 .fillText("time " + ~~(time) + "." + (~~(time * 10) % 10), [0.01, 0.01 + Camera.py].translate([rr, 0]))
			 .fillText("score " + score + "(lv" + lv + ")", [0.61, 0.01 + Camera.py])
			;

			if(damaged) {
				not = new Notifiler(stars[0].p, "-Time3.0s", [0xff, 0x00, 0x00])
			}
			not.act();
			not.draw();

			// restore
			d.restore();



			prevDate = now;
			damaged = false;
			cnt++;

			if(time < 0) {
				if(confirm("コインいっこいれる")) {
					start();
				} else {
					return;
				}
			} else {
				window.setTimeout(arguments.callee, 16);
			}
		})();
	};
};
