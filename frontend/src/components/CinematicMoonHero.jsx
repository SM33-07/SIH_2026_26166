import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import useMatchStore from '../store/matchStore'

function latLon360ToXYZ(lat, lon360, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon360 - 180) * (Math.PI / 180)
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// Local textures served from /public — no CORS, bundled by Vite
const MOON_COLOR_PRIMARY  = '/moon_color.jpg'
const MOON_BUMP_PRIMARY   = '/moon_bump.jpg'
const MOON_COLOR_FALLBACK = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.jpg'
const MOON_BUMP_FALLBACK  = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg'

function loadTextureWithFallback(primary, fallback) {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    loader.load(primary, resolve, undefined, () => {
      loader.load(fallback, resolve, undefined, () => resolve(null))
    })
  })
}

/**
 * CinematicMoonHero
 * Props:
 *   catalogPoints     array from GET /common-points
 *   onPointSelect     called when a catalog/preset marker is clicked
 *   matchResultPoint  { latitude, longitude_360, label? } — from POST /match/three-images
 *                     Shows a pulsing green marker and rotates globe to face it.
 */
export default function CinematicMoonHero({ catalogPoints = [], onPointSelect, matchResultPoint = null }) {
  const mountRef        = useRef(null)
  const rendererRef     = useRef(null)
  const sceneRef        = useRef(null)
  const cameraRef       = useRef(null)
  const animRef         = useRef(null)
  const moonRef         = useRef(null)
  const markersGroupRef = useRef(null)
  const resultGroupRef  = useRef(null)
  const isDragging      = useRef(false)
  const lastMouse       = useRef({ x: 0, y: 0 })
  const autoRotate      = useRef(true)

  const [isRotating, setIsRotating] = useState(true)
  const [texLoading, setTexLoading] = useState(true)
  const { selectedPoint } = useMatchStore()

  // ── Scene bootstrap ─────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth  || 900
    const H = container.clientHeight || 700

    // Solid black background — alpha:false ensures the sphere back hemisphere
    // is NOT clipped by a transparent canvas composited over a dark page.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.01, 2000)
    camera.position.set(0, 0, 3.2)
    cameraRef.current = camera

    // ── Lighting ──────────────────────────────────────────────────────────────
    // Fill ambient — must be strong enough to show dark-side surface detail
    // against the black space background (prevents "cut sphere" look)
    const fill = new THREE.AmbientLight(0x222222, 1.4)
    scene.add(fill)
    // Primary sun from upper-right
    const sun = new THREE.DirectionalLight(0xfff8e0, 2.2)
    sun.position.set(6, 2.5, 4)
    scene.add(sun)
    // Earthshine from opposite direction — makes terminator transition smooth
    const earth = new THREE.DirectionalLight(0x354060, 0.55)
    earth.position.set(-5, -1.5, -3)
    scene.add(earth)

    // ── Starfield ─────────────────────────────────────────────────────────────
    const sv = (n) => Math.abs(Math.sin(n * 7919 + n * 3571) * 98765.4321) % 1
    const starVerts = []
    for (let i = 0; i < 5000; i++) {
      const r = 900, th = sv(i * 3) * Math.PI * 2, ph = Math.acos(2 * sv(i * 3 + 1) - 1)
      starVerts.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph))
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0.68
    })))

    // ── Moon sphere ────────────────────────────────────────────────────────────
    const moonGeo = new THREE.SphereGeometry(1, 128, 128)
    const placeholder = new THREE.MeshStandardMaterial({ color: 0x555550, roughness: 0.95, metalness: 0.01 })
    const moon = new THREE.Mesh(moonGeo, placeholder)
    moonRef.current = moon
    scene.add(moon)

    // Load real textures async
    Promise.all([
      loadTextureWithFallback(MOON_COLOR_PRIMARY, MOON_COLOR_FALLBACK),
      loadTextureWithFallback(MOON_BUMP_PRIMARY,  MOON_BUMP_FALLBACK),
    ]).then(([colorTex, bumpTex]) => {
      if (!moonRef.current) return
      if (colorTex) {
        colorTex.generateMipmaps = true
        colorTex.minFilter = THREE.LinearMipmapLinearFilter
        colorTex.magFilter = THREE.LinearFilter
        colorTex.colorSpace = THREE.SRGBColorSpace
      }
      if (bumpTex) { bumpTex.generateMipmaps = true; bumpTex.minFilter = THREE.LinearMipmapLinearFilter }
      const mat = new THREE.MeshStandardMaterial({
        ...(colorTex ? { map: colorTex } : { color: 0x888880 }),
        ...(bumpTex  ? { bumpMap: bumpTex, bumpScale: 0.05 } : {}),
        roughness: 0.94, metalness: 0.01,
      })
      moonRef.current.material.dispose()
      moonRef.current.material = mat
      setTexLoading(false)
    })

    // ── Coordinate grid ────────────────────────────────────────────────────────
    const gridMat = new THREE.LineBasicMaterial({ color: 0x3a2e10, transparent: true, opacity: 0.14 })
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []
      for (let l = 0; l <= 360; l += 6) pts.push(latLon360ToXYZ(lat, l, 1.003))
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat))
    }
    for (let lon = 0; lon < 360; lon += 45) {
      const pts = []
      for (let la = -90; la <= 90; la += 5) pts.push(latLon360ToXYZ(la, lon, 1.003))
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat))
    }

    // Marker groups
    const mg = new THREE.Group(); scene.add(mg); markersGroupRef.current = mg
    const rg = new THREE.Group(); scene.add(rg); resultGroupRef.current  = rg

    // ── Animation loop ─────────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      const t  = clock.getElapsedTime()
      const dt = clock.getDelta()
      if (autoRotate.current) moon.rotation.y += dt * 0.022
      // Animate pulse rings on result marker
      const resultGrp = resultGroupRef.current
      if (resultGrp) {
        resultGrp.children.forEach((child) => {
          if (child.userData.isPulse) {
            const s = 1 + 0.22 * Math.sin(t * 2.8 + child.userData.phaseOffset)
            child.scale.setScalar(s)
            child.material.opacity = 0.65 - 0.3 * Math.abs(Math.sin(t * 2.8 + child.userData.phaseOffset))
          }
        })
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize observer
    const ro = new ResizeObserver(() => {
      const nW = container.clientWidth, nH = container.clientHeight
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(animRef.current)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  // ── Catalog markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const group = markersGroupRef.current
    if (!group) return
    while (group.children.length) group.remove(group.children[0])

    catalogPoints.forEach((pt) => {
      const isSelected = selectedPoint?.id === pt.id
      const pos = latLon360ToXYZ(pt.latitude, pt.longitude_360, 1.026)

      const rr = isSelected ? 0.024 : 0.013
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(rr, rr + 0.008, 20),
        new THREE.MeshBasicMaterial({
          color: isSelected ? 0x22c55e : 0xf59e0b,
          transparent: true,
          opacity: isSelected ? 1.0 : 0.6,
          side: THREE.DoubleSide,
        })
      )
      ring.lookAt(pos); ring.position.copy(pos); ring.userData = { point: pt }
      group.add(ring)

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.011 : 0.006, 8, 8),
        new THREE.MeshBasicMaterial({ color: isSelected ? 0x22c55e : 0xf59e0b })
      )
      dot.position.copy(pos); dot.userData = { point: pt }
      group.add(dot)
    })
  }, [catalogPoints, selectedPoint])

  // ── Match-result marker ─────────────────────────────────────────────────────
  useEffect(() => {
    const rg = resultGroupRef.current
    if (!rg) return
    while (rg.children.length) rg.remove(rg.children[0])
    if (!matchResultPoint) return

    const pos = latLon360ToXYZ(matchResultPoint.latitude, matchResultPoint.longitude_360, 1.032)

    // Two pulsing rings at different radii
    ;[0.042, 0.065].forEach((pr, i) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(pr, pr + 0.006, 32),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      )
      m.lookAt(pos); m.position.copy(pos)
      m.userData = { isPulse: true, phaseOffset: i * Math.PI * 0.5 }
      rg.add(m)
    })

    // Solid core dot
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 })
    )
    core.position.copy(pos)
    rg.add(core)

    // Rotate moon to face result point
    if (moonRef.current) {
      autoRotate.current = false
      setIsRotating(false)
      const lat = matchResultPoint.latitude
      const lon = matchResultPoint.longitude_360
      moonRef.current.rotation.y = -((lon - 180) * (Math.PI / 180))
      moonRef.current.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, lat * (Math.PI / 180)))
    }
  }, [matchResultPoint])

  // ── Focus on selected catalog point ────────────────────────────────────────
  useEffect(() => {
    if (!selectedPoint || !moonRef.current) return
    autoRotate.current = false
    setIsRotating(false)
    moonRef.current.rotation.y = -((selectedPoint.longitude_360 - 180) * (Math.PI / 180))
    moonRef.current.rotation.x = Math.max(-Math.PI / 2.2,
      Math.min(Math.PI / 2.2, selectedPoint.latitude * (Math.PI / 180)))
  }, [selectedPoint])

  // ── Mouse / interaction ─────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    isDragging.current = true; autoRotate.current = false; setIsRotating(false)
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !moonRef.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    moonRef.current.rotation.y += dx * 0.004
    moonRef.current.rotation.x = Math.max(-Math.PI / 2,
      Math.min(Math.PI / 2, moonRef.current.rotation.x + dy * 0.004))
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback((e) => {
    if (!isDragging.current) return
    isDragging.current = false
    const container = mountRef.current, camera = cameraRef.current, group = markersGroupRef.current
    if (!container || !camera || !group) return
    const rect  = container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top)  / rect.height) * 2 + 1
    )
    const ray = new THREE.Raycaster()
    ray.setFromCamera(mouse, camera)
    const hits = ray.intersectObjects(group.children, true)
    if (hits.length && hits[0].object.userData?.point) onPointSelect?.(hits[0].object.userData.point)
  }, [onPointSelect])

  const handleWheel = useCallback((e) => {
    const cam = cameraRef.current
    if (!cam) return
    cam.position.z = Math.max(1.6, Math.min(5.5, cam.position.z + e.deltaY * 0.004))
  }, [])

  const toggleRotate = () => { autoRotate.current = !autoRotate.current; setIsRotating(autoRotate.current) }
  const resetView    = () => {
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 3.2)
    if (moonRef.current)  { moonRef.current.rotation.x = 0; moonRef.current.rotation.y = 0 }
    autoRotate.current = true; setIsRotating(true)
  }

  return (
    // NO overflow-hidden — that clips the sphere's backside and makes it look flat/2D
    <div id="hero-moon" className="relative w-full bg-black" style={{ height: 700 }}>

      {/* Title overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 w-full px-4">
        <div className="text-[10px] font-mono tracking-[0.4em] text-neutral-500 uppercase mb-1">
          CHANDRAYAAN-2 · MULTI-SENSOR REGISTRATION
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-[0.12em] text-white uppercase">
          LUNAR CORRESPONDENCE ENGINE
        </h1>
        <div className="text-xs font-mono text-amber-400/80 tracking-widest mt-1.5 uppercase">
          OHRC · TMC-2 · IIRS &nbsp;|&nbsp; SIH-2026 #26166
        </div>
      </div>

      {/* Match-result coordinate badge */}
      {matchResultPoint && (
        <div className="absolute top-6 right-6 z-20 border border-green-500/40 bg-black/85 backdrop-blur-sm px-3 py-2 pointer-events-none">
          <div className="text-[8px] font-mono text-green-500/60 uppercase tracking-widest mb-0.5">MATCH LOCATED</div>
          <div className="text-[11px] font-mono text-green-300 font-bold leading-tight">
            {matchResultPoint.latitude?.toFixed(4)}°&nbsp;
            {matchResultPoint.longitude_360?.toFixed(4)}°
          </div>
          {matchResultPoint.label && (
            <div className="text-[9px] font-mono text-green-600/80 mt-0.5 truncate max-w-[160px]">
              {matchResultPoint.label}
            </div>
          )}
        </div>
      )}

      {/* Texture loading spinner */}
      {texLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="border border-amber-500/25 bg-black/80 px-5 py-2.5 text-[10px] font-mono text-amber-400/60 tracking-widest uppercase flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            LOADING LUNAR IMAGERY
          </div>
        </div>
      )}

      {/* Three.js WebGL canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDragging.current = false }}
        onWheel={handleWheel}
      />

      {/* Hint */}
      <div className="absolute bottom-3 right-5 text-[9px] font-mono text-neutral-600 tracking-widest uppercase hidden md:block z-10">
        DRAG TO ORBIT · SCROLL TO ZOOM · CLICK MARKER TO SELECT
      </div>
    </div>
  )
}
