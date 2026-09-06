import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import useMatchStore from '../store/matchStore'

/**
 * Interactive 3D lunar sphere.
 * Moon markers are populated exclusively from the backend catalog (GET /common-points).
 * No coordinates are hardcoded in this file.
 */

function latLon360ToXYZ(lat, lon360, radius = 1) {
  // lat: -90 to +90, lon360: 0 to 360
  const phi   = (90 - lat) * (Math.PI / 180)  // polar angle from north
  const theta = (lon360 - 180) * (Math.PI / 180) // azimuthal, shifted so 0° faces viewer
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export default function MoonHero({ catalogPoints = [], onPointSelect }) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const animRef = useRef(null)
  const moonRef = useRef(null)
  const markersGroupRef = useRef(null)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const autoRotate = useRef(true)

  const [hovered, setHovered] = useState(null)
  const [camLat, setCamLat] = useState(60)
  const [camLon, setCamLon] = useState(355)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const { selectedPoint } = useMatchStore()

  // Build scene
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth
    const H = container.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starVerts = []
    for (let i = 0; i < 3000; i++) {
      starVerts.push(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 400,
      )
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.6 })))

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000)
    camera.position.set(0, 0, 3)
    cameraRef.current = camera

    // Lighting
    scene.add(new THREE.AmbientLight(0x223355, 0.6))
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4)
    sunLight.position.set(5, 3, 5)
    scene.add(sunLight)
    const rimLight = new THREE.DirectionalLight(0x4466aa, 0.3)
    rimLight.position.set(-4, -2, -4)
    scene.add(rimLight)

    // Moon sphere — procedural cratered appearance
    const moonGeo = new THREE.SphereGeometry(1, 64, 64)

    // Build a procedural gray texture with crater shading
    const texSize = 512
    const texCanvas = document.createElement('canvas')
    texCanvas.width = texSize
    texCanvas.height = texSize
    const ctx = texCanvas.getContext('2d')

    // Base gradient
    const grad = ctx.createRadialGradient(texSize/2, texSize/2, texSize*0.1, texSize/2, texSize/2, texSize*0.7)
    grad.addColorStop(0, '#c8c0b8')
    grad.addColorStop(0.5, '#a09888')
    grad.addColorStop(1, '#706860')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, texSize, texSize)

    // Procedural craters
    const rng = (n) => Math.abs(Math.sin(n * 127.1 + n * 311.7) * 43758.5453) % 1
    for (let i = 0; i < 200; i++) {
      const cx = rng(i * 3) * texSize
      const cy = rng(i * 3 + 1) * texSize
      const r = rng(i * 3 + 2) * 18 + 2
      const shadow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      shadow.addColorStop(0, 'rgba(50,45,40,0.4)')
      shadow.addColorStop(0.7, 'rgba(50,45,40,0.15)')
      shadow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = shadow
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const moonTex = new THREE.CanvasTexture(texCanvas)
    const moonMat = new THREE.MeshPhongMaterial({
      map: moonTex,
      bumpMap: moonTex,
      bumpScale: 0.03,
      shininess: 5,
      specular: new THREE.Color(0x111111),
    })
    const moon = new THREE.Mesh(moonGeo, moonMat)
    moonRef.current = moon
    scene.add(moon)

    // Lat/lon grid
    const gridMat = new THREE.LineBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.25 })
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []
      for (let l = 0; l <= 360; l += 5) {
        pts.push(latLon360ToXYZ(lat, l, 1.002))
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat))
    }
    for (let lon = 0; lon < 360; lon += 45) {
      const pts = []
      for (let la = -90; la <= 90; la += 5) {
        pts.push(latLon360ToXYZ(la, lon, 1.002))
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat))
    }

    // Markers group
    const markersGroup = new THREE.Group()
    scene.add(markersGroup)
    markersGroupRef.current = markersGroup

    // Animation loop
    const clock = new THREE.Clock()
    function animate() {
      animRef.current = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      if (autoRotate.current) {
        moon.rotation.y += dt * 0.04
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize observer
    const ro = new ResizeObserver(() => {
      const nW = container.clientWidth
      const nH = container.clientHeight
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(animRef.current)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Rebuild markers whenever catalog changes
  useEffect(() => {
    const group = markersGroupRef.current
    if (!group) return

    // Clear old markers
    while (group.children.length) group.remove(group.children[0])

    if (!catalogPoints.length) return

    catalogPoints.forEach((pt) => {
      const pos = latLon360ToXYZ(pt.latitude, pt.longitude_360, 1.02)
      const isSelected = selectedPoint?.id === pt.id

      // Outer ring
      const ringGeo = new THREE.RingGeometry(0.015, 0.022, 16)
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x22c55e : 0x6366f1,
        transparent: true,
        opacity: isSelected ? 1.0 : 0.8,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.lookAt(pos)
      ring.position.copy(pos)
      ring.userData = { point: pt }
      group.add(ring)

      // Core dot
      const dotGeo = new THREE.SphereGeometry(0.009, 8, 8)
      const dotMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0x22c55e : 0x818cf8 })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.copy(pos)
      dot.userData = { point: pt }
      group.add(dot)
    })
  }, [catalogPoints, selectedPoint])

  // Mouse/touch orbit
  const handleMouseDown = useCallback((e) => {
    isDragging.current = true
    autoRotate.current = false
    setIsAutoRotating(false)
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !moonRef.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    moonRef.current.rotation.y += dx * 0.005
    moonRef.current.rotation.x += dy * 0.005
    moonRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, moonRef.current.rotation.x))
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback((e) => {
    if (!isDragging.current) return
    isDragging.current = false
    // Raycasting for click detection
    const container = mountRef.current
    const camera = cameraRef.current
    const group = markersGroupRef.current
    if (!container || !camera || !group) return

    const rect = container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(group.children, true)
    if (hits.length && hits[0].object.userData?.point) {
      onPointSelect?.(hits[0].object.userData.point)
    }
  }, [onPointSelect])

  const handleWheel = useCallback((e) => {
    const camera = cameraRef.current
    if (!camera) return
    camera.position.z = Math.max(1.5, Math.min(6, camera.position.z + e.deltaY * 0.005))
  }, [])

  const toggleAutoRotate = () => {
    autoRotate.current = !autoRotate.current
    setIsAutoRotating(autoRotate.current)
  }

  const resetCamera = () => {
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 3)
    if (moonRef.current) { moonRef.current.rotation.x = 0; moonRef.current.rotation.y = 0 }
    autoRotate.current = true
    setIsAutoRotating(true)
  }

  return (
    <div className="relative w-full h-full moon-canvas-wrapper">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDragging.current = false }}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleAutoRotate}
          title={isAutoRotating ? 'Pause rotation' : 'Resume rotation'}
          className={[
            'w-8 h-8 border text-xs font-mono flex items-center justify-center transition-all',
            isAutoRotating
              ? 'border-lunar-accent text-lunar-accent bg-lunar-accent/10'
              : 'border-lunar-border text-slate-500 hover:border-slate-500',
          ].join(' ')}
        >
          {isAutoRotating ? '⏸' : '▶'}
        </button>
        <button
          onClick={resetCamera}
          title="Reset camera"
          className="w-8 h-8 border border-lunar-border text-slate-500 hover:text-slate-300 hover:border-slate-500 text-xs font-mono flex items-center justify-center transition-all"
        >
          ⌂
        </button>
      </div>

      {/* Catalog loading overlay */}
      {catalogPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glass px-6 py-4 text-center">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Fetching lunar observation catalog…
            </div>
          </div>
        </div>
      )}

      {/* Point count badge */}
      {catalogPoints.length > 0 && (
        <div className="absolute top-3 left-3 glass px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          {catalogPoints.length} OBSERVATION SITES
        </div>
      )}

      {/* Interaction hint */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
        Drag to orbit · Scroll to zoom · Click marker to select
      </div>
    </div>
  )
}
