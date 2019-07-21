(function() {
	var d = new DCore();

	var Box = {};
	Box.size = 20;
	Box.min = [-Box.size,-Box.size,-Box.size];
	Box.max = [ Box.size, Box.size, Box.size];
	Box.draw = function() {
		d
		 .rgb(0xff, 0xff, 0xff)
		;

		d
		 .line([[Box.min[0], Box.min[1], Box.min[2]], [Box.max[0], Box.min[1], Box.min[2]]])
		 .stroke()
		 .line([[Box.max[0], Box.min[1], Box.min[2]], [Box.max[0], Box.max[1], Box.min[2]]])
		 .stroke()
		 .line([[Box.max[0], Box.max[1], Box.min[2]], [Box.min[0], Box.max[1], Box.min[2]]])
		 .stroke()
		 .line([[Box.min[0], Box.max[1], Box.min[2]], [Box.min[0], Box.min[1], Box.min[2]]])
		 .stroke()

		 .line([[Box.min[0], Box.min[1], Box.max[2]], [Box.max[0], Box.min[1], Box.max[2]]])
		 .stroke()
		 .line([[Box.max[0], Box.min[1], Box.max[2]], [Box.max[0], Box.max[1], Box.max[2]]])
		 .stroke()
		 .line([[Box.max[0], Box.max[1], Box.max[2]], [Box.min[0], Box.max[1], Box.max[2]]])
		 .stroke()
		 .line([[Box.min[0], Box.max[1], Box.max[2]], [Box.min[0], Box.min[1], Box.max[2]]])
		 .stroke()

		 .line([[Box.min[0], Box.min[1], Box.min[2]], [Box.min[0], Box.min[1], Box.max[2]]])
		 .stroke()
		 .line([[Box.max[0], Box.min[1], Box.min[2]], [Box.max[0], Box.min[1], Box.max[2]]])
		 .stroke()
		 .line([[Box.max[0], Box.max[1], Box.min[2]], [Box.max[0], Box.max[1], Box.max[2]]])
		 .stroke()
		 .line([[Box.min[0], Box.max[1], Box.min[2]], [Box.min[0], Box.max[1], Box.max[2]]])
		 .stroke()
		;
	};

	function Node(sid) {
		this.sid = sid;
		var w = 10;
		this.p = [$R(-w, w).randf(), $R(-w, w).randf(), $R(-w, w).randf()];
		var s = 0.2;
		this.sp = [$R(-s, s).randf(), $R(-s, s).randf(), $R(-s, s).randf()];
		this.s = 0.01;
		this.visibleDistance = 7;
		this.minDistance = 0.1;
	};
	Node.prototype.act = function(sid) {

		this.p = this.p.translate(this.sp);
		if(this.p[0] < Box.min[0]) {
			this.p[0] = Box.max[0];
		}
		if(this.p[0] > Box.max[0]) {
			this.p[0] = Box.min[0];
		}

		if(this.p[1] < Box.min[1]) {
			this.p[1] = Box.max[1];
		}
		if(this.p[1] > Box.max[1]) {
			this.p[1] = Box.min[1];
		}

		if(this.p[2] < Box.min[2]) {
			this.p[2] = Box.max[2];
		}
		if(this.p[2] > Box.max[2]) {
			this.p[2] = Box.min[2];
		}
	};
	Node.prototype.spring = function() {
		var nodes = God.nodes;
		var self = this;

		nodes.each(function(that) {
			if(self.sid < that.sid) {
				var visibleDistance = self.visibleDistance;
				var minDistance = self.minDistance;
				var distance = self.p.distance(that.p);
				if(distance < visibleDistance) {
					var diff = that.p.sub(self.p);
					self.sp = self.sp.add(diff.mul(0.0025));
					self.sp = self.sp.mul(0.996);

					var c = distance / visibleDistance * 64;
					d
					 .rgb(c, c, c)
					 .line([self.p, that.p])
					 .stroke()
					;
				}
				if(distance < minDistance) {
					self.sp = self.sp.mul(2);
				}
			}
		});
	};
	Node.prototype.draw = function() {
		d
		 .luminous(this.p, 0.02, 0.1, [
		    [0.00,   [0xff, 0xff, 0xff]],
		    [1.00,   [0xff, 0xff, 0xff]],
		 ])
		 .fill()
		;
	};

	var God  = {
		initialize: function() {
			this.nodes = $R(0, 48).map(function(i) { return new Node(i);});
		},
		act: function() {
			this.nodes.each(function(e) {
				e.act();
			});
			this.nodes.each(function(e) {
				e.spring();
			});
		},
		draw: function() {
			this.nodes.each(function(e) {
				try {
				e.draw();
				} catch(e) {}
			});

			Box.draw();
		},
	};

	var Camera = {
		initialize: function() {
			var self = this;
			this.cnt = 0;
			this.cameraWorks = [
				function() {
					return function() {
						self.pos = [70, 0, 0].rotatey(self.cnt * 0.01);
						self.to = [0, 0, 0];
						self.upTo = [0, 1, 0];
					}
				},
				function() {
					return function() {
						var w = Box.size * 1.5;
						self.pos = [Math.cos(self.cnt * 0.008 + 0.01) * w, Math.sin(self.cnt * 0.01) * w, 0].rotatey(self.cnt * 0.007);
						self.to = [0, Math.cos(self.cnt * 0.01), 0];
						self.upTo = [0, 1, 0].rotatex(self.cnt * 0.005);

					}
				},
				function() {
					var fromN = God.nodes.length.rand();
					do {
						var toN = God.nodes.length.rand();
					} while(!(fromN !=toN))

					return function() {
						self.pos = God.nodes[fromN].p;
						self.to = God.nodes[toN].p;
						self.upTo = [0, 1, 0];
					}
				},
				function() {
					var w = Box.size * 0.8;
					self.pos = [$R(-w, w).randf(), $R(-w, w).randf(), $R(-w, w).randf()];
					var toN = God.nodes.length.rand();
					return function() {
						self.to = God.nodes[toN].p;
						self.upTo = [0, 1, 0];
					}
				},
			];
		},
		act: function() {
			var self = this;
			if((self.cnt % 256) === 0) {
				self.cameraWork = self.cameraWorks.randomSelect()();
			}
			self.cnt++;
			self.cameraWork();

			d
			 .gazeFrom(
				self.pos,
				self.to,
				self.upTo
			 );
		},
	}

	God.initialize();
	Camera.initialize();
	(function(c) {
		d
		 .blend("source-over")
		 .alpha(1)
		 .rgb(0x00, 0x00, 0x00)
		 .fillBack()
		;

		Camera.act();

		God.act();
		God.draw();
		
		window.setTimeout(arguments.callee.curry(c + 1), 33);
	})(0);
})();
