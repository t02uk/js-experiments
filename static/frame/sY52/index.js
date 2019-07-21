(function() {

	// 配列 -> base64変換
	(function() {
		// 参考 http://github.com/dankogai/js-base64
		var base64Table = (function() {
			var raw = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
			return $R(0, raw.length - 1).map(function(i) {
				return raw.charAt(i);
			});
		})();

		Array.prototype.toBase64 = function() {
			var bt = base64Table;
			var bin = this;
			var padlen = 0;
			while(bin.length % 3) {
				bin.push(0);
				padlen++;
			}

			var b64 = [];
			for(var i = 0, l = bin.length; i < l; i += 3) {
				var c = (bin[i + 0] << 16)
					  | (bin[i + 1] <<  8)
					  | (bin[i + 2] <<  0)
				;
				b64.push(
					bt[(c >>> 18) & 63],
					bt[(c >>> 12) & 63],
					bt[(c >>>  6) & 63],
					bt[(c >>>  0) & 63]
				);
			}

			while(padlen--) b64[b64.length - padlen - 1] = '=';
			return b64.join("");
		};
		String.prototype.charCodes = function() {
			var result = new Array(this.length);
			for(var i = 0, l = this.length; i < l; i++) {
				result[i] = this.charCodeAt(i);
			}
			return result;
		};
		Number.prototype.toBytes = function(size) {
			var size = size || 4;
			var result = new Array(size);
			for(var i = 0; i < size; i++) {
				result[i] = (this >>> (i << 3) & 0xff);
			}
			return result;
		};
	})();


	// Wave Data-Scheme生成用
	//   参考 http://hooktail.org/computer/index.php?Wave%A5%D5%A5%A1%A5%A4%A5%EB%A4%F2%C6%FE%BD%D0%CE%CF%A4%B7%A4%C6%A4%DF%A4%EB
	(function() {
		function Wave(data, seconds) {
			var header = [];

			// サンプリングレート
			var samplingRate = this.samplingRate;
			// チャンネル数
			var chunnels = 1;
			// 量子化ビット数
			var quanizationBits = 8;
			// 再生秒数
			this.seconds = seconds;
			// dataチャンクのサイズ
			var dataSize = this.chunkSize(seconds);

			// RIFFヘッダ

			// ファイルタイプ (0)
			header.push("RIFF".charCodes());
			// ファイルサイズ - 8 (4 - )
			header.push((44 + dataSize - 8).toBytes(4));
			// RIFFのタイプ (8)
			header.push("WAVE".charCodes());

			// fmtチャンク

			// FormatチャンクID　(12)
			header.push("fmt ".charCodes());
			// fmtチャンクのサイズ (16)
			header.push((16).toBytes(4));
			// フォーマットID (20)
			header.push((1).toBytes(2));
			// チャンネル数 (22)
			header.push(chunnels.toBytes(2));
			// サンプリング周波数 (24)
			header.push(this.samplingRate.toBytes(4));
			// データ速度 (28)
			header.push((samplingRate * chunnels * quanizationBits / 8).toBytes(4));
			// ブロックサイズ (32)
			header.push((chunnels * quanizationBits / 8).toBytes(2));
			// 量子化ビット数 (34)
			header.push(quanizationBits.toBytes(2));


			// dataチャンク

			// dataチャンクID (36)
			header.push("data".charCodes());
			// dataチャンクのサイズ (40)
			header.push(dataSize.toBytes(4));

			// ヘッダセット
			this.header = header.flatten();

			// 周波数データセット (44)
			this.data = data;

			return this;

		}
		Wave.prototype = {
			samplingRate: 22050,
			chunnels: 1,
			quanizationBits: 8,
			chunkSize: function(seconds) {
				return ~~((seconds || this.seconds) * (this.samplingRate * this.chunnels * this.quanizationBits / 8));
			},
			build: function() {
				this.base64 = "data:audio/wav;base64," + this.header.concat(this.data).toBase64();
				this.audio = new Audio(this.base64);
				this.audio.load();
				return this;
			},
			play: function(volume) {
				if(!this.audio) this.build();
				if(volume) this.audio.volume = volume;
				this.audio.play();
				return this;
			},
			stop: function() {
				if(this.audio && this.audio.currentTime) {
					this.audio.pause();
					this.audio.currentTime = 0;
				}
			}
		};
		window.Wave = Wave;

		// 波形生成クラス
		function WaveGenerator() {
			this.clean();
			return this;
		};
		window.WaveGenerator = WaveGenerator;

		WaveGenerator.prototype = {
			samplingRate: Wave.prototype.samplingRate,
			minSeconds: 0.033  * 18,    // 最低でも保証する再生秒数(Firefoxなどであまりに短いWAVEファイルは再生されないため)
			clean: function() {
				this.data = [];
				this.phase = 0.0;
				return this;
			},
			build: function(echo) {
				var data = this.data.flatten();
				for(var i = 0, l = data.length; i < l; i++) {
					data[i] = data[i] * 24 + 128;
				}
				// あまったチャンクも無音で埋める
				for(var i = data.length, l = Wave.prototype.chunkSize(this.minSeconds); i < l; i++) {
					data[i] = 128;
				}

				var realSeconds = data.length / this.samplingRate;
				var logicalSeconds = [realSeconds, this.minSeconds].max();
				return new Wave(data, logicalSeconds);
			},
			flat: function() {
				return 1;
			},
			flatdown: function(x) {
				return 1 - x;
			},
			flatup: function(x) {
				return x;
			},
			cos: function(x) {
				return Math.cos(Math.PI / 2.0 * x);
			},
			// freq: 周波数
			// secodns: 秒数
			sin: function(freq, seconds, envelove) {
				envelove = envelove || WaveGenerator.prototype.flat;
				var dataSize = Wave.prototype.chunkSize(seconds);
				var data = new Array(dataSize);
				var phase = this.phase;

				var f = 2.0 * Math.PI / this.samplingRate * freq;
				var d = 1 / dataSize;
				var t = 0;

				var c = 0;
				for(var i = 0; i < dataSize; i++) {
					data[i] = Math.sin(phase) * envelove(d);
					phase += f;
					t += d;
				}

				this.data.push(data);
				this.phase = phase;
				return this;
			},
			// freq: 周波数
			// secodns: 秒数
			square: function(freq, seconds, envelove) {
				envelove = envelove || WaveGenerator.prototype.flat;
				var dataSize = Wave.prototype.chunkSize(seconds);
				var data = new Array(dataSize);
				var phase = this.phase;

				var f = 2.0 * Math.PI / this.samplingRate * freq;
				var d = 1 / dataSize;
				var t = 0;

				var c = 0;
				for(var i = 0; i < dataSize; i++) {
					data[i] = (Math.sin(phase) < 0 ? -1 : 1) * envelove(d);
					phase += f;
					t += d;
				}

				this.data.push(data);
				this.phase = phase;
				return this;
			},
			// freq: 周波数
			// secodns: 秒数
			saw: function(freq, seconds, envelove) {
				envelove = envelove || WaveGenerator.prototype.flat;
				var dataSize = Wave.prototype.chunkSize(seconds);
				var data = new Array(dataSize);
				var phase = this.phase;

				var f = 2.0 * Math.PI / this.samplingRate * freq;
				var d = 1 / dataSize;
				var t = 0;

				var c = 0;
				for(var i = 0; i < dataSize; i++) {
					data[i] = ((phase % (Math.PI * 2)) / (Math.PI * 2)) * envelove(d) - 0.5;
					phase += f;
					t += d;
				}

				this.data.push(data);
				this.phase = phase;
				return this;
			},
			// freq: 周波数
			// secodns: 秒数
			triangle: function(freq, seconds, envelove) {
				envelove = envelove || WaveGenerator.prototype.flat;
				var dataSize = Wave.prototype.chunkSize(seconds);
				var data = new Array(dataSize);
				var phase = this.phase;

				var f = 2.0 * Math.PI / this.samplingRate * freq;
				var d = 1 / dataSize;
				var t = 0;

				var c = 0;
				for(var i = 0; i < dataSize; i++) {
					var m = (phase % (Math.PI * 2)) / (Math.PI * 2);
					data[i] = (m < 0.5 ? m * 2 : 1 - m * 2) * envelove(d) - 0.5;
					phase += f;
					t += d;
				}

				this.data.push(data);
				this.phase = phase;
				return this;
			},
			noise: function(freq, seconds, envelove) {
				envelove = envelove || WaveGenerator.prototype.flat;
				var dataSize = Wave.prototype.chunkSize(seconds);
				var data = new Array(dataSize);
				var phase = this.phase;

				var f = 2.0 * Math.PI / this.samplingRate * freq;
				var d = 1 / dataSize;
				var t = 0;

				var c = 0;
				for(var i = 0; i < dataSize; i++) {
					data[i] = (Math.random() * 2 - 1) * envelove(d) - 0.5;
					phase += f;
					t += d;
				}

				this.data.push(data);
				this.phase = phase;
				return this;
			}
		};
	})();


	// マウス操作をイベントドリブンじゃないかのように振舞わせる
	function Mouse(d) {
		var self = this;
		self._lbdown = false;
		self.__lbdown = false;
		self._px = 0;
		self._py = 0;
		self.p = [0, 0];
		self.op = [0, 0];
		document.addEventListener("mouseup", function(e) {
			self._lbdown = false;
			self._count = 0;
		}, false);
		document.addEventListener("mousemove", function(e) {
			self._px = e.clientX / d.width - d.left2d;
			self._py = e.clientY / d.height - d.top2d;
		}, false);
		document.addEventListener("mousedown", function(e) {
			self._lbdown = true;
			self._count = 0;
		}, false);
	}
	Mouse.prototype = {
		flush: function() {
			this.lbdown = this._lbdown;
			this.p = [this._px, this._py];
			this.sp = this.op.sub(this.p);
			this.op = this.p.clone();
			if(this.lbdown) {
				this._count++;
			}
			this.lbdowned = this._count == 1;
			this.lbupped = this.__lbdown && !this._lbdown;
			this.__lbdown = this._lbdown;
		}
	}
	window.Mouse = Mouse;

	function Key(code) {
		this.code = code;
	}
	Key.prototype = {
		flush: function() {
			this.upped = this._upped;
			this.downed = this._downed;
			this.pressing = this._pressing;

			this._upped = false;
			this._downed = false;
		},
		enablePrevent: function() {
			this.prevent = true;
		},
		disablePrevent: function() {
			this.prevent = false;
		},
		keyup: function() {
			this._upped = true;
			this._pressing = false;
		},
		keydown: function() {
			this._downed = true;
			this._pressing = true;
		},
	};

	function Keyboard() {
		this.keys = $R(1, 255).map(function(x) {
			return new Key(x);
		});

		var self = this;
		document.addEventListener("keyup", function(e) {
			key = self.keys[e.keyCode];
			key.keyup();
			if(key.prevent) {
				e.preventDefault();
				e.returnValue = false;
			}
		}, false);
		document.addEventListener("keydown", function(e) {
			key = self.keys[e.keyCode];
			key.keydown();
			if(key.prevent) {
				e.preventDefault();
				e.returnValue = false;
			}
		}, false);
	}
	Keyboard.prototype = {
		flush: function() {
			this.keys.invoke("flush");
		},
		at: function(key) {
			if(!/\d+/.match(key)) {
				return this.keys[key.charCodeAt(0)];
			} else {
				return this.keys[key];
			}
		},
	};
	window.Keyboard = Keyboard;

	// メモ化
	Object.extend(Function.prototype, {
		memoize: function() {
			var memo = [];
			var fn = this;
			return function() {
				var key = Array.prototype.join.apply(arguments, [","]);
				if(memo[key] === undefined) {
					memo[key] = fn.apply(fn, arguments);
				}
				return memo[key];
			}
		},
	});


	// 再現性のある乱数生成
	var randomGen = function() {
		var x = 1;
		return function(m) {
			m = m || 1;
			x = (x * 22695477 + 1) & 0xffffffff;
			return m * (((x >>> 16) & 0x7fff) / 0x7fff);
		};
	};
	window.randomGen = randomGen;


	var smoothNoise = function(x) {
		return Math.random() * x / 2
			+ Math.random() * (x - 1) / 4
			+ Math.random() * (x + 1) / 4
			;
	};
	var interpolate = function(a, b, x) {
		var ft = x * Math.PI;
		var f =  (1 - Math.cos(ft)) * 0.5;

		return a * (1 - f) + b * f;
	}

	var interpolatedNoise = function(x) {
		var ix = ~~x;
		var fx = (x - ix);

		var v1 = smoothNoise(ix);
		var v2 = smoothNoise(ix + 1);

		return interpolate(v1, v2, fx);
	}

	var pelinNoise = function(x) {
		var total = 0;
		var p = 1.8;
		var n = 1;

		for(var i = 0; i < n; i++) {
			var freq = Math.pow(2.0, i);
			var amplitude = Math.pow(p, i);

			total += interpolatedNoise(x * freq) * amplitude * 0.06;
		}

		return total;
	}
	window.pelinNoise = pelinNoise
})();
// vim:sw=4:ts=4
