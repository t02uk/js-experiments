// forked from mackee's "forked:  Web Audio APIで音楽のリアルタイム波形表示" http://jsdo.it/mackee/9WGv
// forked from warinside's " Web Audio APIで音楽のリアルタイム波形表示" http://jsdo.it/warinside/tk3X
// forked from warinside's "Web Audio API Test+GainNode" http://jsdo.it/warinside/3AY7
//参考
//http://www.usamimi.info/~ide/programe/tinysynth/doc/audioapi-report.pdf
//http://epx.com.br/artigos/audioapi.php
//http://code.google.com/p/chromium/issues/detail?id=88122
//https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioSourceNode-section

var context = new webkitAudioContext();

var source = context.createBufferSource();
var gainNode = context.createGainNode();		//音量変えるノード
var analyserNode = context.createAnalyser();
    
gainNode.gain.value = 0.5;

source.connect(gainNode);
gainNode.connect(analyserNode);		//destinationが最終的な出力
analyserNode.connect(context.destination);	//RealTimeAnalyserの出力は必要かどうか意見が求められているそうですよ

var request = new XMLHttpRequest();
var url = "http://jsrun.it/static/assets/svggirl/01/svg_girl_theme.ogg";//あてずっぽうでjsrun.it上に発見
//var url = "http://jsrun.it/static/assets/sound/01/sound.ogg";
request.open("GET", url, true);
request.responseType = "arraybuffer";

request.onload = function() {
    play();
};

request.send();

/**
*FFTされたデータをもらう配列。
*要素数がfrequencyBinCount(FFTのサイズの半分 FFT結果は対称だから半分でいい)より少ないときは
*余分なデータは切り捨てられる。
*/
var analyzedData = new Uint8Array(analyserNode.frequencyBinCount);

// 音可視化用クラス
function Star(p, sp, v) {
    this.p = p;
    this.sp = sp;
    this.rad = $R(0, 100).randf();
    this.radp = 0;
    this.hue = $R(0, 1).randf();
    this.v = v;
}
Star.prototype = {
    act: function(velocity) {
	if(this.prevVelocity) {
	    var delta = velocity - this.prevVelocity;
	    if(delta > 0) {
		this.radp += delta * 2;
	    }
	}
	this.radp *= 0.8;
	if(this.radp > 0.15) {
	    this.rad += this.radp;
	}
	
	this.p = this.p.add(this.sp);
	this.sp = this.sp.add([this.radp * 0.02, 0].rotate($R(0, 100).randf()));
	if(this.p[0] < 0 || 1 < this.p[0]) this.p[0] = 0.5;
	if(this.p[1] < 0 || 1 < this.p[1]) this.p[1] = 0.5;
	this.sp = this.sp.mul(0.9);

	this.prevVelocity = velocity;
	return this;
    },
    draw: function(velocity) {
	d
	 .blend("source-over")
	 .alpha(0.3)
	 .hsv(this.hue, 0.5, this.v)
	 .quads(
	  Geo.polygon(3, 1).rotate(this.rad).scale((velocity / 10 + 0.01).arize(2)).translate(this.p)
	 ).fill();
	return this;
    }
}
    
var d = new DCore();

function play(){
    source.buffer = context.createBuffer(request.response, false);	//ArrayBufferからバッファを作成　第２引数をtrueにするとモノラルに
    source.noteOn(context.currentTime);   //指定した時間に再生する　もし指定した時間がcontext.currentTimeより小さい場合はすぐ再生される

    var step = 1 / 25;
    var stars = $R(0, 25, false).map(function(e) { return new Star([0.5, 0.5], [0.05, 0].rotate(e.toRadian() / 5.2), e / 100 + 0.8); });
    
    setInterval(function(){
	analyserNode.getByteFrequencyData(analyzedData);

	d.blend("source-over").alpha(1).rgb(0xff, 0xff, 0xff).fillBack();
	
	var resp = analyzedData.length;

	for(var freq = 0; freq <= 1; freq += 0.01) {
	    var velocity = analyzedData[~~(resp * freq)] / 255;
	    d.rgb(0xee, 0xff, 0xff).quads(
	      Geo.rect(true).scale([0.01, velocity / 4]).translate([freq, 0.5])
		).fill().rgb(0xdd, 0xff, 0xff).stroke();
								
	}

	for(var freq = 0, i = 0; freq <= 1; freq += step) {
	    var velocity = analyzedData[~~(resp * freq)] / 255;
	    stars[i++].act(velocity).draw(velocity);
	}
    },16);
}