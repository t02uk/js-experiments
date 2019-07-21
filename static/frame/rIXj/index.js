window.onload = (function() {

  var d = new DCore();
    
  RippleManager = {
    initialize: function() {
      var self = RippleManager;
      self.ripples = [];
      self.ripplesPool = [];
    },
    add: function(ripple) {
      var self = RippleManager;
      self.ripplesPool.push(ripple);
    },
    flush: function() {
      var self = RippleManager;
      self.ripples = self.ripples.concat(self.ripplesPool);
      self.ripplesPool = [];
    },
    act: function() {
      var self = RippleManager;
      self.ripples = self.ripples.select(function(e) {
        return e.alive();
      });
      self.ripples.invoke("act");
    },
    draw: function(lazy) {
      var self = RippleManager;
      self.ripples.invoke("draw", lazy);
    }
  };
  RippleManager.initialize();


  function Ripple(p, sp, seedless, pitch){
    this.p = p.clone();
    this.sp = sp || 0.05;
    this.count = 0;
    this.radius = 0.1;
    this.asParrent = 0.1;
    this.seedless = seedless;
    this.pitch = pitch || $R(1, 12).rand();

    var magicNumber = Math.pow(Math.E, Math.log(2) / 12);
    var freq = Math.pow(magicNumber, this.pitch) * 1760;
    var volume = this.sp * 1.0;
    mixer.addNote(genNote(freq, volume));
  }

  Ripple.prototype = {
    act: function() {
      this.sp *= 0.985;
      this.radius += this.sp;
      this.count++;
      if(!this.seedless) {
        if(!this.leftHit) {
          if(this.p[0] - this.radius / 2 < 0) {
            this.leftHit = true;
            RippleManager.add(new Ripple([0, this.p[1]], this.sp * 0.5, true, this.pitch));
          }
        }
        if(!this.rightHit) {
          if(this.p[0] + this.radius / 2 > 1) {
            this.rightHit = true;
            RippleManager.add(new Ripple([1, this.p[1]], this.sp * 0.5, true, this.pitch));
          }
        }
        if(!this.topHit) {
          if(this.p[1] - this.radius / 2 < 0) {
            this.topHit = true;
            RippleManager.add(new Ripple([this.p[0], 0], this.sp * 0.5, true, this.pitch));
          }
        }
        if(!this.bottomHit) {
          if(this.p[1] + this.radius / 2 > 1) {
            this.bottomHit = true;
            RippleManager.add(new Ripple([this.p[1], 1], this.sp * 0.5, true, this.pitch));
          }
        }
      }
    },
    draw: function(lazy) {
      var alpha = this.sp * 8 * (this.seedless ? 0.8 : 1);
      var z = 0.04 / this.radius;
      if(z > 0.5) z = 0.5;
      
      if(lazy) {
        d
         .alpha(alpha)
         .rgb(0x99, 0x99, 0xcc)
         .lineWidth(0.04)
         .circle(this.p, this.radius)
         .stroke()
        ;
      } else {
        d
         .rgb(0x00, 0x00, 0x00)
         .luminous(this.p, this.radius * 0.5, this.radius, [
            [0.00,      [0xff, 0xff, 0xff, 0.0]],
            [1 - z * 2, [0x99, 0x99, 0xcc, 0.0]],
            [1 - z,     [0x99, 0x99, 0xcc, alpha]],
            [1.00,      [0x00, 0x00, 0x00, 0.0]]
         ])
         .fill()
        ;
      }
    },
    alive: function() {
      return this.count < 100 && this.sp > 0.005;
    },
  };

  function MockAudioContext() {}
  MockAudioContext.prototype = {
    createJavaScriptNode: function() {
      return {
        connect : function(){}
      }
    }
  };

  function Mixer() {
  }
  Mixer.prototype = {
    prepare: function() {
      this.ctx = new (window.AudioContext || window.webkitAudioContext || MockAudioContext)();
      this.channel = 1;
      this.bufferSize = 2 << 11;

      this.node = this.ctx.createJavaScriptNode(this.bufferSize, 1, 1);
      this.node.connect(this.ctx.destination);

      var self = this;

      var pos = 0;
      this.notes = [];
      
      this.node.onaudioprocess = function(evt) {
        RippleManager.flush();

        var sampleRate = evt.outputBuffer.sampleRate;
        var length = evt.outputBuffer.length;
        var buffer = evt.outputBuffer.getChannelData(0);

        for(var i = 0; i < length; i++) {
          buffer[i] *= 0.0;
        }

        for(var i = 0; i < self.notes.length; i++) {
          var alive = self.notes[i](buffer, sampleRate, length);
          if(!alive) {
            self.notes[i] = undefined;
          }
        }
        
        self.notes = self.notes.compact();

      };
    },
    addNote: function(functor) {
      this.notes.push(functor);
    },
    update: function() {
    }
  };
      
  function genNote(freq, volume) {
    var seek = 0;
    var pos = 0;
    return function(buffer, sampleRate, size) {
      var step = freq * Math.PI / sampleRate;
      for(var i = 0; i < size; i++) {
        pos += step;
        buffer[i] += Math.sin(pos) * Math.cos(seek / 50000 - 0.1) * volume;
        seek++;
      }
      return seek < 50000;
    };
  }
    
  function analyzeLocationHash(hash) {
    var x = hash.split("#");
    if(!x[1]) return {};
    return x[1].split("&").inject({}, function(h, x) {
      var a = x.split("=");
      h[a[0]] = a[1];
      return h;
    });
  }
  var conf = analyzeLocationHash(window.location.hash);
    
  var mixer = new Mixer();
  mixer.prepare();

  window.addEventListener("keydown", function(evt) {
    var a = "A".charCodeAt();
    var z = "Z".charCodeAt();
    if(a <= evt.keyCode && evt.keyCode <= z) {
      RippleManager.add(new Ripple([$R(0, 1).randf(), $R(0, 1).randf()], null, null, evt.keyCode % 12));
    }
  }, false);

  (function(c) {
    d
     .blend("source-over")
     .alpha(0.5)
     .rgb(0xff, 0xff, 0xff)
     .fillBack()
    ;

    if(c % 64 === 0) {
      RippleManager.add(new Ripple([$R(0, 1).randf(), $R(0, 1).randf()]));
    }
    RippleManager.act();
    RippleManager.draw(!!conf.lazy);
    setTimeout(arguments.callee.curry(c + 1), 33);
  })(0);

});
