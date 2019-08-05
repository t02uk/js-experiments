(function() {
  var d = new DCore().init();

  function Actors() {
    this.acts = [];
    this.pActs = [];
  }
  Actors.prototype = {
    registor: function(fn) {
      this.pActs.push(fn);
    },
    invoke: function() {
      var p;
      while(!!(p = this.pActs.pop())) this.acts.push(p);

      this.acts = this.acts.map(function(e) {
        return e.call() ? e : null;
      }).compact();
    }
  };
  var actors = new Actors();


  // fragment
  $R(1, 50).each(function() {
    actors.registor(function() {
      var y = $R(   0, 50.0).randf();
      var x = $R(-1.5, 1.5).randf() * 3;
      var z = $R(-1.5, 1.5).randf() * 3;
      var r = $R(0.0, Math.PI * 2).randf();
      var speed = $R(0.05, 0.03).randf();

      var xw = 0.1;
      var yw = $R(-0.1, 0.1).randf();
      var zw = 0.1;

      return function() {
        try {
          r += 0.05;
          y -= speed;

          d
           .quads([
             [-xw, -yw, -zw],
             [+xw, -yw, -zw],
             [+xw, +yw, +zw],
             [-xw, +yw, +zw]
           ].map(function(e) {
             return e.rotatey(r);
           }).translate([x, y, z])
           .scale(scale)
           )
           .fill()
          ;

          if(y < -0.0) {
            actors.registor(ripple(x, 0, z));
            y = 50.0;
          }

        } catch(e) {
        }
        return true;
      };
    }());
  });

  // ripple
  var ripple = function(_x, _y, _z) {
    var x = _x;
    var y = _y;
    var z = _z;
    var count = 0;
    var rotates = $R(-0.15, 0.15).randf();

    return function() {
      var w = Math.sqrt(count * 0.01);
      d
       .alpha((20 - count) / 80)
       .quads(
         [[-w, 0,-w],
          [ w, 0,-w],
          [ w, 0, w],
          [-w, 0, w]
         ].map(function(e) {
           return e.rotatey(count * rotates + x + y);
         }).translate([x, y, z])
       )
       .stroke()
      ;

      count++;
      return count < 20;
    };
  };



  // ray
  $R(1, 20).each(function() {
    actors.registor(function() {
      var y = $R(   0, 50.0).randf();
      var x = $R(-1.5, 1.5).randf() * 10;
      var z = $R(-1.5, 1.5).randf() * 10;
      var r = $R(0.0, Math.PI * 2).randf();
      var speed = $R(0.05, 0.2).randf();

      var xw = 0.02;
      var yw = 1.1;

      return function() {
        try {
          y += speed;

          d
           .quads([
             [-xw, -yw, z],
             [+xw, -yw, z],
             [+xw, +yw, z],
             [-xw, +yw, z]
           ].map(function(e) {
             return e.rotatey(r);
           }).translate([x, y, z])
           .scale(scale)
           )
           .fill()
          ;

          if(y > 50.0) y -= 50;

        } catch(e) {
        }
        return true;
      };
    }());
  });

  var scale;
  var backHue = Math.random();
  var second = false;
  (function(c) {

    // fill background
    backHue += 0.0005;
    backHue %= 1;
    var s = 0.008;
    var r = 15 * Math.cos(s * c * 0.10 + 1.0);

    var cx = r * Math.sin(s * c + 0.5);
    var cy = -r * Math.sin(s * c * 0.3) * 0.20 + r * 0.25;
    cy *= r / r.abs();
    var cz = r * Math.cos(s * c);


    if(second) {
      var hy = d.toWorld2d([
        -cx * 10000, 0.0, -cz * 10000
      ])[1];

      // sky
      if(hy > 0) {
        d
         .alpha(1.0)
         .hsv(backHue, 0.9 + (cy < 0) ? 0.3 : 0 , 0.6)
         .quads([
           [0.0, 0.0],
           [1.0, 0.0],
           [1.0, hy],
           [0.0, hy]
         ]).fill()
        ;
      }
      // water
      if(hy < 1) {
        d
         .alpha(1.0)
         .hsv(backHue, 0.4 + (cy < 0) ? 0.3 : 0, 0.7)
         .quads([
           [0.0, hy],
           [1.0, hy],
           [1.0, 1.0],
           [0.0, 1.0]
         ]).fill()
        ;
      }
    }
    second = true;

    for(var i = 0; i < 2; i++) {
      var first = !i;
      scale = first ? [1,-1, 1] : [1, 1, 1];

      // set camera
      d.gazeFrom([cx, cy, cz],
        [0.1, 2, 0.1],
        [0, 1, 0]
      );

      d
       .rgb(0xff, 0xff, 0xff)
       .blend("source-over")
       .alpha(first ? 0.15 : 0.5)
      ;
      actors.invoke();
    }

    window.setTimeout(arguments.callee.curry(c + 1), 16);
  })(0);
})();

