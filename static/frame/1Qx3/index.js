// Generated by CoffeeScript 1.6.3
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.onload = function() {
    var Cpu, Hand, Judge, Judgement, Phase, PhaseFighting, PhaseInitialize, PhaseOpening, Player, Pose, Stage, createTexture, d, main, phase, prevPhase, _ref, _ref1, _ref2;
    (function() {
      var lastTime, org_setTimeout;
      lastTime = 0;
      org_setTimeout = window.setTimeout;
      return window.setTimeout = function(func, wait) {
        var realWait;
        realWait = lastTime ? wait : wait - (new Date() - lastTime);
        if (realWait <= 0) {
          realWait = 1;
        }
        lastTime = +new Date();
        return org_setTimeout(func, realWait);
      };
    })();
    d = new DCore();
    createTexture = function(src, width, height) {
      var image;
      image = new Image;
      image.src = src;
      image.width = width;
      image.height = height;
      return image;
    };
    Stage = (function() {
      function Stage() {
        this.camp = [0.1, 0];
        this.camw = 1;
        this.mTex = this.genMountainTexture();
      }

      Stage.prototype.genMountainTexture = function() {
        var mountain, sd, z;
        mountain = $R(0, 127).map(function(x) {
          return [x / 127, 0.9];
        });
        z = 0.5;
        64..times(function(i) {
          z = (z + pelinNoise(6)) / 2;
          mountain[i + 0][1] -= z;
          return mountain[i + 64][1] -= z;
        });
        mountain[0][1] = mountain[63][1] = mountain[64][1] = mountain[127][1] = 0.7;
        mountain.push([1, 1]);
        mountain.push([0, 1]);
        sd = d.subTexture(512, 256);
        sd.rgb([0x11, 0x22, 0x66]).quads(mountain).fill();
        return sd;
      };

      Stage.prototype.delegateDraw = function(absolute, fn) {
        var f, s;
        if (absolute) {
          s = [0, 0];
        } else {
          s = this.camp.scale(-1, 1);
        }
        if (this.shockCount > 0) {
          f = $R(-1, 1).randf() * this.shockCount;
          s = s.add([$R(-1, 1).randf() * this.shockCount * 0.01, $R(-1, 1).randf() * this.shockCount * 0.01]);
        }
        return d.save().translate(s).tap(fn).restore();
      };

      Stage.prototype.shock = function() {
        return this.shockCount = 4;
      };

      Stage.prototype.damaged = function() {
        return this.damagedCount = 2;
      };

      Stage.prototype.captureHands = function(hand1, hand2) {
        this.hand1 = hand1;
        return this.hand2 = hand2;
      };

      Stage.prototype.reset = function() {
        return this.camp[0] = (this.hand1.p[0] + this.hand2.p[0]) / 2 - this.camw / 2;
      };

      Stage.prototype.act = function() {
        var _this = this;
        [this.hand1.p[0], this.hand2.p[0]].each(function(x) {
          if (x - 0.2 < _this.camp[0]) {
            _this.camp[0] = (x - 0.2 + _this.camp[0]) / 2;
          }
          if (x + 0.2 > _this.camp[0] + _this.camw) {
            return _this.camp[0] = (x + 0.2 + _this.camp[0] - _this.camw) / 2;
          }
        });
        this.shockCount--;
        return this.damagedCount--;
      };

      Stage.prototype.draw = function() {
        var _this = this;
        return this.delegateDraw(true, function() {
          var rnd, x;
          d.gradient([0, 0], [0, 1], [[0, [0x33, 0x33, 0x66]], [1, [0x44, 0x44, 0xaa]]]).rect([0, 0.0], [1, 1.0]).fill();
          rnd = randomGen();
          300..times(function(x) {
            var p, s, v;
            x = [4 * rnd() - _this.camp[0] + 65536];
            x = x % 4;
            p = [x, rnd() * 0.9];
            v = 1 - p[1] + rnd() * 0.3;
            s = rnd() * 0.003 + 0.002;
            return d.rgb(v * 0xff, v * 0xff, v * 0x99).circle(p, s).fill();
          });
          x = (_this.camp[0] * 0.1 + 12345) % 0.5 + 0.25;
          d.blend("source-over").alpha(0.3).drawImage(_this.mTex, [x, 0.5], [0.2, 0.5], [0, 0.5], [1, 0.4]);
          x = (_this.camp[0] * 0.075 + 12345.1) % 0.5 + 0.25;
          d.blend("source-over").alpha(0.5).drawImage(_this.mTex, [x, 0.5], [0.2, 0.5], [0, 0.5], [1, 0.5]);
          x = (_this.camp[0] * 0.05 + 12345.2) % 0.5 + 0.25;
          d.blend("source-over").alpha(1.0).drawImage(_this.mTex, [x, 0.4], [0.2, 0.6], [0, 0.5], [1, 0.6]).gradient([0, 0.9], [0, 1], [[0, [0x33, 0x33, 0x44]], [1, [0x77, 0x66, 0x99]]]).rect([0, 0.9], [1, 0.1]).fill();
          if (_this.damagedCount > 0) {
            return d.rgb(0xff, 0x00, 0x00).fillBack();
          }
        });
      };

      return Stage;

    })();
    Pose = {
      Rock: 0,
      Scissors: 1,
      Paper: 2,
      Size: 3
    };
    Hand = (function() {
      function Hand(x, direction) {
        this.life = 256;
        this.s = [0.15, 0.15];
        this.p = [x, 0.98 - this.s[1]];
        this.direction = direction;
        this.sp = 0.01;
        this.dasheSp = 0.00;
        this.knockBackSp = 0.00;
        this.pose = Pose.Rock;
        this.reflectCnt = 0;
        this.images = [createTexture("http://jsrun.it/assets/a/H/C/r/aHCrM.png", 169, 169), createTexture("http://jsrun.it/assets/a/r/G/j/arGjf.png", 166, 195), createTexture("http://jsrun.it/assets/5/R/8/k/5R8kA.png", 180, 180)];
        this.willTo("nop");
        this.knockOutCnt = 0;
      }

      Hand.prototype.captureJudgement = function(judgement) {
        return this.judgement = judgement;
      };

      Hand.prototype.captureEnemy = function(enemy) {
        return this.enemy = enemy;
      };

      Hand.prototype.damage = function() {
        var ss;
        ss = 2;
        if (this.enemy.dasheSp > 0.002) {
          ss *= 2.0;
        }
        if (this.dasheSp > 0.002) {
          ss *= 4.0;
        }
        return this.life -= 8 * ss;
      };

      Hand.prototype.act = function() {
        if (this.life < 0 && this.reflection !== "") {
          this.reflectTo("knockOut", 10);
        }
        if (this.enemy < 0 && this.reflectTo !== "") {
          this.reflectTo("nop", 3);
        }
        this.dasheSp *= 0.7;
        this.knockBackSp *= 0.7;
        this.reflectCnt--;
        if (this.reflectCnt > 0) {
          Hand.prototype[this.reflection].apply(this, null);
        } else {
          Hand.prototype[this.will].apply(this, null);
        }
        this.p[0] += this.dasheSp;
        return this.p[0] += this.knockBackSp;
      };

      Hand.prototype.reborn = function() {
        this.p[0] = this.enemy.p[0] + this.enemy.direction * 0.7;
        this.p[1] = 0.08 - 0.15;
        this.reflectTo("reborning", 10);
        return this.heal();
      };

      Hand.prototype.heal = function() {
        this.life = 256;
        return this.knockOutCnt = 0;
      };

      Hand.prototype.reborning = function() {
        return this.p[1] += 0.1;
      };

      Hand.prototype.willTo = function(will) {
        return this.will = will;
      };

      Hand.prototype.reflectTo = function(reflection, reflectCnt) {
        this.reflection = reflection;
        return this.reflectCnt = reflectCnt;
      };

      Hand.prototype.transform = function(pose) {
        return this.pose = pose;
      };

      Hand.prototype.nop = function() {};

      Hand.prototype.dashe = function() {
        if (this.dasheSp.abs() < 0.01) {
          return this.dasheSp += 0.08 * this.direction;
        }
      };

      Hand.prototype.backSteppo = function() {
        if (this.dasheSp.abs() < 0.01) {
          return this.dasheSp -= 0.04 * this.direction;
        }
      };

      Hand.prototype.moveBack = function() {
        return this.p[0] += -this.sp * this.direction;
      };

      Hand.prototype.moveFront = function() {
        return this.p[0] += this.sp * this.direction;
      };

      Hand.prototype.weakKnockBack = function() {
        this.knockBackSp = -0.05 * this.direction;
        return this.reflectTo("nop", 3);
      };

      Hand.prototype.knockBack = function() {
        this.knockBackSp = -0.1 * this.direction;
        return this.reflectTo("nop", 3);
      };

      Hand.prototype.knockOut = function() {
        this.p[0] -= 0.05 * this.direction;
        this.p[1] -= 0.05;
        return this.knockOutCnt++;
      };

      Hand.prototype.draw = function() {
        return d.drawImage(this.images[this.pose], [0, 0], [1, 1], this.p, this.s);
      };

      return Hand;

    })();
    Judge = {
      Draw: 0,
      Lose: 1,
      Win: 2
    };
    Judgement = (function() {
      function Judgement() {
        this.se_lose = new Audio("http://dl.dropbox.com/u/3589634/resource/se/se_lose.ogg");
        this.se_draw = new Audio("http://dl.dropbox.com/u/3589634/resource/se/se_draw.ogg");
        this.se_win = new Audio("http://dl.dropbox.com/u/3589634/resource/se/se_win.ogg");
      }

      Judgement.prototype.playOgg = function(audio) {
        if (audio.currentTime) {
          audio.pause();
          audio.currentTime = 0;
        }
        return audio.play();
      };

      Judgement.prototype.judge = function(self, enemy) {
        return (self.pose - enemy.pose + Pose.Size) % Pose.Size;
      };

      Judgement.prototype.tellMeHowToWin = function(enemy) {
        return (enemy.pose + 2 + Pose.Size) % Pose.Size;
      };

      Judgement.prototype.tellMeHowToLose = function(enemy) {
        return (enemy.pose + 1 + Pose.Size) % Pose.Size;
      };

      Judgement.prototype.captureHands = function(hand1, hand2) {
        this.hand1 = hand1;
        return this.hand2 = hand2;
      };

      Judgement.prototype.captureStage = function(stage) {
        return this.stage = stage;
      };

      Judgement.prototype.hitTest = function() {
        var result, signBase;
        if ((this.hand1.p[0] - this.hand2.p[0]).abs() < (this.hand1.s[0] + this.hand2.s[1]) / 2 / 2) {
          signBase = (this.hand1.p[0] - this.hand2.p[0]).sign();
          result = this.judge(this.hand1, this.hand2);
          if (result === Judge.Draw) {
            this.hand1.knockBack();
            this.hand2.knockBack();
            return this.playOgg(this.se_draw);
          } else if (result === Judge.Lose) {
            this.hand1.knockBack();
            this.hand1.damage();
            this.hand2.weakKnockBack();
            this.stage.shock();
            this.stage.damaged();
            return this.playOgg(this.se_lose);
          } else if (result === Judge.Win) {
            this.hand1.weakKnockBack();
            this.hand2.knockBack();
            this.hand2.damage();
            this.stage.shock();
            return this.playOgg(this.se_win);
          }
        }
      };

      return Judgement;

    })();
    Player = (function(_super) {
      __extends(Player, _super);

      function Player() {
        Player.__super__.constructor.call(this, 0.1, 1);
      }

      return Player;

    })(Hand);
    Cpu = (function(_super) {
      __extends(Cpu, _super);

      function Cpu() {
        this.willTo("moveFront");
        this.nextDecition = 0;
        this.setParam();
        Cpu.__super__.constructor.call(this, 0.7, -1);
      }

      Cpu.prototype.setParam = function(clock, p1, p2, p3) {
        if (clock == null) {
          clock = 12;
        }
        if (p1 == null) {
          p1 = 5;
        }
        if (p2 == null) {
          p2 = 5;
        }
        if (p3 == null) {
          p3 = 0.1;
        }
        this.clock = 12;
        this.p1 = p1;
        this.p2 = p2;
        return this.p3 = p3;
      };

      Cpu.prototype.willTo = function(will) {
        return Cpu.__super__.willTo.call(this, will);
      };

      Cpu.prototype.makeDecision = function() {
        var distance, simulate;
        simulate = this.judgement.judge(this, this.enemy);
        if (simulate === Judge.Lose) {
          if (!(this.clock * this.p1 * 1..rand())) {
            this.pose = this.judgement.tellMeHowToWin(this.enemy);
          }
        }
        distance = (this.enemy.p[0] - this.p[0]).abs();
        if (distance > 0.8) {
          if (1..randf() < 0.5) {
            this.willTo("dashe");
          }
        } else if (distance.abs() > 0.3) {
          if (1..randf() < 0.2) {
            this.willTo("moveBack");
          } else {
            this.willTo("moveFront");
          }
        } else {
          if (1..randf() < this.p3) {
            this.willTo("dashe");
          } else {
            this.willTo("moveBack");
            if (1..randf() < this.p2) {
              this.pose = this.judgement.tellMeHowToLose(this.enemy);
            }
          }
        }
        if (1..randf() < 0.1) {
          this.willTo("moveBack moveFront dashe moveBack nop".split(" ").randomSelect());
        }
        if (1..randf() < 0.1) {
          return this.transform([Pose.Rock, Pose.Scissors, Pose.Paper].randomSelect());
        }
      };

      Cpu.prototype.act = function() {
        if (this.nextDecition <= 0) {
          this.makeDecision();
          this.nextDecition += this.clock * $R(0, 2).rand();
        }
        this.nextDecition--;
        if (this.p[0] < this.enemy.p[0]) {
          this.p[0] = this.enemy.p[0] + 0.01;
        }
        return Cpu.__super__.act.apply(this, arguments);
      };

      return Cpu;

    })(Hand);
    Phase = (function() {
      function Phase() {}

      Phase.prototype.activateFrom = function(from) {
        this.kb = from.kb;
        this.judgement = from.judgement;
        this.player = from.player;
        this.cpu = from.cpu;
        this.stage = from.stage;
        return this.lv = from.lv;
      };

      return Phase;

    })();
    PhaseInitialize = (function(_super) {
      __extends(PhaseInitialize, _super);

      function PhaseInitialize() {
        _ref = PhaseInitialize.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PhaseInitialize.prototype.initialize = function() {
        var _this = this;
        this.kb = new Keyboard();
        '37 39 X Y Z V'.split(' ').each(function(x) {
          return _this.kb.at(x).enablePrevent();
        });
        this.judgement = new Judgement();
        this.player = new Player();
        this.cpu = new Cpu();
        this.stage = new Stage();
        this.player.transform(Pose.Rock);
        this.cpu.transform(Pose.Rock);
        this.judgement.captureHands(this.player, this.cpu);
        this.judgement.captureStage(this.stage);
        this.player.captureJudgement(this.judgement);
        this.player.captureEnemy(this.cpu);
        this.cpu.captureJudgement(this.judgement);
        this.cpu.captureEnemy(this.player);
        this.stage.captureHands(this.player, this.cpu);
        return this.lv = 1;
      };

      return PhaseInitialize;

    })(Phase);
    PhaseOpening = (function(_super) {
      __extends(PhaseOpening, _super);

      function PhaseOpening() {
        _ref1 = PhaseOpening.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PhaseOpening.prototype.initialize = function() {
        var ps;
        this.stage.reset();
        ps = [[5, 2, 0.1], [8, 2, 0.1], [5, 4, 0.1], [5, 2, 0.2]].randomSelect();
        this.cpu.setParam(128 / (this.lv + 8), ps[0], ps[1], ps[2]);
        this.count = 0;
        this.maxFrame = 40;
        return this.prefix = "";
      };

      PhaseOpening.prototype.main = function() {
        var len,
          _this = this;
        this.kb.flush();
        this.stage.act();
        this.stage.draw();
        this.player.willTo("nop");
        if (this.kb.at(37).pressing) {
          this.player.willTo("moveBack");
        }
        if (this.kb.at(39).pressing) {
          this.player.willTo("moveFront");
        }
        this.player.act();
        this.cpu.act();
        this.stage.delegateDraw(false, function() {
          _this.player.draw();
          return _this.cpu.draw();
        });
        this.count++;
        d.rgb(0x00, 0x00, 0x00).alpha(0.5).blend("source-over").rect([0, 0.4], [1, 0.2]).fill();
        d.alpha(1).rgb(0xff, 0xff, 0xff).textBaseline("middle").textAlign("center").font("cursive", 0.2, "italic").fillText("VS - " + "LV." + this.lv, [0.5, 0.5]);
        len = this.count / this.maxFrame;
        d.alpha(0.5).rgb(0xff, 0x00, 0x00).rect([1 - len, 0.4], [len, 0.01]).fill().rect([0, 0.6], [len, 0.01]).fill();
        d.alpha(1);
        if (this.count > this.maxFrame) {
          return new PhaseFighting();
        }
        return this;
      };

      return PhaseOpening;

    })(Phase);
    PhaseFighting = (function(_super) {
      __extends(PhaseFighting, _super);

      function PhaseFighting() {
        _ref2 = PhaseFighting.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PhaseFighting.prototype.initialize = function() {};

      PhaseFighting.prototype.main = function() {
        var _this = this;
        this.kb.flush();
        this.stage.act();
        this.stage.draw();
        this.player.willTo("nop");
        if (this.kb.at(37).pressing) {
          if (this.kb.at('V').downed) {
            this.player.willTo("backSteppo");
          } else {
            this.player.willTo("moveBack");
          }
        }
        if (this.kb.at(39).pressing) {
          if (this.kb.at('V').downed) {
            this.player.willTo("dashe");
          } else {
            this.player.willTo("moveFront");
          }
        }
        if (this.kb.at('Z').downed) {
          this.player.transform(Pose.Rock);
        }
        if (this.kb.at('X').downed) {
          this.player.transform(Pose.Scissors);
        }
        if (this.kb.at('C').downed) {
          this.player.transform(Pose.Paper);
        }
        this.player.act();
        this.cpu.act();
        this.stage.delegateDraw(false, function() {
          _this.player.draw();
          return _this.cpu.draw();
        });
        this.judgement.hitTest();
        this.stage.delegateDraw(true, function() {
          d.blend("source-over").alpha(0.8).gradient([0, 0], [1, 0], [[0, [0xff, 0x00, 0x00]], [1, [0x99, 0x99, 0xff]]]);
          d.rect([0, 0.02], [_this.player.life / 256, 0.01]).fill();
          d.rect([0.0, 0.05], [_this.cpu.life / 256, 0.01]).fill();
          return d.blend("source-over").alpha(1.0);
        });
        if (this.cpu.knockOutCnt > 45) {
          this.cpu.reborn();
          this.player.heal();
          this.cpu.heal();
          this.lv++;
          return new PhaseOpening();
        } else if (this.player.knockOutCnt > 45) {
          this.player.reborn();
          this.player.heal();
          this.cpu.heal();
          this.lv -= 3;
          if (this.lv <= 0) {
            this.lv = 1;
          }
          return new PhaseOpening();
        } else {
          return this;
        }
      };

      return PhaseFighting;

    })(Phase);
    prevPhase = new PhaseInitialize();
    prevPhase.initialize();
    phase = new PhaseOpening();
    main = function(c) {
      if (c == null) {
        c = 0;
      }
      if (phase !== prevPhase) {
        phase.activateFrom(prevPhase);
        phase.initialize();
      }
      prevPhase = phase;
      phase = phase.main();
      return setTimeout(arguments.callee.curry(c + 1), 33);
    };
    return main();
  };

}).call(this);

/*
//@ sourceMappingURL=index.map
*/
