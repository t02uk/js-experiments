window.onload = ->

	# install pseude fps control
	(() ->
		lastTime = 0
		org_setTimeout = window.setTimeout
		window.setTimeout = (func, wait) ->
			realWait = if lastTime then wait else wait - (new Date() - lastTime)
			realWait = 1 if realWait <= 0
			lastTime = +new Date()
			org_setTimeout(func, realWait)
	)()

	# create my lib
	d = new DCore()

	# create texture (a wraper function for load image):w
	createTexture = (src, width, height) ->
		image = new Image
		image.src = src
		image.width = width
		image.height = height
		image

	# stage
	class Stage
		constructor: ->
			@camp = [0.1, 0]
			@camw = 1
			@mTex = @genMountainTexture()

		genMountainTexture: ->

			mountain = $R(0, 127).map (x) ->
				return [x / 127, 0.9]

			z = 0.5
			64 .times (i) ->
				z = (z + pelinNoise(6)) / 2
				mountain[i +  0][1] -= z
				mountain[i + 64][1] -= z

			mountain[  0][1] = 
			mountain[ 63][1] = 
			mountain[ 64][1] = 
			mountain[127][1] = 0.7
			mountain.push([1, 1])
			mountain.push([0, 1])

			sd = d.subTexture(512, 256)
			sd
				.rgb([0x11, 0x22, 0x66])
				.quads(mountain)
				.fill()

			sd

		delegateDraw: (absolute, fn) ->
			if absolute
				s = [0, 0]
			else
				s = @camp.scale(-1, 1)

			if @shockCount > 0
				f = $R(-1, 1).randf() * @shockCount
				s = s.add([$R(-1, 1).randf() * @shockCount * 0.01, $R(-1, 1).randf() * @shockCount * 0.01])

			d
			 .save()
			 .translate(s)
			 .tap(fn)
			 .restore()
		# shake screen
		shock: ->
			@shockCount = 4
		# damaged (screen background fill with red)
		damaged: ->
			@damagedCount = 2
		captureHands: (hand1, hand2) ->
			@hand1 = hand1
			@hand2 = hand2
		reset: ->
			@camp[0] = (@hand1.p[0] + @hand2.p[0]) / 2 - @camw / 2
		act: ->
			# adjust camera position
			[@hand1.p[0], @hand2.p[0]].each (x) =>
				if x - 0.2 < @camp[0]
					@camp[0] = (x - 0.2 + @camp[0]) / 2
				if x + 0.2 > @camp[0] + @camw
					@camp[0] = (x + 0.2 + @camp[0] - @camw) / 2
			@shockCount--
			@damagedCount--
		draw: ->
			@delegateDraw true, () =>

				# back
				d
				 .gradient([0, 0], [0, 1], [
						[0,  [0x33, 0x33, 0x66]],
						[1,  [0x44, 0x44, 0xaa]]
					])
				 .rect([0, 0.0], [1, 1.0])
				 .fill()

				# stars
				rnd = randomGen()
				300 .times (x) =>
					x = [4 * rnd() - @camp[0] + 65536]
					x = x % 4
					p = [x, rnd() * 0.9]
					v = 1 - p[1] + rnd() * 0.3
					s = rnd() * 0.003 + 0.002
					d
					 .rgb(v * 0xff, v * 0xff, v * 0x99)
					 .circle(p, s)
					 .fill()

				# draw far mountain
				x = (@camp[0] * 0.1 + 12345) % 0.5 + 0.25
				d
				 .blend("source-over")
				 .alpha(0.3)
				 .drawImage(@mTex, 
				  [x, 0.5], [0.2, 0.5],
					[0, 0.5], [1, 0.4]
				 )

				# draw middle range mountain
				x = (@camp[0] * 0.075 + 12345.1) % 0.5 + 0.25
				d
				 .blend("source-over")
				 .alpha(0.5)
				 .drawImage(@mTex, 
				  [x, 0.5], [0.2, 0.5],
					[0, 0.5], [1, 0.5]
				 )

				# draw near mountain
				x = (@camp[0] * 0.05 + 12345.2) % 0.5 + 0.25
				d
				 .blend("source-over")
				 .alpha(1.0)
				 .drawImage(@mTex, 
				  [x, 0.4], [0.2, 0.6],
					[0, 0.5], [1, 0.6]
				 )

				# floor
				 .gradient([0, 0.9], [0, 1], [
						[0,  [0x33, 0x33, 0x44]],
						[1,  [0x77, 0x66, 0x99]]
					])
				 .rect([0, 0.9], [1, 0.1])
				 .fill()

				# fill back with red when damaged
				if @damagedCount > 0
					d
					 .rgb(0xff, 0x00, 0x00)
					 .fillBack()


	# Pose
	Pose =
		Rock: 0
		Scissors: 1
		Paper: 2
		Size: 3

  # base class for Player and Cpu
	class Hand
		constructor: (x, direction) ->
			@life = 256
			@s = [0.15, 0.15]
			@p = [x, 0.98 - @s[1]]
			# direction(-1: left, 1:right)
			@direction = direction
			# normal speed (
			@sp = 0.01
			# dashe speed
			@dasheSp = 0.00
			# knockback speed
			@knockBackSp = 0.00
			# pose
			@pose = Pose.Rock
			# reflection count
			@reflectCnt = 0
			# load images
			@images = [
				createTexture("http://jsrun.it/assets/a/H/C/r/aHCrM.png", 169, 169),
				createTexture("http://jsrun.it/assets/a/r/G/j/arGjf.png", 166, 195),
				createTexture("http://jsrun.it/assets/5/R/8/k/5R8kA.png", 180, 180)
			]
			# set default will
			@willTo("nop")
			# death count
			@knockOutCnt = 0
		captureJudgement: (judgement) ->
			@judgement = judgement
		captureEnemy: (enemy) ->
			@enemy = enemy
		damage: ->
			#if @dasheSp > 0.1
			ss = 2
			if @enemy.dasheSp > 0.002
				ss *= 2.0
			if @dasheSp > 0.002
				ss *= 4.0
			@life -= 8 * ss
		act: ->
			# check life
			if @life < 0 and @reflection isnt ""
				@reflectTo("knockOut", 10)
			if @enemy < 0 and @reflectTo isnt ""
				@reflectTo("nop", 3)

			@dasheSp *= 0.7
			@knockBackSp *= 0.7
			@reflectCnt--
			if @reflectCnt > 0
				Hand.prototype[@reflection].apply(this, null)
			else
				Hand.prototype[@will].apply(this, null)

			@p[0] += @dasheSp
			@p[0] += @knockBackSp
		reborn: ->
			@p[0] = @enemy.p[0] + @enemy.direction * 0.7
			@p[1] = 0.08 - 0.15
			@reflectTo("reborning", 10)
			@heal()
		heal: ->
			@life = 256
			@knockOutCnt = 0
		reborning: ->
			@p[1] += 0.1
		willTo: (will) ->
			@will = will
		reflectTo: (reflection, reflectCnt) ->
			@reflection = reflection
			@reflectCnt = reflectCnt
		# transform to pose state
		transform: (pose) -> 
			@pose = pose
		# no operation (dummy phase)
		nop: ->
		dashe: ->
			if @dasheSp.abs() < 0.01
				@dasheSp += 0.08 * @direction
		backSteppo: ->
			if @dasheSp.abs() < 0.01
				@dasheSp -= 0.04 * @direction
		moveBack: ->
			@p[0] +=-@sp * @direction
		moveFront: ->
			@p[0] += @sp * @direction
		weakKnockBack: ->
			@knockBackSp = -0.05 * @direction
			@reflectTo("nop", 3)
		knockBack: ->
			@knockBackSp = -0.1 * @direction
			@reflectTo("nop", 3)
		knockOut: ->
			# i can fly!
			@p[0] -= 0.05 * @direction
			@p[1] -= 0.05
			@knockOutCnt++
		draw: ->
			d
			 .drawImage(@images[@pose], [0, 0], [1, 1], @p, @s)

	# janken judge result
	Judge =
		Draw: 0
		Lose: 1
		Win: 2

	# judge a win/draw/lose
	class Judgement
		constructor: ->
			@se_lose = new Audio("http://dl.dropbox.com/u/3589634/resource/se/se_lose.ogg")
			@se_draw = new Audio("http://dl.dropbox.com/u/3589634/resource/se/se_draw.ogg")
			@se_win = new Audio("http://dl.dropbox.com/u/3589634/resource/se/se_win.ogg")
		playOgg: (audio) ->
			if audio.currentTime
				audio.pause()
				audio.currentTime = 0
			audio.play()
		judge: (self, enemy) ->
			(self.pose - enemy.pose + Pose.Size) % Pose.Size
		tellMeHowToWin: (enemy) ->
			(enemy.pose + 2 + Pose.Size) % Pose.Size
		tellMeHowToLose: (enemy) ->
			(enemy.pose + 1 + Pose.Size) % Pose.Size
		captureHands: (hand1, hand2) ->
			@hand1 = hand1
			@hand2 = hand2
		captureStage: (stage) ->
			@stage = stage
		hitTest: ->
			# be collisioned!
			if (@hand1.p[0] - @hand2.p[0]).abs() < (@hand1.s[0] + @hand2.s[1]) / 2 / 2
				signBase = (@hand1.p[0] - @hand2.p[0]).sign()
				# judge
				result = @judge(@hand1, @hand2)
				if result is Judge.Draw
					@hand1.knockBack()
					@hand2.knockBack()
					@playOgg(@se_draw)
				else if result is Judge.Lose
					@hand1.knockBack()
					@hand1.damage()
					@hand2.weakKnockBack()
					@stage.shock()
					@stage.damaged()
					@playOgg(@se_lose)
				else if result is Judge.Win
					@hand1.weakKnockBack()
					@hand2.knockBack()
					@hand2.damage()
					@stage.shock()
					@playOgg(@se_win)


	# Player class
	class Player extends Hand
		constructor: ->
			super(0.1, 1)

	# Cpu class
	class Cpu extends Hand
		constructor: ->
			# action
			@willTo("moveFront")
			# if this value is 0, make decision
			@nextDecition = 0
			@setParam()

			super(0.7, -1)
		setParam: (clock=12,p1=5, p2=5,p3=0.1) ->
			@clock = 12
			@p1 = p1
			@p2 = p2
			@p3 = p3
		willTo: (will) ->
			super(will)
		makeDecision: ->
			simulate = @judgement.judge(this, @enemy)
			if simulate is Judge.Lose
				if not (@clock * @p1 * 1 .rand())
					@pose = @judgement.tellMeHowToWin(@enemy)
				
			distance = (@enemy.p[0] - @p[0]).abs()
			# dashe
			if distance > 0.8
				if 1 .randf() < 0.5
					@willTo("dashe")
			else if distance.abs() > 0.3
				if 1 .randf() < 0.2
					# hardly back step
					@willTo("moveBack")
				else
					@willTo("moveFront")
			else
				# in range dashe or back
				if 1 .randf() < @p3
					@willTo("dashe")
				else
					@willTo("moveBack")
					# and transform to lose pose randomly
					if 1 .randf() < @p2
						@pose = @judgement.tellMeHowToLose(@enemy)

			# override will randomly
			if 1 .randf() < 0.1
				@willTo("moveBack moveFront dashe moveBack nop".split(" ").randomSelect())

			# change pose randomly
			if 1 .randf() < 0.1
				@transform([Pose.Rock, Pose.Scissors, Pose.Paper].randomSelect())
		act: ->
			# decision time
			if @nextDecition <= 0
				@makeDecision()
				@nextDecition += @clock * $R(0, 2).rand()

			@nextDecition--

			if @p[0] < @enemy.p[0]
				@p[0] = @enemy.p[0] + 0.01

			super


	# phase a base class of vary phase...?
	class Phase
		activateFrom: (from) ->
			@kb = from.kb
			@judgement = from.judgement
			@player = from.player
			@cpu = from.cpu
			@stage = from.stage
			@lv = from.lv

	# dummy phase for initializing instances variables
	class PhaseInitialize extends Phase
		initialize: ->
			@kb = new Keyboard()
			'37 39 X Y Z V'.split(' ').each (x) =>
				@kb.at(x).enablePrevent()

			# create instances
			@judgement = new Judgement()
			@player = new Player()
			@cpu = new Cpu()
			@stage = new Stage()

			# set up
			@player.transform(Pose.Rock)
			@cpu.transform(Pose.Rock)

			@judgement.captureHands(@player, @cpu)
			@judgement.captureStage(@stage)
			@player.captureJudgement(@judgement)
			@player.captureEnemy(@cpu)
			@cpu.captureJudgement(@judgement)
			@cpu.captureEnemy(@player)
			@stage.captureHands(@player, @cpu)

			@lv = 1

	# on opening phase
	class PhaseOpening extends Phase
		initialize: ->
			@stage.reset()
			ps = [
				[5, 2, 0.1],
				[8, 2, 0.1],
				[5, 4, 0.1],
				[5, 2, 0.2],
			].randomSelect()
			@cpu.setParam(128 / (@lv + 8), ps[0], ps[1], ps[2])
			@count = 0
			@maxFrame = 40

			@prefix = ""

		main: ->
			@kb.flush()
			# init background
			@stage.act()
			@stage.draw()

			@player.willTo("nop")

			# act
			if @kb.at(37).pressing
				@player.willTo("moveBack")

			# right key
			if @kb.at(39).pressing
				@player.willTo("moveFront")

			@player.act()
			@cpu.act()

			# draw player, cpu
			@stage.delegateDraw false, () =>
				@player.draw()
				@cpu.draw()

			@count++

			# draw title
			d
			 .rgb(0x00, 0x00, 0x00)
			 .alpha(0.5)
			 .blend("source-over")
			 .rect([0, 0.4], [1, 0.2])
			 .fill()

			# VS
			d
			 .alpha(1)
			 .rgb(0xff, 0xff, 0xff)
			 .textBaseline("middle")
			 .textAlign("center")
			 .font("cursive", 0.2, "italic")
			 .fillText("VS - " + "LV." + @lv, [0.5, 0.5])


			len = @count / @maxFrame
			d
			 .alpha(0.5)
			 .rgb(0xff, 0x00, 0x00)
			 .rect([1 - len, 0.4], [len, 0.01])
			 .fill()
			 .rect([0, 0.6], [len, 0.01])
			 .fill()

			# reset
			d
			 .alpha(1)

			if @count > @maxFrame
				return new PhaseFighting()


			this

	# on fighting phase
	class PhaseFighting extends Phase
		
		initialize: ->

		main: ->

			@kb.flush()

			# init background
			@stage.act()
			@stage.draw()

			## user control

			# default
			@player.willTo("nop")

			# left key
			if @kb.at(37).pressing
				if @kb.at('V').downed
					@player.willTo("backSteppo")
				else
					@player.willTo("moveBack")

			# right key
			if @kb.at(39).pressing
				if @kb.at('V').downed
					@player.willTo("dashe")
				else
					@player.willTo("moveFront")

			# pose
			if @kb.at('Z').downed
				@player.transform(Pose.Rock)
			if @kb.at('X').downed
				@player.transform(Pose.Scissors)
			if @kb.at('C').downed
				@player.transform(Pose.Paper)

			# player phase
			@player.act()
			# cpu phase
			@cpu.act()

			# draw player, cpu
			@stage.delegateDraw false, () =>
				@player.draw()
				@cpu.draw()

			@judgement.hitTest()

			# show life
			@stage.delegateDraw true, () =>
				# player
				d
				 .blend("source-over")
				 .alpha(0.8)
				 .gradient([0, 0], [1, 0], [
					 [0, [0xff, 0x00, 0x00]],
					 [1, [0x99, 0x99, 0xff]],
				 ])

				# player
				d
				 .rect([0, 0.02], [@player.life / 256, 0.01])
				 .fill()

				# cpu
				d
				 .rect([0.0, 0.05], [@cpu.life / 256, 0.01])
				 .fill()

				# reset draw mode
				d
				 .blend("source-over")
				 .alpha(1.0)


			# observe knock out
			# reborn and goto opening phase on counter is over

			# player won
			if @cpu.knockOutCnt > 45
				@cpu.reborn()
				@player.heal()
				@cpu.heal()
				@lv++
				new PhaseOpening()
			# cpu won
			else if @player.knockOutCnt > 45
				@player.reborn()
				@player.heal()
				@cpu.heal()
				@lv -= 3
				@lv = 1 if @lv <= 0
				new PhaseOpening()
			else
				this


	prevPhase = new PhaseInitialize()
	prevPhase.initialize()
	phase = new PhaseOpening()

	# main loop
	main = (c = 0) ->
		if(phase isnt prevPhase)
			phase.activateFrom(prevPhase)
			phase.initialize()
		prevPhase = phase
		phase = phase.main()
		setTimeout(arguments.callee.curry(c + 1), 33)

	main()

# vim:sw=2:ts=2
