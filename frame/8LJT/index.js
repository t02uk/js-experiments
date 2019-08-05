window.onload = function() {

  var d = new DCore();
  (function(count) {

    var py = 20 + Math.sin(count / 100) * 10;
    var ty = 150 - Math.cos(count / 130) * 100;
    var cp, ct;
    d.gazeFrom(
      cp = [50, py, 0].rotatey(count / 200),
      ct = [10, ty, 0].rotatey(count / 260)
    );
    var dot = ct.sub(cp).normalize().dot([0, 10000, 0].sub(cp).normalize());

    // fill back
    d
     .blend("copy")
     .hsv(0.6, 0.7 - dot / 3, 0.1 + dot / 1.5)
     .fillBack()
    ;
     
    d.blend("lighter");

    // sun
    d
     .alpha(1.0)
     .luminous([0, 10000, 0], 200.0, 1300.0, [
         [0,    [0xee, 0xee, 0xee]],
         [0.25, [0x99, 0xcc, 0xee]],
         [0.60, [0x22, 0x22, 0x22]],
         [1,    [0x00, 0x00, 0x00]]
      ])
     .fill()
    ;

    var random = function() {
      var x = 1;
      return function() {
        x = (x * 22695477 + 1) & 0xffffff;
        return (x >> 16) & 0x7fff;
      };
    }();
    (1000).times(function(){random();});

    // snow
    (100).times(function(i) {

      var x = (random() & 0xff) - 0x7f;
      var y = ((random() * 11 - count * (random() % 3 + 1)) & 1023);
      var z = (random() & 0xff) - 0x7f;

      d
       .alpha(1.0)
       .luminous([x, y, z], 0.1, 2.0, [
         [0,    [0x99, 0x99, 0xff]],
         [0.20, [0x22, 0x22, 0x44]],
         [1,    [0x07, 0x07, 0x11]]
       ])
       .fill()
      ;
    });

    window.setTimeout(arguments.callee.curry(count+1), 33);
  })(350);

};

// vim:sw=2:ts=2
