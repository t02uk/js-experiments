window.onload = ->

  # load video
  video = document.getElementById("video")

  withVendorPrefix = (obj, member) ->
    obj[member] || ["webkit", "moz", "ms"].inject(undefined, (i, e) ->
      i || obj[e + member.replace(/^\w/, (x) -> x.toUpperCase())])

  getUserMedia = withVendorPrefix(navigator, "getUserMedia")
  if not getUserMedia
    alert("video is not supported")
    return

  getUserMedia.call navigator, {video:true, toString: () -> return "video"}, (stream) ->
    URL = withVendorPrefix(window, "URL")
    url = URL.createObjectURL(stream) || stream
    video.src = url
    video.width = 465
    video.height = 465
    video.style.display = "hidden"
    video.play()
  , () ->
    alert("stream is not available")
    return


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
      alert('audio not supported')
      return

    checkSupportFor = (type) ->
      cpt = sacrifice.canPlayType(type)
      return (cpt isnt "no") && (cpt isnt "")

    supports_mp3 = checkSupportFor("audio/mp3")
    if not (supports_mp3)
      alert('audio not supported')
      return
    # load audio

    instruments =
     [
       "resource/se/se_maoudamashii_instruments_drum1_cymbal.mp3",
       "resource/se/se_maoudamashii_instruments_drum1_snare.mp3",
       "resource/se/se_maoudamashii_instruments_drum1_bassdrum1.mp3",
       "resource/se/se_maoudamashii_instruments_drum1_hat.mp3",
       "resource/se/se_maoudamashii_instruments_drum1_tom1.mp3",
       "resource/se/se_maoudamashii_instruments_drum1_tom2.mp3",
       "resource/se/se_maoudamashii_instruments_drum1_tom3.mp3",
      ].map (x) ->
        return new Audio("https://dl.dropboxusercontent.com/u/3589634/" + x)
    instruments.each (e) ->
      e.addEventListener "canplay", () ->
        e.playable = true
      , true
      e.load()

    return instruments


  # create instance of my lib
  d = new DCore()

  measure = 32


  # effect 
  class VFX
    constructor: ->
      [@p] = $A(arguments)
      @count = 0
    act: ->
      @count++
    draw: ->

  # tile
  class VFXTile extends VFX
    draw: (sd) ->
      @m = @m or $R(1, 4).rand()
      m = @m

      m.times (i) =>
        w = 1 / m
        x = i * w
        m.times (j) =>
          h = 1 / m
          y = j * h
          sd
           .drawImage(video, [0, 0], [1, 1], [x, y], [w, h])

  # horizontal slice
  class VFXHorizontalSlice extends VFX
    draw: (sd) ->
      y = 0
      while true
        h = $R(0.01, 0.1).randf()
        fx = $R(-1, 1).randf() * (0.3 / @count)

        if y + h > 1
          h -= (y + h) - 1

        sd
         .drawImage(sd, [0, y], [1, h], [fx, y], [1 - fx, h])

        break if y + h >= 0.9999
        y += h

  # vertical slice
  class VFXVerticalSlice extends VFX
    draw: (sd) ->
      x = 0
      while true
        w = $R(0.01, 0.1).randf()
        fy = $R(-1, 1).randf() * (0.3 / @count)

        if x + w > 1
          w -= (x + w) - 1

        sd
         .drawImage(sd, [x, 0], [w, 1], [x, fy], [w, 1 - fy])

        break if x + w >= 0.9999
        x += w

  # tile slice
  class VFXTileSlice extends VFX
    draw: (sd) ->
      10.times (i) =>
        x = $R(0.0, 0.9).randf()
        y = $R(0.0, 0.9).randf()
        w = $R(0.3, 0.6).randf()
        h = $R(0.3, 0.6).randf()
        x2 = $R(-0.05, 0.05).randf() + x
        y2 = $R(-0.05, 0.05).randf() + y
        w2 = $R(-0.01, 0.01).randf() * @count + w
        h2 = $R(-0.01, 0.01).randf() * @count + h
        
        sd
         .drawImage(sd, [x2, y2], [w2, h2], [x, y], [w, h])

  # flash
  class VFXFlash extends VFX
    draw: (sd) ->
      sd
       .hsv((1).randf(), 0.5, 0.5)
       .blend("lighter")
       .alpha($R(0.2, 0.9).randf())
       .fillBack()

      sd
       .blend("source-over")
       .alpha(1)

  # swap color
  class VFXSwapColor extends VFX
    draw: (sd) ->
      p = sd.getNativeImageData()
      img = p.data

      len = img.length
      i = 0
      while i < len
        work = img[0]
        img[i + 0] += img[i + 1] * @count >> 2
        img[i + 1] += img[i + 2] * @count >> 2
        img[i + 2] += work * @count >> 2
        i += 4

      sd.ctx.putImageData(p, 0, 0)

  # color shift
  class VFXColorShift extends VFX
    draw: (sd) ->
      p = sd.getNativeImageData()
      img = p.data

      len = img.length
      i = 0
      th = @count * 32 + 64
      t = @count * 6
      rd = ($R(-t, t).rand() + $R(-t, t).rand() * 128) * 4 + 0
      gd = ($R(-t, t).rand() + $R(-t, t).rand() * 128) * 4 + 1
      bd = ($R(-t, t).rand() + $R(-t, t).rand() * 128) * 4 + 2
      while i < len
        ri = i + rd
        if 0 <= ri and ri < len
          img[ri] += img[i + 0] >> 1
        gi = i + gd
        if 0 <= gi and gi < len
          img[gi] += img[i + 1] >> 1
        bi = i + bd
        if 0 <= bi and bi < len
          img[ri] += img[i + 2] >> 1
        i += 4

      sd.ctx.putImageData(p, 0, 0)

  # manager of vfx
  class VFXManager
    constructor: ->
      @ms = []
    registor: (e) ->
      @ms.push(e)
    act: ->
      @ms.invoke("act")
      @ms = @ms.select (e) ->
        e.count < 6
    draw: ->
      @sd = @sd || d.subTexture(128, 128)
      @sd.drawImage(video)

      @ms.invoke("draw", @sd)
      d
       .blend("source-over")
       .alpha(1)
       .drawImage(@sd)


  # note
  class Note
    constructor: ->
      @active = false
      [@ps, @xy] = $A(arguments)
    act: ->
    draw: ->
      d
       .quads(@ps)
       .blend("lighter")
       .alpha(0.5)
       .rgb((if @active then 0xff else 0x66).arize(3))
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
          inst.pause()
          inst.currentTime = 0
          inst.play()
        cstr = [VFXTile, VFXSwapColor, VFXColorShift, VFXFlash, VFXHorizontalSlice, VFXVerticalSlice, VFXTileSlice][@xy[1]]
        if cstr
          vm.registor(new cstr([(1.0).randf(), (0.8).randf()]))


  # score
  class Score
    FineSeekMax = 128
    NoteHeight = 0.03
    NoteTypes = 7
    constructor: ->
      # for notes
      margin = 0.02
      size = (1 - margin * 2) / measure
      @notes = $R(0, NoteTypes, true).map (y) ->
        $R(0, measure, true).map (x) ->
          note = new Note(Geo.rect().scale([size * 0.8, NoteHeight]).translate([margin + size * x, 0.68 + NoteHeight * y * 1.5]), [x, y])
          if (y is 4 and x % 2 is 0)
#            note.flipFlop()
            null
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
      h = 0.65
      # fill back
      d
       .blend("source-over")
       .alpha(0.3)
       .rgb(0x00, 0x00, 0x00)
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
       .rgb(0xff, 0xff, 0xff)
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



  vm = new VFXManager()
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
     .blend("source-over")
     .alpha(1)
     .rgb(0x00, 0x00, 0x00)
     .fillBack()

    # act
    score.act()
    vm.act()

    # score control
    vm.draw()
    score.draw()


  setInterval(main, 33)
