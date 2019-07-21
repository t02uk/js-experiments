(function() {

    var SHADOW_SIZE = 256;
    var SHADOW_SIZE_BITS = 7;
    var THREAD_HOLD = 8;
    
    var video = document.getElementById("video");

    // search bendor prefixed function/method and return found one
    var withVendorPrefix = function(obj, member) {
        return obj[member] || ["webkit", "moz", "ms"].inject(undefined, function(i, e) {
            return i || obj[e + member.replace(/^\w/, function(x){return x.toUpperCase();})];
        });
    };

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
        var d = new DCore();
        var work = $R(1, 2).map(function() {
            return d
                .subTexture(SHADOW_SIZE, SHADOW_SIZE)
                .rgb(0x00, 0x00, 0x00)
                .fillBack()
            ;
        });
        var workIndex = 0;

        var shadows = $R(1, 8).map(function() { return d.subTexture(SHADOW_SIZE, SHADOW_SIZE);});
        var shadowIndex = 0;
        
        (function() {
            work[workIndex].drawImage(video);
            var imgA = work[workIndex].getNativeImageData().data;
            var imgB = work[1 - workIndex].getNativeImageData().data;
            var shadow = shadows[shadowIndex];
            var img =  shadow.ctx.createImageData(SHADOW_SIZE, SHADOW_SIZE);
            var imgDest = img.data;
            for(var i = 0, l = SHADOW_SIZE * SHADOW_SIZE * 4; i < l; i += 4) {
                var grayScaledA = (imgA[i] * 19589 + imgA[i + 1] * 38444 + imgA[i + 2] * 7502) >>> 16;
                var grayScaledB = (imgB[i] * 19589 + imgB[i + 1] * 38444 + imgB[i + 2] * 7502) >>> 16;
                var diff = grayScaledA - grayScaledB;
                if(diff < 0) diff = -diff;
                if(diff < THREAD_HOLD) {
                    imgDest[i] = 0x00;
                    imgDest[i + 1] = 0x00;
                    imgDest[i + 2] = 0x00;
                    imgDest[i + 3] = 0x00;
                } else {
                    imgDest[i] = 0x00;
                    imgDest[i + 1] = 0x00;
                    imgDest[i + 2] = 0xff;
                    imgDest[i + 3] = diff * diff >> 4;
                }
            }
            //console.info(putImageData);
            shadow.ctx.putImageData(img, 0, 0);

            d
             .blend("source-over")
             .alpha(1)
             .rgb(0x00, 0x00, 0x00).fillBack()
             .drawImage(work[workIndex])
            ;
            for(i = 0; i < 8; i++) {
                var k = (shadowIndex - i + 8) % 8;
                d
                 .blend("lighter")
                 .alpha(1 - (i / 8))
                 .drawImage(shadows[k])
                ;
            }
             
            shadowIndex++;
            shadowIndex %= 8;
            workIndex++;
            workIndex %= 2;
            window.setTimeout(arguments.callee, 33);
        })();        
    };

})();
