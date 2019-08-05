(function() {
	var d = new DCore();
	var mouse = new Mouse(d);

    // カイルや冴子先生のようなもの(廃止)
    /*
	function F1() {
		this.phase = 0;
		this.count = 0;
	}

	F1.prototype = {
		onInitial: function() {
			this.phase = 0;
			this.onPhaseChange();
		},
		onClickDot: function() {
			if(this.phase < 1) {
				this.phase = 1;
				this.onPhaseChange();
			}
		},
		onClickPad: function() {
			this.phase = 2;
			this.onPhaseChange();
		},
		onPhaseChange: function() {
			this.count = 0;
		},
		act: function() {
			this.count++;
		},
		draw: function() {
			var texts = [
				"> Click the any dot.",
				"> And Let's drag(or just click) pad!",
				"> That's all.",
			];

			var text = texts[this.phase];

			var allLen = text.length;
			var text = text.substr(0, this.count);
			var display = true;
			if(this.count < allLen) {
				// add _ in displaying phase
				text += "_";
			} else {
				var past = this.count - text.length;
				// blink
				if(past < 16 && past % 8 < 4) {
					display = false;
				}
			}

			if(display) {
				d
					.rgb(0x99, 0x99, 0x99)
					.font("monospace", 0.04, "bold")
					.fillText(text, [0.02, 0.02])
					.stroke()
				;
			}
		}
	}
	*/

    // シンセサイザークラス
    // (どちらかというとミキサー)
	var Synth = {
        // 初期化処理
		initialize: function() {
			this.wg = new WaveGenerator();
			this.wave = [];
		},
        // 音を再生(やや汎用的)
		playSlave: function(freq) {
            // メモ化してなかった音データをつくる
			if(!this.wave[freq]) {
				var envelove = function(x) {
					var z = x * Math.PI * 2;
					return Math.cos(z) * Math.cos(z);
				};
				this.wave[freq] = this.wg.clean().sin(freq, 0.1, this.wg.flatdown).build();
			}
            // 再生
			this.wave[freq].stop();
			this.wave[freq].play(0.2);
		},
        // Ballクラスから呼び出される
		playBall: function(ball) {
            // ボールの位置から周波数を計算
			var freqTn = ball.p[0] * 48;
            // Webで検索 [平均律]
			var magicNumber = Math.pow(Math.E, Math.log(2) / 12);
            // 周波数
			var freq = Math.pow(magicNumber, freqTn) * 220;
			return this.playSlave(~~freq);
		},
	};
	Synth.initialize();


    // ヘルパークラス。下記を束ねる
    // -画面に並ぶ点(Dot)
    // -オブジェクト(Pad)
	var helper = {
        // 初期状態
		PhaseInitial: 0,
        // Dotがひとつ以上クリックされている
		PhaseDotClicked: 1,
        // Padがクリックされている
		PhasePadClicked: 2,
        // Padが離された
		PhasePadReleased: 3,
		phase: 0,
		initialize: function() {
			this.dotId = 0;
			this.frame = 0;
		},
        // DotIdを採番する
        // ボールを具象化時に、ボールを生成する順番を決めるために使用する
		numberingDotId: function() {
			this.dotId++;
			return this.dotId;
		},
        // 引数(何フレームで頂点から床まで落とすか)から、
        // 重力加速度、高さを算出する
		calculateGravityAndHeight: function(frame) {
			var g = 0.02 / frame * 1.05;
			return [g, 1 - ((g * frame * (frame - 1) / 2) * 1.0) * 1.01];
		},
        // Frames
		frames: [64, 32, 16, 8],
        // Act
		act: function() {
			this.frame++;
			// フェーズをコントロール
            // 
			if(this.phase === this.PhaseInitial) {
                // 何かしらドットがおされたなら
				if(this.dots.flatten().any(function(x) { return x.active; })) {
					this.phase = this.PhaseDotClicked;
				}
			}
			if(this.phase === this.PhaseDotClicked) {
                // ドットがすべてアンアクティブな状態
				if(!this.dots.flatten().any(function(x) { return x.active; })) {
					this.phase = this.PhaseInitial;
                // パッドがホバーされている、かつクリック状態
				} else if(this.pad.isHovered() && mouse.lbdowned) {
					this.phase = this.PhasePadClicked;
				}
			}
			if(this.phase === this.PhasePadClicked) {
                // ボールを撒き散らせる
				if(this.pad.isReadyForScatter()) {
					this.phase = this.PhasePadReleased;
					this.pad.fadeOut();
				}
			}
			if(this.phase === this.PhasePadReleased) {
                // パッドが終了時→初期状態へ
				if(this.pad.hasDeath()) {
					this.phase = this.PhaseInitial;
				}
			}

			if(this.phase === this.PhaseInitial) {
				this.pad.initialize();
			}
			if(this.phase === this.PhaseInitial
			|| this.phase === this.PhaseDotClicked) {
				this.actDots();
			}
			if(this.phase >= this.PhaseDotClicked) {
				//kairuKun.onClickDot();
				this.actPad();
			}
			if(this.phase >= this.PhasePadClicked) {
			}
			if(this.phase == this.PhasePadReleased) {
				this.scatterBalls();
				this.actPad();
			}
		},
		draw: function() {
			this.drawDots();
			if(this.phase >= this.PhaseDotClicked) {
				this.drawPad();
			}
			if(this.phase >= this.PhasePadClicked) {
			}
		},
		actDots: function() { 
			this.dots.flatMap(function(dot) {
				dot.act();
			});
		},
		drawDots: function() {
			this.dots.flatMap(function(dot) {
				dot.draw();
			});
		},
		actPad: function() {
			this.pad.act();
		},
		drawPad: function() {
			this.pad.draw();
		},
        // ボールを撒き散らすメソッド
		scatterBalls: function() {
            // 撒き散らしの長さを特定(０～４を返す）
			var str = ~~(this.pad.scatterStrength() / 16) / 8;
            // 落下時が8フレームの倍数になるようにディレイをかける
			var offset = 8 - this.frame % 8;
            // 選択されているものを取得
			var selected= this.dots.flatten().select(function(x) {
				return x.active;
			});
            // フレーム数の最大を取得
			var maxFrame = selected.max(function(x) {
				return x.frame;
			});
            // dotId(選択された順番にソートして処理を行う)
			selected.sortBy(function(x) {
				return x.dotId;
			}).zipWithIndex(function(x, i) {
                // delay (dotId順序 * 撒き散らし速度 + オフセットディレイ)
				var delay = i * str * maxFrame + (maxFrame - x.frame) + offset;
                // 上記ディレイ分のフレーム数後にボールが追加されるように処理する
				li.add(function() {
					BallManager.add(new Ball(x.p[0], x.frame));
				}, delay);
				x.active = false;
			});
		},
	};
	helper.initialize();

    // Dot(画面の点)
	helper.Dot = function(p, frame){
		this.p = p;
		this.frame = frame;
		this.r = 0.02;
		this.hoverSize = 0.018;
		this.hoverCount = 0;
		this.active = false;
		this.hovered = false;
		this.dotId = 0;
	};
	helper.Dot.prototype = {
		act: function(click) {
			if(this.isHovered()) {
                // ホバー時、アニメーションの制御
				this.hoverCount++;
				if(this.hoverCount < 6) {
					this.r = Math.sin(this.hoverCount / 3 * Math.PI / 2) * 0.02 + 0.01;
					if(this.r < 0) this.r = 0.01;
				} else {
					this.r = 0.03;
				}
                // クリック時にアクティブ＜ー＞アンアクティブを制御
				if(mouse.lbdowned) {
					this.dotId = helper.numberingDotId();
					this.r *= 0.5;
					this.active ^= true;
				}
			} else {
                // ホバーされてない場合もアニメーション(しぼむ感じに)
				this.hoverCount = 0;
				this.r *= 0.8;
				if(this.r < 0.01) this.r = 0.01;
			}
		},
		draw: function() {
			var color = [0xcc, 0xcc, 0xcc];
			if(this.active) color = [0x00, 0x00, 0x00];
			d
			 .rgb(color)
			 .circle(this.p, this.r)
			 .fill()
			;
		},
		isHovered: function() {
			return this.p.distance(mouse.p) < this.hoverSize;
		},
		handleClick: function() {
		},
	};
	helper.dots = function() {
		return $R(0, 24).map(function(x) {
			return helper.frames.map(function(f) {
				var p = [x / 25 + 1 / 24 / 2, helper.calculateGravityAndHeight(f)[1]];
				return new helper.Dot(p, f);
			})
		});
	}();


    // Pad(画面中央に出てくる奴)
	helper.Pad = function() {
		this.initialize();
	}
	helper.Pad.prototype = {
		initialize: function() {
			this.r = 0.0;
			this.p = [0.5, 0.5];
			this.count = 0;
			this.hoverSize = 0.05;
			this.clickCount = 0;
			this.fadeOuting = false;
		},
		act: function() {
			this.r *= 0.65;
			this.r += 0.04;
			if(this.fadeOuting) {
				this.fadeOutCount++;
			} else if(this.isHovered() && mouse.lbdown) {
				this.clickCount++;
			}
		},
		draw: function() {
			var sc = this.clickCount % 16;
			var c = [0x99, 0x99, 0x99];
			if(this.isHovered()) c = [0x00, 0x00, 0x00];
			if(this.fadeOuting) {
				var a = this.fadeOutCount * 16;
				c = [a, a, a];
				this.r *= 0.5;
			}

			this.count++;
			if(sc === 0) {
				this.r *= 0.9;
			}
			d
			 .rgb(c)
			 .circle(this.p, this.r)
			 .fill()
			;

			if(this.clickCount > 0) {
				d
				 .lineWidth(0.02)
				 .rgb(0xff, 0xff, 0xff)
				 .circle(this.p, this.r * 0.8, 0.0, Math.PI * 2 * this.clickCount / 64)
				 .stroke()
				;
			}
		},
		isHovered: function() {
			return this.p.distance(mouse.p) < this.hoverSize;
		},
		isReadyForScatter: function() {
			return !this.isHovered() || !mouse.lbdown || this.clickCount >= 64;
		},
		fadeOut: function() {
			this.fadeOuting = true;
			this.fadeOutCount = 0;
		},
		hasDeath: function() {
			return this.fadeOuting && this.fadeOutCount > 16;
		},
		scatterStrength: function() {
			return this.clickCount;
		},
	};
	helper.pad = new helper.Pad();



    // Ball (弾んでる奴)
	function Ball(x, frame) {
		this.p = [x, 0.1];
		var work = helper.calculateGravityAndHeight(frame);
		this.g = work[0];
		var h = work[1];
		this.p[1] = h;
		this.sp = [0, this.g];
		this.c = 1;
		this.count = 0;
	}
	Ball.prototype = {
		act: function() {
			this.count++;
			this.p = this.p.translate(this.sp);
			if(this.p[1] > 1) {
				this.c = 1;
				this.sp[1] *= -1;
				Synth.playBall(this);
			} else {
				this.c++;
				this.sp = this.sp.add([0, this.g]);
			}
			// FIXME ゴリ押し
            // (落下からバウンド、初期位置に戻るまでのフレーム数が奇数フレームになってしまい、都合が悪いため
            // 頂点に達した場合は1フレーム飛ばす)
			if(0 <= Math.abs(this.sp[1]) && Math.abs(this.sp[1]) <= this.g / 2) {
				this.c--;
				this.act();
			}
		},
		draw: function() {
			d
			 .rgb(0x00, 0x00, 0x00)
			 .circle(this.p, 0.01)
			 .fill()
			;
		},
		alive: function() {
			return this.count < 1024;
		},
	};

	var BallManager = {
		initialize: function() {
			this.balls = [];
		},
		act: function() {
			var killed = this.balls.select(function(x) {
				return !x.alive();
			});
			killed.each(function(x) {
				EffectManager.add(new Effect(x.p));
			});

			this.balls = this.balls.select(function(x) {
				return x.alive();
			});
			this.balls.each(function(ball) {
				ball.act();
			});
		},
		draw: function() {
			this.balls.each(function(ball) {
				ball.draw();
			});
		},
		add: function(ball) {
			this.balls.push(ball);
		},
	};


	function Effect(p) {
		this.count = 0;
		this.p = p.clone();
	}
	Effect.prototype = {
		act: function() {
			this.count++;
		},
		draw: function() {
			if(this.count > 7) return;
			var a = this.count / 7;
			a *= a * 2;
			var ar = 1 - a;
			var s = 0.03;
			d
			 .lineWidth(ar * s / 1)
			 .rgb(0x00, 0x00, 0x00)
			 .circle(this.p, a * s + 0.01)
			 .stroke()
			;
		},
		alive: function() {
			return this.count < 16;
		},
	};

	var EffectManager = {
		initialize: function() {
			this.effects = [];
		},
		act: function() {
			this.effects.each(function(ball) {
				ball.act();
			});
		},
		draw: function() {
			this.effects.each(function(ball) {
				ball.draw();
			});
		},
		add: function(ball) {
			this.effects.push(ball);
		},
	};
	EffectManager.initialize();

    // LazyInvoke
    // 時間差(フレーム単位)で関数を実行するクラス
	function LazyInvoker() {
		this.task = [];
	}
	LazyInvoker.prototype = {
        // 処理を追加
        // func関数を、frameだけ遅れて実行する
		add: function(func, frame) {
			this.task.push([func, frame]);
		},
        // キューに溜まった関数が指定のフレームに到達した場合実行する
		update: function() {
			this.task.each(function(t) {
				if(t[1] <= 0) {
					t[0]();
				}
				t[1]--;
			});

			this.task = this.task.select(function(t) {
				return t[1] >= 0;
			});
		},
	};

	var li = new LazyInvoker();

	BallManager.initialize();

	//var kairuKun = new F1();


	var main = function() {

		d
		 .rgb(0xff, 0xff, 0xff)
		 .fillBack()
		;
		mouse.flush();

		helper.act();
		helper.draw();

		BallManager.act();
		BallManager.draw();

		li.update();

		EffectManager.act();
		EffectManager.draw();
		//kairuKun.act();
		//kairuKun.draw();
	};
	window.setInterval(main, 33);
})();
// vim:sw=2:ts=2