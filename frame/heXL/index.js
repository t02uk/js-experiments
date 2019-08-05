window.onload = (function() {

	var d = new DCore();
	var mouse = new Mouse(d);

	// AudioContext
	// 各ブラウザに実装されたAudioContextと同じメソッドを備える(一切何もしない)
	function MockAudioContext() {}
	MockAudioContext.prototype = {
		createJavaScriptNode: function() {
			return {
				connect : function(){}
			}
		}
	};

	// 簡易ミキサ
	function Mixer() {
	}
	Mixer.prototype = {
		// 初期化処理
		prepare: function() {
			this.ctx = new (window.AudioContext || window.webkitAudioContext || MockAudioContext)();
			this.channel = 1;
			this.bufferSize = 2 << 10;

			this.node = this.ctx.createJavaScriptNode(this.bufferSize, 1, 1);

			this.lowpass = this.node.context.createBiquadFilter();
			this.lowpass.type = this.lowpass.LOWPASS;
			this.highpass = this.node.context.createBiquadFilter();
			this.highpass.type = this.highpass.HIGHPASS;

			this.node.connect(this.lowpass);
			this.lowpass.connect(this.highpass);
			this.highpass.connect(this.ctx.destination);

			var self = this;

			this.waves = [];
			
			this.node.onaudioprocess = function(evt) {

				var sampleRate = evt.outputBuffer.sampleRate;
				var length = evt.outputBuffer.length;
				var buffer = evt.outputBuffer.getChannelData(0);

				for(var i = 0; i < length; i++) {
					buffer[i] *= 0.35;
				}

				for(var i = 0; i < self.waves.length; i++) {
					var alive = self.waves[i](buffer, sampleRate, length);
					if(!alive) {
						self.waves[i] = undefined;
					}
				}
				
				self.waves = self.waves.compact();

			};
		},
		add: function(functor) {
			this.waves.push(functor);
		},
		update: function() {
		}
	};
	var mixer = new Mixer();
	mixer.prepare();
	
	// グリッド(12x12のグリッドがあった場合、どの位置に当たるかを計算する)
	var Grid = {};
	Grid.size = 12;
	Grid.xs = $R(0, Grid.size, true).map(function(i) { return i / Grid.size; });
	Grid.toCordinate = function(p) {
		var unit = 1 / this.size;
		return [~~(p[0] / unit), ~~(p[1] / unit)];
	};


	// エフェクト(波紋)
	function Effect(p, hue) {
		this.p = p;
		this.count = 0;
		this.hue = hue;
	}
	Effect.prototype = {
		act: function() {
			this.count++;
		},
		draw: function() {
			var s = 0.2;
			var a = this.count / 16;
			a *= a / 2;
			var alpha = a;
			var ar = (1 - a) * 0.3;
			d
			 .alpha(0.5)
			 .blend("lighter")
			 .lineWidth(ar * s * 0.2)
			 .hsv(this.hue, 0.85, 0.85)
			 .circle(this.p, a * s + 0.001)
			 .stroke()
			;
		},
		alive: function() {
			return this.count < 16;
		},
	};

	// エフェクト管理用クラス
	var EffectManager = {
		initialize: function() {
			this.effects = [];
		},
		act: function() {
			this.effects = this.effects.select(function(e) {
				return e.alive();
			});
			this.effects.invoke("act");
		},
		draw: function() {
			this.effects.invoke("draw");
		},
		add: function(effect) {
			this.effects.push(effect);
		},
	};
	EffectManager.initialize();

	// 音を鳴らしたり、波紋を描いたり
	function Note(p, wave, delay, volume, life, hue) {
		this.p = p;
		this.wave = wave;
		this.count = 0 - delay;
		this.volume = volume;
		this.life = life;
		this.hue = hue;
	}
	Note.prototype = {
		act: function() {
			if(this.count % 128 == 0) {
				mixer.add(this.wave(this.volume));
				EffectManager.add(new Effect(this.p, this.hue));
				this.volume *= 0.5;
			}
			this.count++;
		},
		draw: function() {
		},
		alive: function() {
			return this.count < this.life;
		},
	};


	// 譜面管理
	var Score = {
		initialize: function() {
			this.notes = new Array(128).fill([]);
			this.idx = 0;
		},
		add: function(note) {
			this.notes[this.idx].push(note);
		},
		each: function(fn) {
			this.notes.flatMap(function(note) {
				if(note && note.alive()) {
					fn(note);
				}
			});
		},
		act: function() {
			for(var i = 0; i < 128; i++) {
				this.notes[i] = this.notes[i].select(function(x) {
					return x.alive();
				});
			}
			this.each(function(x) {
				x.act();
			});
			this.idx++;
			this.idx %= 128;
		},
		draw: function() {
			this.each(function(x) {
				x.draw();
			});
		},
	};
	Score.initialize();

	// 作曲家(主に、コード進行うんぬんが必要な音を担当)
	var Composer = {
		code: function(cord) {
			var patterns = [
				[1, 3, 5]	// C
				,[6, 10, 1]		// F
				,[8, 12, 15]	// G
				,[5, 8, 11, 13]	// Em7
				,[3, 6, 10, 12]	// Dm7-5
				,[4, 6, 10, 11]	// Bm7-5
				,[5, 8, 11, 13]	// Em7
				,[6, 10, 1]		// F
				,[8, 12, 15]	// G
				,[1, 3, 5]	// C
				,[3, 6, 10, 12]	// Dm7-5
				,[4, 6, 10, 11]	// Bm7-5
			];
			return patterns[cord[1] % patterns.length];
		},
		elePi: function(c) {
			var p = mouse.p;
			var cord = Grid.toCordinate(p);
			var pattern = this.code(cord);
			
			var magicNumber = Math.pow(Math.E, Math.log(2) / 12);
			var q = pattern[cord[0] % pattern.length];
			var freq = Math.pow(magicNumber, q) * 440;
			var x = q / 24;
			var y = (c % 128) / 128;
			var hue = (cord[1] % 6) / 6;
			Score.add(new Note([x, y], genSquare.curry(freq), 0, 0.45, 256, hue));

		},
		synth: function(c) {
			var p = mouse.p;
			var cord = Grid.toCordinate(p);
			var pattern = this.code(cord);
			
			var magicNumber = Math.pow(Math.E, Math.log(2) / 12);
			var q = pattern[pattern.length.rand()] + [0, 12, 36, 72].randomSelect();
			var freq = Math.pow(magicNumber, q) * 330;
			Score.add(new Note(0, genBass.curry(freq), 0, 0.1, 1.0));
		},
		myon: function(c) {
			var p = mouse.p;
			var cord = Grid.toCordinate(p);
			var pattern = this.code(cord);
			
			var magicNumber = Math.pow(Math.E, Math.log(2) / 12);
			var q = pattern[pattern.length.rand()];
			var freq = Math.pow(magicNumber, q) * 220;
			Score.add(new Note(0, genSuperSin.curry(freq), 0, 0.08, 1));
		},
	};

	function genSquare(freq, volume) {
		var seek = 0;
		var pos = 0;
		return function(buffer, sampleRate, size) {
			var step = freq * Math.PI / sampleRate;
			for(var i = 0; i < size; i++) {
				pos += step;
				var e = Math.cos(seek / 4000 - 0.1);
				var e = (4000 - seek) / 4000;
				e *= e;
				buffer[i] += (Math.sin(pos) < 0 ? -1 : 0) * (e < 0 ? 0 : e) * volume;
				seek++;
			}
			return seek < 4000;
		};
	}

	function genBass(freq, volume) {
		var seek = 0;
		var pos = 0;
		return function(buffer, sampleRate, size) {
			var step = freq * Math.PI / sampleRate;
			for(var i = 0; i < size; i++) {
				pos += step;
				var e = (3000 - seek) / 4000;
				buffer[i] += (Math.sin(pos) + Math.sin(pos * 1.001)) * (e < 0 ? 0 : e) * volume;
				seek++;
			}
			return seek < 4000;
		};
	}

	function genSuperSin(freq, volume) {
		var seek = 0;
		var pos = 0;
		return function(buffer, sampleRate, size) {
			var step = freq * Math.PI / sampleRate;
			for(var i = 0; i < size; i++) {
				pos += step;
				var e = (40000 - seek) / 40000;
				var sn = 0;
				for(var j = 0; j < 8; j++) {
					sn += Math.sin(pos * j * 1.025);
				}
				buffer[i] += sn * (e < 0 ? 0 : e) * volume;
				seek++;
			}
			return seek < 40000;
		};
	}

	function genHat(freq, volume) {
		var seek = 0;
		var pos = 0;
		return function(buffer, sampleRate, size) {
			var step = freq * Math.PI / sampleRate;
			for(var i = 0; i < size; i++) {
				pos += step;
				var e = (4000 - seek) / 4000;
				e *= e;
				buffer[i] += Math.random() * (e < 0 ? 0 : e) * volume;
				seek++;
			}
			return seek < 4000;
		};
	}



	(function() {
		var c = 0;
		var lbdown = false;
		d.rgb(0x00, 0x00, 0x00).fillBack();
		var main = function() {
			mouse.flush();
			lbdown = lbdown || mouse.lbdowned || mouse._count > 16;
			// Base
			if(c % 4 === 0) {
				Composer.synth(c);
			}
			// electric-piano(?)
			if(c % 4 === 0 && lbdown) {
				lbdown = false;
				Composer.elePi(c);
			}
			// Kick
			if([0, 16, 20].any(function(x) { return c % 32 === x; })) {
				Score.add(new Note(0, genBass.curry(110), 0, 0.2, 1));
			}
			// Hat
			if(c % 16 === 8) {
				Score.add(new Note(0, genHat.curry(0), 0, 0.16, 1));
			}
			// myo-n
			if(c % 64 === 0) {
				Composer.myon(c);
			}

			d
			 .blend("source-over")
			 .alpha(1.0)
			 .rgb(0x00, 0x00, 0x00)
			 .fillBack()
			;
			Score.act();
			Score.draw();
			EffectManager.act();
			EffectManager.draw();

			c++;

			var lfreq = mouse.p[0] * 10000;
			mixer.lowpass.frequency.value = lfreq;
			var hfreq = mouse.p[1] * 3000;
			mixer.highpass.frequency.value = hfreq;

		};

		window.setInterval(main, 33);
	})();

});
