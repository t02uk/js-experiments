(function() {

  
  Object.extend(Array.prototype, {
    chain: function(f) {
      var ret = _V(this[0]);
      if(f(ret)) return ret;
      
      for(var i = 1, l = this.length; i < l; i++) {
        ret = _V(this[i], ret);
        if(f(ret)) return ret;
      }
      return ret;
    },
    
    andThen: function() {
      return this.chain(function(e) {return e === null;});
    },

    orThen: function() {
      return this.chain(function(e) {return e !== null;});
    }
  });
  
  Object.extend(Number.prototype, {
    toRadian: function() {
      return 2.0 * Math.PI * this;
    },
    rand: function() {
      return ~~this.randf();
    },
    randf: function() {
      return this * Math.random();
    },
    sign: function() {
      return this > 0 ?  1 :
             this < 0 ? -1 : 0;
    },
    arize: function(n) {
      if(n === 0) return [];
      else if(n === 1) return [this];
      else return new Array(n).fill(this);
    }

  });

  Object.extend(ObjectRange.prototype, {
    rand: function() {
    return ~~(this.start + (this.end - this.start + 1).randf());
    },
    randf: function() {
      return this.start + (this.end - this.start).randf();
    }
  });
  
  window._V = function(a, b) {
    if(a instanceof Function) return (a(_V(b)));
    else return a;
  };

  window.Geo = {
    polygon: function(n, i) {
      i = i || 1;
      return $R(0, n).map(function(e) { return [0, 1].rotate(e.toRadian() * i / n);});
    },
    rect: function(centerize) {
      if(centerize) return [
        [-0.5, -0.5],
        [ 0.5, -0.5],
        [ 0.5,  0.5],
        [-0.5,  0.5]
      ];
      else return [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ];
    },
    plane: function(centerize) {
      if(centerize) return[
        [-0.5, -0.5, 0],
        [ 0.5, -0.5, 0],
        [ 0.5,  0.5, 0],
        [-0.5,  0.5, 0]
      ];
      else return[
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0]
      ]
    },
  };

  // exntend Number As Vector, Matrix ...
  Object.extend(Array.prototype, {
    fill: function(v) {
      for(var i = 0, l = this.length; i < l; i++) this[i] = v;
      return this;
    },
    randomSelect: function() {
      return this[this.length.rand()];
    },
		shuffle: function() {
			var result = this.clone();
			for(var i = result.length - 1; i > 0; i--) {
				var idx1 = ~~(Math.random() * i);
				var idx2 = i;
				if(idx1 !== idx2) {
					var work = result[idx1];
					result[idx1] = result[idx2];
					result[idx2] = work;
				}
			}
			return result;
		},
    flatMap: function(f) {
      var result = [];
      this.each(function(e) {
        if(e.flatMap) result = result.concat(e.flatMap(f));
        else result = result.concat(f(e));
      });
      return result;
    },
    shallowFlatten: function() {
      var result = [];
      this.each(function(e) {
        if(e instanceof Array) result = result.concat(e);
        else result.push(e);
      })
      return result;
    },
    square: function() {
      return this.inject(0, function(i, n) {
        return i + n * n;
      });
    },
    abs: function() {
      return Math.sqrt(this.square());
    },
    distance: function(that) {
      return this.sub(that).abs();
    },
    normalize: function(a) {
      a = a || 1;
      var abs = this.abs();
      if(abs === 0.0) return this;
      else return this.map(function(e) {
        return e / abs * a;
      });
    },
    add: function(that) {
      return this.zip2(that, function(e) { return e[0] + e[1]; });
    },
    sub: function(that) {
      return this.zip2(that, function(e) { return e[0] - e[1]; });
    },
    mul: function(that) {
      if(typeof that === "number") return this.map(function(e) { return that * e; });
      else if(this.length === 4 && this.all(function(e) { return e.length === 4; })
           && that.length === 3 && that.all(function(e) { return typeof e === "number"; })) return this.mul43(that);
      else if(this.length === 4 && this.all(function(e) { return e.length === 4; })
           && that.length === 4 && that.all(function(e) { return e.length === 4; })) return this.mul44(that);
      else return null;
    },
    mul43: function(that) {
      return [
        this[0][0] * that[0] + this[1][0] * that[1] + this[2][0] * that[2] + this[3][0],
        this[0][1] * that[0] + this[1][1] * that[1] + this[2][1] * that[2] + this[3][1],
        this[0][2] * that[0] + this[1][2] * that[1] + this[2][2] * that[2] + this[3][2],
        this[0][3] * that[0] + this[1][3] * that[1] + this[2][3] * that[2] + this[3][3]
      ];
    },
    mul44: function(that) {
      return [
        [
          this[0][0] * that[0][0] + this[0][1] * that[1][0] + this[0][2] * that[2][0] + this[0][3] * that[3][0],
          this[0][0] * that[0][1] + this[0][1] * that[1][1] + this[0][2] * that[2][1] + this[0][3] * that[3][1],
          this[0][0] * that[0][2] + this[0][1] * that[1][2] + this[0][2] * that[2][2] + this[0][3] * that[3][2],
          this[0][0] * that[0][3] + this[0][1] * that[1][3] + this[0][2] * that[2][3] + this[0][3] * that[3][3]
        ],[
          this[1][0] * that[0][0] + this[1][1] * that[1][0] + this[1][2] * that[2][0] + this[1][3] * that[3][0],
          this[1][0] * that[0][1] + this[1][1] * that[1][1] + this[1][2] * that[2][1] + this[1][3] * that[3][1],
          this[1][0] * that[0][2] + this[1][1] * that[1][2] + this[1][2] * that[2][2] + this[1][3] * that[3][2],
          this[1][0] * that[0][3] + this[1][1] * that[1][3] + this[1][2] * that[2][3] + this[1][3] * that[3][3]
        ],[
          this[2][0] * that[0][0] + this[2][1] * that[1][0] + this[2][2] * that[2][0] + this[2][3] * that[3][0],
          this[2][0] * that[0][1] + this[2][1] * that[1][1] + this[2][2] * that[2][1] + this[2][3] * that[3][1],
          this[2][0] * that[0][2] + this[2][1] * that[1][2] + this[2][2] * that[2][2] + this[2][3] * that[3][2],
          this[2][0] * that[0][3] + this[2][1] * that[1][3] + this[2][2] * that[2][3] + this[2][3] * that[3][3]
        ],[
          this[3][0] * that[0][0] + this[3][1] * that[1][0] + this[3][2] * that[2][0] + this[3][3] * that[3][0],
          this[3][0] * that[0][1] + this[3][1] * that[1][1] + this[3][2] * that[2][1] + this[3][3] * that[3][1],
          this[3][0] * that[0][2] + this[3][1] * that[1][2] + this[3][2] * that[2][2] + this[3][3] * that[3][2],
          this[3][0] * that[0][3] + this[3][1] * that[1][3] + this[3][2] * that[2][3] + this[3][3] * that[3][3]
        ]
      ];
    },
    sum: function() {
      return this.inject(0, function(i, e) { return i + e; });
    },
    average: function() {
      if(this.length === 0) return 0;
      else return this.sum() / this.length;
    },
    negative: function() {
      return this.mul(-1);
    },
    dot: function(that) {
      return this.zip2(that).inject(0, function(i, e) { return i + e[0] * e[1]; });
    },
    cross: function(that) {
      if(this.length === 2 && that.length === 2) return this[0] * that[1] - this[1] * that[0];
      else if(this.length === 3 && that.length === 3) return [
        this[1] * that[2] - this[2] * that[1],
        this[2] * that[0] - this[0] * that[2],
        this[0] * that[1] - this[1] * that[0]
      ];
      else return null;
    },
    invert: function() {
      if(this.length === 2) {
        var det = this[0][0] * this[1][1] - this[0][1] * this[1][0];
        if(det === 0) return null;
        var reciprocal = 1 / det;

        return [
          [this[1][1] * reciprocal,
          -this[0][1] * reciprocal],
          [-this[1][0] * reciprocal,
           this[0][0] * reciprocal]
        ];
      } else {
        return null;
      }
    },
    translate: function(a) {
      if(!(a instanceof Array)) a = Array.prototype.slice.call(arguments);
      
      if(this[0] instanceof Array) return this.map(function(x) {
        return x.zip2(a, function(e) {
          return e[0] + e[1];
        });
      });
      else return this.zip2(a, function(e) {
        return e[0] + e[1];
      });
    },
    rotate: function(radian) {
      if(this.length === 0) return this;
      else if(this[0] instanceof Array) return this.map(function(e) {return e.rotate(radian);});
      else if(this.length === 2)
        return [this[0] * Math.cos(radian) - this[1] * Math.sin(radian),
                this[0] * Math.sin(radian) + this[1] * Math.cos(radian)];
      else if(this.length === 3) return this;
    },
    rotatea: function(radian, axis) {
      if(this.length === 3) {
        var a = axis.normalize();
        var  x = this[0],  y = this[1],  z = this[2];
        var ax = axis[0], ay = axis[1], az = axis[2];
        var sin = Math.sin(radian);
        var cos = Math.cos(radian);
        var rcs = 1 - cos;

        return [
            (ax * ax * rcs + cos) * x
          + (ax * ay * rcs - az * sin) * y
          + (az * ax * rcs + ay * sin) * z,

            (ax * ay * rcs + az * sin) * x
          + (ay * ay * rcs + cos) * y
          + (ay * az * rcs - ax * sin) * z,

            (az * ax * rcs - ay * sin) * x
          + (ay * az * rcs + ax * sin) * y
          + (az * az * rcs + cos) * z
        ];
      }
      else return this;
    },
    rotatex: function(radian) {
      if(this.length === 3) return [
        this[0],
        this[1] * Math.cos(radian) - this[2] * Math.sin(radian),
        this[1] * Math.sin(radian) + this[2] * Math.cos(radian)
      ];
      else return this;
    },
    rotatey: function(radian) {
      if(this.length === 3) return [
        this[0] * Math.cos(radian) - this[2] * Math.sin(radian),
        this[1],
        this[0] * Math.sin(radian) + this[2] * Math.cos(radian)
      ];
      else return this;
    },
    rotatez: function(radian) {
      if(this.length === 3) return [
        this[0] * Math.cos(radian) - this[1] * Math.sin(radian),
        this[0] * Math.sin(radian) + this[1] * Math.cos(radian),
        this[2]
      ];
      else return this;
    },
    scale: function(a) {
      if(!(a instanceof Array)) a = Array.prototype.slice.call(arguments);
      if(this[0] instanceof Array) return this.map(function(x) {
        return x.zip2(a, function(e) {
          return e[0] * e[1];
        });
      });
      else return this.zip2(a, function(e) {
        return e[0] * e[1];
      });
    },
    zip2: function(that, callback) {
      that = that || [];
      callback = callback || Prototype.K;
      var result = new Array(Math.min(this.length, that.length));
      for(var i = 0, l = result.length; i < l; i++) {
        result[i] = (callback([this[i], that[i]]));
      }
      return result;
    },
    zipWithIndex: function(callback) {
      callback = callback || function(){return $A(arguments);};
      var i = 0;
      return this.map(function(e) {
        return callback(e, i++);
      });
    },
    transpose: function() {
      var len1 = this.length;
      var len2 = this[0].length;
      var result = new Array(len2);
      for(var i = 0; i < len2; i++) {
        result[i] = new Array(len1);
        for(var j = 0; j < len1; j++) {
          result[i][j] = this[j][i];
        }
      }
      return result;
    },
    rgb: function() {
      switch(this.length) {
        case 3:
          var r = this[0];
          var g = this[1];
          var b = this[2];
          return "rgb(" + [~~r, ~~g, ~~b].join(", ") + ")";
        case 4:
          var r = this[0];
          var g = this[1];
          var b = this[2];
          var a = this[3];
          return "rgba(" + [~~r, ~~g, ~~b, a].join(", ") + ")";
      }
    },
    hsv: function() {
      var h = this[0];
      var s = this[1];
      var v = this[2];

      var hi = ~~(h * 6);
      var f = h * 6 - hi;

      var p = v * (1 - s);
      var q = v * (1 - f * s);
      var t = v * (1 - (1 - f) * s);

      var result = null;
      switch(hi) {
        case 0: result = [v * 0xff, t * 0xff, p * 0xff].rgb(); break;
        case 1: result = [q * 0xff, v * 0xff, p * 0xff].rgb(); break;
        case 2: result = [p * 0xff, v * 0xff, t * 0xff].rgb(); break;
        case 3: result = [p * 0xff, q * 0xff, v * 0xff].rgb(); break;
        case 4: result = [t * 0xff, p * 0xff, v * 0xff].rgb(); break;
        case 5: result = [v * 0xff, p * 0xff, q * 0xff].rgb(); break;
        default: break;
      }
      return result;
    }
  });


  // Counter
  var Counter = function(max) {
    var count = 0;
    return function() {
      if(count > max) return null;
      else return count++;
    };
  };
  window.Counter = Counter;

  var ImageDataWrapper = function(img) {
    this.img = img;
    this.width = img.width;
    this.height = img.height;
  };
  ImageDataWrapper.prototype = {
    toByte: function(p) {
      if(p.length === 1) return p;
      else return (~~(p[0] * this.width + p[1] * this.height * this.width)) * 4;
    },
    at: function(p, c) {
      p = this.toByte(p);
      if(c) {
        this.img.data[p + 0] = c[0];
        this.img.data[p + 1] = c[1];
        this.img.data[p + 2] = c[2];
        this.img.data[p + 3] = c[3] || 0xff;
      }
      else {
        return [
          this.img.data[p + 0],
          this.img.data[p + 1],
          this.img.data[p + 2]
          //Array.prototype.slice.apply(this.img.data, p, p + 3)
        ];
      }
    }
  };

  DCore = function() {

    //return this.init(c, asSubtexture);
    return DCore.prototype.init.apply(this, $A(arguments))
  };
  DCore.prototype = {
    // world space
    worldSize: 1.0,
    near:  0.0,
    far: 1.5,
    left: -0.5,
    right: 0.5,
    top: 0.5,
    bottom: -0.5,
    viewAngle: 1.5,
    
    // device space
    left2d: 0.0,
    right2d: 1.0,
    top2d: 0.0,
    bottom2d: 1.0,
    
    // (deprecated) draw option
    softclip: true,

    // initialize the class
    // c: canvas dom element
    init: function(c, asSubtexture) {

      var self = this;

      this.asSubtexture = asSubtexture
      self.canvas = c || document.getElementById('world');
      self.ctx = self.canvas.getContext('2d');
      self.ctxCtr = CanvasRenderingContext2D;
      self.ctx.textBaseline = "top";

      if(!asSubtexture) {
        window.addEventListener("resize", function() {
          self.width = self.canvas.width = window.innerWidth;
          self.height = self.canvas.height = window.innerHeight;
          self.ctx.textBaseline = "top";
          return arguments.callee;
       }(), false);
     } else {
       self.width = self.canvas.width;
       self.height = self.canvas.height;
     }

      // 3d 
      this.pos = [0, 0, 1];
      this.upTo = [0, 1, 0];
      this.gazeTo = [0, 0, 0];
      
      this.viewMatrix = new Array(4).fill(new Array(4).fill(0));

      this.projMatrix = (function() {
        var y = 1.0 / Math.tan(self.viewAngle / 2.0);
        var x = y;
        var z = self.far / (self.far - self.near);
        var w = -z * self.near;

        return [
          [x, 0, 0, 0],
          [0, y, 0, 0],
          [0, 0, z, 1],
          [0, 0, w, 0]
        ];
      })();

      this.convMatrix = new Array(4).fill(new Array(4).fill(0));
      this.convMatrixStack = [];

      return this;
    },
    tap: function(func) {
      func.call(this, this);
      return this;
    },
    // generate pseudo texture
    subTexture: function(width, height) {
      var c = document.createElement("canvas");
      c.width = ~~(width) || 256;
      c.height = ~~(height) || c.width;

      return new DCore(c, true);
    },
    // return whether given parameter is instance of texture
    isSubTexture: function(src) {
      return src instanceof DCore && src.asSubtexture;
    },
    // return whether given coordinate is in bound of screen or not
    isInBoundScr: function(p) {
      p = this.toWorld2d(p);
      return this.left2d <= p[0] && p[0] <= this.right2d
          && this.top2d  <= p[1] && p[1] <= this.bottom2d;
    },
    // set drawing color r,g,b
    rgb: function(r, g, b) {
      if(r instanceof Array) {
        return DCore.prototype.rgb.apply(this, r);
      } else {
        this.ctx.fillStyle = [r, g, b].rgb();
        this.ctx.strokeStyle = [r, g, b].rgb();
        return this;
      }
    },
    // set drawing color h,s,v
    hsv: function(h, s, v) {
      if(h instanceof Array) {
        return DCore.prototype.hsv.apply(this, h);
      } else {
        this.ctx.fillStyle = [h, s, v].hsv();
        this.ctx.strokeStyle = [h, s, v].hsv();
        return this;
      }
    },
    // set drawing color h,s,l
    hsl: function(h, s, l) {
      if(h instanceof Array) {
        return DCore.prototype.hsl.apply(this, h);
      } else {
        h = (~~(h * 360)) % 360;
        s = (~~(s * 100)) + "%";
        l = (~~(l * 100)) + "%";
        this.ctx.fillStyle = "hsl(" + [h, s, l].join(", ") + ")";
        this.ctx.strokeStyle = "hsl(" + [h, s, l].join(", ") + ")";
        return this;
      }
    },
    // p0: start of color stop
    // p1: start of color stop
    // css: color infos array
    gradient: function(p0, p1, css) {
      p0 = this.toScr(p0);
      p1 = this.toScr(p1);
      var grad = this.ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      for(var i = 0; i < css.length; i++) {
        var cs = css[i];
        var k = cs[0];
        var c = (cs[1] instanceof Array) ? cs[1].rgb() : cs[1];
        grad.addColorStop(cs[0], c);
      }
      this.ctx.fillStyle = grad;
      return this;
    },
    // set font
    // type. ex) serif, sans-serif, cursive, fantasy, monospace
    font: function(type, size, style) {
      if(type instanceof Array) return DCore.prototype.font.apply(this, type);
      if(typeof size === "number") size = this.toScr(size);
      this.ctx.font = 
        [(style) ? style : ""
        ,(!size) ? 16 : (size.toString().match(/[^0-9]$/)) ? size : size + "pt"
        ,(type || "Serif")].join(" ");
      return this;
    },
    textAlign: function(align) {
      this.ctx.textAlign = align;
      return this;
    },
    textBaseline: function(align) {
      this.ctx.textBaseline = align;
      return this;
    },
    // set alpha value for drawing effect
    alpha: function(alpha) { this.ctx.globalAlpha = alpha; return this; },
    // set globalCompositeOperation parameter
    blend: function(blend) { this.ctx.globalCompositeOperation = blend; return this; },
    // fill background
    fillBack: function() {
      this.ctx.fillRect(0, 0, this.width, this.height);
      return this;
    },
    // convert world coordinate to screen coordinate
    toScr: function(p) {
      if(!p.length) {
        return p * this.width * 0.5;
      }
      // screen -> device
      else if(p.length === 2) return [
        (p[0] + this.left2d) * this.width,
        (p[1] + this.top2d) * this.height
      ];
      // world -> screen
      else if(p.length === 3) return this.toScr(this.toWorld2d(p).slice(0, 2));
    },
    scr2World2d: function(p) {
      // scala value will accepted but not recomended
      if(!p.length) return (p - this.left2d) / this.width;
      // vector
      else return [
        (p[0] - this.left2d) / this.width,
        (p[1] - this.top2d) / this.height
      ];
    },
    toWorld2d: function(p) {
      if(!p.length) return p;
      else if(p.length === 2) return p;
      else if(p.length === 3) {
        var clipPos = this.convMatrix.mul43(p);

        if(clipPos[3] > 0.0) {
          var reciprocal = 1 / clipPos[3];
          clipPos[0] *= reciprocal;
          clipPos[1] *= reciprocal;
          clipPos[2] *= reciprocal;
          clipPos[3]  = 1.0;
        } else {
          clipPos[2] = -1;
        }

        this.backclip = clipPos[3] < 0;

        return [
          clipPos[0] - this.left,
        -(clipPos[1] - this.top),
          clipPos[2]
        ];
      }
    },
    toWorld2dParallel: function(ps, f) {
      var result = new Array(ps.length);
      for(var i = 0, l = ps.length; i < l; i++) {
        var p = this.toWorld2d(ps[i]);
        if(p[2] < 0) return null;
        result[i] = p.slice(0, f ? 3 : 2);
      }
      return result;
    },
    // convert world coordinate to screen coordinate
    // set camera position
    //  p: posiiton of camera
    //  g: gaze to 
    //  u: upto
    gazeFrom: function(p, g, u) {
      if(p) this.pos = p;
      if(g) this.gazeTo = g;
      if(u) this.upTo = u;

      var z = this.gazeTo.sub(this.pos).normalize();
      var x = this.upTo.cross(z).normalize();
      var y = z.cross(x).normalize();

      var p_x = -p.dot(x);
      var p_y = -p.dot(y);
      var p_z = -p.dot(z);

      this.viewMatrix = [
        [x[0], y[0], z[0], 0],
        [x[1], y[1], z[1], 0],
        [x[2], y[2], z[2], 0],
        [p_x,  p_y,  p_z, 1]
      ];

      this.updateConvMatrix();

      return this;
    },
    // push matrix
    pushMatrix: function() {
      if(this.convMatrixStack.length > 64) throw "積みすぎ";
      this.convMatrixStack.push(this.convMatrix);
    },
    // pop matrix
    popMatrix: function() {
      if(this.convMatrixStack.length <= 0) throw "積んでない";
      this.convMatrix = this.convMatrixStack.pop();
    },
    mulMatrix: function(m) {
      this.convMatrix = m.mul(this.convMatrix);
    },
    scale: function(s) {
      this.mulMatrix([
        [s[0] ,  0,   0, 0],
        [  0, s[1],   0, 0],
        [  0,    0,s[2], 0],
        [  0,    0,   0, 1]
      ]);
    },
    translate: function(t) {
      this.mulMatrix([
        [  1,    0,   0, 0],
        [  0,    1,   0, 0],
        [  0,    0,   1, 0],
        [t[0],t[1],t[2], 1]
      ]);
    },
    // mul matrix
    mulMatrix: function(m) {
      this.convMatrix = this.convMatrix.mul(m);
    },
    // update matrix for converting 3 dimension coordinate
    updateConvMatrix: function() {
      if(!this.projMatrix) return;
      if(!this.viewMatrix) return;

      this.convMatrix = this.viewMatrix.mul44(this.projMatrix);
    },
    // draw rect
    rect: function(p, wh) {
      this.ctx.beginPath();
      p = this.toScr(p);
      wh = this.toScr(wh);
      this.ctx.rect(
        p[0], p[1],
        wh[0], wh[1]
      );
      return this;
    },
    // clear rect
    clear: function(p, wh) {
      p = this.toScr(p || [0, 0]);
      wh = this.toScr(wh || [1, 1]);
      this.ctx.clearRect(
        p[0], p[1],
        wh[0], wh[1]
      );
      return this;
    },
    // draw line
    //  ps: position list
    line: function(ps) {
      var ctx = this.ctx;
      ctx.beginPath();

      ps = this.toWorld2dParallel(ps);
      if(!ps) return this;
      
      for(var i = 0, l = ps.length; i < l; i++) {
        var p = this.toScr(ps[i]);
        if(i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      return this;
    },
    // draw quads
    // ps: position list
    quads: function(ps, unclose) {
      var ctx = this.ctx;
      ctx.beginPath();

      ps = this.toWorld2dParallel(ps);
      if(!ps) return this;
      
      for(var i = 0, l = ps.length; i < l; i++) {
        var p = this.toScr(ps[i]);
        if(i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      if(!unclose) ctx.closePath();
      return this;
    },
		// draw loop
		loop: function(ps) {
      var ctx = this.ctx;
      ctx.beginPath();

      ps = this.toWorld2dParallel(ps);
      if(!ps) return this;
      
      for(var i = 0, l = ps.length; i < l; i++) {
        var p = this.toScr(ps[i]);
        if(i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
			ctx.lineTo(ps[0][0], ps[0][1]);
      return this;
		},
    // draw curved quads
    //
    curved: function(ps, unclose) {
      var ctx = this.ctx;
      ctx.beginPath();

      for(var i = 0, l = ps.length; i < l; i++) {
        var p = this.toScr(ps[i][0]);
        if(i === 0) ctx.moveTo(p[0], p[1]);
        else if(!ps[i][1]) ctx.lineTo(p[0], p[1]);
        else { 
          var p2 = this.toScr(ps[++i][0]);
          ctx.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
        }
      }
      if(!unclose) ctx.closePath();
      return this;
    },
    // draw circle
    circle: function(_p, _radius, _startAngle, _endAngle) {
      var p = this.toScr(_p);
      var d = this.toWorld2d(_p);
      var radius = (_p.length === 2) ? this.toScr(_radius) : this.toScr(_radius) / d[2];
      var startAngle = _startAngle || 0.0;
      var endAngle = _endAngle || Math.PI * 2.0;
      this.ctx.beginPath();
      this.ctx.arc(p[0], p[1], radius, startAngle, endAngle, false);
      return this;
    },
    // draw luminous
    luminous: function(_p, _r0, _r1, css) {
      this.ctx.beginPath();
      var p = this.toScr(_p);
      var d = this.toWorld2d(_p);
      var backclip = this.backclip;


      if(_p.length === 2) {
        var r0 = this.toScr(_r0);
        var r1 = this.toScr(_r1);
      } else {
        var z = this.gazeTo.sub(this.pos).normalize();
        var x = this.upTo.cross(z).normalize();
        var r0 = this.toScr(_p.add(x.mul(_r0))).distance(this.toScr(_p));
        var r1 = this.toScr(_p.add(x.mul(_r1))).distance(this.toScr(_p));
        if(backclip) return this;
      }

      var grad = this.ctx.createRadialGradient(p[0], p[1], r0, p[0], p[1], r1);
      for(var i = 0; i < css.length; i++) {
        var cs = css[i];
        var k = cs[0];
        var c = (cs[1] instanceof Array) ? cs[1].rgb() : cs[1];
        grad.addColorStop(cs[0], c);
      }
      this.ctx.fillStyle = grad;
      this.ctx.arc(p[0], p[1], r1, 0, Math.PI * 2, false);
      return this;
    },
    // fill
    fill: function(){ this.ctx.fill(); return this; },
    // stroke
    stroke: function(){ this.ctx.stroke(); return this; },
    // set line width
    lineWidth: function(w){
      var a = this.toScr(w);
      if(isFinite(a)) {
        this.ctx.lineWidth = a;
      }

      return this;
    },
    // scale
    scale: function(s) {
      if(!s) return this;
      this.ctx.scale(s[0], s[1]);
      return this;
    },
    // rotate
    rotate: function(rad) {
      if(!rad) return this;
      this.ctx.rotate(rad);
      return this;
    },
    // translate
    translate: function(_p) {
      if(!_p) return this;
      var p = this.toScr(_p);
      this.ctx.translate(p[0], p[1]);
      return this;
    },
    // reset canvas coordinate space
    reset: function() { 
      this.ctx.setTransform(1.0, 0.0, 
                            0.0, 1.0,
                            0.0, 0.0);
      return this;
    },
    // clip
    clip: function() { this.ctx.clip(); return this; },
    // save
    save: function() { this.ctx.save(); return this; },
    // restore
    restore: function() { this.ctx.restore(); return this; },
    // using
    using: function(f) { this.save(); f(this); this.restore(); return this; },
    // translate -> scale -> rotate (experiments)
    tsr: function(p) {
      var d = this;
      
      d.translate(p);
      return function(s) {
        d.scale(s);
        return function(rad) {
          return d.rotate(rad);
        };
      };
    },
    // a wrapper of canvas.drawImage
    drawImage: function(img, _p1, _s1, _p2, _s2) {

      var args = [img instanceof DCore ? img.canvas : img];

      switch(arguments.length) {
        case 1:   // drawImage(image); // un
          args.push(this.toScr([0, 0]));
          args.push(this.toScr([1, 1]));
          break;
        case 2:   // drawImage(image, p1[dx, dy]);
          args.push(this.toScr(_p1));
          args.push(this.toScr([1, 1]));
          break;
        case 3:   // drawImage(image, p1[dx, dy], s1[dw, dh]);
          args.push(this.toScr(_p1));
          args.push(this.toScr(_s1));
          break;
        case 5:   // drawImage(image, p1[sx, sy], s1[sw, sh], p2[dx, dy], s2[dw, dh])
          args.push(_p1.scale([img.width, img.height]));
          args.push(_s1.scale([img.width, img.height]));
          args.push(this.toScr(_p2));
          args.push(this.toScr(_s2));
          break;
        default:
          throw "引数おかしい";
          break;
      }

      this.ctxCtr.prototype.drawImage.apply(this.ctx, args.shallowFlatten());

      return this;
    },
    transform: function(m11, m12, m21, m22, dx, dy) {
      dx = this.toScr(dx);
      dy = this.toScr(dy);

      this.ctx.transform(m11, m12, m21, m22, dx, dy);
      return this;
    },
    // ref
    // 最速チュパカブラ研究会 - Canvasによる3Dテクスチャマッピングとパフォーマンスチューニング（仮題）
    // http://d.hatena.ne.jp/gyuque/20090211#1234364019
    //
    // 
    transformTo: function(from, to, drawing) {
      // check
      if(!from) throw "from is abnormal";
      if(!to) throw "to is abnormal";
      if(from.length !== to.length) throw "there is defferent between from and to length";

      var self = this;
      from = from.clone();
      to = self.toWorld2dParallel(to);
			if(!to) return this;

      var pf1 = from.shift();
      var pf2 = from.shift();

      var pt1 = to.shift();
      var pt2 = to.shift();


      // a drawing methods like GL_TRIANGLE_FUN
      from.zip2(to).inject([pf2, pt2], function(i, e) {
        var pf2 = i[0];
        var pt2 = i[1];

        var pf3 = e[0];
        var pt3 = e[1];

        var vf1 = pf2.sub(pf1);
        var vf2 = pf3.sub(pf1);

        var vt1 = pt2.sub(pt1);
        var vt2 = pt3.sub(pt1);

        var inv = [
          vf1, vf2
        ].invert();
        if(!inv) return;

        var a = inv[0][0] * vt1[0] + inv[0][1] * vt2[0];
        var c = inv[1][0] * vt1[0] + inv[1][1] * vt2[0];

        var b = inv[0][0] * vt1[1] + inv[0][1] * vt2[1];
        var d = inv[1][0] * vt1[1] + inv[1][1] * vt2[1];

        var ef = pt1.sub([pf1[0] * a + pf1[1] * c,
                          pf1[0] * b + pf1[1] * d]);
        //var ef = pt1.sub(pf1);

        // :<
        self
          .save()
          .quads([pt1, pt2, pt3], true)
          .clip()
          .save()
          .translate(ef)
          .transform(a, b, c, d, 0, 0)
				;
          //.tap(drawing.curry(self, to, from))
				drawing(self, to, from);
				self
          .restore()
          .restore()
        ;

        return e;
      });


      return this;
    },
    // fillText
    fillText: function(text, _p) {
      var p = this.toScr(_p);
      this.ctx.fillText(text, p[0], p[1]);
      return this;
    },
    // strokeText
    strokeText: function(text, _p) {
      var p = this.toScr(_p);
      this.ctx.strokeText(text, p[0], p[1]);
      return this;
    },
    // measureText
    measureText: function(text) {
      var metrics = this.ctx.measureText(text);
      return this.scr2World2d(metrics.width);
    },
    // getNativeImageData
    getNativeImageData: function(p, s) {
      p = this.toScr(p || [0, 0]);
      s = this.toScr(s || [1, 1]);
      return this.ctx.getImageData(p[0], p[1], s[0], s[1]);
    },
    // getImageData
    getImageData: function(p, s) {
      return new ImageDataWrapper(
        this.getNativeImageData(p, s)
      );
    },
  };
  window.DCore = DCore;


  function CSS3Helper() {
  };
  CSS3Helper.prototype = {
		transformToByArray: function(element, wh, to) {
      var w = wh[0];
      var h = wh[1];
      if(!w) throw "failed to get width";
      if(!h) throw "failed to get height";

      var pf1 = [0, 0];
      var pf2 = [w, 0];
      var pf3 = [0, h];

      var pt1 = to[0];
      var pt2 = to[1];
      var pt3 = to[3];

      var vf1 = pf2.sub(pf1);
      var vf2 = pf3.sub(pf1);

      var vt1 = pt2.sub(pt1);
      var vt2 = pt3.sub(pt1);

      var inv = [
        vf1, vf2
      ].invert();
      if(!inv) return;

      var a = inv[0][0] * vt1[0] + inv[0][1] * vt2[0];
      var b = inv[0][0] * vt1[1] + inv[0][1] * vt2[1];
      var x = inv[0][0] * vt1[2] + inv[0][1] * vt2[2];

      var c = inv[1][0] * vt1[0] + inv[1][1] * vt2[0];
      var d = inv[1][0] * vt1[1] + inv[1][1] * vt2[1];
      var y = inv[1][0] * vt1[2] + inv[1][1] * vt2[2];

      var t = pt1.sub([pf1[0] * a + pf1[1] * c,
                       pf1[0] * b + pf1[1] * d,
                       pf1[0] * x + pf1[1] * y]);

      var r = [
        [a, c, 0, t[0]],
        [b, d, 0, t[1]],
        [x, y, 1, t[2]],
        [0, 0, 0, 1],
      ];

			return r;
		},
    transformToByExp: function(element, wh, to) {

			var r = this.transformToByArray(element, wh, to);

      return "-webkit-transform: matrix3d(" + [
        [r[0][0], r[1][0], r[2][0], r[3][0]].join(","),
        [r[0][1], r[1][1], r[2][1], r[3][1]].join(","),
        [r[0][2], r[1][2], r[2][2], r[3][2]].join(","),
        [r[0][3], r[1][3], r[2][3], r[3][3]].join(","),
      ].join(", ") + ");";
    },
  };
  window.CSS3Helper = CSS3Helper;

})();

// vim:sw=2:ts=2

