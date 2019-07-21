window.onload = function() {

  var d = new DCore();
  var color1 = [0xff, 0xff, 0xff];
  var color2 = [0x00, 0x00, 0x00];


  function Water() {
    this.points = $R(0, 40).map(function(x) {
      return {
        pos:[x / 40, 0.5],
        speed:[0, 0]
      };
    });
  }
  Water.prototype = {
    act: function() {

      var points = this.points;
      var savedPoints = points.clone();

      for(var i = 0, l = points.length; i < l; i++) {
        var self = points[i];
        if(i !== 0) {
          var left = savedPoints[i - 1];
        }
        if(i !== l - 1) {
          var right = savedPoints[i + 1];
        }
        if(left) {
          self.speed[1] += (left.pos[1] - self.pos[1]) * 0.05;
        }
        if(right) {
          self.speed[1] += (right.pos[1] - self.pos[1]) * 0.05;
        }
        self.speed[1] += (0.5 - self.pos[1]) * 0.06;
        self.speed[1] *= 0.95;
        self.pos[1] += self.speed[1];
      }

      this.ps = this.points.map(function(x){ return x.pos; });
    },
    draw: function() {
      var ps = this.ps;
      ps.push([1, 1], [0, 1]);
      d
        .rgb(color2)
        .quads(
          ps
        )
        .fill()
      ;
    },
    isInBound: function(p) {
      var ps = this.ps;
      var offx = ~~(p[0] * (ps.length - 2));
      if(offx >= ps.length - 2) offx = ps.length - 2;
      if(offx <= 0) offx = 0;
      var h = ps[offx  ][1]
            + ps[offx+1][1] * (ps[offx][0] - p[0]);
      return p[1] < h;
    },
    shock: function(p, power) {
      var ps = this.ps;
      var offx = ~~(p[0] * (ps.length - 2));
      if(offx >= ps.length - 2) offx = ps.length - 2;
      if(offx <= 0) offx = 0;
      this.points[offx].pos[1] += (p[0] - ps[offx][0]) * ps.length * power;
      this.points[offx].pos[1] +=-(p[0] - ps[offx+1][0]) * ps.length * power;
    }
  };


  function Fish(sid) {
    this.pos = [$R(0.0, 1.0).randf(), $R(0.1, 0.4).randf()];
    this.speed = [$R(-0.01, 0.01).randf(), $R(0.01, -0.03).randf()];
    this.visibleDist = $R(0.0, 0.15).randf();
    this.sid = sid;
    this.power = $R(0.01, 0.01).randf();

    this.opos = new Array(5).fill([]);
    this.count = 0;

    this.inWater = false;
  }
  Fish.prototype = {
    act: function() {
      var self = this;
      var fishes = god.fishes;
      var visibleDist = this.visibleDist;
      var direction = this.speed.normalize();
      var intension = this.speed.mul(0.00000001);
      
      // 一番近い魚を探す
      var nearestFish = fishes.sortBy(function(that) {
        var square = self.pos.sub(that.pos).square();
        if(self.sid === that.sid) return 10000;
        else return square;
      }).first();

      // 範囲内の魚を求める
      var visibleFishes = fishes.select(function(that) {
        var square = self.pos.sub(that.pos).square();
        if(self.sid === that.sid) return false;
        if(square >= visibleDist * visibleDist) return false;
        if(self.speed.dot(that.pos.sub(self.pos) < -0.5)) return false;
        return true;
      });

      // 引き離し
      var realDist = self.pos.sub(nearestFish.pos).abs();
      // 理想距離
      var idealDist = 0.1;
      if(realDist < idealDist * 2) {
        var intension1 = (realDist - idealDist) / idealDist * 1.0;
        intension = intension.add(nearestFish.pos.sub(self.pos)).mul(intension1);
      }

      // 整列
      if(visibleFishes.length) {
        // 可視範囲の魚の向きを算出
        var intension2 = visibleFishes.inject([0, 0], function(i, e) {
          return i.add(e.speed.normalize());
        }).normalize();
        intension = intension.add(intension2.mul(0.003));
      }

      // 結合
      if(visibleFishes.length) {
        // 可視範囲の中心座標を算出
        var center = visibleFishes.inject([0, 0], function(i, e) {
          return i.add(e.pos);
        }).mul(1 / visibleFishes.length);
        var intension3 = center.sub(self.pos).normalize();
        intension = intension.add(intension3.mul(0.015));
      }

      this.power += 0.0008;


      // 速度制御
      var oldInWater = this.inWater;
      this.inWater = water.isInBound(this.pos);

      // マウスを避ける
      if(!this.inWater && [px, py].sub(self.pos).abs() < 0.1) {
        intension = self.pos.sub([px, py]);
        this.power += 0.01;
      }

      if(this.inWater) {
        // 水中の時
        this.speed = this.speed.add([0, 0.003]);
        this.power *= 0.99;
      } else {
        intension = intension.rotate((Math.sin(self.count / 1.5) / 16).toRadian());
        this.speed = this.speed.add(intension.normalize(0.005));
        this.speed = this.speed.normalize(this.power);
        this.power *= 0.90;
      }
      if(oldInWater != this.inWater) {
        water.shock(this.pos, this.speed.dot([0, 1.3]));
      }

      // 壁判定
      this.pos = this.pos.add(this.speed);
      if(!(0.0 <= this.pos[0] && this.pos[0] <= 1.0)) {
        this.speed[0] = -this.speed[0];
        this.pos[0] = [0, this.pos[0], 1].sort()[1];
      }
      if(!(0.0 <= this.pos[1] && this.pos[1] <= 1.0)) {
        this.speed[1] = -this.speed[1];
        this.pos[1] = [0, this.pos[1], 1].sort()[1];
      }

      // 履歴へプッシュ
      this.opos.push(this.pos);
      this.opos.shift();

      this.count++;
    },
    draw: function() {

      d
       .rgb(water.isInBound(this.pos) ? color2 : color1)
       .quads(this.opos)
       .fill()
       .stroke()
      ;
    }
  };

  function God() {
    this.fishes = $R(0, 16).map(function(x) {
      var fish = new Fish(x);
      return fish;
    });
  }
  God.prototype = {
    act: function() {
      this.fishes.invoke("act");
    },
    draw: function() {
      this.fishes.invoke("draw");
    }
  };
  var god = new God();


  var water = new Water();

  (1).times(function() {
    water.act();
    god.act();
  });


  var px, py;
  (function() {
    window.addEventListener("mousemove", function(e) {
      px = e.clientX / d.width - d.left2d;
      py = e.clientY / d.height - d.top2d;
    }, false);
    god.act();

    window.setInterval(function() {
      d
       .rgb(color1)
       .fillBack()
      ;

      water.act();
      god.act();

      water.draw();
      god.draw();
    }, 33);
  })();

};
// vim:sw=2:ts=2

