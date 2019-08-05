window.onload = ->

  # pseude fps control
  (() ->
    lastTime = 0
    org_setTimeout = window.setTimeout
    window.setTimeout = (func, wait) ->
      realWait = if lastTime then wait else wait - (new Date() - lastTime)
      realWait = 1 if realWait <= 0
      lastTime = +new Date()
      org_setTimeout(func, realWait)
  )()

  # audio loader
  loadAudio = () ->
    sacrifice = document.createElement('audio')
    if not sacrifice
      alert('Your browser does not support <audio>!')
      return

    checkSupportFor = (type) ->
      cpt = sacrifice.canPlayType(type)
      return (cpt isnt "no") && (cpt isnt "")

    supports_mp3 = checkSupportFor("audio/mp3")
    supports_ogg = checkSupportFor("audio/ogg")

    if not (supports_mp3 or supports_ogg)
      alert('Your browser supports neither mp3 nor ogg!')
      return

    # load audio
    instruments =
      ["hat", "snare", "bass"].map (e) ->
        return new Audio("../se/" + e + (if supports_ogg then ".ogg" else ".mp3"))

    instruments.each (e) ->
      e.addEventListener "canplay", () ->
        e.playable = true
      , true
      e.load()

    return instruments


  # create instance of my lib
  d = new DCore()

  measure = 32


  # material
  class Material
    constructor: ->
      [@p] = $A(arguments)
      @count = 0
    act: ->
      @count++
      #@p[1] -= 0.001 + @count * 0.0001
    draw: ->

  # circle type
  class MaterialA extends Material
    draw: ->
      if @count < 4
        @model = $R(0, 5).map (e) ->
          [0, 1].rotate((100.0).randf())
      size = if @count > 4 then 0.1
      else 0.1 + 0.1 * (0.5 - @count / 4).randf()
      d
       .rgb(0x00, 0x00, 0x00)
       .lineWidth(0.01)
       .line(@model.scale(size.arize(2)).translate(@p))
       .stroke()

  # triangle
  class MaterialB extends Material
    draw: ->
      if @count < 4
        @model = $R(0, 2).map (e) ->
          [0, 1].rotate(e.toRadian() / 3 + (2.0).randf())
      size = if @count > 4 then 0.1
      else 0.1 + 0.1 * (0.5 - @count / 4).randf()

      d
       .rgb(0x00, 0x00, 0x00)
       .quads(@model.scale(size.arize(2)).translate(@p))
       .fill()

  # mojamoja type
  class MaterialC extends Material
    draw: ->
      size = if @count > 4 then 0.1
      else 0.1 + 0.1 * (0.5 - @count / 4).randf()
      d
       .rgb(0x00, 0x00, 0x00)
       .circle(@p, size)
       .fill()

  # manager of material
  class MaterialManager
    constructor: ->
      @ms = []
    registor: (e) ->
      @ms.push(e)
    act: ->
      @ms.invoke("act")
      @ms = @ms.select (e) ->
        e.count < 18
    draw: ->
      @ms.invoke("draw")


  # note
  class Note
    constructor: ->
      @active = false
      [@ps, @xy] = $A(arguments)
    act: ->
    draw: ->
      d
       .quads(@ps)
       .rgb((if @active then 0x99 else 0xcc).arize(3))
       .fill()
       .rgb(0xff.arize(3))
       .lineWidth(0.003)
       #.stroke()
    isInBound: (p) ->
      @ps[0][0] <= p[0] <= @ps[1][0] and
      @ps[1][1] <= p[1] <= @ps[2][1]
    flipFlop: ->
      @active = not @active
    invoke: ->
      if @active
        inst = instruments[@xy[0] % 4][@xy[1]]
        if inst.playable
          inst.play()
        cstr = [MaterialA, MaterialB, MaterialC][@xy[1]]
        mm.registor(new cstr([(1.0).randf(), (0.8).randf()]))


  # score
  class Score
    FineSeekMax = 128
    NoteHeight = 0.03
    NoteTypes = 3
    constructor: ->
      # for notes
      margin = 0.02
      size = (1 - margin * 2) / measure
      @notes = $R(0, NoteTypes, true).map (y) ->
        $R(0, measure, true).map (x) ->
          note = new Note(Geo.rect().scale([size * 0.8, NoteHeight]).translate([margin + size * x, 0.87 + NoteHeight * y * 1.5]), [x, y])
          if (x + y * 2) % 4 is 0 and y
            note.flipFlop()
          note
    act: ->
      @cnt ?= 0
      @cnt++
      @fineSeek ?= 0
      @fineSeek++
      @fineSeek %= FineSeekMax
      @seek = ~~(@fineSeek * measure / FineSeekMax)
      if @fineSeek % (FineSeekMax / measure) is 0
        @notes.zipWithIndex (e, i) =>
          e[@seek].invoke()
    draw: ->
      h = 0.84
      # fill back
      d
       .blend("source-over")
       .alpha(0.7)
       .rgb(0xee, 0xee, 0xee)
       .quads([[0, h], [1, h], [1, 1], [0, 1]])
       .fill()

      # separator
      d
       .alpha(1)
       .rgb(0x99, 0x99, 0x99)
       .lineWidth(0.005)
       .line([[0, h], [1, h]])
       .stroke()
       .line([[0, h + 0.01], [1, h + 0.01]])
       .stroke()

      # seek bar
      d
       .rgb(0x00, 0x00, 0x00)
       .quads(Geo.rect().scale([0.01, 0.01]).translate([0.02 + @fineSeek / FineSeekMax * 0.96, h]))
       .fill()

      # notes
      @notes.flatten().each (e) ->
        e.draw()
    click: (p) ->
      # notes control
      @notes.flatten().select (e) ->
        e.isInBound(p)
      .each (e) ->
        e.flipFlop()



  mm = new MaterialManager()
  score = new Score()

  instruments = []
  instruments[0] = loadAudio()
  instruments[1] = loadAudio()
  instruments[2] = loadAudio()
  instruments[3] = loadAudio()

  # ovserve mouse
  document.addEventListener "click", (e) ->
    px = e.clientX / d.width - d.left2d
    py = e.clientY / d.height - d.top2d
    score.click([px, py])
  , true

  # main loop
  main = (c = 0) ->

    # init background
    d
     .rgb(0xff, 0xff, 0xff)
     .fillBack()

    # act
    score.act()
    mm.act()

    # score control
    mm.draw()
    score.draw()

  setInterval(main, 33)
