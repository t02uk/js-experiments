window.onload = (function() {

  var d = new DCore();

  // マウスイベント
  var px, py, opx, opy, dx, dy, lbdown, dblclick, dblcount, lbclick = false;
  window.addEventListener("mousemove", function(e) {
    px = e.clientX / d.width - d.left2d;
    py = e.clientY / d.height - d.top2d;
    if(opx) {
      dx = opx - px;
      dy = opy - py;
    }
    opx = px;
    opy = py;
  }, false);
  window.addEventListener("mousedown", function(e) {
    lbclick = true;
    lbdown = true;
  }, false);
  window.addEventListener("mouseup", function(e) {
    lbdown = false;
  }, false);
  window.addEventListener("dblclick", function(e) {
    dblclick = true;
  }, false);

  function Light(p, ss) {
    this.p = p;
    this.ss = ss;
    this.hue = $R(0, 1).randf();
    this.count = 0;
  }
  Light.prototype = {
    act: function() {
      this.count++;
    },
    draw: function() {
      var hue = this.hue;
      var s = this.ss * this.count;
      d
       .alpha(1 - (this.count / 10))
       .blend("lighter")
       .luminous(this.p, s * 0.2, s, [
         [0,   [hue, 0.0, 0.0].hsv()],
         [1,   [hue, 0.7, 1.0].hsv()]
       ])
       .fill()
      ;
    }
  };
  Lights = {
    initialize: function() {
      Lights.es = [];
    },
    registor: function(e) {
      Lights.es.push(e);
    },
    act: function() {
      Lights.es = Lights.es.select(function(e) {
        return e.count < 10;
      });

      Lights.es.each(function(e) {
        e.act();
      });
    },
    draw: function() {
      Lights.es.each(function(e) {
        e.draw();
      });
    }
  };

  // particle
  function Particle(p, sp, s, hue) {
    this.p = p;
    this.sp = sp;
    this.s = s;
    this.hue = hue || $R(0, 1).randf();
    this.active = true;
    this.sid = this.genSid();
  }
  // and this methods
  Particle.prototype = {
    genSid: function() {
      return Particle.sid = ++Particle.sid || 0;
    },
    act: function() {
      var self = this;
      self.sp = self.sp.mul(0.99);
      //if(self.sp.square() < 0.000001) this.unactivate();

      // movement
      this.p = this.p.add(this.sp);

      // wall hit test, reflection
      $R(0, 1, false).each(function(e) {
        if(self.p[e] < 0 || 1 < self.p[e]) {
          self.p[e] = ~~self.p[e];
          self.sp[e] *= -1;
        }
      });
      
      this.count = ++this.count || 0;
    },
    draw: function() {

      var self = this;
      var hue = this.hue;
      var size = this.s;
      
      if(this.count < 4) {
        size = size * (1 + Math.sin($R(0, 3).randf()) * (3 - this.count) / 6);
      }
      
      d
       .alpha(1)
       .blend("lighter")
       .luminous(this.p, size * 0.2, size, [
         [0,   [hue, 0.2, 0.8].hsv()],
         [0.4, [hue, 0.1, 1.0].hsv()],
         [0.5, [hue, 0.7, 0.3].hsv()],
         [0.7, [hue, 0.8, $R(0.15, 0.2).randf()].hsv()],
         [1,   [hue, 0.0, 0.0].hsv()]
       ])
       .fill()
      ;
    },
    // kill me
    unactivate: function() {
      this.active = false;
    }
  };

  Particles = {
    initialize: function() {
      Particles.es = [];
    },
    registor: function(e) {
      Particles.es.push(e);
    },
    act: function() {
      Particles.es.each(function(e1) {
        Particles.es.each(function(e2) {
          if(!e1.active) return;
          if(!e2.active) return;
          if(e1.sid === e2.sid) return;
          var distance = e1.p.distance(e2.p);
          var power = 1 / (distance * distance);
          if(distance < 0.3) {
            e1.sp = e1.sp.add(e2.p.sub(e1.p).mul(0.000001 * power));
          }
          if(distance < 0.01 * e1.s && (e1.hue - e2.hue).abs() > 0.2) {
            e1.unactivate();
            e2.unactivate();

            if(e1.s > 0.1) {
              $R(0, 3).each(function(e) {
                var sp = [0, 0.03].rotate($R(0, 100).randf());
                var p = new Particle(e1.p, sp, 0.05);
                Particles.registor(p);
              });
              Lights.registor(new Light(e1.p, 0.15));
            } else {
              var p = new Particle(e1.p, e1.sp.add(e1.sp), e1.s + e2.s / Math.sqrt(5));
              Particles.registor(p);
              Lights.registor(new Light(e1.p, p.s / 2));
            }
          }
        });
      });

      Particles.es = Particles.es.select(function(e) {
        return e.active;
      });

      Particles.es.each(function(e) {
        e.act();
      });
    },
    draw: function() {
      Particles.es.each(function(e) {
        e.draw();
      });
    }
  };


  var c = 0;
  Particles.initialize();
  Lights.initialize();
  
  $R(0, 16, true).each(function() {
    var sp = [0, 0.0001].rotate($R(0, 100).randf());
    var p = new Particle([$R(0, 1).randf(), $R(0, 1).randf()], sp.mul(0.8), 0.05);
    Particles.registor(p);
  });


  window.setInterval(function() {
    c++;

    if(px) {
      if(lbclick) {
        $R(0, 1, true).each(function() {
          var sp = [0, 0.0001].rotate($R(0, 100).randf()).add([dx, dy].mul(-0.1));
          var p = new Particle([px, py], sp.mul(0.8), 0.05);
          Particles.registor(p);
        });
      }
    }

    // fill back
    d
     .blend("copy")
     .alpha(1)
     .rgb(0x00, 0x00, 0x00)
     .fillBack()
     .fill()
    ;

    Particles.act();
    Particles.draw();

    Lights.act();
    Lights.draw();

    lbclick = false;

  }, 33);
});

// vim:sw=2:ts=2
