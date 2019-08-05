window.onload = ->
  d = new DCore()

  class Branch
    constructor: ->
      [@p, @rad, @size] = $A(arguments)
      @s = [@size, 0].rotate(@rad)
      @sp = @s.mul(0.4)
      @hue = $R(0, 0.3).randf()
      @pe = @p.add(@sp.mul(5))
      @life = 10
      @setChildren() if @size * Math.random() > 0.016
    act: ->
      @life--
      @p = @p.add(@sp)
      @sp = @sp.add([0.0, 0.0002])
      @sp = @sp.mul(0.9)
      @pe = @p.add(@sp.mul(5).add(@s.mul(0.1)))
    draw: ->
      d
       .hsv(@hue, 0.9, 1.0)
       .blend("lighter")
       .alpha($R(0, 0.3).randf())
       .quads([@p, @pe])
       .lineWidth(0.003)
       .stroke()
    setChildren: ->
      @children = $R(0, $R(0, 3).randf() + $R(0, 3).rand()).map () =>
        new Branch(@pe, @rad + $R(0, 10).randf(), @size * $R(0.1, 0.8).randf())

  class Tree
    constructor: ->
      @p = [$R(0.0, 0.01).randf(), 0].rotate($R(0, 100).randf()).add([0.5, 0.7])
      @root = new Branch(@p, $R(0, 100).randf(), $R(0.01, 0.1).randf())
    act: ->
      @root.act()
      @flatMap (x) ->
        x.act()
    draw: ->
      @root.draw()
      @flatMap (x) ->
        x.draw()
    flatMap: (func, x=@root) ->
      x.children?.map (y) =>
        func x
        @flatMap(func, y) if y

  trees = new Array(16).fill()

  main = (cnt=0) ->
    d
     .blend("source-over")
     .alpha(1.0)
     .rgb(0x11, 0x11, 0x22)
     .fillBack()

    d
     .quads([[0.5, 0.0], [0.5, 0.7]])
     .blend("source-over")
     .alpha(0.9)
     .rgb(0x77, 0x55, 0x55)
     .lineWidth(0.008)
     .stroke()

    (3.0).times (i) ->
      p = [Math.sin(cnt * i) * 0.7, Math.cos(cnt * i)].mul(0.003)
      d
       .blend("lighter")
       .alpha(1.0)
       .luminous([0.5, 0.7].add(p), 0.01, $R(0.015, 0.02).randf(), [
         [0.0,  [$R(0, 0.3).randf(), 0.2, 0.9].hsv()]
         [0.7,  [$R(0, 0.3).randf(), 0.7, 0.4].hsv()]
         [1.0,  [0.0, 0.0, 0.0].hsv()]])
      .fill()

    d
     .blend("lighter")
     .alpha(1.0)
     .luminous([0.5, 0.7], 0.1, 0.3 + $R(0, 4).randf() * 0.003, [
       [0.0,  [0.1, 0.1, 0.1].hsv()],
       [0.2,  [0.2, 0.1, 0.1].hsv()],
       [0.7,  [0.3, 0.1, 0.1].hsv()],
       [1.0,  [0.0, 0.0, 0.0].hsv()]])
    .fill()

    (4.0).times () ->
      trees.push(new Tree())
      trees.shift()

    trees.select (x) ->
      x
    .each (x) ->
      x.act()
      x.draw()

    window.setTimeout(arguments.callee.curry(cnt+1), 33)

  main()
