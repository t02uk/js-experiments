// forked from keiji.shimada's "spinWatch" http://jsdo.it/keiji.shimada/pxby
var timerID;
var cW = 850; //canbasの幅
var cH = 500; //canbasの高さ
var centerY = cH / 2; //回転の中心点Y
// 分の設定
var minuteRadius = 180; //分半径の長さ
var minuteCenterX = 200;
//秒の設定
var secRadius = 180; //秒半径の長さ
var secCenterX = 610; //回転の中心点X
// 時間の設定
var hourRadius = 100;
var hourCenterX = minuteCenterX + 30;
// ミリ秒の設定
var startRadius = 10;

var angleSpeed = 6; //角度の速度
var millAngleSpeed = 12;
var hourAngleSpeed = 15; //角度の速度
var per = Math.PI;
var startAngle = 0; //開始角度
var angle = startAngle;
var objX;
var objY;
var maxAlpha = 1;//最大アルファ値
var defScall = 20; //オブジェクトのデフォルトサイズ
var canvas = document.getElementById('testCanvas');
var ctx = canvas.getContext('2d');

window.onload = function(){
    setTimer();
};
function setTimer(){
    clearInterval(timerID);
    timerID = setInterval("draw()", 10);
}

function draw(){

    var dNow = new Date();
    var sHour = dNow.getHours();
    var sMinute = dNow.getMinutes();
    var sSecond = dNow.getSeconds();
    var sMill = dNow.getMilliseconds();
    if (sHour < 10) 
        sHour = "0" + sHour;
    if (sMinute < 10) 
        sMinute = "0" + sMinute;
    if (sSecond < 10) 
        sSecond = "0" + sSecond;
  if (sMill < 10) 
        sMill = "0" + sMill;
    
    ctx.clearRect(0, 0, cW, cH);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    sNow = sHour + ":" + sMinute + ":" + sSecond;
    ctx.font = "22pt Cursive";
    ctx.fillText(":", secCenterX - secRadius - 22, centerY + 4);
    ctx.fillText(":", minuteCenterX + minuteRadius - 22, centerY + 4);
  ctx.fillText(":", secCenterX - secRadius + 28, centerY + 4);
  drawMillSec("" + sMill);
    drawSecond(sSecond, sMill);
    drawMinute(sMinute, sSecond, sMill);
    drawHour(sHour, sMinute, sSecond, sMill);
    ctx.closePath();
}

function drawMillSec(mill){
    var radius = startRadius;
    mill = mill.substring(0, 2);
    //一番はじめの数字
    start = mill - 1;
    var adjustX = 0;
    if (start < 0) 
        start = 99;
    for (var i = 0; i < 100; i++) {
        ctx.font = (~~(start / 10) + 4) + "pt Cursive";
        if (i == 99) {
            adjustX = -10;
            ctx.font = "22pt Cursive";
        }
        var ang = i * millAngleSpeed + 69;
        var x = Math.cos(ang / 360 * 2 * Math.PI) * radius + secCenterX + adjustX;
        var y = Math.sin(ang / 360 * 2 * Math.PI) * radius + centerY;
        setHsl((~~(start / 10) / 10), 0.5, i / 200);
        ctx.fillText(start, x, y);
        //どんどん減っていく
        start--;
        if (start < 0) 
            start = 99;
        radius += 1.2;
    }
}

function drawSecond(sec, mills){
    for (var i = 0; i < 60; i++) {
        var adjustX = 0;
        var addAngle = 30;
        ctx.font = "8pt Cursive";
        if (i == 0) {
            adjustX = -10;
            addAngle = 29.7;
            ctx.font = "22pt Cursive";
            if(mills < 100) {
              adjustX -= Math.sin(mills / 10) * 10 * Math.random();
            }
        }
        var x = Math.cos((i + 30) * angleSpeed / 360 * 2 * Math.PI) * secRadius + secCenterX + adjustX;
        var y = Math.sin((i + addAngle) * angleSpeed / 360 * 2 * Math.PI) * secRadius + centerY;
        setHsl(sec / 60, 0.5, 0.5);
        ctx.fillText(sec, x, y);
        sec++;
        if (sec == 60) {
            sec = 0;
        }
    }
    ctx.fillStyle = '#FFFFFF';
}

function drawMinute(minute, sec, mills){
    for (var i = 0; i < 60; i++) {
    
        var adjustX = 0;
        var addAngle = 30;
        ctx.font = "8pt Cursive";
        if (i == 0) {
            adjustX = -10;
            addAngle = 29.7;
            ctx.font = "22pt Cursive";
            if(mills < 100 && sec < 1) {
              adjustX -= Math.sin(mills / 10) * 10 * Math.random();
            }
        }
        var x = Math.cos((i) * angleSpeed / 360 * 2 * Math.PI) * minuteRadius + minuteCenterX + adjustX;
        var y = Math.sin((i + addAngle) * angleSpeed / 360 * 2 * Math.PI) * minuteRadius + centerY;
        setHsl(minute / 60, 0.5, 0.5);
        ctx.fillText(minute, x, y);
        minute++;
        if (minute == 60) {
            minute = 0;
        }
    }
}

function drawHour(hour, minute, sec, mills){
    for (var i = 0; i < 24; i++) {
    
        var adjustX = 0;
        var addAngle = 0;
        ctx.font = "8pt Cursive";
        if (i == 0) {
            adjustX = -10;
            addAngle = 0.2;
            ctx.font = "22pt Cursive";
            if(mills < 100 && sec < 1 && minute < 1) {
              adjustX -= Math.sin(mills / 10) * 10 * Math.random();
            }
        }
        var x = Math.cos((i) * hourAngleSpeed / 360 * 2 * Math.PI) * hourRadius + hourCenterX + adjustX;
        var y = Math.sin((i + addAngle) * hourAngleSpeed / 360 * 2 * Math.PI) * hourRadius + centerY;
        setHsl(hour / 24, 0.5, 0.5);
        ctx.fillText(hour, x, y);
        hour++;
        if (hour == 24) {
            hour = 0;
        }
    }
}
          
function setHsl(h, s, l) {
  h = (~~(h * 360)) % 360;
  s = (~~(s * 100)) + "%";
  l = (~~(l * 100)) + "%";
  ctx.fillStyle = "hsl(" + [h, s, l].join(", ") + ")";
  ctx.strokeStyle = "hsl(" + [h, s, l].join(", ") + ")";
}

