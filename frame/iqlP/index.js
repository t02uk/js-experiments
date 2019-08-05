(function() {

    var video = document.getElementById("video");

    var aa = "'A`";
    var messageText = "";
    var messageTextCnt = 0;
    var inputedDate = undefined;
    

    // search bendor prefixed function/method and return found one
    var withVendorPrefix = function(obj, member) {
        return obj[member] || ["webkit", "moz", "ms"].inject(undefined, function(i, e) {
            return i || obj[e + member.replace(/^\w/, function(x){return x.toUpperCase();})];
        });
    };

    //
    // copy from http://d.hatena.ne.jp/chaichanPaPa/20080412/1207959725
    var countByte = function(str) {
        var count = 0;
        for(var i = 0; i < str.length; i++) {
            if (escape(str.charAt(i)).length < 4) {
                count++;
            }
            else {
                count += 2;
            }
        }
        return count;
    };

    // add hook for message text
    var message_input = $("message_input");
    $("message_input").addEventListener("keypress", function(e) {
        // entered
        if(e.keyCode === 13) {
            e.preventDefault();
            var elem = e.srcElement;
            messageText = elem.value;
            var r = messageText.match(/\((.+)\)/);
            if(r) {
                aa = r[1];
            }
            messageTextCnt = 0;
            elem.value = "";
            inputedDate = +new Date();
            return false;
        }
    });

    // setup for filter
    var getUserMedia = withVendorPrefix(navigator, "getUserMedia");
    if(!getUserMedia) {
        alert("not supported");
        return;
    }
    getUserMedia.call(navigator, {video:true, toString: function(){return "video"}}, function(stream) {
        var URL = withVendorPrefix(window, "URL");
        var url = URL.createObjectURL(stream) || stream;
        video.src = url;
        video.play();
        main();
    }, function() {
        alert("stream is not available");
        return;
    });

    // main routen
    var main = function() {
        $("message_input").focus();
        var d = new DCore($("out"));
        var dwork = d.subTexture(128, 128);
        var detectedCache = [];
    
        
        // face detection
        (function() {
            d.drawImage(video);
            dwork.drawImage(d);
    
            var dt = new Date();
            var grayscale = ccv.grayscale(dwork.canvas);
            
            var detected = ccv_for_realtime .detect_objects( {
                "canvas" : grayscale,
                "cascade" : cascade,
                "interval" : 5,
                "min_neighbors" : 1
            });
            
            var now = +new Date();
            var elapsed = now - inputedDate;
            
            // faces
            if(detected.length === 0) {
                detected = detectedCache;
            }
            detectedCache = detected;
            detected.each(function(e) {
                var center = [dwork.scr2World2d(e.x + e.width / 2), dwork.scr2World2d(e.y + e.height / 2)];
                var radius = dwork.scr2World2d([e.width, e.height].abs());
                var bytes = countByte(aa);
                d
                 .rgb(0xff, 0xff, 0xff)
                 .circle(center, radius)
                 .fill()
                 .rgb(0xaa, 0xaa, 0xff)
                 .circle(center, radius)
                 .lineWidth(radius * 0.05 + 0.01)
                 .stroke()
                 .textAlign("center")
                 .textBaseline("middle")
                 .font("monospace", radius / bytes * 2, "bold")
                 .fillText(aa, center)
                ;
            });
    
            
            window.setTimeout(arguments.callee, 33);
        })();
        
        // control message output area
        (function() {
            
            var now = +new Date();
            var elapsed = now - inputedDate;
            // message area
            var outputLen = Math.min(messageText.length, ~~(elapsed * 0.01));
            
            $("message_output").innerText = messageText.substr(0, outputLen);
    
            if(aa.length) {
                var text = "気分 " + aa;
                $("aa_output").style.visibility = "visible";
                $("aa_output").innerText = text;        
                $("aa_output").style.width = (countByte(text) * 14 * 0.5 + 4) + "px";
            } else {
                $("aa_output").style.visibility = "hidden";
            }
            window.setTimeout(arguments.callee, 33);
        })();
    };    

})();
