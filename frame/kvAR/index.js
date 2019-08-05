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
  var url = "http://jsrun.it/static/assets/sound/01/sound.ogg";
//  var url = "http://wesaadmin.80code.com/zara.php?a=1";
    
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
    var d = new DCore();
    // 背景初期化
    d
     .blend("source-over")
     .alpha(1)
     .rgb(0x33, 0x33, 0x66)
     .fillBack()
    ;

    const ROOP_DENS = 16;
    var roopMax = ~~(1024 / ROOP_DENS);
    var roop = .0.arize(roopMax);
    var c = 0;

    return function(data) {
      cp = [0.5, 0.5];
      // ロープ
      var roop = $R(0, roopMax).map(function(i) {
        var power = (data[i] - 124) / 108;
        return [0, power].rotate((i / (roopMax)).toRadian()).translate(cp);
      })
      // 背景初期化
      d
       .blend("source-over")
       .alpha(0.05)
       .rgb(0x33, 0x33, 0x66)
       .fillBack()
      ;
      // ロープ書く
      d
       .blend("source-over")
       .alpha(0.15)
       .rgb(0x33, 0x33, 0x66)
       .loop(roop)
       .fill()
       .blend("lighter")
       .alpha(0.4)
       .rgb(0x99, 0xdd, 0xff)
       .lineWidth(0.01)
       .loop(roop)
       .stroke()
      ;
      // 背景を回転しながらサイケデリックにコピー
//      var from = Geo.rect();
//      s = 1.10;
//      var to = Geo.rect(true).scale([s, s]).rotate(Math.sin(Math.cos(c * 0.02) + c * 0.01) * 0.05 + c * 0.00001).translate([0.5, 0.5]);

//      d
//       .transformTo(from, to, function(d) {
//         d
//          .blend("source-over")
//          .alpha(0.8)
//          .drawImage(d)
//         ;
//       });
	d
	 .save()
	 .translate([0.5, 0.5])
	 .scale([1.1, 1.1])
	 .rotate(Math.sin(Math.cos(c * 0.02) + c * 0.01) * 0.05)
	 .translate([-0.5, -0.5])
	 .blend("source-over")
	 .alpha(0.8)
	 .drawImage(d)
	 .restore()
	;
      c++;
    };
  }
};
var player = new Player();
