function Player() {
  var context = new webkitAudioContext();

  var source = context.createBufferSource();
  var gainNode = context.createGainNode();      //音量変えるノード
  var analyserNode = context.createAnalyser();
    
  gainNode.gain.value = 0.5;

  source.connect(gainNode);
  gainNode.connect(analyserNode);           //destinationが最終的な出力
  analyserNode.connect(context.destination);    //RealTimeAnalyserの出力は必要かどうか意見が求められているそう

  var request = new XMLHttpRequest();
  var url = "http://jsrun.it/static/assets/svggirl/01/svg_girl_theme.ogg";

  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onload = function() {
    $("#play").html("<input type='button' onclick='player.play()' value='Play'>");
  };
  request.send();
    
  this.timeDomainData = new Uint8Array(analyserNode.frequencyBinCount);
  this.source = source;
  this.context = context;
  this.analyserNode = analyserNode;
  this.request = request;
};

Player.prototype = {
  play: function() {
    var source = this.source;
    var context = this.context;
    var analyserNode = this.analyserNode;
    var request = this.request;
    var timeDomainData = this.timeDomainData;
    source.buffer = context.createBuffer(request.response, false);  //ArrayBufferからバッファを作成　第２引数をtrueにするとモノラルに
    source.noteOn(context.currentTime);   //指定した時間に再生する　もし指定した時間がcontext.currentTimeより小さい場合はすぐ再生される
    
    var draw = this.draw();
    setInterval(function(){
      analyserNode.getByteTimeDomainData(timeDomainData);
      draw(timeDomainData);
    },50);
  },
  // 描画関数（初期化後に、描画用のクロージャを返す手抜き)
  draw: function() {
    function Particle() {
      Particle.prototype.initialize.apply(this, arguments);
    };
    Particle.prototype = {
      initialize: function(p, sp, r) {
        this.p = p || [0.5, 0.5];
        this.sp = sp || [0, 0.1].rotate($R(0, 100).randf());
        this.h = $R(0, 1).randf();
        this.r = r;
        this.count = 0;
        this.maxCount = 20;
      },
      act: function() {
        this.p = this.p.translate(this.sp);
        this.sp = this.sp.mul(0.8);
        this.count++;
        this.r *= 0.97;
        this.r -= 0.005;
      },
      draw: function() {
        if(this.r < 0) return this;
        var h = this.h;
        var alpha = (this.maxCount - this.count) / this.maxCount;
        d
         .blend("lighter")
         .alpha(alpha * alpha * 0.8)
         .luminous(this.p, this.r / 10, this.r, [
           [0.00,  [h, 0.0, 1.0].hsv()],
           [0.20,  [h, 0.1, 0.9].hsv()],
           [0.40,  [h, 0.2, 0.8].hsv()],
           [0.60,  [h, 0.3, 0.6].hsv()],
           [0.80,  [h, 0.7, 0.2].hsv()],
           [1.00,  [h, 0.0, 0.0].hsv()],
         ])
         .fill()
        ;
      },
      isTired: function() {
        return this.count > this.maxCount;// this.sp.square() < 0.0001
      },
    };

    var particles = [];

    var d = new DCore();

    var bpm = 128.0;

    var st = +new Date();

    var c = 0;
    var spl = .0.arize(1024);

    prevData = [];
      
    // 初期化ここまで、こっから描画
    return (function(data) {
      c++;

      // パーティクル生成
      var step = 64;
      for(var i = 0; i < 1024; i += step) {
        var power = (data[i] - 128) / 128;
        var radian = (i / 1024).toRadian();
        var f = c * 0.001;
        var sp = [$R(-0.001, 0.001).randf(), $R(-0.02, -0.03).randf()];
        var cp = [(i + step / 2) / 1024, 1.0];
        var particle = new Particle(cp, sp, power.abs() * 0.6);
        particles.push(particle);

        var delta = (prevData[i] - data[i]).abs();
        if(delta > 16) {
          var particle = new Particle(cp.translate([$R(-0.03, 0.03).randf(), 0]), sp.mul(0.3), delta * 0.003);
        particles.push(particle);
        }
      }

      // 疲れた人ははじく
      particles = particles.select(function(e) {
        return !e.isTired();
      });

      // 背景初期化
      d
       .blend("source-over")
       .alpha(0.6)
       .rgb(0x00, 0x00, 0x00)
       .fillBack();
      ;

      particles.invoke("act");
      particles.invoke("draw");

      d
       .blend("lighter")
       .alpha(0.4)
       .drawImage(d, [0, 0.1], [1, 0.9], [0, 0], [1, 1])
      ;

      prevData = data.clone();

    });
  }
};
var player = new Player();

