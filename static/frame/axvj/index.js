window.onload = function() {

  var d = new DCore();

  // hh:mm:ss
  var hh_mm_ss = function(date) {
    // 先頭ゼロ埋め
    var foo = function(s) { return ("0" + s).substr(-2, 2); };
    var ret = foo(date.getHours()) + ":" + foo(date.getMinutes()) + ":" + foo(date.getSeconds());
    return ret;
  };

  // 文字の形状を形成/管理する
  function Letter(content) {

    // 大きさ
    var s = 0.05;

    // 背景塗って、指定の文字を描画
    d
     .rgb(0x00, 0x00, 0x00)
     .rect([0.0, 0.0], [s, s])
     .fill()
     .font("monospace", s)
     .rgb(0xff, 0xff, 0xff)
     .fillText(content, [0, 0])
    ;

    // ピクセルデータの取得
    var img = d.getImageData([0, 0], [s, s]);
    var mm = [];

    // 描画した文字を解析
    var m = $R(0, img.width, true).map(function(y) {
      return $R(0, img.height, true).map(function(x) {
        var r = img.at([x / img.width, y / img.height])[0];
        if(r > 0x80) mm.push([x / img.width, 1 - y / img.height]);
        return r > 0x80;
      });
    });

    // 形状データ(該当座標か否かを格納する)
    this.m = m;

    // 形状データ(該当座標を格納する)
    this.mm = mm;
  }

  // 文字を作成
  var letters = {};
  "0123456789:".split("").each(function(e) {
    letters[e] = new Letter(e);
  });


  // 粒子
  function Particle(p) {
    this.p = p;
    this.s = 0.05;
    this.hue = 0.6;
    this.assigned = false;
  }
  Particle.prototype = {
    act: function() {
    },
    // アニメーション用の関数を更新
    updateAnimator: function(a) {
      this.animator = a;
    },
    // アニメーション用の関数を適用
    move: function(t) {
      if(this.animator) this.p = this.animator(t);
    },
    draw: function() {
      if(Camera.p.distance(this.p) < 1.5) return;
      var s = this.s;
      var h = this.hue;
      d
        .blend("lighter")
        .alpha(1.0)
        .luminous(this.p, s / 4, s, [
          [0.1,   [h, 0.2, 1.0].hsv()],
          [0.6,   [h, 0.4, 0.3].hsv()],
          [0.7,   [h, 0.2, 0.2].hsv()],
          [1.0,   [h, 0.0, 0.0].hsv()],
        ])
        .fill()
      ;
    }
  };


  // カメラ
  Camera = {
    updateAnimator: function(pa, ua) {
      this.pAnimator = pa;
      this.uAnimator = ua;
    },
    move: function(t) {
      if(this.pAnimator) this.p = this.pAnimator(t);
      if(this.uAnimator) this.u = this.uAnimator(t);
    },
    act: function() {
      d
       .gazeFrom(Camera.p, Camera.g, Camera.u);
    },
  };
  Camera.p = [0, 0, -4];
  Camera.u = [0, 1,  0];


  // 初期パーティクルを生成
  var particles = $R(0, 180).map(function(e) {
    var r = 2;
    var rr = function(){return $R(-r, r).randf();};
    return new Particle([rr(), rr(), rr()]);
  });


  // べじェ・・・
  var bezier = function(p1, p2, p3, p4) {
    return function(t) {
      var u = 1 - t;
      return p1.mul(u * u * u)
        .add(p2.mul(u * u * t * 3))
         .add(p3.mul(u * t * t * 3))
          .add(p4.mul(t * t * t));
    };
  };

  // 前回ループ時の秒を保持
  var olds = new Date().getSeconds();
  (function(c) {

    // 時刻取得
    var date = new Date();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    var ms = date.getMilliseconds();


    // 秒が変わった瞬間
    if(s != olds) {

      // 回転角度を設定
      var rad1 = $R(-0.25, 0.25).randf().toRadian();
      var rad2 = $R(-0.25, 0.25).randf().toRadian();
      var rad3 = $R(-0.2, 0.2).randf().toRadian();

      // カメラがこれから向く方向を設定(ポジション、頭の向き)
      var p = [0, 0, -4].rotatex(rad1).rotatey(rad2);
      var u = [0, 1, 0].rotatea(rad3, p.normalize());

      // 目的と、現在地との中間地点の座標を算出
      var pcenter = p.add(Camera.p).mul(0.5);
      var ucenter = u.add(Camera.u).mul(0.5);

      // 三次元乱数生成関数
      var rp = function(r){return $R(r, r).randf();}.curry(0.1);
      var ru = function(r){return $R(r, r).randf();}.curry(0.3);

      // アニメーション関数を適用
      Camera.updateAnimator(
         bezier(Camera.p.clone(), pcenter.add([rp(), rp(), rp()]), pcenter.add([rp(), rp(), rp()]), p.clone()),
         bezier(Camera.u.clone(), ucenter.add([ru(), ru(), ru()]), ucenter.add([ru(), ru(), ru()]), u.clone())
      );

      // (カメラの注視点)からカメラに対してのベクトル
      var hoge = p.normalize(1);

      // パーティクル
      var pp = particles.clone();

      // hh:mm:ssに変換後の文字形状を取得する
      var a = hh_mm_ss(date).split("");
      a = a.zipWithIndex(function(e, i) {
        return letters[e].mm.translate([0.25 * i - 1.0, 0]);
      }).shallowFlatten();

      // 文字盤にパーティクルを割り当てる
      // 準備
      var rr = function(r){return $R(-r, r).randf();}.curry(0.5);
      var r3 = [rr(), rr(), rr()];

      // ここから割り当て
      a.each(function(e) {
        // z = 凹み具合
        var z = $R(-0.5, 0.5).randf();
        var k = 0.3 * (z + 4);
        var p = [e[0] * k, (e[1] - 0.5) * k, z].rotatex(rad1).rotatey(rad2);
        p = p.rotatea(rad3, hoge);
        var par = pp.pop();
        var p2 = par.p.add(r3).add([rr(), rr(), rr()].mul(1.0));
        var p3 = p2.add([rr(), rr(), rr()].mul(1.0));
        par.updateAnimator(bezier(par.p, p2, p3, p));
        par.assigned = true;
      });

      // 余ったパーティションをばらまく
      pp.select(
        function(e) { return e.assigned; }
      ).each(function(e) {
        var rr2 = function(r){return $R(-r, r).randf();}.curry(2.5);
        var p4 = [rr2(), rr2(), rr2()];
        var rr = function(r){return $R(-r, r).randf();}.curry(0.3);
        e.updateAnimator(bezier(e.p, e.p.add([rr(), rr(), rr()]), p4.add([rr(), rr(), rr()]), p4));
        e.assigned = false;
      });

      // 色変え
      if(s === 0) {
        particles.each(function(e) {
          e.hue = (m / 6) % 1;
        });
      }
      
    }
    
       
    // 背景を初期化
    d
     .blend("source-over")
     .alpha(1.0)
    .rgb((olds !== s && s === 0) ? [0x66, 0x66, 0x66] : [0x00, 0x00, 0x00])
     .fillBack();


    // アニメーションメモ
    //   100ms 200ms 300ms 400ms 500ms 600ms 700ms 800ms 900ms
    //   ←パーティクル     →
    //                           ←カメラ              →
    //

    // カメラ
    if(ms < 500) {}
    else if(500 < ms && ms < 900) Camera.move((ms - 500) / 400);
    else Camera.move(1);
    Camera.act(1);

    // パーティクル
    if(ms < 400) particles.invoke("move", ms / 400);
    else particles.invoke("move", 1);
    particles.invoke("act");
    particles.invoke("draw");


    // 右下のプレビュー部分を描く
    //
    d
      .save()
      .translate([0.35, 0.35])
      .quads(Geo.rect().translate([0.4, 0.4]), true)
      .clip()
      .save()
    ;

    // プレビュー用に座標系を変更
    d
     .blend("source-over")
     .alpha(1.0)
     .rgb(0x00, 0x00, 0x00)
     .fillBack()
     .rgb(0xff, 0xff, 0xff)
     .quads(Geo.rect().translate([0.4021, 0.402]))
     .stroke()
     .gazeFrom([10, 10, 10], [0, 0, 0], [0, 1, 0])
    ;

    // パーティクル描く
    particles.invoke("draw");

    d
      .restore()
      .restore()
    ;
    
    // 対比する
    olds = s;
    window.setTimeout(arguments.callee.curry(c+1), 16);
  })(0);

};

// vim:sw=2:ts=2
