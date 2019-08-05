window.onload = (function() {

	var d = new DCore()

	function Mouse() {
	}
	Mouse.ovserve = function() {

		Mouse.x = 0;
		Mouse.y = 0;

		document.addEventListener("mousemove", function(e) {
			Mouse.x = e.clientX / d.width - d.left2d;
			Mouse.y = e.clientY / d.height - d.top2d;
		}, false);
	}
	Mouse.ovserve();

	function Synthesizer() {
	};
	Synthesizer.prototype.play = function() {
		this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		this.channel = 1;
		this.bufferSize = 2 << 10;

		this.node = this.ctx.createJavaScriptNode(this.bufferSize, 1, 1);
		this.node.connect(this.ctx.destination);

		var self = this;

		var pos = 0;
		this.node.onaudioprocess = function(evt) {
			var sampleRate = evt.outputBuffer.sampleRate;
			var length = evt.outputBuffer.length;

			var buffer1 = evt.outputBuffer.getChannelData(0);

			var freq = 420 + Math.pow(840, Math.log(Mouse.y) + 1);
			var step = freq * Math.PI / sampleRate;
			for(var i = 0; i < length; i++) {
				pos += step;
				buffer1[i] = Math.sin(pos + Math.sin(Math.pow(8, Math.log(Mouse.x + 0.1)) * i * 0.2) * Mouse.y * 10);
			}
		};
	}

	var synth = new Synthesizer().play();


	var bg = 0;
    var offy = 0;
	(function() {

        
        offy += (Mouse.x) + 0.001;
        offy += 1;

        for(var i = 0; i <= Mouse.y * 0.1; i += 0.02) {
            bg += (Mouse.y * 0.5) + Math.random() * 0.2 - 0.1;
            bg %= 1;
            var form = Geo.rect();
            var y = (i + offy) % 1;
            form = form.scale([1, 0.05]);
            form = form.translate($R(-1, 1).randf(), y);
    
            d
             .hsv(0, 0, ~~(bg * 2.0))
             .quads(form)
             .fill()
            ;
        }
		window.setTimeout(arguments.callee, 16);
	})();
});
