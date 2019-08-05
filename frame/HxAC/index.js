//
// ＊参考
//
// ABA Games > fukuro - 袋叩きの行動モデル 
//   http://www.asahi-net.or.jp/~cs8k-cyu/piece/fukuro.html
// 
//


window.onload = function() {
  var d = new DCore();

  // 優先順位付、アクタークラス
  Actors = {
    init: function() {
      this.acts = [];
    },
    invoke: function() {
      this.acts.sortBy(
        function(a){return a[0];}
      ).each(
        function(a){a[1]();}
      );
      this.acts = [];
    },
    registor: function(priority, act) {
      this.acts.push([priority, act]);
    }
  }
  Actors.init();

  // 鳥などマネージャクラス
  function God() {
    this.birds = $R(0, 16).map(function(e) {
      var bird = new Bird(e);
      bird.pos = [$R(-10, 10).rand(), $R(-20, 0).rand(), $R(-10, 10).rand()];
      bird.rotatez($R(0, 100).randf());
      bird.rotatex($R(0, 100).randf());
      return bird;
    });

    this.stars = $R(0, 127).map(function(e) {
      return new Star();
    });
  }
  God.prototype = {
    act: function() {
      this.birds.invoke("act");
      this.stars.invoke("act");
    },
    draw: function() {
      this.birds.invoke("draw", true);
      this.birds.invoke("draw", false);
      this.stars.invoke("draw");
    }
  }

  // とり
  function Bird(sid) {
    // 座標
    this.pos = [0.1, 0, 0];
    // 速度
    this.speed = [0, 0, 0];

    // 姿勢制御用位置ベクトル (前、横、上)
    this.eye = [0, 0, 1];
    this.arm = [1, 0, 0];
    this.head = [0, 1, 0];

    // サイズ
    this.size = 1;

    // 回転モーメント x, y, z
    this.mx = 0;
    this.my = 0;
    this.mz = 0;

    // アニメーションカウンタ
    this.wc = 0;
    this.cc = 0;

    // 色
    this.hsv = [$R(0, 1).randf(), $R(0.5, 0.8).randf(), $R(0.7, 0.8).randf()];

    // シリアルID
    this.sid = sid;

    // 可視範囲
    this.visibleDist = $R(10, 20).randf();
    this.init();
  }
  Bird.prototype = {
    init: function() {
    },
    act: function() {
      var self = this;

      var birds = god.birds;
      // 視野範囲
      var visibleDist = self.visibleDist;
      
      // 進みたい進行方向へベクトル
      var intension = [0, 0, 0];

      // 一番近い鳥を探す(自分自身はのぞく)
      var nearestBird = birds.sortBy(function(that) {
        var square = self.pos.sub(that.pos).square();
        if(self.sid === that.sid) return 10000;
        else return square;
      }).first();

      // 範囲内の鳥を求める
      // (自分自身は除く→一定距離以上は除く→視野角270度くらいに収まってなければのぞく)
      var visibleBirds = birds.select(function(that) {
        var square = self.pos.sub(that.pos).square();
        if(self.sid === that.sid) return false;
        if(square >= visibleDist * visibleDist) return false;
        if(self.eye.dot(that.pos.sub(self.pos) < -0.7)) return false;
        return true;
      });

      // 引き離し(理想距離内より近ければ逆方向、遠ければ近くへ)
      // 実際距離
      var realDist = self.pos.sub(nearestBird.pos).abs();
      // 理想距離
      var idealDist = 4;
      if(realDist < idealDist * 2) {
        var intension1 = (realDist - idealDist) / idealDist * 1;
        // 加算する > 目標方向へのベクトル(一番近い鳥 - 自分自身) * 係数
        intension = intension.add(nearestBird.pos.sub(self.pos).mul(intension1));
      }

      // 整列
      if(visibleBirds.length) {
        // 可視範囲のBoidの向き(平均値)を算出
        var intension2 = visibleBirds.inject([0, 0, 0], function(i, e) {
          return i.add(e.eye);
        }).normalize();
        intension = intension.add(intension2.mul(1.5));
      }

      // 結合
      if(visibleBirds.length) {
        // 可視範囲の中心座標を算出
        var center = visibleBirds.inject([0, 0, 0], function(i, e) {
          return i.add(e.pos);
        }).mul(visibleBirds.length);
        var intension3 = center.sub(self.pos).normalize();
        intension = intension.add(intension3.mul(0.8));
      }



      // 変数を
      var eye = this.eye;
      var head = this.head;
      var arm = this.arm;
      var pos = this.pos;

      // 目標座標へのベクトル(
      var vi = [0, 0, 0];
      var vi = target.pos.sub(this.pos).mul(0.03);
      var vi = vi.add(intension.normalize(2)).normalize();

      // 各内積
      var dtEye = eye.dot(vi);
      var dtHead = head.dot(vi);
      var dtArm = arm.dot(vi);

      // 制御用の回転モーメント力
      var vr = 0.10;

      // 変数とか
      var mx = this.mx;
      var my = this.mx;
      var mz = this.mz;

      // 姿勢制御開始

      // だいたい前方
      if(dtEye > 0) {

        // だいたい前まっすぐ
        if(dtEye > 0.95) {
          // 姿勢制御なし

        } else {
          // 姿勢制御

          // ヨコ方向にあり
          if(dtArm.abs() > 0.5) {
            my += dtArm * vr;
          // 垂直方向にあり
          } else if(dtHead.abs() < 0.5) {
            mx += -dtHead * vr;
          } else {
            mz += -dtHead * vr;
          }
        }
      } else {
        if(dtArm.abs() > 0.5) {
          my += dtArm * vr;
        } else if(dtHead.abs() > 0.5) {
          mx -= dtHead * vr;
        } else {
          if(dtEye.abs() > 0.5) {
            mx -= vr;
          } else if(dtHead < 0) {
            mz += dtHead * vr;
          }
        }
      }


      // メンバ変数へ戻す
      this.mx = mx;
      this.my = my;
      this.mz = mz;

      // 回転モーメント計算
      this.rotatez(mz);
      this.rotatex(mx);
      this.rotatey(my);

      // 回転モーメントの減退
      this.mx *= 0.6;
      this.my *= 0.6;
      this.mz *= 0.6;

      // 行きたい方向へ近い向きを向いているほど激しく羽ばたくように計算する
      this.wc += dtEye * 0.25 + 0.45;
      this.wc *= 0.5;
      this.cc += this.wc;

      // 速度計算
      this.speed = this.speed.add(this.eye.mul(0.05));
      this.speed = this.speed.mul(0.75);


      // 距離計算
      this.pos = this.pos.add(this.speed);

      // 地面にあたったら上へワープ
      if(this.pos[1] < 0) {
        this.pos = this.pos.add([0, 60, 0]);
      }
    },
    draw: function(shadow) {
      var self = this;

      var size = this.size;

      var model = [];

      var ah = -Math.sin(this.cc) * 0.5 * size;

      model.push([
        this.eye.mul(size)
      , this.eye.mul(size*0.3)
      , this.arm.mul(size*0.5).add(this.head.mul(size*0.2)).add(this.head.mul(ah))
      ]);
      model.push([
        this.eye.mul(size)
      , this.eye.mul(size*0.3)
      , this.arm.mul(-size*0.5).add(this.head.mul(size*0.2)).add(this.head.mul(ah))
      ]);

      if(shadow) {
        model.each(function(e) {
          e = e.translate(self.pos).scale([1, 0, 1]);
          var ee = d.toWorld2dParallel(e, true);
          if(!ee) return;
          var orz = ee.inject(0, function(i, e) { return i + e[2]; }) / 3;

          Actors.registor(-orz, function() {
            d
             .alpha(0.25)
             .rgb(0x66, 0x66, 0x66)
             .quads(e)
             .fill()
            ;
          });
        });
      } else {
        model.each(function(e) {
          e = e.translate(self.pos);
          var ee = d.toWorld2dParallel(e, true);
          if(!ee) return;
          var orz = ee.inject(0, function(i, e) { return i + e[2]; }) / 3;

          Actors.registor(-orz, function() {
            d
             .alpha(0.7)
             .hsv(self.hsv)
             .quads(e)
             .fill()
            ;
          })
        });
      }

      return this;
    },
    rotatey: function(t) {
      var self = this;
      this.arm = this.arm.rotatea(t, self.head).normalize();
      this.eye = this.eye.rotatea(t, self.head).normalize();
      this.head = this.eye.cross(self.arm).normalize();
    },
    rotatex: function(t) {
      var self = this;
      this.eye = this.eye.rotatea(t, self.arm).normalize();
      this.head = this.head.rotatea(t, self.arm).normalize();
      this.arm = this.head.cross(self.eye).normalize();
    },
    rotatez: function(t) {
      var self = this;
      this.arm = this.arm.rotatea(t, self.eye).normalize();
      this.head = this.head.rotatea(t, self.eye).normalize();
      this.eye = this.arm.cross(self.head).normalize();
    },
  }


  function Target() {
    this.pos = [0, 10, 0];
  }


  function Star() {
    this.init();
  }
  Star.prototype = {
    init: function() {
      var self = this;
      this.fixedModel = (function() {
        var model = Star.prototype.model;
        var size = $R(200, 600).randf();
        model = model.scale([size, size, size]);
        model = model.invoke("rotatex", $R(0, 100).randf());
        model = model.translate([40000, size * $R(50, 75).randf() / 100, 0]);
        if($R(0, 1).rand()) {
          self.rz = $R(0, (1 / 2)).randf() * $R(0, (1 / 2)).randf() + 0.03;
        } else {
          self.rz = 0;
        }
        model = model.invoke("rotatez", self.rz.toRadian());
        model = model.invoke("rotatey", $R(0, 100).randf());
        return model;
      })();

      this.hsv = [
        $R(0.5, 0.8).randf(),
        $R(0.15, 0.2).randf(),
        $R(0.85, 0.9).randf()
      ];
      return this;
    },
    model: (function() {
      return $R(0, 5, true).map(function(x) {
        return [0, 0, 1].rotatex((x * 2 / 5).toRadian());
      });
    })(),
    act: function() {
      this.count++;
    },
    draw: function() {
      var self = this;
      Actors.registor(-10000, function() {
        d
         .alpha(0.9)
         .hsv(self.hsv)
         .quads(self.fixedModel)
         .fill()
        ;

        if(self.rz < 0.03) {
          d
           .alpha(0.3)
           .hsv(self.hsv)
           .quads(self.fixedModel.scale([1, -1, 1]))
           .fill()
          ;
        }
      });
    }
  }


  var god = new God();
  var target = new Target();
  target.pos = [$R(-20, 20).rand(), $R(-20, 20).rand(), $R(-20, 20).rand()];

  // メイン部
  (function() {

    // 各種ハンドラ設定
    var px, py;
    var lbdown = false;
    var wdelta = 0;
    window.addEventListener("mousemove", function(e) {
      px = e.clientX / d.width - d.left2d;
      py = e.clientY / d.height - d.top2d;
    }, false);
    window.addEventListener("mousedown", function(e) {
      lbdown = true;
    }, false);
    window.addEventListener("mouseup", function(e) {
      lbdown = false;
    }, false);
    window.addEventListener("mousewheel", function(e) {
      if(e.wheelDelta) {
        wdelta = -e.wheelDelta / 120;
      }
      if(e.preventDefault) e.preventDefault();
      e.returnValue = false;
    }, false);
    window.addEventListener("keydown", function(e) {
      if(e.keyCode === 32) {
        camera.changeMode();
        if(e.preventDefault) e.preventDefault();
        e.returnValue = false;
      }
      if(e.keyCode === 13) {
        camera.target = god.birds[$R(0, god.birds.length - 1).rand()];
        if(e.preventDefault) e.preventDefault();
        e.returnValue = false;
      }
    }, false);
      

    function Camera() {
      this.crad = 0.5;
      this.crad2 = 0.5;
      this.cz = 15.0;
      this.mode = 0;
      this.pos = [10, 100, 10];
    }
    Camera.prototype = {
      act: function() {
        if(wdelta) {
          this.cz += wdelta * 2;
        }
        this.cameraWorks[this.mode].call(this);
      },
      cameraWorks: [
        // 追尾
        function() {
          var idealDist = this.cz;
          var realDist = this.pos.sub(this.target.pos).abs();
          if(realDist > idealDist) {
            var t = this.target.pos.sub(this.pos).mul(1 - idealDist / realDist);
            this.pos = this.pos.add(t);
          }
          d.gazeFrom(
            this.pos,
            this.target.pos,
            [0, 1, 0]
          );
        },
        // ぐるぐる
        function() {
          if(lbdown) {
            this.crad  = px.toRadian();
            this.crad2 = (py / 2 + 0.25).toRadian();
            this.crad -= 0.01;
          } else {
            this.crad += 0.007;
            this.crad2 += 0.005;
          }

          this.pos = [this.cz, Math.sin(this.crad2) * 40 + 40, 0].rotatey(this.crad);
          this.head = this.target.pos.sub(this.pos).normalize().cross([this.cz, 0, 0]);

          d.gazeFrom(
            this.pos,
            [0, 40, 0],
            [0, 1, 0]
          );
        },
      ],
      changeMode: function() {
        this.mode += 1;
        this.mode %= this.cameraWorks.length;
      }
    }
    var camera = new Camera();
    camera.target = god.birds[0];


    window.setInterval(function() {


      camera.act();

      // 背景
      d
       .blend("source-over")
       .alpha(1.0)
       .rgb(0xee, 0xef, 0xf4)
       .fillBack()
      ;

      god.act();
      god.draw();
      Actors.invoke();

      if($R(0, 200).rand() === 0) {
        target.pos = [$R(-20, 20).rand(), $R(10, 30).rand(), $R(-20, 20).rand()];
      }

      wdelta = 0;

    }, 33);
  })();

};
// vim:sw=2:ts=2

