window.onload = (function() {

  var d = new DCore();

  // pseudo random generator
  var randomGen = function() {
    var x = 1;
    return function() {
      x = (x * 22695477 + 1) & 0xffffffff;
      return ((x >> 16) & 0x7fff) / 0x7fff;
    };
  };

  function MockAudioContext() {}
  MockAudioContext.prototype = {
    createJavaScriptNode: function() {
      return {
        connect : function(){}
      }
    }
  }

  function Mixer() {
  };
  Mixer.prototype = {
    prepare: function() {
      this.ctx = new (window.AudioContext || window.webkitAudioContext || MockAudioContext)();
      this.channel = 1;
      this.bufferSize = 2 << 11;
      this.notes = [];
    },
    createNode: function() {
      return this.ctx.createJavaScriptNode(this.bufferSize, 1, 1);
    },
    addNote: function(note, p) {
      this.notes.push(note);
    },
    update: function() {
      var self = this;
      for(var i = 0; i < self.notes.length; i++) {
        if(!self.notes[i].hasNext()) {
          self.notes[i].stop();
          self.notes[i] = undefined;
        }
      }
      self.notes = self.notes.compact();
    }
  };

  function Note(volume, delay, p) {
    this.seek = 0;
    this.a = 18000;
    this.delay = delay;
    this.birthTime = +new Date();
    this.p = p;
    this.install();
  }
  Note.prototype = {
    install: function() {

      var seek = this.seek;
      var a = this.a;
      
      this.jsNode = mixer.createNode();
      var self = this;
      var p = this.p;
        
      // connect js node -> panner
      var pannerNode = this.parrentNode = mixer.ctx.createPanner();
      pannerNode.connect(mixer.ctx.destination);
      pannerNode.setPosition(p[0], p[1], p[2]);
      this.jsNode.connect(pannerNode);

      this.jsNode.onaudioprocess = function(evt) {
        if(!self.readyForPlay()) return;

        var sampleRate = evt.outputBuffer.sampleRate;
        var length = evt.outputBuffer.length;
        var buffer = evt.outputBuffer.getChannelData(0);

        // fade out effect
        for(var i = 0; i < length; i++) {
          buffer[i] *= 0.3;
        }

        if(seek <= 10000) {
          // fill buffer
          for(var i = 0; i < length; i++) {
            buffer[i] += Math.sin(a * a * 0.0000004 + a * 0.002) * Math.cos(seek / 10000) * 0.5;
            seek++;
            a -= 1;
          }
        }
        self.seek = seek;
        self.a = a;
      };

    },
    readyForPlay: function() {
      var passedTime = new Date() - this.birthTime;
      return passedTime > this.delay;
    },
    hasNext: function() {
      return this.seek < 18000;
    },
    stop: function() {
      this.jsNode.disconnect();
    }
  }

  var mixer = new Mixer();
  mixer.prepare();
    
  var ln = 0;

  (function(c) {
    mixer.update();

    var random = randomGen();

    // ellipse back
    d
     .blend("source-over")
     .alpha(1)
     .hsv(0, 0, ln)
     .fillBack()
    ;
    // fade lightness of 
    // below values will be increased when Hanabi exploded
    ln *= 0.5;

    // set camera position
    var cp = [Math.cos(c * 0.0023) * 200, Math.sin(c * 0.01) * 20 + 40, 0].rotatey(c * 0.003)
    var gp = [0, 20 + Math.cos(c * 0.017) * 10, 0]
    d
     .gazeFrom(
       cp,
       gp
     )
    ;

    // buoy
    for(var i = 0; i < 64; i++) {
      var x = random() * 150;
      var z = random() * 150;
      var y = Math.sin(x + z + c * 0.01) * 3;
      d
       .blend("lighter")
       .alpha(1)
       .luminous([x, y, z].rotatey(i.toRadian() / 32), 0.1, 0.2, [
         [0.00, [0xff, 0xff, 0xff]],
         [1.00, [0x00, 0x00, 0x00]]
       ])
       .fill()
      ;
    }

    // hanabi
    for(var i = 0; i < 12; i++) {
      // sub counter
      var sc = ((c + (i >> 0) * 85) % 900);
      // hanabi hue
      var hue = random();
      // 
      var ry = (sc * 0.01).toRadian() / 2;
      // phase detect, based on sub counter
      //   0 -> rising
      //   1 -> stop
      //   2 -> explode
      //   3 -> wait
      var phase = (sc < 40) ? 0 : (sc < 43) ? 1 : (sc < 93) ? 2 : 3;
      // if not rising fix the value rx to 40
      if(phase != 0) ry = (40 * 0.01).toRadian() / 2;
      // calculate base position
      var ym = 20 + random() * 10;
      var rm = 0.2 + random() * 0.4;
      var br = random() * 100 + 10;
      var ba = random() * 100;
      var bx = br * Math.cos(ba);
      var bz = br * Math.sin(ba);
      var by = ((phase == 0 || phase == 1) ? Math.sin(ry) : 1) * ym;
      // draw each Hanabi particle
      for(var j = 0; j < 50; j++) {
        //
        var p = [bx, by, bz];
        // for rising logic
        var bby = Math.sin(ry) * random() * 4 + random();
        var bbx = Math.sin(ry) * random() * 1 * Math.sin(j);
        var bbz = Math.sin(ry) * random() * 1 * Math.cos(j);
        if(phase == 0 || phase == 2) {
          p = p.translate([bbx, bby, bbz]);
        }
        
        // for exploding logic
        var ssc = sc - 38;
        var r = Math.cos(ssc * 0.01) * rm * ssc;

        var rxy = random() * 100;
        var exy = [r, 0, 0].rotatey(rxy);
        exy = exy.rotatea(random() * 100, [0, 0, 1].rotatey(rxy));

        var ex = exy[0];
        var ey = exy[1] - ssc * 0.09;
        var ez = exy[2];
        if(phase == 2) {
          p = p.translate([ex, ey, ez]);
        }

        var a = 0.1;
        if(phase == 1) {
          a = sc % 0.1;
          // luminous
          ln += 0.005;
        }

        var x = random();
        if(phase == 2) {
          // sound
          if(j == 0 && sc == 44) {
            var dist = cp.distance(p);
            var vc = gp.sub(cp).scale([1, 0, 1]).normalize();
            var va = vc.rotatey(-0.25.toRadian()).normalize();
            var vp = p.sub(cp);
            var vz = vc.dot(vp);
            var vx = va.dot(vp);
            var vy = [0, 1, 0].dot(vp);
            mixer.addNote(new Note(0.5, dist * 8, [vx, vy, vz].mul(0.01)));
          }
          var erased = ssc / 50 > x;
        }

        // draw on phase rising or explode
        if(phase == 0 || phase == 2) {
          if(!erased) {
            // body
            d
             .blend("lighter")
             .alpha(a)
             .luminous(p, 0.5, 0.9, [
               [0.00, [hue, 0.3, 1.0].hsv()],
               [0.70, [hue, 0.8, 0.8].hsv()],
               [1.00, [hue, 0.3, 0.0].hsv()]
              ])
             .fill()
            ;

            // reflection
            d
             .blend("lighter")
             .alpha(a * 0.1)
             .luminous(p.scale(1, -1, 1), 0.5, 0.9, [
               [0.00, [hue, 0.3, 1.0].hsv()],
               [0.30, [hue, 0.8, 0.8].hsv()],
               [1.00, [hue, 0.3, 0.0].hsv()]
              ])
             .fill()
            ;
          }
        }
      }
    }

    setTimeout(arguments.callee.curry(c + 1), 33);
  })(0);


});
// vim:sw=2:ts=2
