window.onload = function() {
  var d = new DCore();

  function Text(r1, content) {
    this.r1 = r1;
    this.r2 = $R(0, 1).randf().toRadian();
    this.mr = $R(0.01, 0.03).randf();
    this.letters = content.split("");
    this.type = "cursive".split(" ").randomSelect();
  }
  Text.prototype = {
    act: function() {
     this.r2 += this.mr;
    },
    draw: function() {
      var self = this;
      var rx = 0;
      this.letters.zipWithIndex(function(letter,i) {
  
        var s = 0.2;
        var to = [
           [ 0.5, -0.5, 0],
           [ 0.5,  0.5, 0],
           [-0.5,  0.5, 0],
           [-0.5, -0.5, 0],
         ].scale([s, s, 0]).translate([0, 0, 1]).map(function(e) {
           return e.rotatey(self.r1)
             .rotatea(self.r2 - rx, [1, 0, 0].rotatey(self.r1));
         });
  
        var s = 0.1;
  
        d
         .font(self.type, s)
        ;
  
        var w = d.measureText(letter);
        var h = s;
  
        rx += w * 3;
      
        var from = [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1]
        ].scale(s.arize(2));
  
        d
         .rgb(0x77, 0x88, 0xdd)
         .transformTo(from, to, function(d) {
           d.fillText(letter, [0.0, 0.0]);
         })
        ;
      });
    },
  };
  
  var px = py = 0.8;
  document.addEventListener("mousemove", function(e) {
    px = e.clientX / d.width - d.left2d;
    py = e.clientY / d.height - d.top2d;
  }, false);

  var main = (function() {
    d
     .rgb(0xff, 0xff, 0xff)
     .fillBack()
    ;

    d
     .gazeFrom([0, -(py - 0.5) * 8, (px - 0.5) * 6 - 5])
    ;

    texts.invoke("act");
    texts.invoke("draw");

    window.setTimeout(arguments.callee, 33);
  });


  var contents = (function() {
    var contents = [];
    var inspectee = CanvasRenderingContext2D.prototype;
    for(i in inspectee) {
      //if(inspectee[i] instanceof Function) {
      if(i.match(/[^A-Z_0-9]/) && !i.match(/^moz/)) {
        if(inspectee.hasOwnProperty(i)) {
          //if((5).rand()) {
            contents.push(i);
          //}
        }
      }
    }
    return contents;
  })();

  var texts = contents.zipWithIndex(function(c, i) {
    return new Text((i / contents.length).toRadian(), c);
  });

  main();

};
