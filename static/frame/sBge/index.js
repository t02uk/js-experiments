// forked from Event's "Instrument" http://jsdo.it/Event/jam_session4
/*
※お題のプログラムで使用している音源の、当イベント以外での使用を禁じます。
それ以外の音源の使用は自由ですので、他に使用した音源がありましたら、権利をご確認の上各自ご用意下さい。
なお、当イベントでは、音源のアップロード場所として、こえ部(http://koebu.com/)のご利用を推奨いたします。
* mp3 files used in the code are not allowed to use outside wonderfl.net/jsdo.it
You're free to use your own sound source for JAM, if you have rights to use it.
We recommend soundcloud.com to upload music.


* ogg files are available from

http://jsrun.it/sounds/event/jam/drop1.ogg
http://jsrun.it/sounds/event/jam/drop2.ogg
http://jsrun.it/sounds/event/jam/drop3.ogg
http://jsrun.it/sounds/event/jam/drop4.ogg
http://jsrun.it/sounds/event/jam/drop5.ogg
http://jsrun.it/sounds/event/jam/drop6.ogg
http://jsrun.it/sounds/event/jam/drop7.ogg
http://jsrun.it/sounds/event/jam/drop8.ogg
http://jsrun.it/sounds/event/jam/drop9.ogg
http://jsrun.it/sounds/event/jam/drop10.ogg

* mp3 files are available from

http://jsrun.it/sounds/event/jam/drop1.mp3
http://jsrun.it/sounds/event/jam/drop2.mp3
http://jsrun.it/sounds/event/jam/drop3.mp3
http://jsrun.it/sounds/event/jam/drop4.mp3
http://jsrun.it/sounds/event/jam/drop5.mp3
http://jsrun.it/sounds/event/jam/drop6.mp3
http://jsrun.it/sounds/event/jam/drop7.mp3
http://jsrun.it/sounds/event/jam/drop8.mp3
http://jsrun.it/sounds/event/jam/drop9.mp3
http://jsrun.it/sounds/event/jam/drop10.mp3
*/

(function() {

  // 配列 -> base64変換
  (function() {
    // 参考 http://github.com/dankogai/js-base64
    var base64Table = (function() {
      var raw = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      return $R(0, raw.length - 1).map(function(i) {
        return raw.charAt(i);
      });
    })();

    Array.prototype.toBase64 = function() {
      var bt = base64Table;
      var bin = this;
      var padlen = 0;
      while(bin.length % 3) {
        bin.push(0);
        padlen++;
      }

      var b64 = [];
      for(var i = 0, l = bin.length; i < l; i += 3) {
        var c = (bin[i + 0] << 16)
              | (bin[i + 1] <<  8)
              | (bin[i + 2] <<  0)
              ;
        b64.push(
          bt[(c >>> 18) & 63],
          bt[(c >>> 12) & 63],
          bt[(c >>>  6) & 63],
          bt[(c >>>  0) & 63]
        );
      }

      while(padlen--) b64[b64.length - padlen - 1] = '=';
      return b64.join("");
    };
    String.prototype.charCodes = function() {
      var result = new Array(this.length);
      for(var i = 0, l = this.length; i < l; i++) {
        result[i] = this.charCodeAt(i);
      }
      return result;
    };
    Number.prototype.toBytes = function(size) {
      var size = size || 4;
      var result = new Array(size);
      for(var i = 0; i < size; i++) {
        result[i] = (this >>> (i << 3) & 0xff);
      }
      return result;
    };
  })();


  // Wave Data-Scheme生成用
  //   参考 http://hooktail.org/computer/index.php?Wave%A5%D5%A5%A1%A5%A4%A5%EB%A4%F2%C6%FE%BD%D0%CE%CF%A4%B7%A4%C6%A4%DF%A4%EB
  (function() {
    function Wave(data, seconds) {
      var header = [];

      // サンプリングレート
      var samplingRate = this.samplingRate;
      // チャンネル数
      var chunnels = 1;
      // 量子化ビット数
      var quanizationBits = 8;
      // 再生秒数
      this.seconds = seconds;
      // dataチャンクのサイズ
      var dataSize = this.chunkSize(seconds);

      // RIFFヘッダ

      // ファイルタイプ (0)
      header.push("RIFF".charCodes());
      // ファイルサイズ - 8 (4 - )
      header.push((44 + dataSize - 8).toBytes(4));
      // RIFFのタイプ (8)
      header.push("WAVE".charCodes());

      // fmtチャンク

      // FormatチャンクID　(12)
      header.push("fmt ".charCodes());
      // fmtチャンクのサイズ (16)
      header.push((16).toBytes(4));
      // フォーマットID (20)
      header.push((1).toBytes(2));
      // チャンネル数 (22)
      header.push(chunnels.toBytes(2));
      // サンプリング周波数 (24)
      header.push(this.samplingRate.toBytes(4));
      // データ速度 (28)
      header.push((samplingRate * chunnels * quanizationBits / 8).toBytes(4));
      // ブロックサイズ (32)
      header.push((chunnels * quanizationBits / 8).toBytes(2));
      // 量子化ビット数 (34)
      header.push(quanizationBits.toBytes(2));


      // dataチャンク

      // dataチャンクID (36)
      header.push("data".charCodes());
      // dataチャンクのサイズ (40)
      header.push(dataSize.toBytes(4));

      // ヘッダセット
      this.header = header.flatten();

      // 周波数データセット (44)
      this.data = data;

      return this;

    }
    Wave.prototype = {
      samplingRate: 22050,
      chunnels: 1,
      quanizationBits: 8,
      chunkSize: function(seconds) {
        return ~~((seconds || this.seconds) * (this.samplingRate * this.chunnels * this.quanizationBits / 8));
      },
      build: function() {
        this.base64 = "data:audio/wav;base64," + this.header.concat(this.data).toBase64();
        this.audio = new Audio(this.base64);
        this.audio.load();
        return this;
      },
      play: function(volume) {
        if(!this.audio) this.build();
        if(volume) this.audio.volume = volume;
        this.audio.play();
        return this;
      }
    };
    window.Wave = Wave;

    // 波形生成クラス
    function WaveGenerator() {
      return this;
    };
    window.WaveGenerator = WaveGenerator;

    WaveGenerator.prototype = {
      samplingRate: Wave.prototype.samplingRate,
      minSeconds: 0.033  * 18,    // 最低でも保証する再生秒数(Firefoxなどであまりに短いWAVEファイルは再生されないため)
      clean: function() {
        this.data = [];
        this.phase = 0.0;
      },
      build: function() {
        var data = this.data.flatten();
        // あまったチャンクも無音で埋める
        for(var i = data.length, l = Wave.prototype.chunkSize(this.minSeconds); i < l; i++) {
          data[i] = 128;
        }
        return data;
      },
      // freq, 周波数
      // seconds: 秒数
      // m: モジュレータ周波数(キャリア周波数との比を指定)
      fmsin: function(freq, seconds, m) {
        var dataSize = Wave.prototype.chunkSize(seconds);
        var data = new Array(dataSize);
        var phase = this.phase;

        var freqStart = freq[0];
        var freqEnd = freq[1] || freq[1];

        // 計算式怪しい
        var f =  this.samplingRate * 2.0 * Math.PI / freqStart;
        var df =  (this.samplingRate * 2.0 * Math.PI / freqEnd - f) / dataSize;

        for(var i = 0; i < dataSize; i++) {
          // モジューレータの変調指数がなげやり
          data[i] = Math.sin(phase + Math.sin(phase * m) * 10) * 32;
          phase += f;
          f += df;
          data[i] += 128;
        }

        this.data.push(data);
        this.phase = phase;
        return this;
      }
    };
  })();


  var d = new DCore().init();

  // リボン
  function Ribon() {
    this.init();
    this.ps = [];
    this.dispCount = 0;
    this.fixed = false;
    return this;
  }
  Ribon.prototype = {
    init: function(x, y) {
      this.ps = [];
      this.life = 4;
      if(x && y) this.ps.push([x, y]);
      return this;
    },
    countMax: ~~(4.0 / 0.033),
    append: function(x, y) {
      if(this.ps.length === 0) this.hue = (x * y * 7) + x + y;
      this.ps.push([x, y]);
      return this;
    },
    fix: function() {
      this.fixed = true;
      return this;
    },
    setAudio: function(audio) {
      this.audio = audio;
      return this;
    },
    isKilled: function() {
      return (this.life <= 0) && (this.dispCount + 1 >= this.ps.length);
    },
    act: function() {
      if(this.fixed) {
        if(this.dispCount === 0) {
          if(this.life !== 0) {
            this.audio.play(this.life / 4);
          }
          this.life--;
        }
        if(this.fixed) this.dispCount++;
        if(this.dispCount > this.countMax) {
          this.dispCount = 0;
        }
      }
    },
    draw: function() {
      var self = this;

      // line
      ppool.push([0, function(e) {
        var head = self.life !== 0 ? 0 : self.dispCount;

        d
         .lineWidth(0.005)
         .hsl(self.hue, 0.8, 0.6)
         .line(self.ps.slice(head, self.ps.length))
         .stroke()
        ;
      }]);

      var c = this.dispCount
      if(this.dispCount < this.ps.length) {

        if(this.fixed) {
          var r = 0.03 + 0.04 * Math.random();
          if(this.dispCount == this.ps.length - 1) r *= 2.0;
          if(this.dispCount == this.ps.length - 2) r *= 2.0;

          var r2 = r * (0.6);
          if(this.dispCount == this.ps.length - 1) r2 *= 0.5;
          if(this.dispCount == this.ps.length - 2) r2 *= 0.5;

          // outline -> clear -> inner luminous
          ppool.push([10, function(e) {
            d
             .hsl(self.hue, 0.8, 0.6)
             .circle(self.ps[c], r)
             .fill()
            ;
          }], [20, function(e) {
            d
             .rgb(0xff, 0xff, 0xff)
             .circle(self.ps[c], r * (0.9))
             .fill()
            ;
          }], [30, function(e) {
            d
             .hsl(self.hue, 0.9, 0.9)
             .circle(self.ps[c], r2)
             .fill()
            ;
          }]);
        }
      } else {
        if(this.fixed) {
          var r = 0.03 + 0.02;
          var r2 = r * (0.5);

          var rad = 1.0 - (this.countMax - this.dispCount) / (this.countMax - this.ps.length);

          // outline -> clear -> inner luminous
          ppool.push([10, function(e) {
            d
             .hsl(self.hue, 0.8, 0.6)
             .circle(self.ps[0], r)
             .fill()
            ;
          }], [20, function(e) {
            d
             .rgb(0xff, 0xff, 0xff)
             .circle(self.ps[0], r * (0.9))
             .fill()
           ;
          }], [30, function(e) {
            d
             .hsl(self.hue, 0.8, 0.8)
             .lineWidth(0.015)
             .circle(self.ps[0], r2, 0.0, rad.toRadian())
             .stroke();
         }]);
        }
      }

      return this;
    }
  };

  // リボンのマネージャ
  function Ribons() {
    this.init();
    return this;
  }
  Ribons.prototype = {
    init: function() {
      this.rs = [];
      return this;
    },
    append: function(ribbon) {
      this.rs.push(ribbon);
      return this;
    },
    act: function() {
      this.rs = this.rs.select(function(e) {
        return !e.isKilled();
      });

      this.rs.each(function(e) {
        e.act();
      });
      return this;
    },
    draw: function() {
      this.rs.each(function(e) {
        e.draw();
      });
      return this;
    }
  };


  var rs = new Ribons().init();

  var r = null;
  var wave = null;
  var ppool = [];

  var main = function() {

    // 各種ハンドラ設定
    var px = 0, py = 0;
    var lbdown = false;
    var lbcount = 0;
    var nl = new WaveGenerator();
    var freeHand = false;

    document.addEventListener("keydown", function(e) {
      if(13 == e.keyCode) freeHand ^= true;
      return true;
    }, false);
    document.addEventListener("mousemove", function(e) {
      px = e.clientX / d.width - d.left2d;
      py = e.clientY / d.height - d.top2d;
      if(!freeHand) {
        px = Math.round(px * 16) / 16;
        py = Math.round(py * 16) / 16;
      }
    }, false);
    document.addEventListener("mousedown", function(e) {
      lbdown = true;
      r = new Ribon();
      nl.clean();
    }, false);
    document.addEventListener("mouseup", function(e) {
      lbdown = false;
      if(r) {
        var wave = new Wave(nl.build(), [WaveGenerator.prototype.minSeconds, lbcount * 0.033].max());
        wave.build();
        r.setAudio(wave);

        rs.append(r.fix());
      }
      lbcount = 0;

      r = null;
      nl.clean();
    }, false);


    var opx, opy;
    (function() {
      // back ground
      d
       .rgb(0xff, 0xff, 0xff)
       .fillBack();

      if(!freeHand) {
        // solid
        $R(1, 16 - 1).map(function(e) {
          return e / 16;
        }).map(function(e) {
          d.lineWidth(0.001)
           .rgb(0x88, 0x88, 0x88)
           .line([[0.0, e], [1.0, e]])
           .stroke()
          ;
          return e;
        }).map(function(e) {
          d.lineWidth(0.001)
           .rgb(0x88, 0x88, 0x88)
           .line([[e, 0], [e, 1]])
           .stroke()
          ;
          return e;
        });
      }

      if(r) {
        if(lbdown) {
          r.append(px, py);
          if(lbcount >= 1) {
            var pitch = Math.pow(420, (1.0 +  py));
            var m = Math.pow(2, px * 16 - 8);
            nl.fmsin([pitch, pitch], 0.033, m);
          }
        }
        r.act();
        r.draw();
      }
      rs.act();
      rs.draw();


      opx = px;
      opy = py;
      if(lbdown) lbcount++;

      ppool.sortBy(function(e) {
        return e[0];
      }).each(function(e) {
        return e[1]();
      });
      ppool = [];

      window.setTimeout(arguments.callee, 33);
    })();
  };

  main();
})();
// vim:sw=2:ts=2

