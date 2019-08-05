__DEBUG__ = false
pass = undefined

pp = ->
  console.info.apply(console, arguments)
  arguments


class God
  @setup: ->
    c = document.getElementById('c')

    windowResized = =>
      width = window.innerWidth
      height = window.innerHeight
      @camera.aspect = width / height
      @camera.updateProjectionMatrix()
      @renderer.setSize(width, height)

    @scene = new THREE.Scene()
    @scene.fog = new THREE.FogExp2(0xeeeeff, 0.005)
    @camera = new THREE.PerspectiveCamera(75, 640 / 480, Math.pow(0.1, 8), Math.pow(10, 3))
    @renderer = new THREE.WebGLRenderer(antialias: true)
    @renderer.setClearColor(0xeeeeff, 0)
    c.appendChild(@renderer.domElement)

    windowResized()
    window.addEventListener('resize', windowResized)

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.7)
    directionalLight.position.set(0, 1000, 0)
    @scene.add(directionalLight)

    ambientLight = new THREE.AmbientLight(0x999999)
    @scene.add(ambientLight)

    @land = new Land(@scene)

  @start: ->
    startTime = +new Date()
    render = =>
      ras = (new Date() - startTime) * 0.001
      @camera.position.x = Math.sin(ras) * 100
      @camera.position.z = ras * 100
      @camera.position.y = Math.cos(ras * 0.7) * 30 + 50
      @camera.lookAt(new THREE.Vector3(
        @camera.position.x + Math.sin(ras * 0.9321),
        @camera.position.y + Math.sin(ras * 0.82331) * 0.5 - 0.3,
        @camera.position.z + Math.cos(ras * 0.78321)
      ))

      @land.update()
      requestAnimationFrame(render)
      @renderer.render(@scene, @camera)
    render()


# http://www.technotype.net/hugo.elias/models/m_perlin.html
class PerlinNoise
  @noise2: (x, y) ->
    n = x + y * 1023
    n = (n << 13) ^ n | 0
    ret = 1.0 - ( (((n * (((n * n * 15731) | 0) + 789221) | 0 ) + 1376312589) & 0x7fffffff) / 1073741824.0 )
    ret

  @smoothedNoise2: (x, y) ->
    corners = (PerlinNoise.noise2(x - 1, y - 1) + PerlinNoise.noise2(x + 1, y - 1) + PerlinNoise.noise2(x - 1, y + 1) + PerlinNoise.noise2(x + 1, y + 1)) / 16
    sides   = (PerlinNoise.noise2(x - 1, y    ) + PerlinNoise.noise2(x + 1, y    ) + PerlinNoise.noise2(x    , y - 1) + PerlinNoise.noise2(x    , y + 1)) /  8
    center  =  PerlinNoise.noise2(x, y) / 4
    return corners + sides + center

  @interpolate: (a, b, x) ->
    ft = x * Math.PI
    f = (1 - Math.cos(ft)) * 0.5
    return  a * (1 - f) + b * f

  @interpolatedNoise2: (x, y) ->
    intX = ~~x
    fracX = x - intX

    intY = ~~y
    fracY = y - intY

    v1 = PerlinNoise.smoothedNoise2(intX,     intY    )
    v2 = PerlinNoise.smoothedNoise2(intX + 1, intY    )
    v3 = PerlinNoise.smoothedNoise2(intX,     intY + 1)
    v4 = PerlinNoise.smoothedNoise2(intX + 1, intY + 1)

    i1 = PerlinNoise.interpolate(v1, v2, fracX)
    i2 = PerlinNoise.interpolate(v3, v4, fracX)

    return PerlinNoise.interpolate(i1, i2, fracY)

  @perlinNoise2: (x, y, p = 4, octaves = 2) ->
    total = 0
    n = octaves - 1

    for i in [0...n]
      frequency = Math.pow(2, i)
      amplitude = Math.pow(p, i)

      total = total + PerlinNoise.interpolatedNoise2(x * frequency, y * frequency) * amplitude

    return total


class Land
  constructor: (@scene) ->

    @width = @height = 1000
    @widthSegment = @heightSegment = 400

    mesh1 = @makeMesh(@width, @height, @widthSegment, @heightSegment)
    @constructLandMap(mesh1.geometry)
    @scene.add(mesh1)

    mesh2 = @makeMesh(@width, @height, @widthSegment, @heightSegment)
    @constructLandMap(mesh2.geometry)
    @scene.add(mesh2)

    @meshes = [mesh1, mesh2]

    mesh1.position.z = mesh2.position.z + @height

  makeMesh: (width, height, widthSegment, heightSegment) ->

    wps = 1.0 * width / widthSegment
    hps = 1.0 * height / (heightSegment - 1)

    material = new THREE.MeshBasicMaterial
      vertexColors: THREE.FaceColors

    geometry = new THREE.Geometry()

    mesh = new THREE.Mesh(geometry, material)

    for z in [0...heightSegment]
      for x in [0...widthSegment]
        xoff = if z % 2 is 0
          0
        else
          wps * 0.5
        geometry.vertices.push(new THREE.Vector3((x * wps + xoff) - width / 2, 0, (z * hps) - height / 2))

    faceIdx = (x, z) => z * widthSegment + x
    for z in [0...(heightSegment - 1)]
      for x in [0...(widthSegment - 1)]
        geometry.faces.push(
          new THREE.Face3(faceIdx(x, z), faceIdx(x, z + 1), faceIdx(x + 1, z)),
          new THREE.Face3(faceIdx(x + 1, z), faceIdx(x, z + 1), faceIdx(x + 1, z + 1))
        )

    mesh

  constructLandMap: (geometry) ->

    maxH = minH = 0
    for v in geometry.vertices
      z = v.z
      if Math.abs(z - @width / 2) < 0.001
        z = -@width / 2

      h = PerlinNoise.perlinNoise2(v.x * 0.001, z * 0.001, 1.1, 10) * 5.5 + 5
      v.y = h
      maxH = Math.max(maxH, h)
      minH = Math.min(minH, h)

    for face in geometry.faces
      vs = geometry.vertices
      h = (vs[face.a].y + vs[face.b].y + vs[face.c].y) / 3
      if h > 0
        _h = h / maxH
        face.color.setHSL(Math.min(0.1 + _h * 0.6, 0.5), 0.9, Math.min(0.2 + _h * 0.3, 0.8))
      else
        _h = h / minH
        face.color.setHSL(0.6, 0.9, 0.5 - _h * 0.1)

    geometry.computeFaceNormals()
    geometry.computeVertexNormals()


  update: (@scene) ->
    [mesh1, mesh2] = @meshes
    if (mesh1.position.z - God.camera.position.z) < @height / 20
      mesh2.position.z = mesh1.position.z + @height
      @meshes = [mesh2, mesh1]



window.God = God

God.setup()
God.start()
