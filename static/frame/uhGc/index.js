window.onload = function() {

  Function.prototype.curry = function() {
    if (!arguments.length) return this;
    var __method = this, args = Array.prototype.slice.call(arguments, 0);
    return function() {
      return __method.apply(this, args);
    };
  };


  var Farmer = {
    primes: document.getElementById('primes'),
    reap: function() {
      var s = document.getElementsByTagName("style")[0];
      return function(n) {
        var i = n + n;
        s.innerHTML += "" +
        "li:nth-child(" + n + "n+" + i + "):before {" +
        "display: none;" +
        "}";
      };
    }(),
    planting: function(n) {
      for(var i = 0; i < n; i++) {
        Farmer.primes.appendChild(document.createElement("li"));
      }
    },
    hasReaped: function(n) {
      return !Farmer.primes.childNodes.item(n).offsetWidth;
    }
  };

  Farmer.planting(1000);

  (function(i) {
    if(i < Math.sqrt(1000)) {
      var unreaped;
      if(unreaped = !Farmer.hasReaped(i+1)) {
        Farmer.reap(i);
      }
    }
    window.setTimeout(arguments.callee.curry(i+1), unreaped ? 100 : 0);
  })(2);
};
