// forked from kyo_ago's "CoffeeScript出来るかな" http://jsdo.it/kyo_ago/gAoN
//以下のコメントアウト内にCoffeeScriptを記述してください。
//コード開始から/＊までは無視されます。
/*
window.onload = (e)->

  main = (() ->

    # random
    random = (x=1) -> () ->
      x = (x * 22695477 + 1) & 0xffffffff
      ((x >> 16) & 0x7fff) / 0x7fff

    (() ->
      lastTime = 0
      org_setTimeout = window.setTimeout
      window.setTimeout = (func, wait) ->
        realWait = if lastTime then wait else wait - (new Date() - lastTime)
        realWait = 1 if realWait <= 0
        lastTime = +new Date()
        org_setTimeout(func, realWait)
    )()

    # create my library
    d = new DCore()

    # observe key event
    keys = []
    ((keys, target) ->
      flipOrFlop = (flag) ->
        (e) ->
          if e.keyCode in target
            keys[e.keyCode] = flag
            e.preventDefault?() ? e.returnValue = false

      window.addEventListener("keydown", flipOrFlop(true), false)
      window.addEventListener("keyup", flipOrFlop(false), false)

    )(keys, [37,38,39,40,32])

    # definition of screen
    Screen =
      left: 0.2
      right: 0.8
      top: 0.0
      bottom: 1.0
      width: 0.6
      height: 1.0

    # manager of score
    class Score
      constructor: ->
        @score = 0
        @pool = 0
      add: (x) ->
        @pool ?= x; @pool += x
      act: () ->
        if @pool > 0
          @pool -= 1
          @score += 1
      draw: () ->
        score = ("0000#{@score}").substr(-4, 4)
        d
         .font("monospace", 0.04, "bold")
         .rgb(0x33, 0x33, 0x99)
         .textAlign("right")
         .fillText("SCORE #{score}", [0.99, 0.01])

    # enemy
    class Enemy
      size: 0.04
      accell: 0.01
      damage: () ->
        @damaged = true
        @life--
        unless @alive() then score.add(10)
      alive: () ->
        @life > 0
      launchTypes: [
        () ->
          new EnemyAmmo(@p, [0.0, 0.005], @hue)
        ,() ->
          asp = player.p.sub(@p).normalize(0.01)
          [
            new EnemyAmmo(@p, asp.rotate( 0.1), @hue)
            new EnemyAmmo(@p, asp.rotate(-0.1), @hue)
          ]
        ,() ->
          asp = player.p.sub(@p).normalize(0.01)
          new EnemyAmmo(@p, asp, @hue)
      ]
      constructor: (p, life) ->
        @p = p
        @life = life ? 5
        @type = ((x) ->
          a = $R(0, 1).randf()
          if 0.0 <= a < 0.5 then 0
          else if 0.5 <= a < 0.8 then 1
          else 2
        )()
        @hue = [0.0, 0.25, 0.6][@type]
        @launchType = @launchTypes[@type]
      move: (sp) ->
        @p = @p.add(sp.mul(@accell))
      act: () ->
        @damaged = false
        @count ?= 0; @count++
        if(@count % 20 is 0)
          ammos.push(@launchType.call(@))
        this
      draw: () ->
        s = if @count < 4 then @count * 0.004 else 0
        d
         .quads(Geo
           .rect(true)
           .scale((@size + @damaged * (5 - @life) * 0.0075 - s).arize(2))
           .translate(@p))
         .blend("source-over")
         .alpha(0.4 + @life * 0.15)
         .hsv(@hue, 0.1, 0.95)
         .fill()
         .hsv(@hue, 0.3, 0.8)
         .stroke()

    # ammo
    class Ammo
      valid: () ->
        return -0.1 < @p[0] < 1.1 and -0.1 < @p[1] < 1.1

    # ammo of player
    class PlayerAmmo extends Ammo
      size: 0.02
      constructor: () ->
        [@p, @sp] = $A(arguments)
      act: () ->
        @count ?= 0; @count++
        @p = @p.add(@sp.mul(1 + @count * 0.1))
      draw: () ->
        d
         .rgb(0x33, 0xcc, 0x66)
         .alpha(0.5)
         .lineWidth(0.005)
         .quads(Geo.rect(true)
           .rotate(@count / 10)
           .scale(@size.arize(2))
           .translate(@p))
         .stroke()

    # ammo of enemy
    class EnemyAmmo extends Ammo
      size: 0.015
      constructor: () ->
        [@p, @sp, @hue] = $A(arguments)
        buzzed = false

      act: () ->
        @p = @p.add(@sp)
      draw: () ->
        d
          .hsv(@hue, 0.7, (if @buzzed then 0.5 else 0.8))
         .alpha(0.8)
         .lineWidth(0.01)
         .quads(Geo.rect(true)
           .scale(@size.arize(2))
           .translate(@p))
         .stroke()


    # bit
    class Bit
      vissize: 0.015
      size: 0.045
      dist: 0.06
      constructor: (player, p, d) ->
        @player = player
        @p = p.clone()
        @d = d
        @reserved = 0
        @bound = true
      act: () ->

        @count ?= 0; @count++

        if @bound
          _p = [0, @dist].rotate((@count / 6) + @d.toRadian()).add(@player.p)
        else
          _p = @p


        @p = @p.add(_p).mul(0.5)

        if @reserved isnt 0
          ammos.push(
            new PlayerAmmo(@p, [Math.sin(@count / 6) * 0.003, -0.02]))
          @reserved--

      launch: () ->
        @player.launch()
        @reserved += 1
      bindToggle: () ->
        @bound ^= true
      draw: () ->
        d
         .quads(Geo
           .rect(true)
           .rotate(@count / 10)
           .scale(@vissize.arize(2))
           .translate(@p))
         .blend("source-over")
         .alpha(0.35)
         .lineWidth(0.008)
         .rgb(0x33, 0x66, 0x99)
         .stroke()


    class Player
      size: 0.01
      sieldsize: 0.04
      accell: 0.01
      constructor: (p) ->
        @p = p
      move: (sp) ->
        @p = @p.add(sp.mul(@accell))
        @p[0] = ((x) ->
          if x < Screen.left then Screen.left
          else if x > Screen.right then Screen.right
          else x
        )(@p[0])
        @p[1] = ((x) ->
          if x < Screen.top then Screen.top
          else if x > Screen.bottom then Screen.bottom
          else x
        )(@p[1])
      launch: () ->
        @reserved ?= 0; @reserved++
        ammos.push(
          new PlayerAmmo(@p, [0, -0.01]))
      kill: () ->
        @killed = true
      act: () ->
        @count ?= 0; @count++
        if(@count % 4 is 0)
          ammos.push(
            new PlayerAmmo(@p, [0, -0.01]))
        if(@reserved > 0)
          ammos.push(
            new PlayerAmmo(@p, [0, -0.01]))
          @reserved--
        this
      draw: () ->
        d
         .quads(Geo
           .rect(true)
           .rotate(@count / 10)
           .scale(@sieldsize.arize(2))
           .translate(@p))
         .blend("source-over")
         .alpha(0.3)
         .rgb(0xaa, 0xff, 0xff)
         .fill()
         .alpha(0.9)
         .rgb(0x77, 0x77, 0xcc)
         .stroke()
         .alpha(0.9)
         .rgb(0xff, 0x99, 0x99)
         .quads(Geo
           .rect(true)
           .scale((@size).arize(2))
           .translate(@p))
         .fill()


    # first initialize
    player = new Player([0.5, 0.8])
    bits = [0...3].map((x) ->
      new Bit(player, player.p, x / 3))

    ammos = []
    enemies = []
    score = new Score()

    # main loop
    ((c, lv=0) ->

      # enemy generation control
      if c % (150 - lv) is 0
        if enemies.length is 0 then score.add(lv * 3)
        (3 + ~~(lv / 4)).times((x) ->
          enemies.push(
            new Enemy([$R(Screen.left, Screen.right).randf(), $R(0.03, 0.1).randf()]))
        )
        lv++

      # background
      d
       .blend("copy")
       .alpha(1)
       .rgb(0xea, 0xe9, 0xff)
       .fillBack()

      # draw tiles
      rand = random()
      [0..100].each((x) ->
        p =
        [
          (x % 10 * Screen.width) * 0.1 + Screen.left,
          rand() * 2.5 - 0.25,
        ]


        s = (~(x * x / 1000.0) / 100) + 0.1
        s = x / 800 + 0.02

        p[1] += c / 10 * s + 0.15
        p[1] %= 2.0
        p[1] -= 0.5

        d
         .quads(Geo.rect(true)
           .scale(s.arize(2))
           .translate(p))
         .blend("source-over")
         .alpha(0.15)
         .rgb(0xaa, 0xaa, 0xff)
         .fill()
         .lineWidth(0.01)
         .stroke()
      )

      # key control
      if keys[37] then player.move([-1,  0])
      if keys[38] then player.move([ 0, -1])
      if keys[39] then player.move([ 1,  0])
      if keys[40] then player.move([ 0,  1])
      if keys[32] then bits.each((x) -> x.bindToggle())
      keys[32] = false

      # delete killed enemy
      enemies = enemies.select((x) -> x.alive())

      # control
      [
        player,
        enemies,
        bits
      ].shallowFlatten().each(
        (x) -> x.act()
      )

      collisionTest = (lhs, rhs)->
        lhs.p.distance(rhs.p) < lhs.size + rhs.size

      # hit ammo test
      ammos = ammos.flatten().select((ammo) ->
        ammo.act()
        if not ammo.valid() then false
        else if ammo instanceof EnemyAmmo
          bits.each((bit) ->
            if collisionTest(ammo, bit)
              unless ammo.buzzed then bit.launch()
              unless ammo.buzzed then score.add(1)
              ammo.buzzed = true
          )
          if collisionTest(ammo, player) then player.kill()
          true
        else if ammo instanceof PlayerAmmo
          enemy = enemies.find((enemy) ->
            collisionTest(ammo, enemy))
          enemy?.damage()
          not enemy
      ).map((ammo) ->
        ammo.draw()
        ammo
      )

      # drawing
      [
        player,
        enemies,
        bits
      ].shallowFlatten().each(
        (x) -> x.draw()
      )

      # ellipse left/right side
      d
       .alpha(0.8)
       .rgb(0xbb, 0xcc, 0xff)
        # fill left
       .quads(Geo.rect(false)
         .scale([Screen.left, Screen.height]))
       .fill()
        # fill left
       .quads(Geo.rect(false)
         .scale([Screen.left, Screen.height])
         .translate([Screen.right, Screen.top]))
       .fill()

      # control of score
      score.act()
      score.draw()

      unless player.killed
        window.setTimeout(arguments.callee.curry(c+1, lv), 33)
      else
        if confirm("""
        Game is over. (Score #{score.score})
        Continue?
        """) then main()
    )(0)
  )
  main()

    


# vim:sw=2:ts=2


*/
(function() {
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  window.onload = function(e) {
    var main;
    main = (function() {
      var Ammo, Bit, Enemy, EnemyAmmo, Player, PlayerAmmo, Score, Screen, ammos, bits, d, enemies, keys, player, random, score;
      random = function(x) {
        if (x == null) {
          x = 1;
        }
        return function() {
          x = (x * 22695477 + 1) & 0xffffffff;
          return ((x >> 16) & 0x7fff) / 0x7fff;
        };
      };
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
      keys = [];
      (function(keys, target) {
        var flipOrFlop;
        flipOrFlop = function(flag) {
          return function(e) {
            var _ref, _ref2;
            if (_ref = e.keyCode, __indexOf.call(target, _ref) >= 0) {
              keys[e.keyCode] = flag;
              return (_ref2 = typeof e.preventDefault == "function" ? e.preventDefault() : void 0) != null ? _ref2 : e.returnValue = false;
            }
          };
        };
        window.addEventListener("keydown", flipOrFlop(true), false);
        return window.addEventListener("keyup", flipOrFlop(false), false);
      })(keys, [37, 38, 39, 40, 32]);
      Screen = {
        left: 0.2,
        right: 0.8,
        top: 0.0,
        bottom: 1.0,
        width: 0.6,
        height: 1.0
      };
      Score = (function() {
        function Score() {
          this.score = 0;
          this.pool = 0;
        }
        Score.prototype.add = function(x) {
          var _ref;
          (_ref = this.pool) != null ? _ref : this.pool = x;
          return this.pool += x;
        };
        Score.prototype.act = function() {
          if (this.pool > 0) {
            this.pool -= 1;
            return this.score += 1;
          }
        };
        Score.prototype.draw = function() {
          var score;
          score = ("0000" + this.score).substr(-4, 4);
          return d.font("monospace", 0.04, "bold").rgb(0x33, 0x33, 0x99).textAlign("right").fillText("SCORE " + score, [0.99, 0.01]);
        };
        return Score;
      })();
      Enemy = (function() {
        Enemy.prototype.size = 0.04;
        Enemy.prototype.accell = 0.01;
        Enemy.prototype.damage = function() {
          this.damaged = true;
          this.life--;
          if (!this.alive()) {
            return score.add(10);
          }
        };
        Enemy.prototype.alive = function() {
          return this.life > 0;
        };
        Enemy.prototype.launchTypes = [
          function() {
            return new EnemyAmmo(this.p, [0.0, 0.005], this.hue);
          }, function() {
            var asp;
            asp = player.p.sub(this.p).normalize(0.01);
            return [new EnemyAmmo(this.p, asp.rotate(0.1), this.hue), new EnemyAmmo(this.p, asp.rotate(-0.1), this.hue)];
          }, function() {
            var asp;
            asp = player.p.sub(this.p).normalize(0.01);
            return new EnemyAmmo(this.p, asp, this.hue);
          }
        ];
        function Enemy(p, life) {
          this.p = p;
          this.life = life != null ? life : 5;
          this.type = (function(x) {
            var a;
            a = $R(0, 1).randf();
            if ((0.0 <= a && a < 0.5)) {
              return 0;
            } else if ((0.5 <= a && a < 0.8)) {
              return 1;
            } else {
              return 2;
            }
          })();
          this.hue = [0.0, 0.25, 0.6][this.type];
          this.launchType = this.launchTypes[this.type];
        }
        Enemy.prototype.move = function(sp) {
          return this.p = this.p.add(sp.mul(this.accell));
        };
        Enemy.prototype.act = function() {
          var _ref;
          this.damaged = false;
          (_ref = this.count) != null ? _ref : this.count = 0;
          this.count++;
          if (this.count % 20 === 0) {
            ammos.push(this.launchType.call(this));
          }
          return this;
        };
        Enemy.prototype.draw = function() {
          var s;
          s = this.count < 4 ? this.count * 0.004 : 0;
          return d.quads(Geo.rect(true).scale((this.size + this.damaged * (5 - this.life) * 0.0075 - s).arize(2)).translate(this.p)).blend("source-over").alpha(0.4 + this.life * 0.15).hsv(this.hue, 0.1, 0.95).fill().hsv(this.hue, 0.3, 0.8).stroke();
        };
        return Enemy;
      })();
      Ammo = (function() {
        function Ammo() {}
        Ammo.prototype.valid = function() {
          var _ref, _ref2;
          return (-0.1 < (_ref = this.p[0]) && _ref < 1.1) && (-0.1 < (_ref2 = this.p[1]) && _ref2 < 1.1);
        };
        return Ammo;
      })();
      PlayerAmmo = (function() {
        __extends(PlayerAmmo, Ammo);
        PlayerAmmo.prototype.size = 0.02;
        function PlayerAmmo() {
          var _ref;
          _ref = $A(arguments), this.p = _ref[0], this.sp = _ref[1];
        }
        PlayerAmmo.prototype.act = function() {
          var _ref;
          (_ref = this.count) != null ? _ref : this.count = 0;
          this.count++;
          return this.p = this.p.add(this.sp.mul(1 + this.count * 0.1));
        };
        PlayerAmmo.prototype.draw = function() {
          return d.rgb(0x33, 0xcc, 0x66).alpha(0.5).lineWidth(0.005).quads(Geo.rect(true).rotate(this.count / 10).scale(this.size.arize(2)).translate(this.p)).stroke();
        };
        return PlayerAmmo;
      })();
      EnemyAmmo = (function() {
        __extends(EnemyAmmo, Ammo);
        EnemyAmmo.prototype.size = 0.015;
        function EnemyAmmo() {
          var buzzed, _ref;
          _ref = $A(arguments), this.p = _ref[0], this.sp = _ref[1], this.hue = _ref[2];
          buzzed = false;
        }
        EnemyAmmo.prototype.act = function() {
          return this.p = this.p.add(this.sp);
        };
        EnemyAmmo.prototype.draw = function() {
          return d.hsv(this.hue, 0.7, (this.buzzed ? 0.5 : 0.8)).alpha(0.8).lineWidth(0.01).quads(Geo.rect(true).scale(this.size.arize(2)).translate(this.p)).stroke();
        };
        return EnemyAmmo;
      })();
      Bit = (function() {
        Bit.prototype.vissize = 0.015;
        Bit.prototype.size = 0.045;
        Bit.prototype.dist = 0.06;
        function Bit(player, p, d) {
          this.player = player;
          this.p = p.clone();
          this.d = d;
          this.reserved = 0;
          this.bound = true;
        }
        Bit.prototype.act = function() {
          var _p, _ref;
          (_ref = this.count) != null ? _ref : this.count = 0;
          this.count++;
          if (this.bound) {
            _p = [0, this.dist].rotate((this.count / 6) + this.d.toRadian()).add(this.player.p);
          } else {
            _p = this.p;
          }
          this.p = this.p.add(_p).mul(0.5);
          if (this.reserved !== 0) {
            ammos.push(new PlayerAmmo(this.p, [Math.sin(this.count / 6) * 0.003, -0.02]));
            return this.reserved--;
          }
        };
        Bit.prototype.launch = function() {
          this.player.launch();
          return this.reserved += 1;
        };
        Bit.prototype.bindToggle = function() {
          return this.bound ^= true;
        };
        Bit.prototype.draw = function() {
          return d.quads(Geo.rect(true).rotate(this.count / 10).scale(this.vissize.arize(2)).translate(this.p)).blend("source-over").alpha(0.35).lineWidth(0.008).rgb(0x33, 0x66, 0x99).stroke();
        };
        return Bit;
      })();
      Player = (function() {
        Player.prototype.size = 0.01;
        Player.prototype.sieldsize = 0.04;
        Player.prototype.accell = 0.01;
        function Player(p) {
          this.p = p;
        }
        Player.prototype.move = function(sp) {
          this.p = this.p.add(sp.mul(this.accell));
          this.p[0] = (function(x) {
            if (x < Screen.left) {
              return Screen.left;
            } else if (x > Screen.right) {
              return Screen.right;
            } else {
              return x;
            }
          })(this.p[0]);
          return this.p[1] = (function(x) {
            if (x < Screen.top) {
              return Screen.top;
            } else if (x > Screen.bottom) {
              return Screen.bottom;
            } else {
              return x;
            }
          })(this.p[1]);
        };
        Player.prototype.launch = function() {
          var _ref;
          (_ref = this.reserved) != null ? _ref : this.reserved = 0;
          this.reserved++;
          return ammos.push(new PlayerAmmo(this.p, [0, -0.01]));
        };
        Player.prototype.kill = function() {
          return this.killed = true;
        };
        Player.prototype.act = function() {
          var _ref;
          (_ref = this.count) != null ? _ref : this.count = 0;
          this.count++;
          if (this.count % 4 === 0) {
            ammos.push(new PlayerAmmo(this.p, [0, -0.01]));
          }
          if (this.reserved > 0) {
            ammos.push(new PlayerAmmo(this.p, [0, -0.01]));
            this.reserved--;
          }
          return this;
        };
        Player.prototype.draw = function() {
          return d.quads(Geo.rect(true).rotate(this.count / 10).scale(this.sieldsize.arize(2)).translate(this.p)).blend("source-over").alpha(0.3).rgb(0xaa, 0xff, 0xff).fill().alpha(0.9).rgb(0x77, 0x77, 0xcc).stroke().alpha(0.9).rgb(0xff, 0x99, 0x99).quads(Geo.rect(true).scale(this.size.arize(2)).translate(this.p)).fill();
        };
        return Player;
      })();
      player = new Player([0.5, 0.8]);
      bits = [0, 1, 2].map(function(x) {
        return new Bit(player, player.p, x / 3);
      });
      ammos = [];
      enemies = [];
      score = new Score();
      return (function(c, lv) {
        var collisionTest, rand, _i, _results;
        if (lv == null) {
          lv = 0;
        }
        if (c % (150 - lv) === 0) {
          if (enemies.length === 0) {
            score.add(lv * 3);
          }
          (3 + ~~(lv / 4)).times(function(x) {
            return enemies.push(new Enemy([$R(Screen.left, Screen.right).randf(), $R(0.03, 0.1).randf()]));
          });
          lv++;
        }
        d.blend("copy").alpha(1).rgb(0xea, 0xe9, 0xff).fillBack();
        rand = random();
        (function() {
          _results = [];
          for (_i = 0; _i <= 100; _i++){ _results.push(_i); }
          return _results;
        }).apply(this, arguments).each(function(x) {
          var p, s;
          p = [(x % 10 * Screen.width) * 0.1 + Screen.left, rand() * 2.5 - 0.25];
          s = (~(x * x / 1000.0) / 100) + 0.1;
          s = x / 800 + 0.02;
          p[1] += c / 10 * s + 0.15;
          p[1] %= 2.0;
          p[1] -= 0.5;
          return d.quads(Geo.rect(true).scale(s.arize(2)).translate(p)).blend("source-over").alpha(0.15).rgb(0xaa, 0xaa, 0xff).fill().lineWidth(0.01).stroke();
        });
        if (keys[37]) {
          player.move([-1, 0]);
        }
        if (keys[38]) {
          player.move([0, -1]);
        }
        if (keys[39]) {
          player.move([1, 0]);
        }
        if (keys[40]) {
          player.move([0, 1]);
        }
        if (keys[32]) {
          bits.each(function(x) {
            return x.bindToggle();
          });
        }
        keys[32] = false;
        enemies = enemies.select(function(x) {
          return x.alive();
        });
        [player, enemies, bits].shallowFlatten().each(function(x) {
          return x.act();
        });
        collisionTest = function(lhs, rhs) {
          return lhs.p.distance(rhs.p) < lhs.size + rhs.size;
        };
        ammos = ammos.flatten().select(function(ammo) {
          var enemy;
          ammo.act();
          if (!ammo.valid()) {
            return false;
          } else if (ammo instanceof EnemyAmmo) {
            bits.each(function(bit) {
              if (collisionTest(ammo, bit)) {
                if (!ammo.buzzed) {
                  bit.launch();
                }
                if (!ammo.buzzed) {
                  score.add(1);
                }
                return ammo.buzzed = true;
              }
            });
            if (collisionTest(ammo, player)) {
              player.kill();
            }
            return true;
          } else if (ammo instanceof PlayerAmmo) {
            enemy = enemies.find(function(enemy) {
              return collisionTest(ammo, enemy);
            });
            if (enemy != null) {
              enemy.damage();
            }
            return !enemy;
          }
        }).map(function(ammo) {
          ammo.draw();
          return ammo;
        });
        [player, enemies, bits].shallowFlatten().each(function(x) {
          return x.draw();
        });
        d.alpha(0.8).rgb(0xbb, 0xcc, 0xff).quads(Geo.rect(false).scale([Screen.left, Screen.height])).fill().quads(Geo.rect(false).scale([Screen.left, Screen.height]).translate([Screen.right, Screen.top])).fill();
        score.act();
        score.draw();
        if (!player.killed) {
          return window.setTimeout(arguments.callee.curry(c + 1, lv), 33);
        } else {
          if (confirm("Game is over. (Score " + score.score + ")\nContinue?")) {
            return main();
          }
        }
      })(0);
    });
    return main();
  };
}).call(this);

