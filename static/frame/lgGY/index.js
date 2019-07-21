// forked from norahiko's "うおっ まぶしっ" http://jsdo.it/norahiko/29c3
$(function(){

var GRID_WIDTH = 40
var BACKGROUND_STYLE = "#333"

var floor = Math.floor
var min = Math.min
var pow = Math.pow
var sqrt = Math.sqrt

var PI_2 = Math.PI * 2

var maxRadius
var width
var height
var tick = 0
var position = {
    x: 0,
    y: 0
}

var canvas = $("#world")[0]
var context = canvas.getContext("2d")


$(window).resize(function(){
    width = canvas.width = $(window).width()
    height = canvas.height = $(window).height()
}).resize()

$(window).mousemove(function(event){
    position.x = event.clientX
    position.y = event.clientY
    tick++
    draw()
})
draw();

function distance(x1, y1, x2, y2){
    return sqrt( pow(x2-x1, 2) + pow(y2-y1, 2))
}

function draw(){
    // draw background
    context.globalCompositeOperation = "source-over"
    context.fillStyle = "hsla(" + [(tick * 9) % 360, "10%", "10%", 0.4].join(",") + ")"
    context.globalAlpha = 0.4
    context.fillRect(0, 0, width, height)
    
    // draw circles
    context.globalCompositeOperation = "lighter"
    for(var row = 0; row < height; row += GRID_WIDTH){
        for(var col = 0; col < width; col += GRID_WIDTH){
            context.beginPath()
          
            var radius = distance(position.x, position.y, col, row) / 7
            var gradient = context.createRadialGradient(col, row, radius / 5 + 1, col, row, radius)
            hue = (tick * 4 + 0 | radius * 8)  % 360
            gradient.addColorStop(0, "hsla(" + [hue, "80%", "60%", 1].join(",") + ")" )
            gradient.addColorStop(0.2, "hsla(" + [hue, "70%", "40%", 1].join(",") + ")" )
            gradient.addColorStop(1, "hsla(" + [hue, "50%", "30%", 0].join(",") + ")")
          
            context.fillStyle = gradient
//            context.globalAlpha = 0.3
            context.arc(col, row, radius, 0, PI_2, true)
            context.fill()
        }
    }
}

})
