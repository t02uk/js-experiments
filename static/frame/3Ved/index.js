(function() {
  
  // 自前ライブラリ擬似3D対応
  DCore.prototype.org_toScr = DCore.prototype.toScr;
  DCore.prototype.toScr = function(p) {
    if(p.length === 3)
      return this.org_toScr([
        (p[0] - p[2]       ) * 0.40 + 0.5,
        (p[0] + p[2] + p[1]) * 0.40 + 0.4
      ]);
    else return this.org_toScr(p);
  };
  DCore.prototype.toWorld2dParallel = function(ps, f) {
    return ps;
  };
  var d = new DCore().init();
  
  // 水のつなぎ部分
  function Joint(x, y, z) {
    this.x = x || 0.0;
    this.y = y || 0.0;
    this.z = z || 0.0;
    this.sx = 0.0;
    this.sy = 0.0;
    this.sz = 0.0;
    return this;
  }
  
  // 水
  function Water() {
    return this;
  }
  Water.prototype = {
    // 格子密度
    density: 21,
    init: function() {
  
      // 格子をちりばめ、初期化
      var joints = [];
      this.joints = joints;
      for(var i = 0; i < this.density; i++) {
        joints[i] = [];
        for(var j = 0; j < this.density; j++) {
          joints[i][j] = new Joint(
            (i - 10) * 0.05,
            Math.sqrt((i - 10) * (i - 10) + (j - 10) * (j - 10)) * 0.01,
            (j - 10) * 0.05
          );
        }
      }
            
      return this;
    },
    
    act: function(clicked, px, py) {
      var joints = this.joints;
      var copied = joints.clone();
      
      // 移動速度を計算
      for(var i = 0; i < this.density; i++) {
        for(var j = 0; j < this.density; j++) {
          var self =   (copied[i    ] ? copied[i    ][j    ] : null);
          var left =   (copied[i - 1] ? copied[i - 1][j    ] : null);
          var right =  (copied[i + 1] ? copied[i + 1][j    ] : null);
          var top =    (copied[i    ] ? copied[i    ][j - 1] : null);
          var bottom = (copied[i    ] ? copied[i    ][j + 1] : null);
          
          // 前後左右との距離から、速度を計算する(距離が長いほど強く引っ張られる)
          var sides = [left, right, top, bottom];
          for(var k = 0, l = sides.length; k < l; k++) {
            var side = sides[k];
            if(!side) continue;
            
            joints[i][j].sx -= (self.x - side.x) * 0.5;
            joints[i][j].sy -= (self.y - side.y) * 0.5;
            joints[i][j].sz -= (self.z - side.z) * 0.5;
          }
          
          joints[i][j].sy -= (self.y - 0.0) * 0.03;
        }
      }
      
      // 速度を計算
      for(var i = 0; i < this.density; i++) {
        for(var j = 0; j < this.density; j++) {
          
          var self = joints[i][j];
          // 摩擦
          self.sx *= 0.995;
          self.sy *= 0.980;
          self.sz *= 0.995;
          
          // 位置計算
          self.y += self.sy;
          
          
          // 壁際
          if(i === 0 || i === this.density - 1
             || j === 0 || j === this.density- 1) {
            self.sy *= 0.997;
            continue;
          }

          self.x += self.sx;
          self.z += self.sz;
          
          // マウス座標と描画座標の差異を求め、
          // 一定未満の距離であれば重力方向のベクトルを加える(クリックされたとき)
          var p1 = d.toScr([self.x, 0.0, self.z]);
          var p2 = d.toScr([px, py]);          
          if(clicked) {
            if((p1[0] - p2[0]) * (p1[0] - p2[0]) +
              (p1[1] - p2[1]) * (p1[1] - p2[1]) < 400.0) {
                self.sy += 0.06;
            }
          }
        }
      }
      
      return this;
      
    },
    
    draw: function() {
      
      var joints = this.joints;
      var density = this.density;
      
      // 水槽部分の柱を描く
      d.blend("lighter")
       .alpha(0.03)
       .rgb(0x55, 0x55, 0x55);
      ;

      // 向かって左の柱
      var p = joints[0][density - 1];
      d.quads([
        [p.x, p.y, p.z],
        [p.x, 1.0, p.z],
        [p.x, 1.0, p.z],
        [p.x, p.y, p.z],
      ]).stroke();

      // 真ん中手前
      p = joints[density - 1][density - 1];
      d.quads([
        [p.x, p.y, p.z],
        [p.x, 1.0, p.z],
        [p.x, 1.0, p.z],
        [p.x, p.y, p.z],
      ]).stroke();

      // 向かって右
      var p = joints[density - 1][0];
      d.quads([
        [p.x, p.y, p.z],
        [p.x, 1.0, p.z],
        [p.x, 1.0, p.z],
        [p.x, p.y, p.z],
      ]).stroke();
      


      // 水面を描く
      for(var i = 1; i < this.density; i++) {
        for(var j = 1; j < this.density; j++) {
          var p1 = joints[i    ][j    ];
          var p2 = joints[i - 1][j    ];
          var p3 = joints[i - 1][j - 1];
          var p4 = joints[i    ][j - 1];
          
          // 水面と視野角の差異を算出・・・できてる？
          var dx = p3.x - p1.x;
          var dy = p3.y - p1.y;
          var dz = p3.z - p1.z;
          var dxy = Math.sqrt(dx * dx + dz * dz);
          var theta = Math.atan2(dxy, dy);
          
          // 差異を元に、てかり具合を計算
          var pl = 0.3 * Math.sin(theta - 0.7);
          
          // 距離
          var uv = d.toScr([p1.x, p1.y, p1.z]);
          
          // 奥(上)に行くほど、暗めに
          var el = 0.0008 * uv[1];
      
          d.quads([
            [p1.x, p1.y, p1.z],
            [p2.x, p2.y, p2.z],
            [p3.x, p3.y, p3.z],
            [p4.x, p4.y, p4.z]
          ])
          .rgb(0x00, 0x33, 0x66)
          .blend("source-over").alpha(0.1 + pl + el).fill()
          .alpha((0.1 + pl + el) / 2).stroke()
          ;
        }
      }
    
      // 光球を描かない
      /*
      for(var i = 0; i < this.density; i++) {
        for(var j = 0; j < this.density; j++) {
          if((i % 2) || (j % 2)) continue;
          
          var p = joints[i][j];
          d.rgb(0x33, 0x66, 0x66)
           .blend("lighter").alpha(0.08)
           .circle(
            [p.x, p.y, p.z],
            0.010
          )
//          .fill()
          .circle(
            [p.x, p.y, p.z],
            0.005
          )
//          .fill()
          ;
        }
      }
      */
 
      // 左側の手前の壁描く
      var ps = joints.map(function(e) {
        var joint = e[density - 1];
        return [joint.x,
                joint.y,
                joint.z];
      });
      d.quads(
        ps.concat(
          ps.map(function(e) {
            return [e[0], 1.0, e[2]];
          }).reverse()
        )
      )
      .rgb(0x00, 0x33, 0x66)
      .blend("source-over").alpha(0.35)
      .fill()
      ;
      
      // 右側の手前の壁を描く
      var ps = joints[density - 1].map(function(e) {
        var joint = e;
        return [joint.x,
                joint.y,
                joint.z];
      });
      d.quads(
        ps.concat(
          ps.map(function(e) {
            return [e[0], 1.0, e[2]];
          }).reverse()
        )
      )
      .rgb(0x00, 0x11, 0x22)
      .blend("source-over").alpha(0.35)
      .fill()
      ;

      
      return this;
    }
  };
  


  
  var main = function() {

    var water = new Water().init();

    
    // 各種ハンドラ設定
    var px, py;
    var lbdown = false;
    document.addEventListener("mousemove", function(e) {
      px = e.clientX / d.width - d.left2d;
      py = e.clientY / d.height - d.top2d;
    }, false);
    document.addEventListener("mousedown", function(e) {
      lbdown = true;
    }, false);
    document.addEventListener("mouseup", function(e) {
      lbdown = false;
    }, false);
    
    
    (function() {
      
      // 背景を初期化(奥ほど暗く)
      var ctx = d.ctx;
      var p1 = d.toScr([0.5, 0.0]);
      var p2 = d.toScr([0.5, 1.0]);

      var grad =ctx.createLinearGradient(
        p1[0], p1[1],
        p2[0], p2[1]
      );
      grad.addColorStop(0, "rgb(10, 10, 25)");
      grad.addColorStop(1, "rgb(20, 21, 33)");
      
      ctx.fillStyle = grad;
      
      d
        .blend("source-over")
        .alpha(1.0)
        .fillBack();
      
      // 水
      water.act(lbdown, px, py);
      water.draw();
      
      window.setTimeout(arguments.callee, 33);
    })();
  };
 
  main();
})();