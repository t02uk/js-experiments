// Generated by CoffeeScript 1.6.3
(function() {
  window.onload = function() {
    var Cell, cap, cells, d, drawInteval, drawing, flattened, memodDrawing, memoize;
    cap = 24;
    drawInteval = 4;
    d = new DCore();
    memoize = function(f, memo) {
      if (memo == null) {
        memo = {};
      }
      return function() {
        var key;
        key = $A(arguments).join();
        if (memo[key] != null) {
          return memo[key];
        } else {
          return memo[key] = f.apply(null, $A(arguments));
        }
      };
    };
    Cell = (function() {
      function Cell() {
        var _ref;
        _ref = $A(arguments), this.active = _ref[0], this.x = _ref[1], this.y = _ref[2];
      }

      Cell.prototype.eq = function(x, y) {
        return this.x === x && this.y === y;
      };

      Cell.prototype.saveMemento = function() {
        return this.preactive = this.active;
      };

      return Cell;

    })();
    cells = $R(0, cap, true).map(function(y) {
      return $R(0, cap, true).map(function(x) {
        return new Cell(!$R(0, 2).rand(), x, y);
      });
    });
    drawing = function(n1, n2, n3, n4, o1, o2, o3, o4, step) {
      var img, recp, rstep, sd, shift, size;
      rstep = 1 - step;
      size = 16;
      shift = 6;
      recp = 1 / size;
      sd = d.subTexture(size, size);
      img = sd.ctx.createImageData(size, size);
      $R(0, size, true).map(function(ax) {
        return $R(0, size, true).map(function(ay) {
          var c, col, i, x, y;
          x = ax * recp;
          y = ay * recp;
          c = 0;
          if (n1 && o1) {
            c += 1 / (x * x + y * y);
          }
          if (n2 && o2) {
            c += 1 / ((1 - x) * (1 - x) + y * y);
          }
          if (n3 && o3) {
            c += 1 / (x * x + (1 - y) * (1 - y));
          }
          if (n4 && o4) {
            c += 1 / ((1 - x) * (1 - x) + (1 - y) * (1 - y));
          }
          if (n1 && !o1) {
            c += step / (x * x + y * y);
          }
          if (n2 && !o2) {
            c += step / ((1 - x) * (1 - x) + y * y);
          }
          if (n3 && !o3) {
            c += step / (x * x + (1 - y) * (1 - y));
          }
          if (n4 && !o4) {
            c += step / ((1 - x) * (1 - x) + (1 - y) * (1 - y));
          }
          if (!n1 && o1) {
            c += rstep / (x * x + y * y);
          }
          if (!n2 && o2) {
            c += rstep / ((1 - x) * (1 - x) + y * y);
          }
          if (!n3 && o3) {
            c += rstep / (x * x + (1 - y) * (1 - y));
          }
          if (!n4 && o4) {
            c += rstep / ((1 - x) * (1 - x) + (1 - y) * (1 - y));
          }
          col = c > 3 ? [0x99, 0xa0, 0x73] : [0xff, 0xff, 0xd5];
          i = (ax + ay * size) * 4;
          img.data[i + 0] = col[0];
          img.data[i + 1] = col[1];
          img.data[i + 2] = col[2];
          return img.data[i + 3] = 0xff;
        });
      });
      sd.ctx.putImageData(img, 0, 0);
      return sd;
    };
    memodDrawing = memoize(drawing);
    flattened = cells.flatten();
    flattened.each(function(e1) {
      return e1.neighbor = flattened.select(function(e2) {
        return e2.eq(e1.x - 1, e1.y - 1) || e2.eq(e1.x + 1, e1.y - 1) || e2.eq(e1.x, e1.y - 1) || e2.eq(e1.x - 1, e1.y) || e2.eq(e1.x + 1, e1.y) || e2.eq(e1.x, e1.y + 1) || e2.eq(e1.x - 1, e1.y + 1) || e2.eq(e1.x + 1, e1.y + 1);
      });
    });
    return (function(c) {
      if (c % drawInteval === 0) {
        (function() {
          return cells.map(function(e) {
            return e.map(function(e) {
              var numActive;
              e.saveMemento();
              numActive = e.neighbor.select(function(e) {
                return e.active;
              }).length;
              if (!e.active && numActive === 3) {
                return true;
              } else if (e.active && (2 <= numActive && numActive <= 3)) {
                return true;
              } else if (e.active && numActive <= 1) {
                return false;
              } else if (e.active && numActive >= 4) {
                return false;
              } else {
                return e.active;
              }
            });
          }).zip2(cells, function(e) {
            return e[1].zip(e[0], function(ee) {
              return ee[0].active = ee[1];
            });
          });
        })();
      }
      cells.inject(false, function(left, right) {
        if (!left) {
          right;
        } else {
          left.zip2(right).inject(false, function(left, right) {
            var sd, x, y;
            if (!left) {
              return right;
            } else {
              x = (left[0].x + right[0].x) / 2 / cap;
              y = (left[0].y + left[1].y) / 2 / cap;
              sd = memodDrawing(left[0].active, right[0].active, left[1].active, right[1].active, left[0].preactive, right[0].preactive, left[1].preactive, right[1].preactive, (c / drawInteval) % 1);
              d.blend("source-over").alpha(1.0).drawImage(sd, [x, y], [1 / cap, 1 / cap]);
              return right;
            }
          });
        }
        return right;
      });
      return window.setTimeout(arguments.callee.curry(c + 1), 33);
    })(0);
  };

}).call(this);
