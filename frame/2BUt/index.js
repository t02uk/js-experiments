(function() {

  var Eratosthenes = {
    // using array
    // the most generaly used algorithm
    general: function(max) {
      var unprimables = [];
      var result = [];
      
      for(var i = 2; i < max; i++) {
        if(!unprimables[i]) {
          result.push(i);
          for(var j = i * i; j < max; j+= i) {
            unprimables[j] = j;
          }
        }
      }
      return result;
    },
    // using RegExp#replace method for writing work memory
    regexp: function(max) {
      // allocate work area and fill with "x"
      // note:
      //   char "x" consists i am not prime number. and
      //   char "o" consists i am     prime number.
      var work = new Array(max + 1).join("o");
      
      // substitute o -> x if number is not prime number
      for(var i = 2; i <= Math.sqrt(max); i++) {
        var pattern =
           "(^." + "{" + (i + 0) + "})?" +
            "(." + "{" + (i - 1) + "})" + ".";
        work = work.replace(new RegExp(pattern, 'g'), "$1$2x");
      }
      
      // walk around and correct primes
      var result = [];
      for(var i = 2; i < max; i++) {
        if(work.charAt(i - 1) === "o") result.push(i);
      }
      
      return result;
    },
    // using canvas. using vram a.k.a GPGPU.
    canvas: function(max) {
      
      // get canvas context
      var primeCanvas = $("prime");
      primeCanvas.width = max;
      var primeCtx = primeCanvas.getContext("2d");
      
      var workCanvas = $("work");
      var workCtx = workCanvas.getContext("2d");
            
      for(var i = 2; i < Math.sqrt(max); i++) {
        
        // set bit-blt interval
        workCanvas.width = i;
        
        // fill background
        workCtx.fillStyle = "rgb(" + [0xff, 0xff, 0xff].join(", ") + ")";
        workCtx.fillRect(i - 1, 0, i - 1, 1);
        
        primeCtx.fillStyle = primeCtx.createPattern(workCanvas, "repeat");
        primeCtx.fillRect(i, 0, max, 1);
      }
      
      // get image data
      var image = primeCtx.getImageData(0, 0, max, 1);
      
      // vram to array
      var result = [];
      for(var i = 2; i < max; i++) {
        if(!image.data[(i - 1) << 2]) result.push(i);
      }
      
      return result;
    }
  };
  window.Eratosthenes = Eratosthenes;
  
})();