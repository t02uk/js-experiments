window.onload = (function() {

  var d = new DCore();

  var c = 2200;
  var main = function() {

    // random generator
    var random = function() {
      var x = 1;
      return function() {
        x = (x * 22695477 + 1) & 0xffffffff;
        return (x >> 16) & 0x7fff;
      };
    }();


    // set camera
    var cp, cg;
    (function() {
      cp = function() {
        var s = 0.01;
        var r = 500 * Math.cos(s * c * 0.1 + 1);
        var cx = r * Math.sin(s * c - 0.2);
        var cy = -r * Math.sin(s * c * 0.3) * 0.45 + r * 0.5;
        cy *= r / r.abs();
        var cz = r * Math.cos(s * c);
        return [cx, cy, cz];
      }();
      d
       .gazeFrom(
        cp,
        cg = [100, 200, 1]
       );
    })();

    var suns = [
      [0,  8000, -20000],
      //[0,  6000,  20000],
      [0, 22000,  1000],
    ];

    var dots = suns.map(function(sun) {
      var scgp = cg.sub(cp);
      return scgp.dot(sun) / sun.distance([0, 0, 0]) / scgp.distance([0, 0, 0])
    });
    var dot = dots.max();

    // draw background
    (function() {
      d
       .blend("source-over")
       .alpha(1)
      ;

      var cc = Math.pow(dot, 8) * 140;
      var ad = [cc, cc, cc * 1.2];

      var hy = d.toWorld2d(cp.scale([-10000, 0, -10000]))[1];

      // sky
      if(hy > 0) {
        d
         .alpha(1.0)
         .rgb([0x22, 0x22, 0x44].add(ad))
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
         .rgb([0x2f, 0x2c, 0x55].add(ad))
         .quads([
           [0.0, hy],
           [1.0, hy],
           [1.0, 1.0],
           [0.0, 1.0]
         ]).fill()
        ;
      }
    })();

    suns.zip(dots).each(function(e) {
      var sun = e[0];
      var dot = e[1];
      // draw sun
      d
       .blend("lighter")
       .alpha(1.0)
       .luminous(sun, 200.0, 2000.0, [
           [0,    [0xee, 0xee, 0xee]],
           [0.15, [0x99, 0xcc, 0xee]],
           [0.60, [0x22, 0x22, 0x22]],
           [1,    [0x00, 0x00, 0x00]]
       ])
       .fill()
      ;

      // draw sun (reflection)
      d
       .blend("lighter")
       .alpha(0.1)
       .luminous(sun.scale(1, -1, 1), 200.0, 2000.0, [
           [0,    [0xff, 0xff, 0xff]],
           [0.15, [0x99, 0xee, 0xee]],
           [0.60, [0x33, 0x66, 0x66]],
           [0.65, [0x11, 0x11, 0x11]],
           [1,    [0x00, 0x00, 0x00]]
       ])
       .fill()
      ;

      // lens flare
      for(var i = 1; i < 12; i++) {
        var p = sun.mul((6 - i) / 8);
        var h = (random() % 255) / 255;
        if(dot > 0.5) {
          var a = [0, Math.pow(dot, 9) * 0.7 - 0.1, 1].sort()[1];
          d
           .blend("lighter")
           .alpha(a)
           .luminous(p, 100.0, 400.0, [
               [1,    [h, 0.9, 0.1].hsv()],
               [0.9,  [h, 0.8, 0.9].hsv()],
               [0.7,  [h, 0.6, 0.2].hsv()],
               [0.0,  [h, 0.3, 0.1].hsv()],
           ])
           .fill()
          ;
        }
      }
    });


    // draw luminous on water
    for(var i = 0; i < 150; i++) {
      var x = random() % 4000 - 2000;
      var z = random() % 4000 - 2000;
      var dist = [0, 0, 0].distance([x, 0, z]);
      var cdist = [0, 0, 0].distance([x, 0, z]);
      var y = Math.sin(c / 10 + dist / 300) * 10;
      var a = [0, 1 / cdist * 300, 1].sort()[1];

      d
       .blend("lighter")
       .alpha(a)
       .luminous([x, y, z], 1.0, 5.0, [
           [0,    [0xee, 0xee, 0xee]],
           [0.05, [0xcc, 0xcc, 0xee]],
           [0.20, [0x22, 0x22, 0x22]],
           [1,    [0x00, 0x00, 0x00]]
       ])
       .fill()
    }

    // draw stars
    for(var i = 0; i < 50; i++) {
      var p = [0, 10000, 0]
       .rotatex((random() / 0x7fff) * 1.4)
       .rotatey(random())
      ;

      var r = (random() / 0x7fff) * 10 + 10;

      d
       .blend("lighter")
       .alpha(0.5)
       .luminous(p, r, r * 8, [
           [0,    [0xee, 0xee, 0xee]],
           [0.05, [0x99, 0x99, 0xcc]],
           [0.20, [0x22, 0x22, 0x22]],
           [1,    [0x00, 0x00, 0x00]]
       ])
       .fill()
    }

    //window.setTimeout(arguments.callee.curry(c + 1), 33);
    c++;
    if(c % 50 === 0) console.log(c);
  };



  window.setInterval(main, 33);
  //main(0);
});
