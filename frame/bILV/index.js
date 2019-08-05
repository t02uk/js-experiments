window.onload = function() {
	var d = new DCore();

	function Ball() {
		Ball.prototype.initialize.apply(this, $A(arguments));
	}
	Ball.prototype = {
		initialize: function() {
			this.p = [$R(0, 1).randf(), 0];
			this.s = [$R(-0.01, 0.01).randf(), $R(-0.08, 0.00).randf()];
			this.bound = false;
			this.binder = undefined;
		},
		act: function() {
			if(this.bound) {
				this.binder.act();
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
			}
			if(this.p[1] > 1) {
				this.bound = false;
				if(this.s[1] > 0.01) {
					this.s[1] *= -0.8;
				} else {
					this.p[1] = -0.1;
					//this.initialize();
				}
			}
			if(this.p[0] > 1) {
				if(this.bound) {
					this.binder.rads *= -1.0;
				} else {
					this.s[0] *= -0.9;
					this.p[0] = 1;
				}
			}
			if(this.p[0] < 0) {
				if(this.bound) {
					this.binder.rads *= 1.0;
				} else {
					this.s[0] *= -0.9;
					this.p[0] = 0;
				}
				//this.bound = false;
			}

			if(!this.bound) {
				if(this.p[1] > 0.2 && this.s.abs() > 0.015) {
					if($R(0, 1).randf() < 0.05) {
						this.binder = new Binder(this);
						this.bound = true;
					}
				}
			}
		},
		draw: function() {
			d
			 .rgb(0xaa, 0xaa, 0xaa)
			 .circle(this.p, 0.02)
			 .fill()
			;

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
	}

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
		},
		release: function() {
			var t = this.bindee;
		},
		draw: function() {
			d
			 .rgb(0x99, 0x99, 0x99)
			 .circle(this.p, 0.01)
			 .fill()
			;
		}
	};

	var balls = $R(1, 9).map(function() { return new Ball();});
	var sd = d.subTexture();


	(function() {
		d
		 .blend("lighter")
		 .alpha(0.04)
		 .rgb(0xff, 0xff, 0xff)
		 .fillBack()
		 .blend("source-over")
		 .alpha(1)
		;


		balls.each(function(e) {
			e.act();
			e.draw();
		});


		window.setTimeout(arguments.callee, 16);
	})();
};
