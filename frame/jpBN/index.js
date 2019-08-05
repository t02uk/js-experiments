$(function() {

  // 動画読み込み
  var video = $("<video>")
    .attr("src", "http://anyhub.net/file/1yxz-whiteletter.mp4")
    .width(0)
    .attr("autoplay", true);

  var vw = 512;
  var vh = 384;
  var ratio = vh / vw;
  var canplay = false;
  video[0].addEventListener("canplay", function(e) {
    canplay = true;
  });
  $("#outer").append(video);

  
  // canvas設定
  var cw = 320;
  var ch = 320 * ratio;
  $("#world")
    .attr("width", cw)
    .attr("height", ch)

  
  var canvas = $("#world")[0].getContext("2d");


  // マウスイベント
  var px, py;
  window.addEventListener("mousemove", function(e) {
    px = e.clientX;
    py = e.clientY;
  }, false);

  var c = 0;
  window.setInterval(function() {
      c++;

      // on loading
      if(!canplay) {
        canvas.fillStyle = "rgb(255, 255, 255)";
        canvas.rect(0, 0, cw, ch);
        canvas.fill();

        canvas.beginPath();
        canvas.font = "bold 10pt 'monospace'";
        canvas.textAlign = "left";
        canvas.fillStyle = "rgb(128, 128, 128)";
        canvas.globalCompositeOperation = "copy";
        canvas.globalAlpha = 1.0;
        canvas.fillText("now loading" + "...".substring(0, (c / 3) % 8), 8, 20);
        canvas.fill();
        return;
      }
      // v else

      // ノイズ
      if(px && px < cw && py < ch) {
        var nr = (1 - Math.sqrt(Math.pow(px - cw / 2, 2) + Math.pow(py - ch / 2, 2)) / cw - 0.4) * 3;
      } else {
        var nr = 0.0;
      }
      var n = (1 - Math.abs(Math.sin(c / 10)) * Math.abs(Math.sin(c / 13)) * Math.random()) * nr;

      // 動画を転送(Alpha値込み)
      canvas.globalCompositeOperation = "source-over";
      canvas.globalAlpha = 0.85;
      canvas.drawImage(video[0], 0, 0, vw, vh, 0, 0, cw, ch);
      canvas.fill();

      // ゴーストノイズ
      canvas.globalAlpha = 0.15;
      for(var y = 0; y < ch - 20;) {
        var h = ~~(Math.random() * 13);
        y += h;
        if(y > vh - 10) break;
        if(y < 0) continue;
        if(h <= 0) h += 4;
        if(Math.random() < 0.01) continue;
        var offx = n * Math.random() * 30 - nr * 30 / 2 + n * 24 - nr * 13;
        var offy = n * Math.random() * 4;
        canvas.drawImage(video[0], 0, y / ch * vh, vw, h, offx, y + offy, cw, h);
      }

      // 無彩色を半透明コピーして彩度を下げる
      canvas.globalCompositeOperation = "source-over";
      canvas.globalAlpha = 0.2;
      canvas.fillStyle = "rgb(128, 128, 128)";
      canvas.beginPath();
      canvas.rect(0, 0, cw, ch);
      canvas.fill();

      // ノイズ(縦線)
      canvas.globalCompositeOperation = "source-over";
      canvas.globalAlpha = 0.25;
      canvas.fillStyle = "rgb(128, 128, 128)";
      for(var i = 0; i < n * 32; i++) {
        var x = ~~(Math.random() * cw);
        var y = ~~(Math.random() * ch) - 40;
        canvas.beginPath();
        var r = Math.random() * Math.random();
        canvas.rect(x, y, 1, r * 80);
        canvas.fill();
      }

      // 上のテロップ
      canvas.beginPath();
      canvas.font = "bold 10pt 'Serif'";
      canvas.textAlign = "right";
      canvas.fillStyle = "rgb(128, 128, 128)";
      canvas.globalCompositeOperation = "copy";
      canvas.globalAlpha = 1.0;
      canvas.fillText("アナログ", cw - 8, 20);
      canvas.fill();

      // 下のテロップ
      canvas.beginPath();
      canvas.font = "bold 10pt 'Serif'";
      canvas.textAlign = "center";
      canvas.fillStyle = "rgb(128, 128, 128)";
      canvas.globalCompositeOperation = "copy";
      canvas.globalAlpha = 1.0;
      canvas.fillText("地上アナログ放送は2011年7月に終了します", cw / 2, ch - 10);
      canvas.fill();

    }, 33);
});
