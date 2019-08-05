window.onload = (function() {

    jQuery.noConflict();
    J = jQuery;

    // automatically color pattern generator
    function AutoColor() {
        this.init();
    };

    AutoColor.prototype.init = function() {
        this.m = $R(0, 1).rand();
        // set pattern
        this.current = {
            // hue
            h: $R(0, 1).randf(),
            // saturation
            s: $R(0.2, 1.0).randf(),
            // value
            v: $R(0.3, 1.0).randf()
        };
    }
    AutoColor.prototype.next = function() {
        if(!this.c) this.c = 0;
        this.c++;
        var cur;

        // re-create
        if((1.0).randf() < 0.3) {
            this.m = 1 - this.m;
            this.init();
        }
        cur = this.current;
        // type: dominant color
        if(this.m == 0) {
            // re saturation
            cur.s += $R(0.2, 0.4).randf();
            cur.s %= 1;
            // re value
            cur.v += $R(0.2, 0.4).randf();
            cur.v %= 1;
        } else if(this.m == 1) {
        // type: dominant tone
            cur.h += $R(0.15, 0.3).randf();
            cur.h %= 1;
        } else {
            throw "Ops... unexpected value " + this.m;
        }
        // 
        if(cur.v < 0.2) {
            cur.v += $R(0.2, 0.4).randf();
        }

        if((1.0).randf() < 0.2) {
            cur.s = 1.0;
        }
        if((1.0).randf() < 0.2) {
            cur.v = 1.0;
        }
        return {
            h: cur.h,
            s: cur.s,
            v: cur.v
        };
    };


    // set background-color
    function setColor(grp) {
        $A(J(".pair .color_" + grp)).zip(
            (function(ac) {
                return $R(0, 5, true).map(function(e) {
                    return ac.next();
                });
            })(new AutoColor())
        , function(e) {
            var dom = e[0];
            var val = e[1];

            var rrggbb = [
                val.h,
                val.s,
                val.v,
            ].hsv();
            dom.style.backgroundColor = rrggbb;
        });
    }
    
    function setAnimation(grp) {
        // animation
        J(".pair").each(function(i) {
            var to = J(this).css("top") === "-485px" ? "0px" : "-485px";
            J(this).animate({
                top: to
            }, 250, "swing");
        });
    }

    setColor("1");
    setColor("2");


    (function(grp) {
        setColor(grp ? "2" : "1");
        setAnimation(grp ? "1" : "2");
        window.setTimeout(arguments.callee.curry(!grp), 1000);
    })(true);

});
