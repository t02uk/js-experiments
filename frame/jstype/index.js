window.onload = function() {

  // ;d
  var d = new DCore();
  var random = function() {
    var x = 1;
    return function() {
      x = (x * 22695477 + 1) & 0xffffffff;
      return ((x >> 16) & 0x7fff) / 0x7fff;
    };
  };

  // {{{ タイピングフェーズ
  function OnTyping() {

    this.startTime = +new Date() - 0 * 59500;
    this.timeupdCnt = 0;

    var problems = $R(0, 500, true).map(function(e) {
      return Global.methods[Global.methods.length.rand()];
    });

    // {{{ パーティクルエフェクト
    function Particle(p, s) {
      this.p = p;
      this.s = s;
      this.hue = $R(0, 1).randf();
    }
    Particle.prototype = {
      act: function() {
        this.p = this.p.add(this.s);
        this.s = this.s.mul(0.9);
      },
      draw: function() {
        d
         .blend("source-over")
         .alpha(this.s.abs() * 30)
         .hsv(this.hue, 0.3, 0.9)
         .circle(this.p, 0.01)
         .fill()
        ;
      }
    };
    // }}}


    // {{{ 問題描画用
    function ProblemLabel(problem) {
      this.problem = problem;
      this.numTyped = 0;
      this.font = ["monospace", 0.04, "bold"];
      this.r = (d.font(this.font).measureText(problem)) * 1.2 + 0.05;
      this.shakePower = 0;
      this.completed = false;
      this.hue = $R(0, 1).randf();

      this.repNumTyped = 0;
      this.repCompleted = false;
      this.missTyped = false;
    }
    ProblemLabel.prototype = {
      activate: function() {
        this.active = true;
      },
      isInBound: function(that) {
        var f = this.p.distance(that.p) < this.r + that.r;
        return f;
      },
      handleTyped: function(key) {
        var expected = this.problem.charCodeAt(this.numTyped);
        if(key === 0) return null;

        var correct = expected == key;
        this.missTyped = !correct;
        if(correct) {
          this.numTyped++;
          this.shakePower += 0.3;
          if(this.numTyped >= this.problem.length) {
            this.completed = true;
          }
        } else {
        }

        return correct;
      },
      repTyped: function(key) {
        this.repNumTyped++;
        if(this.repNumTyped >= this.problem.length) {
          this.repCompleted = true;
        }
      },
      act: function() {
        this.shakePower *= 0.5;
      },
      draw: function(rep) {

        if(rep) {
          if(this.repNumTyped) {
            d
              .blend("source-over")
              .alpha(0.8)
              .hsv(0.0, 0.2, 0.95)
              .circle(this.p, this.r * (1 + this.shakePower) + 0.03 + 0.03, (0).toRadian(), (this.repNumTyped / this.problem.length).toRadian())
              .stroke()
              ;
          }
        } else {
          if(this.active) {

            d
              .blend("source-over")
              .alpha(1)
              .hsv(this.missTyped ? [0, 0.7, 0.85] : [this.hue, 0.3, 0.85])
              .circle(this.p, this.r * (1 + this.shakePower))
              .fill()
              ;

            if(this.numTyped) {
              d
                .blend("source-over")
                .alpha(1)
                .hsv(0.6, 0.3, 0.95)
                .circle(this.p, this.r * (1 + this.shakePower) + 0.03, (0).toRadian(), (this.numTyped / this.problem.length).toRadian())
                .stroke()
                ;
            }

            d
              .font(this.font)
              .hsv(this.hue, 0.3, 0.3)
              .textAlign("center")
              .textBaseline("middle")
              .fillText(this.problem, this.p)
              ;

            var typed = this.problem.substr(0, this.numTyped);

            d
              .font(this.font)
              .rgb(0xff, 0xff, 0xff)
              .textAlign("center")
              .textBaseline("middle")
              .fillText(typed, this.p.add([-d.font(this.font).measureText(this.problem.substr(this.numTyped)) * 0.5, 0]))
          } else {
            d
              .blend("source-over")
              .alpha(1)
              .hsv(this.hue, 0.1, 0.95)
              .circle(this.p, this.r)
              .stroke()
              .fill()
              ;

            d
              .font(this.font)
              .rgb(0x99, 0x99, 0x99)
              .textAlign("center")
              .textBaseline("middle")
              .fillText(this.problem, this.p)
              ;
          }
        }
        return
      },
    }
    // }}}

    // 全体描画制御
    function TypeField(problems, ki, replay) {
      this.numSolved = 0;
      this.problems = problems;
      this.ki = ki;
      this.pls = [];
      this.allPls 
      this.plsIdx = 0;
      this.plsCapacity = 5;
      this.particles = [];
      this.numAllocated = 0;
      this.cameraP = [0, 0];
      this.score = 0;
      this.ir = new InputRecorder(ki);
      this.replay = replay;
      this.replay.reset();

      this.repIdx = 0;

      this.wholePls = [];


      var self = this;
      var c = 0;
      var _ = function(m) {
        var pls = self.wholePls;
        while(pls.length < m) {
          var i = 0;
          var problem = self.problems[pls.length];
          var pl = new ProblemLabel(problem);
          do {
            pl.p = [$R(0.15, 0.85).randf(), c * 0.2 + $R(0, 0.1).randf() + 0.2];
            if(i++ > 100) break;
          } while(pls.all(function(that) { return !pl.isInBound(that); }) && pls.length !== 0)
          pls.push(pl);
          c++;

          if(i++ > 100) break;
        }
      }

      _(10);
      for(i = 1; i < 30; i++) {
        window.setTimeout(_.curry(10 * i), 1000 * i);
      }

      this.allocate();

      this.repPl = this.wholePls[0];
    }
    TypeField.prototype = {
      allocate: function() {
        var pls = this.pls;

        while(pls.length < this.plsCapacity) {
          pls.push(this.wholePls[this.numAllocated]);
          this.numAllocated++;
        }

        pls[0].activate();

      },
      act: function() {

        // key control
        var key = this.ki.get();

        var f = this.pls[0].handleTyped(key);
        if(f) {
          this.ir.record();
        }

        if(f !== null) {
          this.score += f ? 61 : 81;
        }


        if(this.pls[0].completed) {
          var self = this;

          $R(0, 16, true).each(function(i) {
            self.particles.push(
              new Particle(self.pls[0].p, [0, $R(0.02, 0.04).randf()].rotate((i / 16).toRadian()))
            );
          });

          this.pls.shift();
        }

        // Replay
        var f = replay.next();
        if(f) {
          console.log("!");
          this.repPl.repTyped();
          if(this.repPl.repCompleted) {
            console.log("c");
            this.repPl = this.wholePls[++this.repIdx];
          }
        }


        this.allocate();
        this.pls.invoke("act");

        this.particles = this.particles.select(function(e) {
          return e.s.square() > 0.00001;
        });
        this.particles.invoke("act");

        var y = this.pls[0].p[1];
        this.cameraP = [0, (this.cameraP[1] * 9 + y) / 10];

        return this;
      },
      draw: function() {
        var self = this;

        // background pattern
        $R(0, 10).each(function(i) {
          var y = i / 10 + (100000 - self.cameraP[1]);
          y %= 1;
          d
           .rgb(0xee, 0xee, 0x99 + self.cameraP[1] * 5)
           .line([
             [0, y],
             [1, y]
            ])
           .stroke()
          ;
        });


        // objects
        d.top2d = -this.cameraP[1] + 0.2;

        this.repPl.draw(true);
        this.particles.invoke("draw");
        this.pls.reverse().invoke("draw");
        this.pls.reverse();


        d.top2d = 0;

      }
    };
    // }}}

    replay.decode(Global.replay);
    this.tfs = $R(1, 1).map(function(e) { return new TypeField(problems, ki, replay); });
  }
  OnTyping.prototype = {
    act: function() {
      if(this.timeupdCnt) return this;
      this.tfs.invoke("act");
      return this;
    },
    draw: function() {
      var tfs = this.tfs;

      // fill back
      d
       .blend("source-over")
       .alpha(1)
       .rgb(0xff, 0xfc, 0xf3)
       .fillBack()
      ;

      tfs.invoke("draw");

      // time information
      var remain = new Date() - this.startTime;
      var remain_ms = ~~((remain % 1000) / 100);
      var remain_s = ~~(remain / 1000);

      if(remain_s >= 60) {
        this.timeupdCnt++;
        var c = this.timeupdCnt;

        // background pattern
        $R(0, 10).each(function(i) {
          var x = i / 10;
          d
           .rgb(0xff, 0xff, 0xff)
           .quads([
             [x, 0],
             [x + c / 200, 0],
             [x + c / 200, 1],
             [x, 1],
            ])
           .fill()
          ;
        });

        return this;
      }

      d
        .blend("source-over")
        .alpha(0.8)
        .circle([0.9, 0.9], 0.2)
        .rgb(0xee, 0xd9, 0x99)
        .fill()
        .lineWidth(0.015)
        .rgb(0xcc, 0x66, 0x66)
        .circle([0.9, 0.9], 0.18, (0.75).toRadian(), (remain_s / 60 + 0.75).toRadian())
        .stroke()
        .rgb(0x66, 0xcc, 0x66)
        .lineWidth(0.015)
        .circle([0.9, 0.9], 0.2, (-0.25).toRadian(), (remain_ms / 10 - 0.25).toRadian())
        .stroke()
      ;

      d
        .rgb(0x97, 0x82, 0x42)
        .font("monospace", 0.06, "bold")
        .textAlign("center")
        .textBaseline("middle")
        .fillText(remain_s + "." + remain_ms, [0.9, 0.9])
      ;

      return this;
    },
    next: function() {
      if(this.timeupdCnt > 20) {
        return new OnTitle(this.tfs[0].score, this.tfs[0].ir.encode());
      }
      else return this;
    },
  }
  // }}}

  // OnTitle
  function OnTitle(score, replay) {
    this._next = this;
    this.score = score;
    this.replay = replay;
  }
  OnTitle.prototype = {
    act: function() {
      var key = ki.next();
      if(key == "s".charCodeAt(0)) this._next = new OnTyping();
      if(key == "t".charCodeAt(0)) tweet(this.replay);
    },
    draw: function() {

      d
       .rgb(0xff, 0xff, 0xff)
       .fillBack()
      ;

      var rnd = random();
      (25).times(function(i) {
        var p = [
          rnd(), rnd()
        ]
        var r = rnd() / 20 + 0.03;
        var hue = rnd();

        d
         .hsv(hue, 0.05, 0.95)
         .circle(p, r)
         .fill()
        ;
      });


      "JS*TYPE".split("").zipWithIndex(function(e, i) {
        var p = [i * 0.1 + 0.2, 0.4];
        d
         .hsv(i / 7, 0.4, 0.9)
         .circle(p, 0.1)
         .fill()
         .textAlign("center")
         .textBaseline("middle")
         .font("monospace", 0.08, "bold")
         .hsv(i / 7, 0.0, 1.0)
         .fillText(e, p)
        ;
      });


      d
       .rgb(0xff, 0x66, 0x99)
       .font("monospace", 0.05, "bold")
       .textAlign("left")
       .fillText("Score: " + (this.score ? this.score : "0"), [0.2, 0.6])
       .fillText("* Press 'S' Key To Play", [0.2, 0.7])
       .fillText(this.replay ? "* Or, Press 'T' Key To Tweet Replay" : "", [0.2, 0.8])
      ;
    },
    next: function() {
      return this._next;
    },
  }

  // {{{ 共通グローバル領域
  var Global = {};
  // {{{ メソッド一覧取得
  Global.methods = (function(objs) {
    var results = [];
    [objs].each(function(obj) {
      for(var i in obj) {
        if((obj.hasOwnProperty(i) 
        || (obj.prototype && obj.prototype.hasOwnProperty(i)))
        && (obj[i] instanceof Function)
	&& (!i.match(/[^a-zA-Z]/))) {
          results.push(i);
        }
      }
    });
    return results.uniq();
  })(jQuery, jQuery.fn);
  // }}}
  // {{{ リプレイ
  Global.replay = (function(p) {
    var post = p.split("?");
    if(post.length < 2) return "";
    var hash = post[1];
    var h = (function(hash) {
      return hash.split("&").map(function(x) {
        return x.split("=");
      });
    })(hash);
    var hs = {};
    for(var i = 0; i < h.length; i++) {
      hs[h[i][0]] = h[i][1];
    }
    return hs["replay"] || "";
  })(location.search);
  // }}}
  // }}}
	
  // {{{ キーボード入力ハンドラ
  function KeyInput() {
    var self = this;
    self.key = 0;
    window.addEventListener("keydown", function(e) {
      if('A'.charCodeAt(0) <= e.keyCode && e.keyCode <= 'Z'.charCodeAt(0)) {
        self.key = e.keyCode ^ !e.shiftKey << 5;
      }
    }, false);
  }
  // }}}
  // {{{ prototype
  KeyInput.prototype = {
    get: function() {
      return this.key;
    },
    next: function() {
      var a = this.key
      this.key = 0;
      return a;
    }
  };
  // }}}
  var ki = new KeyInput();


  // {{{ デバイス入力レコーダ/簡易録画、再生機能機能
  function InputRecorder(recordee) {
    this.clear();
    var self = this;
    this.startTime = +new Date();
    this.playCount = 0;

    // アスペクトでフック -> 無理
    //var recordee_next = recordee.next;
    //recordee.next = function() {
    //  var a = recordee_next.call(recordee);
    //  if(a) {
    //    self.inputs.push({"key": a, "time": ~~(new Date() - startTime) / 16});
    //  }
    //  return a;
    //};

    this.recordee = recordee;

    this.convTable = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  }
  // }}}
  // {{{ prototype
  InputRecorder.prototype = {
    clear: function() {
      this.inputs = [];
      this.playCount = 0;
    },
    reset: function() {
      this.startTime = +new Date();
    },
    get: function() {
      return this.inputs[0];
    },
    record: function() {
      this.inputs.push({
        "time": ~~(new Date() - this.startTime) / 16
      });
    },
    next: function() {
      if(!this.inputs.length) return;
      if(this.inputs.length <= this.playCount) return;

      var d = ~~(new Date() - this.startTime) / 16;
      if(d >= this.inputs[this.playCount].time) {
        this.inputs[this.playCount];
        this.playCount++;
        return true;
      }
      return false;
    },
    encode: function() {
      var inputs = this.inputs;
      var result = "";
      for(i = 0, l = inputs.length; i < l; i++) {
        var input = inputs[i];
        var d = inputs[i].time - (i ? inputs[i - 1].time : 0);
        var dh = d >> 6;
        var dl = d & 63;
        result += this.convTable.substr(dh, 1) + this.convTable.substr(dl, 1);
      }
      return result;
    },
    decode: function(raw) {
      this.clear();
      var ot = 0;
      for(i = 0, l = raw.length; i < l; i += 2) {
        var d = raw.substring(i, i + 2);
        var dh = this.convTable.indexOf(d.substr(0, 1));
        var dl = this.convTable.indexOf(d.substr(1, 1));
        var t = dh << 6 | dl & 63;
        ot += t
        this.inputs.push({"time": ot});
      }
    },
  };
  // }}}
  var replay = new InputRecorder();

  function tweet(replay) {
    window.callback = function(bitlyResponse) {
      shortUrl = bitlyResponse.results[url].shortUrl;
      window.open("http://twitter.com/share?url="+url, 'tweet', 'width=550, height=450,personalbar=0,toolbar=0,scrollbars=1,resizable=1');
    }
    var url = "http://jsrun.it/t02uk/jstype" + "?" + "replay=" + replay;
    var login  = 'o_7t5r7knc2s';
    var apiKey = 'R_7a210c6e5993a8c6e59c6dded03e55c4';
    bitly = 'http://api.bit.ly/shorten' 
        + '?version=2.0.1&format=json&callback=callback'
        + '&login=' + login
        + '&apiKey=' + apiKey
        + '&longUrl=' + url;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = bitly;
    document.body.appendChild(script);
  }
  
  /// {{{ メイン
  (function(phase) {
    phase.act();
    phase.draw();

    ki.next();

    window.setTimeout(arguments.callee.curry(phase.next()), 33);
  })(new OnTitle());
  /// }}}

};

// vim:sw=2:ts=2:foldmethod=marker:
