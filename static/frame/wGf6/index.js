// forked from t02uk's "Ribon & Shabon" http://jsdo.it/t02uk/o67P
window.onload = function() {
  
  function Ribon() {
    return this;
  }
  Ribon.prototype = {
    capacity: 10,
    init: function(ps, hue) {
      this.born = [];
      for(var i = 0; i < this.capacity; i++) {
        this.born[i] = new Born(ps);
        this.born[i].act();
      }
      this.hue = hue;

      return this;
    },
    act: function() {
     
      var lhs = {x: px, y: py};
      var rhs = this.born[0];
        
      var dx = lhs.x - rhs.x - rhs.sx;
      var dy = lhs.y - rhs.y - rhs.sy;
      
      var direction = Math.atan2(dy, dx);
      
      rhs.sx += Math.cos(direction) * 0.005;
      rhs.sy += Math.sin(direction) * 0.005;
      
      rhs.sx *= 0.99;
      rhs.sy *= 0.99;

      //if(rhs.x < 0 || 1 < rhs.x) {
      //  rhs.x = ~~rhs.x;
      //  rhs.sx *= -0.5;
      //}
      //if(rhs.y < 0 || 1 < rhs.y) {
      //  rhs.y = ~~rhs.y;
      //  rhs.sy *= -0.5;
      //}

      rhs.x += rhs.sx;
      rhs.y += rhs.sy;
      
      for(var i = 1; i < this.capacity; i++) {
        this.born[i].act();
        this.born[i].x = (this.born[i-1].ox + this.born[i].x) / 2;
        this.born[i].y = (this.born[i-1].oy + this.born[i].y) / 2;
        this.born[i].sx = (this.born[i-1].x - this.born[i].x);
        this.born[i].sy = (this.born[i-1].y - this.born[i].y);

        if(Math.random() < 0.15 - i * 0.015) {
          var sx = (-this.born[i].sx) * 0.3 + $R(-0.02, 0.02).randf();
          var sy = (-this.born[i].sy) * 0.3 + $R(-0.02, 0.02).randf();
          Ripple.registor(
            {x: this.born[i].x,
             y: this.born[i].y,
             sx: sx,
             sy: sy,
             radius: 0.02 - i * 0.001,
             hue: this.hue}
          );
        }
      }
      
      rhs.act();
      
      return this;
    },
    draw: function(d) {

      for(var i = 1; i < this.capacity; i++) {
        var p1 = this.born[i-1];
        var p2 = this.born[i];
        
        var s = 0.013 - i * 0.0015;
        if(i === 1) s = 0.013 - 2 * 0.0015;
        var t = 0.013 - (i + 1) * 0.0015;
        var hue = this.hue;

        var to = [
          [p1.x + p1.ny * s, p1.y - p1.nx * s],
          [p1.x - p1.ny * s, p1.y + p1.nx * s],
          [p2.x - p2.ny * t, p2.y + p2.nx * t],
          [p2.x + p2.ny * t, p2.y - p2.nx * t]
        ];
        
        d
         .alpha(1 - i / this.capacity * 0.9)
         .blend("lighter")
         .transformTo([[0, 0], [s, 0], [s, s], [0, s]], to, function(d) {
           d.gradient([0, s / 2], [s, s / 2], [
             [0.0,  [hue, 0.0, 0.0].hsv()],
             [0.3,  [hue, 0.4, 0.7].hsv()],
             [0.5,  [hue, 0.0, 1.0].hsv()],
             [0.7,  [hue, 0.4, 0.7].hsv()],
             [1.0,  [hue, 0.0, 0.0].hsv()],
           ])
           .quads([[0, 0], [s, 0], [s, s], [0, s]])
           .fill();
         })
      }
      
      return this;
    }
  };
  
  function Ripple(o) {
    this.x = o.x;
    this.y = o.y;
    this.sx = o.sx;
    this.sy = o.sy;
    this.radius = o.radius;
    this.hue = o.hue;
    this.lineWidth = Math.random() * 0.03 + 0.02;
    this.count = 0;
  }
  Ripple.items = [];
  Ripple.registor = (function() {
    var seq = 0;
    var items = Ripple.items;
    return function(o) {
      var ret;
      ret = items[seq] = new Ripple(o);
      
      seq++; seq &= 127;
      
      return ret;
    };
  })();
  Ripple.prototype = {
    act: function() {
      this.x += this.sx;
      this.y += this.sy;
      
      this.sx *= 0.95;
      this.sy *= 0.95;
      
      return this;
    },
    draw: function(d) {
      this.lineWidth -= 0.002;
      if(this.lineWidth < 0) return;
      d.hsv(this.hue, 0.7, 0.7)
       .lineWidth(this.lineWidth)
        .alpha(1.0)
      
      var hue = this.hue;

      //d.circle(
      //  [this.x, this.y],
      //  this.radius
      //).stroke();

      if(this.radius > 0) {
        d
         .luminous([this.x, this.y], this.radius * 0.2, this.radius, [
          [0.0,  [this.hue, 0.0, 1.0].hsv()],
          [0.5,  [this.hue, 0.1, 0.9].hsv()],
          [0.8,  [this.hue, 0.5, 0.3].hsv()],
          [1.0,  [this.hue, 0.7, 0.5].hsv()]
         ]).fill();
      }

      this.count++;
      this.radius -= 0.002;
      return this;
    }        
  };
  

  function Born(ps) {
    this.x = ps.x || 0.0;
    this.y = ps.y || 0.0;
    this.sx = this.sy = 0.0;
    return this;
  }
  Born.prototype = {
    draw: function(d) {

      var s = 0.1;
      d.quads([
        [this.x - s, this.y - s],
        [this.x + s, this.y - s],
        [this.x + s, this.y + s],
        [this.x - s, this.y + s]
      ]).fill().stroke();
      return this;
    },
    act: function() {
      
      this.ox = this.x;
      this.oy = this.y;
      
      var sp = Math.sqrt(this.sx * this.sx + this.sy * this.sy);
      if(sp !== 0.0) {
        this.nx = this.sx / sp;
        this.ny = this.sy / sp;
      } else {
        this.nx = 0.0;
        this.ny = 0.0;
      }
          
      return this;
    }
  };
  
      
  function Explode(o) {
    this.x = o.x;
    this.y = o.y;
    this.size = 0.1;
    this.sizeUp = $R(0.001, 0.2).randf();
    this.count = 0;
    this.height = $R(0.01, 0.1).randf() + ~~($R(0, 1.2).randf());
    this.rad = $R(0, 1).randf().toRadian();
    this.hue = $R(0.4, 0.7).randf();
  }
  Explode.prototype = {
    act: function() {
      this.count++;
      if(this.count > 4) return {
        act: function(){},
        draw: function(){},
      };

      this.size += this.sizeUp += 0.01;
      return this;
    },
    draw: function(d) {
      var self = this;
      var hue = this.hue;

      d
       .alpha(1.2 - this.count / 4)
       .blend("lighter")
       .save()
       .translate([self.x, self.y])
       .rotate(self.rad)
       .scale([1, self.height])
       .luminous([0, 0], self.size * 0.1, self.size, [
         [1.0,   [hue, 0.7, 1.0].hsv()],
         [0.9,   [hue, 0.3, 0.5].hsv()],
         [0.7,   [hue, 0.3, 0.2].hsv()],
         [0.0,   [hue, 0.1, 0.1].hsv()]
       ]).fill()
       .restore()
      ;

      return this;
    },
  };
  Explode.items = [];
  Explode.registor = (function() {
    var seq = 0;
    var items = Explode.items;
    return function(o) {
      var ret;
      ret = items[seq] = new Explode(o);
      
      seq++; seq &= 15;
      
      return ret;
    };
  })();
  

  var main = function() {
    
    window.px = 0.5;
    window.py = 0.5;
    document.addEventListener("mousemove", function(e) {
      px = e.clientX / d.width + d.left2d;
      py = e.clientY / d.height + d.top2d;
    }, false);
    var lbclick = false;
    window.addEventListener("mousedown", function(e) {
      lbclick = true;
      for(var i = 0; i < $R(2, 5).rand(); i++) {
        Explode.registor({
                x:px,
                y:py});
      }
      for(var i = 0; i < rs.length; i++) {
        var r = rs[i];
        var b = r.born[0];
        var dist = Math.pow(b.x - px, 2) + Math.pow(b.y - py, 2);
        var power = 1 / dist * 0.01;
        if(power > 0.1) power = 0.1;

        var rad = Math.atan2(px - b.x, py - b.y);
        for(var j = 0; j < r.born.length; j++) {
          var b = r.born[j];
          b.sx += Math.cos(rad) * power;
          b.sy += Math.sin(rad) * power;
        }
      }
    }, false);
  
    var d = new DCore().init();
  
    var rs = [];
    for(var i = 0; i < 7; i++) {
      rs[i] = new Ribon().init(
        {
          x: Math.random(),
          y: Math.random()
        },
        i / 7
      );
    }
    (function() {
      d.rgb(lbclick ? [160, 180, 200] : [10, 20, 30])
        .alpha(1.0)
          .blend("source-over")
            .fillBack();

      for(var i = 0; i < rs.length; i++) {
        var r = rs[i];
        r.act().draw(d);
      }
      
      for(var i = 0; i < 128; i++) {
        var ripple = Ripple.items[i];
        if(!ripple) continue;
        ripple.act().draw(d);
      }
      for(var i = 0;i < 16; i++) {
        var explode = Explode.items[i];
        if(!explode) continue;
        explode.act().draw(d);
      }
          
      lbclick = false;
      window.setTimeout(arguments.callee, 33);
    
    })();
  };
  
  main();
};

