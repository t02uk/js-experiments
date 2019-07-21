// 関数型言語、分からない

(function() {

  var main = function() {

    // load audio
    var instruments =
    $R(0, 7 * 4 - 1).map(function(i) {
      var serverPath = "../se";
      var id = "sp";
      pitch = "cdefgab".charAt(i % 7);
      var audio = new Audio(serverPath + "/" + id + "_" + pitch + "." + "ogg");
      audio.load();
      return audio;
    });

    // Create DCore
    var d = new DCore().init();


    // polygon, the master of some shape
    var polygon = function(n, step) {
      d.quads(
        $R(0, n - 1).map(function(i) {
          return [Math.cos((i * step / n).toRadian()),
                  Math.sin((i * step / n).toRadian())];
        })
      ).stroke();
    };

    // generate shapes
    var square = polygon.curry(4, 1);
    var triangle = polygon.curry(3, 1);
    var star = polygon.curry(5, 2);
    var line = polygon.curry(2, 1);
    var circle = function(radius, p) {
      d.circle([0.0, 0.0], 1.0).stroke();
    };


    // counter
    var counter = function(max) {
      var count = 0;
      return function() {
        if(count >= max) return null;
        count++;
        return count;
      };
    };

    // ripple launcher
    var rippleLauncher = function(x, y, c, axis, drawer) {
      return function(count) {
        var size = count / 12.0;
        var rad = axis + count / 15.0;
        d
         .blend("lighter")
         .alpha(0.6)
         .rgb(c[0], c[1], c[2])
         .tsr([x, y])([size, size])(rad)
         .lineWidth(0.06 / size)
        ;
        drawer();
        d.reset()
        ;
      };
    };

    // random actor
    function RandomActor() {
      this.seq = 0;
      return this;
    }
    RandomActor.items = [];
    RandomActor.registor = function(e) {
      this.seq++; this.seq &= 63;
      this.items[this.seq] = e;
    };
    RandomActor.act = function(e) {
      for(var i = 0; i < this.items.length; i++) {
        if(!this.items[i]) continue;
        this.items[i]();
      }
    };


    var instSeq = 0;

    // observe mouse click, and handle it
    window.px = 0.0;
    window.py = 0.0;
    document.addEventListener("click", function(e) {
      px = e.clientX / d.width - d.left2d;
      py = e.clientY / d.height - d.top2d;

      inst = ~~(1.0 - py * 7) + instSeq;
      instSeq += 7;
      instSeq %= 4 * 7;
      if(instruments[inst]) instruments[inst].play();

      // add ripple
      RandomActor.registor(
        (function() {
          var shapes = [
            square,
            triangle,
            //star,
            line,
            circle
          ];
          var shape = shapes[~~(Math.random() * shapes.length)];

          var thisCounter = counter(35);
          var axis = Math.random().toRadian();
          var x = px;
          var y = py;
          return function() {
            return [
              thisCounter,
              rippleLauncher(
                x,
                y,
                [0x66, 0xff, 0xcc],
                axis,
                shape
              )
            ].andThen();
          };
        })(), false);
    }, false);

    (function() {
      // clear back ground
      d.rgb(10, 15, 15)
        .alpha(1.0)
        .blend("source-over")
        .fillBack();

      RandomActor.act();

      window.setTimeout(arguments.callee, 33);
    })();
  };

  try {
    main();
  } catch(e) {
//    alert("Error:" + e.message);
    throw e;
  }
})();
