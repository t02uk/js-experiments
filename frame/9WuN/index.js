// forked from t02uk's "地アナ化" http://jsdo.it/t02uk/jpBN

window.onload = (function() {

  jQuery.noConflict();
  var $j = jQuery;

  // 動画読み込み
  var media = $j("<video>")
    .attr("src", "http://dl.dropbox.com/u/3589634/resource/movie/Phonogram%20AEmix.mp4")
    .attr("autoplay", true)
    .hide();

  var vw = 480;
  var vh = 270;
  var ratio = vh / vw;
  var canplay = false;
  media[0].addEventListener("canplay", function(e) {
    canplay = true;
  });
  $j("#outer").append(media);
  media[0].width = vw;
  media[0].height = vh;

  // canvas設定
//  var cw = 300;
//  var ch = 300 * ratio;
//  $j("#world")
//    .attr("width", cw)
//    .attr("height", ch)

  var d = new DCore();


  var TileCapacity = 8;
  var TileSize = 1 / TileCapacity;
  function Tile(p) {
    this.p = p;
    this.op = p.clone();
    this.xroll = 0;
    this.yroll = 0;
    this.xrollm = 0;
    this.yrollm = 0;
    this.idealSize = TileSize;
    this.size = TileSize;
    this.sid = Tile.prototype.genSid();
    this.top = 0;
  }
  Tile.prototype = {
    genSid: function() {
      if(!Tile.sid) return Tile.sid = 1;
      else return Tile.sid++;
    },
    genTop: function() {
      if(!Tile.top) return Tile.top = 1;
      else return Tile.top++;
    },
    topTo: function() {
      this.top = this.genTop();
    },
    act: function() {
      this.xroll += this.xrollm;
      this.yroll += this.yrollm;
      if(Math.cos(this.xroll) > 0.95) {
        this.xrollm *= 0.7;
      }
      if(Math.cos(this.yroll) > 0.95) {
        this.yrollm *= 0.7;
      }
    },
    roll: function(x, y) {
      this.xrollm += x;
      this.yrollm += y;
    },
    isInBound: function(p) {
      return this.p[0] - this.size / 2 < p[0] &&
        p[0] <= this.p[0] + this.size / 2 &&
        this.p[1] - this.size / 2 < p[1] &&
        p[1] <= this.p[1] + this.size / 2
      ;
    },
    draw: function() {
      d.save();
      d.translate(this.p);
      d.scale([Math.cos(this.xroll), Math.cos(this.yroll)]);
      d.scale([this.size, this.size]);
      var s = this.size;

      d
        .rgb(0x33, 0x33, 0x33)
        .drawImage(media[0],
          this.op.sub([this.idealSize / 2, this.idealSize / 2]),
          [this.idealSize, this.idealSize],
          [-0.5, -0.5],
          [1.0, 1.0]
        )
        .quads([
         [-1,  1],
         [-1, -1],
         [ 1, -1],
         [ 1,  1]
        ].scale([0.5, 0.5]))
        .stroke()
      ;

      d.restore();
    }
  };

  var tiles = $R(0, TileCapacity, true).map(function(x) {
    return $R(0, TileCapacity, true).map(function(y) {
      return new Tile([(x + 0.5) / TileCapacity, (y + 0.5) / TileCapacity]);
    });
  });


  // マウスイベント
  var px, py, opx, opy, dx, dy, lbdown, dblclick, dblcount;
  window.addEventListener("mousemove", function(e) {
    px = e.clientX / d.width - d.left2d;
    py = e.clientY / d.height - d.top2d;
    if(opx) {
      dx = opx - px;
      dy = opy - py;
    }
    opx = px;
    opy = py;
  }, false);
  window.addEventListener("mousedown", function(e) {
    lbdown = true;
  }, false);
  window.addEventListener("mouseup", function(e) {
    lbdown = false;
  }, false);
  window.addEventListener("dblclick", function(e) {
    dblclick = true;
  }, false);

  var c = 0;


  window.setInterval(function() {
    c++;

    // on loading
    if(!canplay) {
      d
       .rgb(0xff, 0xff, 0xff)
       .fillBack()
       .fill()
      ;

      d
       .font('monospace', 0.10, 'bold')
       .textAlign("left")
       .rgb(0x9f, 0x9f, 0x9f)
       .alpha(1)
       .blend("copy")
       .fillText("／｜＼―".charAt((c / 4) % 4) + " now loading", [0.1, 0.45])
       .fill()
      ;
      return;
    }
    // v else


    d
      .rgb(0x00, 0x00, 0x00)
      .fillBack()
      .fill()
    ;


    if(px) {

      // ポジションリセット
      if(dblcount >= 0) {
        tiles.flatten().each(function(tile) {
          tile.p[0] = (tile.op[0] + tile.p[0]) / 2;
          tile.p[1] = (tile.op[1] + tile.p[1]) / 2;
          tile.xroll /= 2;
          tile.yroll /= 2;
          tile.xrollm /= 2;
          tile.yrollm /= 2;
        });
      }

      // くるくる
      if(!lbdown) {

        // [0] -> active, [1], unactive
        var partitioned = tiles.flatten().partition(function(tile) {
          return tile.isInBound([px, py]);
        });

        partitioned[0].each(function(tile) {
          // unactive -> active
          if(!tile.active) {
            tile.roll(dx * 10, dy * 10);
          }
          tile.active = true;
        });

        partitioned[1].each(function(tile) {
          tile.active = false;
        });
      } else {
      // ドラッグドゥ
        tiles.flatten().select(function(tile) {
          return tile.active;
        }).each(function(tile) {
          tile.topTo();
          tile.p = tile.p.add([px, py]).mul(1 / 2);
        });
      }
    }

    // タイル動き
    tiles.flatten().sortBy(function(e){return e.top;}).map(function(tile) {
      tile.act();
      tile.draw();
    });

    // ダブルクリック制御
    if(dblclick) {
      dblcount = 10;
    }
    dblclick = false;
    dblcount--;

  }, 33);
});

