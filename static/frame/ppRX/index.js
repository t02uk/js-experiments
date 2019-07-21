(function() {
  var d = new DCore().init();

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


  function AirPlane() {
    this.theta1 = 0;
    this.arm  = [1, 0, 0];
    this.head = [0, 1, 0];
    this.eye  = [0, 0, 1];
    this.pos  = [5, 90, -30];

    this.init();

  }
  AirPlane.prototype = {
    model: [
      // 左翼
      [   0.0,   0.0,   0.5],
      [   0.0,   0.0,-  0.4],
      [-  0.5,  0.04,-  0.5],
      // 右翼
      [   0.0,   0.0,   0.5],
      [   0.0,   0.0,-  0.4],
      [   0.5,  0.04,-  0.5],
      // 下のやつ
      [   0.0,   0.0,   0.5],
      [   0.0,   0.0,-  0.4],
      [   0.0,-  0.3,-  0.4],
      // 垂直尾翼
      [   0.0,   0.0,-  0.0],
      [   0.0,   0.0,-  0.3],
      [   0.0,   0.2,-  0.4],
    ].inGroupsOf(3),
    init: function() {
      this.transformed = this.model;
    },
    act: function() {
      var self = this;
      $R(0, $R(0, 2).rand()).each(function(e) {
        var s = $R(0.2, 0.7).randf();
        var rad = Math.PI.randf() * 2;
        var t = self.arm.rotatea(rad, self.eye).mul(0.1);
        fm.registor(self.pos.add(self.arm.mul( 0.3)), self.eye.mul(-0.2 * s).add(t));
        fm.registor(self.pos.add(self.arm.mul(-0.3)), self.eye.mul(-0.2 * s).add(t));
      });
    },
    draw: function() {
      this.pos = this.pos.add(this.eye.mul(0.33));
      var self = this;

      this.transformed
        .map(function(e) { return e.translate(self.pos) })
        .each(function(e) {
        d
         .blend("lighter")
         .alpha(0.3)
         .rgb(0x11, 0xcc, 0xcc)
         .quads(e)
         .fill()
         .alpha(1.0)
         .stroke()
        ;
      });

    },
    rotatey: function(t) {
      var self = this;
      this.transformed = this.transformed.map(function(e) {
        return e.map(function(e) {
          return e.rotatea(t, self.head);
        });
      })
      //console.log("arm", this.arm.invoke("sign"));
      //console.log("eye", this.eye.invoke("sign"));
      //console.log("head", this.head.invoke("sign"));
      this.arm = this.arm.rotatea(t, self.head);
      this.eye = this.eye.rotatea(t, self.head);
      this.head = this.eye.cross(this.arm).normalize();
      //console.log("arm", this.arm.invoke("sign"));
      //console.log("eye", this.eye.invoke("sign"));
      //console.log("head", this.head.invoke("sign"));
    },
    rotatex: function(t) {
      var self = this;
      this.transformed = this.transformed.map(function(e) {
        return e.map(function(e) {
          return e.rotatea(t, self.arm);
        });
      })
      //console.log("arm", this.arm.invoke("sign"));
      //console.log("eye", this.eye.invoke("sign"));
      //console.log("head", this.head.invoke("sign"));
      this.eye = this.eye.rotatea(t, self.arm);
      this.head = this.head.rotatea(t, self.arm);
      this.arm = this.head.cross(this.eye).normalize();
      //console.log("arm", this.arm.invoke("sign"));
      //console.log("eye", this.eye.invoke("sign"));
      //console.log("head", this.head.invoke("sign"));
    },
    rotatez: function(t) {
      var self = this;
      this.transformed = this.transformed.map(function(e) {
        return e.map(function(e) {
          return e.rotatea(t, self.eye);
        });
      })
      //console.log("arm", this.arm.invoke("sign"));
      //console.log("eye", this.eye.invoke("sign"));
      //console.log("head", this.head.invoke("sign"));
      this.arm = this.arm.rotatea(t, self.eye);
      this.head = this.head.rotatea(t, self.eye);
      this.eye = this.arm.cross(this.head);
      //console.log("arm", this.arm.invoke("sign"));
      //console.log("eye", this.eye.invoke("sign"));
      //console.log("head", this.head.invoke("sign"));
    },
  }
  var ap = new AirPlane();

  function Camera(target) {
    this.pos = [0, 100, 0];
    this.target = target;
  }
  Camera.prototype = {
    act: function() {
      this.follow();
    },
    fix: function() {
    },
    follow: function() {
      var idealDist = 20.0;
      var realDist = this.pos.sub(this.target.pos).abs();
      if(realDist > idealDist) {
        var t = this.target.pos.sub(this.pos).mul(1 - idealDist / realDist);
        this.pos = this.pos.add(t);
      }
    }
  }
  var cam = new Camera(ap);

  function Fragment() {
    this.count = 100;
    this.pos = [0, 0, 0];
  }
  Fragment.prototype = {
    model: (function() {
      return $R(0, 2).map(function(e) {
        var rad = (e / 3).toRadian();
        return [Math.sin(rad), 0, Math.cos(rad)];
      });
    })().scale([0.1, 0.1, 0.1]),
    init: function(pos, speed) {
      this.count = 0;
      this.pos = pos.clone();
      this.speed = speed.clone();
      this.rad1 = $R(0, 100).randf();
      this.rad2 = $R(0, 100).randf();
      this.rad3 = $R(0, 100).randf();
    },
    act: function() {
      this.pos = this.pos.add(this.speed);
      this.speed = this.speed.mul(0.97);
      this.speed = this.speed.add([0, -0.004, 0]);
      //this.rad1 += 0.1;
      this.rad2 += 0.1;
      this.rad3 += 0.1;
      this.count++;
    },
    draw: function() {
      if(this.count > 100) return;
      d
       .alpha(0.3)
       .quads(
         this.model
        .invoke("rotatey", this.rad1)
        .invoke("rotatex", this.rad2)
        .translate(this.pos)
       )
       .fill()
      ;
    }
  };

  function Fragments() {
    this.fs = $R(0, 100 - 1).map(function(e) {
      return new Fragment(); 
    });
    this.fc = 0;
  }
  Fragments.prototype = {
    registor: function(pos, speed) {
      var f = this.fs[this.fc];
      f.init(pos, speed);
      this.fc++; this.fc %= 64;
    },
    act: function() {
      this.fs.select(function(e) {
        return e.count < 100;
      }).each(function(e) {
        e.act();
      });
    },
    draw: function() {
      this.fs.select(function(e) {
        return e.count < 100;
      }).each(function(e) {
        e.draw();
      });
    }
  };
  var fm = new Fragments();



  (function(i) {

    // key control
    if(keys[37]) ap.rotatez( 0.08);
    if(keys[39]) ap.rotatez(-0.08);
    if(keys[38]) ap.rotatex( 0.03);
    if(keys[40]) ap.rotatex(-0.03);

    ap.act();
    fm.act();
    cam.act();
    //console.log(cam.pos);


    // set camera position
    with({r: 3, th: i * 0.05}) {
      d.gazeFrom(
        cam.pos,
        ap.pos
      );
    }

    // fill background
    d
     .blend("source-over")
     .alpha(1.0)
     .rgb(0x00, 0x00, 0x00)
     .fillBack()
     ;

    // floor
    $R(-10, 10, false).map(function(e) {
      return e * 10;
    }).map(function(e) {
      d
       .rgb(0x33, 0x99, 0x99)
       .line([
         [e, 0, -100],
         [e, 0,  100],
       ])
       .stroke()
      ; 
      return e;
    }).each(function(e) {
      d
       .line([
         [-100, 0,  e],
         [ 100, 0,  e],
       ])
       .stroke()
      ; 
    });

    ap.draw();
    fm.draw();

   window.setTimeout(arguments.callee.curry(i + 1), 16);
  })(0);
})();
// vim:sw=2:ts=2
