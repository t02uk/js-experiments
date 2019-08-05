window.onload = (function() {

  var d = new DCore();

  // random generator
  var randomGen = function() {
    var x = 1;
    return function() {
      x = (x * 22695477 + 1) & 0xffffffff;
      return ((x >> 16) & 0x7fff) / 0x7fff;
    };
  };
  
  // make setTimeout time sensitive
  (function() {
    var lastTime = 0;
    var org_setTimeout = window.setTimeout;
    window.setTimeout = function(func, wait) {
      var realWait = !lastTime ? wait : (wait - (new Date() - lastTime));
      if(realWait >= wait) realWait = wait;
      if(realWait <= 0) realWait = 1;
      lastTime = +new Date();
      org_setTimeout(func, wait);
    }
  })();

  // create moon texture
  moonTexture = (function() {
    var sd = d.subTexture();

    // fill back
    sd
     .rgb(0x00, 0x00, 0x00)
     .fillBack()
    ;

    // body
    sd
     .luminous([0.5, 0.5], 0.30, 0.90, [
         [0.00,  [0xff, 0xff, 0xaa]],
         [1.00,  [0xaa, 0xaa, 0x88]],
     ])
     .fill()
    ;

    // elipse
    sd
     .rgb(0x00, 0x00, 0x00)
     .circle([0.4, 0.4], 0.8)
     .fill()
    ;

    return sd;
  })();
  
  // create mountain texture
  var createMountainTexture = function() {
    var mountain = $R(0, 127).map(function(e) {
      return [e / 127, 0.9];
    });
    
    (function() {
      var smoothNoise = function(x) {
        return Math.random() * x / 2
             + Math.random() * (x - 1) / 4
             + Math.random() * (x + 1) / 4
        ;
      };

      var interpolate = function(a, b, x) {
        var ft = x * Math.PI;
        var f =  (1 - Math.cos(ft)) * 0.5;

        return a * (1 - f) + b * f;
      }

      var interpolatedNoise = function(x) {
        var ix = ~~x;
        var fx = (x - ix);

        var v1 = smoothNoise(ix);
        var v2 = smoothNoise(ix + 1);

        return interpolate(v1, v2, fx);
      }

      var pelinNoise = function(x) {
        var total = 0;
        var p = 1.8;
        var n = 1;

        for(var i = 0; i < n; i++) {
          var freq = Math.pow(2.0, i);
          var amplitude = Math.pow(p, i);

          total += interpolatedNoise(x * freq) * amplitude * 0.06;
        }

        return total;
      }
      // export pelin noise
      window.pelinNoise = pelinNoise;
    })();

    for(var i = 0; i < 64; i++) {
      var z = pelinNoise(6);
      mountain[i +  0][1] -= z;
      mountain[i + 64][1] -= z;
    }
    mountain[  0][1] = 
    mountain[ 63][1] = 
    mountain[ 64][1] = 
    mountain[127][1] = 0.9;
    mountain.push([1, 1]);
    mountain.push([0, 1]);

    var sd = d.subTexture(1024, 256);
    sd
      .rgb([0x11, 0x22, 0x66])
      .quads(mountain)
      .fill()
    ;

    // particle :(
    //for(var i = 0; i < 10; i++) {
    //  var k = (64).rand();
    //  var x = mountain[k][0];
    //  var y = $R(mountain[k][1], 0.98).randf();

    //  sd
    //    .blend("lighter")
    //    .alpha(0.1)
    //    .luminous([x, y], 0.003, 0.005, [
    //        [0.00,  [0xff, 0xff, 0xff]],
    //        [0.50,  [0x00, 0xff, 0xff]],
    //        [1.00,  [0x00, 0x00, 0x00]],
    //    ]).fill()
    //  ;
    //}


    return sd;
  };

  var mountainTexture = createMountainTexture();

  // draw glass
  var drawGlass = function(bx, bz, bs, length, dt) {

    var glass = [];
    var slope = Math.sin(bs * 0.04) * 0.4 + 0.2;
    var x = 0;
    var y = 0;

    if(dt > 1) dt = 1;
    if(dt < 0) return;

    glass.push([x + bx, y, bz]);
    for(var i = 0; i < 7; i++) {
      x += length * Math.sin(slope);
      y += length * Math.cos(slope);
      slope *= 1.20;
      length *= 0.7;
      glass.push([x + bx, y, bz]);
    }

    d
     .alpha(0.3)
     .blend("lighter")
     .luminous([x + bx, y, bz], 0.02, 0.04, [
         [0.00, [0xcc, 0xcc, 0xcc]],
         [0.10, [0x33, 0x99, 0x99]],
         [0.20, [0x33, 0x33, 0x66]],
         [1.00, [0x00, 0x00, 0x00]],
     ])
     .fill()
    ;

    if(d.backclip) return;

    d
     .rgb(0xcc, 0xcc, 0xff)
     .line(glass)
     .alpha(0.3 * dt)
     .lineWidth(0.002)
     .stroke()
    ;


    d
     .alpha(0.1)
     .blend("lighter")
     .luminous([x + bx, -y, bz], 0.02, 0.04, [
         [0.00, [0xcc, 0xcc, 0xcc]],
         [0.10, [0x33, 0x99, 0x99]],
         [0.20, [0x33, 0x33, 0x66]],
         [1.00, [0x00, 0x00, 0x00]],
     ])
     .fill()
    ;

    if(d.backclip) return;

    d
     .rgb(0xcc, 0xcc, 0xff)
     .alpha(0.1 * dt)
     .line(glass.scale([1, -1, 1]))
     .lineWidth(0.002)
     .stroke()
    ;
  };

  // particle
  var drawParticle = function(bx, by, bz, ln) {
    if(ln < 0) return;

    d
     .alpha(ln)
     .blend("lighter")
     .luminous([bx, by, bz], 0.03, 0.09, [
         [0.00, [0xcc, 0xcc, 0xcc]],
         [0.10, [0x33, 0x99, 0x99]],
         [0.20, [0x33, 0x33, 0x66]],
         [1.00, [0x00, 0x00, 0x00]],
     ])
     .fill()
    ;

    d
     .alpha(ln * 0.2)
     .blend("lighter")
     .luminous([bx, -by, bz], 0.03, 0.04, [
         [0.00, [0xcc, 0xcc, 0xcc]],
         [0.10, [0x33, 0x99, 0x99]],
         [0.20, [0x33, 0x33, 0x66]],
         [1.00, [0x00, 0x00, 0x00]],
     ])
     .fill()
    ;
  };

  (function(c) {

    var crad = c * 0.02;
    var gp = [1.0, Math.cos(c * 0.013) + 1.5, 0];
    var cp = [Math.cos(c * 0.007) * 3, 2.0 + Math.sin(c * 0.01) * 1.5, 0].rotatey(c * 0.01);

    d
     .gazeFrom(
       cp,
       gp
     )
    ;


    var hy = d.toWorld2d(cp.sub(gp).scale([-10000, 0, -10000]))[1];

    // sky
    if(hy > 0) {
      d
       .blend("source-over")
       .alpha(1.0)
       .rgb([0x00, 0x33, 0x77])
       .quads([
           [0.0, 0.0],
           [1.0, 0.0],
           [1.0, hy],
           [0.0, hy]
       ])
       .fill()
      ;

      // mountain
      var normalize = function(radian) {
        return Math.atan2(Math.sin(radian), Math.cos(radian));
      };

      var dp = gp.sub(cp);
      var grad = Math.atan2(dp[0], dp[2]) + Math.PI;
      var w = 0.25;
      var x = grad / (Math.PI * 2) / 2 + 0.25;

      d
       .blend("source-over")
       .alpha(0.2)
       .drawImage(
          mountainTexture,
          [x,  0], [w, 1],
          [0,  hy - 0.3], [1, 0.3]
       )
      ;
    }
    // in water
    if(hy < 1) {
      d
       .blend("source-over")
       .alpha(1)
       .rgb([0x00, 0x44, 0x88])
       .quads([
           [0.0, hy],
           [1.0, hy],
           [1.0, 1.0],
           [0.0, 1.0]
       ])
       .fill()
      ;

      // mountain
      var normalize = function(radian) {
        return Math.atan2(Math.sin(radian), Math.cos(radian));
      };

      var dp = gp.sub(cp);
      var grad = Math.atan2(dp[0], dp[2]) + Math.PI;
      var w = 0.25;
      var x = grad / (Math.PI * 2) / 2 + 0.25;

      d
       .save()
       .translate([0, 1])
       .scale([1, -1])
       .blend("source-over")
       .alpha(0.15)
       .drawImage(
          mountainTexture,
          [x,  0], [w, 1],
          [0,  1 - hy - 0.3], [1, 0.3]
       )
       .restore()
      ;
    }

    // moon
    var rect = Geo.rect(true).map(function(e) {
      return [0, -e[0], -e[1]];
    });


   // skys
   var to = rect
       .scale([2000, 2000, 2000])
       .translate([10000, 0, 0])
       .invoke("rotatez", 0.4)
   ;

   d
    .rgb(0x00, 0xff, 0x00)
    .transformTo(Geo.rect(), to, function(d) {
        d
         .blend("lighter")
         .alpha(0.7)
         .drawImage(moonTexture)
        ;
    })
   ;

    // refrection
    var to = to.scale([1, -1, 1]);
    d
     .rgb(0x00, 0xff, 0x00)
     .transformTo(Geo.rect(), to, function(d) {
         d
          .blend("lighter")
          .alpha(0.1)
          .drawImage(moonTexture)
         ;
     })
    ;

    d
     .blend("lighter")
     .alpha(1)
    ;
      
    var random = randomGen();

    // glasses
    for(var i = 0; i < 150; i++) {
      var bx = (random() - 0.5) * 20;
      var bz = (random() - 0.5) * 20;
      var dt = cp.distance([bx, 0, bz]);
      drawGlass(bx, bz, c * 0.8 + (bx * 8.5), random() * 0.4 + 0.10, 8 / dt);
    }

    // particle: josho
    for(var i = 0; i < 50; i++) {
      var bx = (random() - 0.5) * 8 + Math.sin(random() * c * 0.04);
      var by = (random() - 0.0) * 0.3 + 1 + Math.sin(c * 0.04 + random()) * random() + (c * 0.02 + random() * 20) % 20;
      var bz = (random() - 0.5) * 8 + Math.sin(random() * c * 0.04);
      drawParticle(bx, by, bz, Math.sin(c * (random() * 0.1) + random()) * (random() * 0.1 + 0.1) + 0.2);
    }

    // particle: fuwafuwa
    for(var i = 0; i < 30; i++) {
      var bx = (random() - 0.5) * 8 + Math.sin(random() * c * 0.04);
      var by = (random() - 0.0) * 0.3 + 1 + Math.sin(c * 0.04 + random()) * random();
      var bz = (random() - 0.5) * 8 + Math.sin(random() * c * 0.04);
      drawParticle(bx, by, bz, Math.sin(c * (random() * 0.1) + random()) * (random() * 0.1 + 0.1) + 0.2);
    }
    setTimeout(arguments.callee.curry(c + 1), 33);
  })(0);

});
// vim:sw=2:ts=2

