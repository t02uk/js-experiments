$(function () {

  window._log = {
    outputee: (function() {return $("#log");})(),
    info: function(msg) {
      this.outputee.append(
        $("<div>")
          .text(msg.toString())
          .attr("class", "info")
      );
      this.scroll();
    },
    error: function(msg) {
      this.outputee.append(
        $("<div>")
          .text(msg.toString())
          .attr("class", "error")
      );
      this.scroll();
    },
    scroll: function() {
      this.outputee.attr("scrollTop", this.outputee.attr("scrollHeight"));
    },
    clear: function() {
      this.outputee.html("");
    }
  };
  
  window.run= function() {
    try {
      _log.clear();
      _log.info("start on " + new Date());
      var js = CoffeeScript.compile($('#coffee').val());
      eval(js);
    } catch(e) {
      _log.error(e.toString());
    }
  };
  
  window.cls = function() {
    _log.clear();
  };

  window.addEventListener("keydown", function(e) {
    if(115 == e.keyCode) {
      window.run();
      e.preventDefault ? e.preventDefault() : e.returnValue = false;
    }
  }, false);  
  
});
