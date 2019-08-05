(function() {

	// util
	var util = {
		// if small value is given, return zero. otherwise not edited value
		fx: function(x) {
			if(Math.abs(x) < 0.00001) return 0;
			else return x;
		},
		invert33: function(m) {
			var repdet = 0;
			repdet += m[0][0] * m[1][1] * m[2][2];
			repdet += m[1][0] * m[2][1] * m[0][2];
			repdet += m[2][0] * m[0][1] * m[1][2];
			repdet -= m[0][0] * m[2][1] * m[1][2];
			repdet -= m[2][0] * m[1][1] * m[0][2];
			repdet -= m[1][0] * m[0][1] * m[2][2];


			if(repdet === 0) {
			  return undefined;
			}
			var det = 1 / repdet;

			return [
			  [
			  (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * det,
			  (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * det,
			  (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * det,
			  ],[
			  (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * det,
			  (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * det,
			  (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * det,
			  ],[
			  (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * det,
			  (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * det,
			  (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * det,
			  ]
			];
		},
		mulMatrix33: function(lhs, rhs) {
			// it must be promised below condition
			//   lhs.length === rhs.length === lhs[n].length === rhs[n].length
			var n = 3;
			var r = new Array(n);
			for(var i = 0; i < n; i++) {
				r[i] = new Array(n);
				for(var j = 0; j < n; j++) {
					r[i][j] = 0;
				}
			}

			for(var i = 0; i < n; i++) {
				for(var j = 0; j < n; j++) {
					for(var k = 0; k < n; k++) {
						r[i][j] += lhs[i][k] * rhs[k][j];
					}
				}
			}

			return r;
		},
		mulMatrix44: function(lhs, rhs) {
			// it must be promised below condition
			//   lhs.length === rhs.length === lhs[n].length === rhs[n].length
			var n = 4;
			var r = new Array(n);
			for(var i = 0; i < n; i++) {
				r[i] = new Array(n);
				for(var j = 0; j < n; j++) {
					r[i][j] = 0;
				}
			}

			for(var i = 0; i < n; i++) {
				for(var j = 0; j < n; j++) {
					for(var k = 0; k < n; k++) {
						r[i][j] += lhs[i][k] * rhs[k][j];
					}
				}
			}

			return r;
		},
		// imitate Option in Scala, Maybe in Haskell,
		opt: function(x) {
			if(x === undefined) return [];
			else return x;
		},
	};


	// Key-frames Builder, supply us easy way for building @-vendor-key frames in Java Script.
	// NOTE: It's might be criminally implementation to initialize prototype on instance method.
	function KeyframesBuilder(keyframeName) {
		this.keyframeName = keyframeName;
		this.keyframeNames = $A(arguments);

		var This = KeyframesBuilder;
		var initializeTask = {};
		var evaluateTask = {};
		var evaluateTaskName = [];
		this.dirtyPlugin = [];

		// install plug-in
		// and on same time, rewrite this of plug-ins -> oneself
		var plugins = This.prototype.plugins;
		var self = this;
		plugins.each(function(e) {
			var methods = e['methods'];
			var name = e['name'];
			for(var method in methods) {
				var nfn = self.wrapNormalFn(self, name, methods, method);

				var sfn = methods[method];

				// push common task
				//  initialize -> called on self#initialize
				//  evaluate -> called for building animation statement
				//  others -> extends prototype
				if("initialize" === method) {
					initializeTask[name] = sfn;
				} else if("evaluate" === method) {
					evaluateTask[name] = sfn;
					evaluateTaskName.push(name);
				} else {
					This.prototype[method] = nfn;
				}
			}
			//
			self.dirtyPlugin[name] = false;
		});


		// extends prototype
		This.prototype.initializeTask = initializeTask;
		This.prototype.evaluateTask = evaluateTask;
		This.prototype.evaluateTaskName = evaluateTaskName;

		// initialize oneself
		this.initialize();
	}

	
	// prototype
	KeyframesBuilder.prototype = {
		// call plug-ins initialize
		initialize: function(name) {
			this.seek_ = 0;
			var self = this;
			for(var name in this.initializeTask) {
				if(!this.initializeTask.hasOwnProperty(name)) {
					continue;
				}
				var method = this.initializeTask[name];
				method.apply(self, undefined);
			}
			this.frames = [];
			this.dirty = false;
			return this;
		},
		// wrap normal fn (such as translate, scale etc..)
		wrapNormalFn: function(caller, name, methods, method) {
			return function() {
				caller.dirty = true;
				caller.dirtyPlugin[name] = true;
				var result = methods[method].apply(caller, arguments);
				return result || caller;
			};
		},
		// flush pooled frame text
		flush: function() {
			if(this.dirty) {
				var frame = {seek: this.seek_, frame: this.fixedState()};
				this.frames.push(frame);
			}
			this.dirty = false;
		},
		// seek (parameter is absolute)
		seek: function(seek_) {
			this.flush();
			this.seek_ = seek_;
			return this;
		},
		// seek (parameter is relative)
		after: function(time) {
			return this.seek(this.seek_ + time);
		},
		// build current text for animation
		fixedState: function() {
			var self = this;
			var animation = [];
			this.evaluateTaskName.each(function(name) {
				if(!self.dirtyPlugin[name]) return;
				var method = self.evaluateTask[name];
				var work = method.apply(self, undefined);
				if(work !== undefined) animation.push(work);
			});
			return animation.transpose().invoke("join", "\n");
		},
		// build all text for animation
		build: function() {
			this.flush();
			if(!this.frames.length) return;
			var frames = this.frames.sortBy(function(e) {
				return e.seek;
			});
			var playTime = frames.last().seek;
			this.playTime = playTime;
			var result = frames.map(function(e) {
				var percent = ((e.seek / playTime) * 100) + "%";
				return e.frame.map(function(f) {
					return percent + " {\n" + f + "}";
				});
			}).transpose().invoke("join", "\n");
			return result;
		},
		// change frame behavior and over ride it
		hook: function(name, methods) {
			var This = KeyframesBuilder;

			for(method in methods) {
				var fn = methods[method];
				if(method === "initialize") {
					if(!this.hasOwnProperty("initialize")) {
						this.initializeTask = $A(This.prototype.initializeTask);
					}
					this.initializeTask[name] = fn;
				} else if(method === "evaluate") {
					if(!this.hasOwnProperty("evaluate")) {
						this.evaluateTask = $A(This.prototype.evaluateTask);
					}
					this.evaluateTask[name] = fn;
				} else {
					this[method] = this.wrapNormalFn(this, name, methods, method);
				}
			}
		},
		// apply animation
		apply: function(selector, duration, timingFunction, delay, iterationCount, direction) {
			var all = this.build();
			if(!all) return this;

			var self = this;

			var _selector = selector;

			this.keyframeNames.zipWithIndex(function(keyframeName, i) {

				var st = all[i];
				// default set
				selector = _selector || ("." + keyframeName);
				duration = duration || (self.playTime + "ms");
				timingFunction = timingFunction || "linear";
				iterationCount = iterationCount || "infinite";
				direction = direction || "";
				delay = delay || "0s";

				var x = [
				  "@-webkit-keyframes " + keyframeName + " {",
				  st,
				  "}",
				  selector + " {",
				  "-webkit-animation:" + [keyframeName, duration, timingFunction, delay, iterationCount].join(" ") + ";",
				  "}",
				].join("\n");

				if(self.style) {
					var style = self.style;
					style.html([style.html(), x].join("\n"));
				} else {
					var style = $("<style>", {type: "text/css"});
					style.html(x);
					style.appendTo($("head"));
					self.style = style;
				}
			});
		},
		fixStyle: function(elem) {
			var all = this.build();
			if(!all) return this;

			var style = this.fixedState();
			if(!style) {
				return;
			}

			elem.setAttribute("style", style.join(":"));
		},
	};
	KeyframesBuilder.prototype.plugins = [];

	// install (for add plug-in)
	// adding method for prototype are called in initialization method
	KeyframesBuilder.install = function(name, methods) {
		var This = KeyframesBuilder;
		This.prototype.plugins.push({name: name, methods: methods});
	};

	/// install (for add plug-in. It's very suitable method for lazy man)
	KeyframesBuilder.EazyInstall = function(name) {
		var This = KeyframesBuilder;
		var prop = name + "_";
		var func = {};
		func['initialize'] = function() {
			this[prop] = undefined;
		};
		func[name] = function(val) {
			this[prop] = val;
		};
		func['evaluate'] = function() {
			if(this[prop] === undefined) return undefined;
			else return [name + ":" + this[prop] + ";"];
		};
		This.install(name, func);
	};


	// transform wrapper (2d)
	KeyframesBuilder.install('transform', {
		initialize: function() {
			this.transform_ = [
				[1, 0, 0],
				[0, 1, 0],
				[0, 0, 1],
			];
		},
		evaluate: function() {
			var t = this.transform_;
			var fx = util.fx;
			return ["-webkit-transform: matrix(" + [fx(t[0][0]), fx(t[1][0]), fx(t[0][1]), fx(t[1][1]), fx(t[0][2]), fx(t[1][2])].join(",") + ");"];
		},
		translate: function(a) {
			if(!(a instanceof Array)) a = $A(arguments);
			a[0] = a[0] || 0;
			a[1] = a[1] || 0;
			var t = this.transform_;
			this.transform_ = util.mulMatrix33(this.transform_, [
				[1, 0, a[0]],
				[0, 1, a[1]],
				[0, 0, 1   ]
			]);
		},
		rotate: function(a) {
			var t = this.transform_;
			a = a || 0;
			var sin = Math.sin(a / 360 * Math.PI * 2.0);
			var cos = Math.cos(a / 360 * Math.PI * 2.0);

			this.transform_ = util.mulMatrix33(this.transform_, [
				[cos,-sin, 0],
				[sin, cos, 0],
				[0,   0,   1],
			]);
		},
		scale: function(a) {
			if(!(a instanceof Array)) a = $A(arguments);
			a[0] = a[0] || 1;
			a[1] = a[1] || 1;
			this.transform_ = util.mulMatrix33(this.transform_, [
				[a[0],   0, 0],
				[   0,a[1], 0],
				[   0,   0, 1],
			]);
		},
	});


	// transform wrapper (3d)
	KeyframesBuilder.install('transform3d', {
		initialize: function() {
			this.transform3d_ = [
				[1, 0, 0, 0],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1],
			];
		},
		evaluate: function() {
			var fx = util.fx;
			var t = this.transform3d_.map(function(xy) {
				return xy.map(function(x) {
					return fx(x);
				});
			});
			return ["-webkit-transform: matrix3d(" + [
				[t[0][0], t[1][0], t[2][0], t[3][0]].join(", "),
				[t[0][1], t[1][1], t[2][1], t[3][1]].join(", "),
				[t[0][2], t[1][2], t[2][2], t[3][2]].join(", "),
				[t[0][3], t[1][3], t[2][3], t[3][3]].join(", "),
			].join(",   ")+ ")"];
		},
		translate3d: function(a) {
			if(!(a instanceof Array)) a = $A(arguments);
			a[0] = a[0] || 0;
			a[1] = a[1] || 0;
			a[2] = a[2] || 0;
			var t = this.transform3d_;
			this.transform3d_ = util.mulMatrix44(this.transform3d_, [
				[1, 0, 0, a[0]],
				[0, 1, 0, a[1]],
				[0, 0, 1, a[2]],
				[0, 0, 0, 1   ]
			]);
		},
		rotatex3d: function(a) {
			var t = this.transform3d_;
			a = a || 0;
			var sin = Math.sin(a / 360 * Math.PI * 2.0);
			var cos = Math.cos(a / 360 * Math.PI * 2.0);

			this.transform3d_ = util.mulMatrix44(this.transform3d_, [
				[   1,   0,   0,   0],
				[   0, cos,-sin,   0],
				[   0, sin, cos,   0],
				[   0,   0,   0,   1],
			]);
		},
		rotatey3d: function(a) {
			var t = this.transform3d_;
			a = a || 0;
			var sin = Math.sin(a / 360 * Math.PI * 2.0);
			var cos = Math.cos(a / 360 * Math.PI * 2.0);

			this.transform3d_ = util.mulMatrix44(this.transform3d_, [
				[ cos,   0, sin,   0],
				[   0,   1,   0,   0],
				[-sin,   0, cos,   0],
				[   0,   0,   0,   1],
			]);
		},
		rotatez3d: function(a) {
			var t = this.transform3d_;
			a = a || 0;
			var sin = Math.sin(a / 360 * Math.PI * 2.0);
			var cos = Math.cos(a / 360 * Math.PI * 2.0);

			this.transform3d_ = util.mulMatrix44(this.transform3d_, [
				[ cos,-sin,   0,   0],
				[ sin, cos,   0,   0],
				[   0,   0,   1,   0],
				[   0,   0,   0,   1],
			]);
		},
		scale3d: function(a) {
			if(!(a instanceof Array)) a = $A(arguments);
			a[0] = a[0] || 1;
			a[1] = a[1] || 1;
			a[2] = a[2] || 1;
			this.transform3d_ = util.mulMatrix44(this.transform3d_, [
				[a[0],   0,   0, 0],
				[   0,a[1],   0, 0],
				[   0,   0,a[2], 0],
				[   0,   0,   0, 1],
			]);
		},
		initMatrix3d: function(a) {
			this.transform3d_ = a.clone();
		},
	});
	KeyframesUtil = {};

	KeyframesUtil.CameraWork2DTransform = {
		evaluate: function(a) {
			var t = util.invert33(this.transform_);
			var fx = util.fx;
			return ["-webkit-transform: matrix(" + [fx(t[0][0]), fx(t[1][0]), fx(t[0][1]), fx(t[1][1]), fx(t[0][2]), fx(t[1][2])].join(",") + ");"];
		},
	};

	KeyframesUtil.CameraWork3DTransform = {
		gazeFrom: function(p, g, u) {
			if(!this.projMatrix) {
				var self = this;
				this.projMatrix = (function() {
					var viewAngle = 1.0;
					var far = -1;
					var near = -0.001;
					var y = 1.0 / Math.tan(viewAngle / 2.0);
					var x = y;
					var z = far / (far - near);
					var w = -z * near;

					return [
					  [x, 0, 0, 0],
					  [0, y, 0, 0],
					  [0, 0, z, 1],
					  [0, 0, w, 0]
					].transpose();
				})();
			}

			var pos = (p || [0, 0, 0]);
			var gazeTo = (g || [0, 0, 0]);
			var upTo = u || [0, -1, 0];

			// multiply -1 to parts of pole (due to right hand coordinate system on css)
			var z = gazeTo.sub(pos).normalize(1);
			var x = upTo.cross(z).normalize(1);
			var y = z.cross(x).normalize(-1);

			var p_x = -p.dot(x);
			var p_y = -p.dot(y);
			var p_z = -p.dot(z);

			this.viewMatrix = [
				[x[0], y[0], z[0], 0],
				[x[1], y[1], z[1], 0],
				[x[2], y[2], z[2], 0],
				[p_x,  p_y,  p_z, 1]
			];

			this.transform3d_ = util.mulMatrix44(this.viewMatrix, this.projMatrix).transpose();
		},
	};

	window.KeyframesBuilder = KeyframesBuilder;

})();
