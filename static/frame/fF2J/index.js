window.onload = function() {
	// Create draw object
	var d = new DCore();

	// Box (fall object)
	function Box() {
		Box.prototype.initialize.apply(this, $A(arguments));
	};
	Box.prototype = {
		initialize: function(i) {
			this.p = [$R(0, 1).randf(), $R(0, 0.7).randf()];
			this.s = [$R(-0.01, 0.01).randf(), $R(-0.01, 0.01).randf()];
			this.bound = false;
			this.binder = undefined;
			this.rotates = $R(-.1, .1).randf();
			this.rotatep = $R(0, 100).randf();
			this.h = i / 7;
		},
		act: function() {
			// on bound
			if(this.bound) {
				this.binder.act();

				// if box is enough fast, release object randomly
				if(this.s[1] < 0) {
					if($R(0, 1).randf() < 0.08) {
						this.binder.release();
						this.bound = false;
					}
				}
			}
			else {
				this.p = this.p.add(this.s);
				this.s = this.s.mul(0.95);
				this.s = this.s.add([0, 0.002]);
				this.rotates *= 1.003;
			}
			// too slow
			if(!this.bound && Camera.py - this.p[1] > 1) {
				// follow automatically
				this.p[1] = Camera.py - 1.0;
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

			if(!this.bound) {
				// if not bound, bind randomly
				if($R(0, 1).randf() < 0.05) {
					this.binder = new Binder(this);
					this.bound = true;
				}
			}

			// register particle
			if(this.s.abs() > 0.01) {
				var particle = new Particle(this.p, [0, 0.02 + this.s.abs() / 10].rotate($R(0, 100).randf()), this.h);
				particles.push(particle);
			}

			this.rotatep += this.rotates;
		},
		draw: function() {
			// form
			var form = $R(0, 2).map(function(i) {
				return [0.018, 0].rotate(i.toRadian() / 3);
			}).rotate(this.rotatep).translate(this.p);

			// draw
			d
			 .quads(form)
			 .hsv(this.h, 0.3, 0.8)
			 .fill()
			 .hsv(this.h, 0.2, 0.95)
			 .stroke()
			;

			// draw line from binder to this
			if(this.bound) {
				d
				 .rgb(0xdd, 0xdd, 0xdd)
				 .line([this.p, this.binder.p])
				 .stroke()
				;
				this.binder.draw();
			}
		}
	};

	// Binder (maru)
	function Binder(bindee) {
		this.bindee = bindee;
		var bp = bindee.p;
		var bs = bindee.s;
		var l = 10;
		var sign = [-1, 1][$R(0, 1).rand()];
		if(bp[0] > 0.5) {
			sign = 1;
		} else if(bp[0] < 0.5) {
			sign = -1;
		}
		this.sign = sign;
		this.p = bp.add([-sign * bs[1] * l, sign * bs[0] * l]);
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
		},
		draw: function() {
			d
			 .rgb(0x99, 0x99, 0x99)
			 .circle(this.p, 0.01)
			 .stroke()
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
		height: 0.7,
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

			var s = this.s.abs() * 20;

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


	var boxes = $R(0, 6).map(function(i) { return new Box(i);});
	var particles = [];
	var sd = d.subTexture();


	(function() {

		boxes.each(function(e) {
			e.act();
		});

		particles = particles.select(function(e) {
			return e.s.abs() > 0.001;
		});
		particles.each(function(e) {
			e.act();
		});

		var bottomBallY = boxes.max(function(e) {
			return e.p[1];
		});
		Camera.follow(bottomBallY);

		// initialize background
		d
		 .blend("source-over")
		 .rgb(0xff, 0xff, 0xff)
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
			var w = (y * y * y) % 0.2;
			var hue = (y * y * (y * 1.5)) % 1;
			d
			 .circle([x, y], w)
			 .hsv(hue, 0.1, 0.98)
			 .fill()
			;
		});

		particles.each(function(e) {
			e.draw();
		});

		boxes.each(function(e) {
			e.draw();
		});

		d.restore();

		window.setTimeout(arguments.callee, 16);
	})();
};
