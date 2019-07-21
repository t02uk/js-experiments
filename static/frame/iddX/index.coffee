window.onload = ->

  # セル数
  cap = 24
  # セルの状態が次の状態へ移る時の描画間隔
  drawInteval = 4

  d = new DCore()

  # 任意関数オブジェクトのメモ化
  memoize = (f, memo={}) -> () ->
    key = $A(arguments).join()
    if memo[key]? then memo[key]
    else memo[key] = f.apply(null, $A(arguments))

  # セル。一マスに相当
  class Cell
    constructor: ->
      # 生きているか, 描画座標[x, y]
      [@active, @x, @y] = $A(arguments)
    # 与えられた座標をもとに、自分自身か否かを返す
    eq: (x, y) ->
      @x is x and @y is y
    # 前回の状態を保存
    saveMemento: ->
      @preactive = @active

  # セルを生成
  cells = $R(0, cap, true).map((y)->
    $R(0, cap, true).map((x) ->
      new Cell(!$R(0, 2).rand(), x, y)
    )
  )

  # セルの描画処理。。。に使用するバッファを返す
  # 描画処理の高速化のためメモ化して使用することを前提とし、
  # キャッシュにヒットしやすくするため描画範囲が特殊
  # セルとセルの隙間を中心に、左上、右上、左下、右下のそれぞれ
  # 四分の一ずつ描くイメージ
  #  n1-n4 => それぞれ左上、右上、左下、右下が現在生きているか
  #  o1-o4 => それぞれ左上、右上、左下、右下が前回生きていたか
  #  step  => セルの状態移行ステップ
  drawing = (n1, n2, n3, n4, o1, o2, o3, o4, step) ->
    rstep = 1 - step
    size = 16
    shift = 6
    recp = 1 / size
    sd = d.subTexture(size, size)
    img = sd.ctx.createImageData(size, size)
    $R(0, size, true).map((ax) ->
      $R(0, size, true).map((ay) ->
        x = ax * recp
        y = ay * recp

        c = 0
        c += 1 / (     x  *      x +       y *       y ) if n1 and o1
        c += 1 / ((1 - x) * (1 - x) +      y  *      y ) if n2 and o2
        c += 1 / (     x  *      x  + (1 - y) * (1 - y)) if n3 and o3
        c += 1 / ((1 - x) * (1 - x) + (1 - y) * (1 - y)) if n4 and o4

        c += step / (     x  *      x +       y *       y ) if n1 and not o1
        c += step / ((1 - x) * (1 - x) +      y  *      y ) if n2 and not o2
        c += step / (     x  *      x  + (1 - y) * (1 - y)) if n3 and not o3
        c += step / ((1 - x) * (1 - x) + (1 - y) * (1 - y)) if n4 and not o4

        c += rstep / (     x  *      x +       y *       y ) if not n1 and o1
        c += rstep / ((1 - x) * (1 - x) +      y  *      y ) if not n2 and o2
        c += rstep / (     x  *      x  + (1 - y) * (1 - y)) if not n3 and o3
        c += rstep / ((1 - x) * (1 - x) + (1 - y) * (1 - y)) if not n4 and o4

        col = if c > 3 then [0x99, 0xa0, 0x73] else [0xff, 0xff, 0xd5]

        i = (ax + ay * size) * 4
        img.data[i + 0] = col[0]
        img.data[i + 1] = col[1]
        img.data[i + 2] = col[2]
        img.data[i + 3] = 0xff
      )
    )
    sd.ctx.putImageData(img, 0, 0)
    sd

  memodDrawing = memoize(drawing)

  # 隣接するセルを求める　だいぶ手抜き
  flattened = cells.flatten()
  flattened.each((e1) ->
    e1.neighbor = flattened.select((e2) ->
      e2.eq(e1.x - 1, e1.y - 1) or
      e2.eq(e1.x + 1, e1.y - 1) or
      e2.eq(e1.x    , e1.y - 1) or
      e2.eq(e1.x - 1, e1.y    ) or
      e2.eq(e1.x + 1, e1.y    ) or
      e2.eq(e1.x    , e1.y + 1) or
      e2.eq(e1.x - 1, e1.y + 1) or
      e2.eq(e1.x + 1, e1.y + 1)
    )
  )

  # メインループここから
  ((c) ->

    #
    (() ->
      # セルの次の状態を求める。(true or false)
      cells.map((e) ->
        e.map((e) ->
          e.saveMemento()
          numActive = e.neighbor.select((e) -> e.active).length

          if not e.active and numActive is 3 then true
          else if e.active and 2 <= numActive <= 3 then true
          else if e.active and numActive <= 1 then false
          else if e.active and numActive >= 4 then false
          else e.active
        )
      # 求めた状態をそれぞれのセルへ適用
      ).zip2(cells, (e) ->
        e[1].zip(e[0], (ee) ->
          ee[0].active = ee[1]
        )
      )
    )() if c % drawInteval is 0

    #d
    # .blend("copy")
    # .alpha(1.0)
    # .rgb(0xff, 0xff, 0xff)
    # .fillBack()

    # 描画処理 injectなのに純関数じゃないのは気にしない
    cells.inject(false, (left, right) ->
      unless left then right
      else
        left.zip2(right).inject(false, (left, right) ->
          unless left then right
          else
            x = (left[0].x + right[0].x) / 2 / cap
            y = (left[0].y +  left[1].y) / 2 / cap
            sd = memodDrawing(
              left[0].active, right[0].active,
              left[1].active, right[1].active,
              left[0].preactive, right[0].preactive,
              left[1].preactive, right[1].preactive,
              (c / drawInteval) % 1
            )
            d
             .blend("source-over")
             .alpha(1.0)
             .drawImage(sd, [x, y], [1 / cap, 1 / cap])

            right
        )
      right
    )
    window.setTimeout(arguments.callee.curry(c + 1), 33)
  )(0)
