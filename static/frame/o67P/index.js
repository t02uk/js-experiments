(function() {
  
  
  
  function Ribon() {
    return this;
  }
  Ribon.prototype = {
    capacity: 10,
    init: function(ps, color) {
      this.born = [];
      for(var i = 0; i < this.capacity; i++) {
        this.born[i] = new Born(ps);
        this.born[i].act();
      }
      this.color = color;

      return this;      
    },
    act: function() {
     
      var lhs = {x: px, y: py};
      var rhs = this.born[0];
        
      var dx = lhs.x - rhs.x - rhs.sx;
      var dy = lhs.y - rhs.y - rhs.sy;
      
      var direction = Math.atan2(dy, dx);
      
      rhs.sx += Math.cos(direction + 0.15) * 0.01;
      rhs.sy += Math.sin(direction + 0.15) * 0.01;
      
      rhs.sx *= 0.99;
      rhs.sy *= 0.99;

      rhs.x += rhs.sx;
      rhs.y += rhs.sy;
      
      for(var i = 1; i < this.capacity; i++) {
        this.born[i].act();
        this.born[i].x = (this.born[i-1].ox + this.born[i].x) / 2;
        this.born[i].y = (this.born[i-1].oy + this.born[i].y) / 2;
        this.born[i].sx = (this.born[i-1].x - this.born[i].x);
        this.born[i].sy = (this.born[i-1].y - this.born[i].y);

        if(Math.random() < 0.01) {
          Ripple.registor(
            {x: this.born[i].x,
             y: this.born[i].y,
             sx: Math.random() * 0.1 - 0.05,
             sy: Math.random() * 0.1 - 0.05,
             radius: 0.001,
             color: this.color}
          );
        }
      }
      
      rhs.act();
      
      return this;
    },
    draw: function(d) {
      
       d.rgb(this.color[0],
             this.color[1],
             this.color[2])
        .alpha(0.3)
          .blend("lighter");

      for(var i = 1; i < this.capacity; i++) {
        var p1 = this.born[i-1];
        var p2 = this.born[i];
        
        var s = 0.01;
        
        d.quads([
          [p1.x + p1.ny * s, p1.y - p1.nx * s],
          [p1.x - p1.ny * s, p1.y + p1.nx * s],
          [p2.x - p2.ny * s, p2.y + p2.nx * s],
          [p2.x + p2.ny * s, p2.y - p2.nx * s]
        ]).fill();
       }
      
      return this;
    }
  };
  
  function Ripple(o) {
    this.x = o.x;
    this.y = o.y;
    this.sx = o.sx;
    this.sy = o.sy;
    this.radius = Math.random() * 0.001 + 0.0005;
    this.color = o.color;
    this.lineWidth = Math.random() * 0.03 + 0.02;
    this.count = 0;
  }
  Ripple.items = [];
  Ripple.registor = (function() {
    var seq = 0;
    var items = Ripple.items;
    return function(o) {
      var ret;
      ret = items[seq] = new Ripple(o);
      
//      console.log("seq " + seq);
      seq++; seq &= 63;
      
      return ret;
    };
  })();
  Ripple.prototype = {
    act: function() {
      this.x += this.sx;
      this.y += this.sy;
      
      this.sx *= 0.95;
      this.sy *= 0.95;
      
      return this;
    },
    draw: function(d) {
      this.lineWidth -= 0.002;
      if(this.lineWidth < 0) return;
      d.rgb(this.color[0],
            this.color[1],
            this.color[2])
       .lineWidth(this.lineWidth)
        .alpha(this.lineWidth * 10.0);
      
      d.circle(
        [this.x, this.y],
        this.radius
      ).stroke();
      this.count++;
      this.radius += 0.01;
      return this;
    }        
  };
  
  
  function Born(ps) {
    this.x = ps.x || 0.0;
    this.y = ps.y || 0.0;
    this.sx = this.sy = 0.0;
    return this;
  }
  Born.prototype = {
    draw: function(d) {

      var s = 0.1;
      d.quads([
        [this.x - s, this.y - s],
        [this.x + s, this.y - s],
        [this.x + s, this.y + s],
        [this.x - s, this.y + s]
      ]).fill().stroke();
      return this;
    },
    act: function() {
      
      this.ox = this.x;
      this.oy = this.y;
      
      var sp = Math.sqrt(this.sx * this.sx + this.sy * this.sy);
      if(sp !== 0.0) {
        this.nx = this.sx / sp;
        this.ny = this.sy / sp;
      } else {
        this.nx = 0.0;
        this.ny = 0.0;
      }
          
      return this;
    }
  };
  
      
      
  var main = function() {
    
    window.px = 0.5;
    window.py = 0.5;
    document.addEventListener("mousemove", function(e) {
      px = e.clientX / d.width + d.left2d;
      py = e.clientY / d.height + d.top2d;
    }, false);
  
    var d = new DCore().init();
  
    var rs = [];
    for(var i = 0; i < 7; i++) {
      rs[i] = new Ribon().init(
        {
          x: Math.random(),
          y: Math.random()
        },
          [
          [0xff, 0x66, 0x66],
          [0xff, 0xaa, 0x66],
          [0xff, 0xff, 0x66],
          [0x66, 0xff, 0x66],
          [0x66, 0x33, 0xff],
          [0x33, 0x66, 0xaa],
          [0xff, 0x66, 0xff]
          ][i]
      );
    }
    (function() {
      d.rgb(10, 20, 30)
        .alpha(1.0)
          .blend("source-over")
            .fillBack();

      for(var i = 0; i < rs.length; i++) {
        var r = rs[i];
        r.act().draw(d);
      }
      
      for(var i = 0; i < 64; i++) {
        var ripple = Ripple.items[i];
        if(!ripple) continue;
        ripple.act().draw(d);
      }
      //console.log("cap " + i)
          
      window.setTimeout(arguments.callee, 33);
    
    })();
  };
  
  try {
    main();
  } catch(e) {
//    alert("Error:" + e.message);
    throw e;
  }
})();
