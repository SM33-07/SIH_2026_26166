import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import useMatchStore from '../store/matchStore'

/**
 * Spherical coordinate conversions aligned with Three.js SphereGeometry equirectangular UV mapping
 */
function latLon360ToXYZ(lat, lon360, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const lam = lon360 * (Math.PI / 180)
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(lam),
    radius * Math.cos(phi),
    -radius * Math.sin(phi) * Math.sin(lam)
  )
}

function xyzToLatLon360(vec) {
  const norm = vec.clone().normalize()
  const phi = Math.acos(Math.max(-1, Math.min(1, norm.y)))
  const lat = 90 - (phi * (180 / Math.PI))
  const lon = Math.atan2(-norm.z, norm.x) * (180 / Math.PI)
  const lon360 = (lon + 360) % 360
  return { lat, lon360 }
}

// Great circle arc interpolation between two spherical points
function createGreatCircleArc(p1, p2, radius, segments = 24) {
  const points = []
  const v1 = p1.clone().normalize()
  const v2 = p2.clone().normalize()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const v = v1.clone().lerp(v2, t).normalize().multiplyScalar(radius)
    points.push(v)
  }
  return points
}

// Thoroughly dispose Three.js geometries and materials when clearing dynamic groups
function clearGroup(group) {
  if (!group) return
  while (group.children.length) {
    const child = group.children[0]
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
      else child.material.dispose()
    }
    group.remove(child)
  }
}

// Local textures served from /public (100% equirectangular 2:1 cylindrical maps)
const MOON_COLOR_PRIMARY  = '/moon_color.jpg'
const MOON_BUMP_PRIMARY   = '/moon_bump.jpg'
const MOON_COLOR_FALLBACK = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'
const MOON_BUMP_FALLBACK  = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'

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
 * CinematicMoonHero — Uninterrupted 3D Moon Hero & Mission Control Radar
 * - Uninterrupted central Moon viewport: no opaque cards covering the model.
 * - Dedicated top control strip: coordinate search + all sites / target only toggle.
 * - Corner control zones:
 *   - Top-Left: Catalog telemetry & swath details
 *   - Top-Right: Surface Reticle & Developer diagnostics (Section 27)
 *   - Bottom-Left: Moon flight controls (Rotate, Fit, Reset, Zoom)
 *   - Bottom-Right: Visual layers panel (Catalog, Target, Grid, Sensor Path)
 * - Distinct visual hierarchy: Catalog points (subtle dots), Hovered (halo ring), Selected/Target (radiant beacon + pulse rings).
 * - Edge-attached Selected Observation HUD with Local Sensor View magnification inset (Section 20).
 */
export default function CinematicMoonHero({
  catalogPoints = [],
  onPointSelect,
  matchResultPoint = null,
  activeResult = null,
  onViewObservation,
  onSearchCoordinate,
}) {
  const mountRef        = useRef(null)
  const rendererRef     = useRef(null)
  const sceneRef        = useRef(null)
  const cameraRef       = useRef(null)
  const animRef         = useRef(null)
  const moonRef         = useRef(null)
  const markersGroupRef = useRef(null)
  const pathGroupRef    = useRef(null)
  const resultGroupRef  = useRef(null)
  const gridGroupRef    = useRef(null)

  const isDragging      = useRef(false)
  const lastMouse       = useRef({ x: 0, y: 0 })
  const autoRotate      = useRef(true)

  // Smooth camera animation targets
  const targetRotation  = useRef(null)
  const targetCameraZ   = useRef(3.6)

  const [isRotating, setIsRotating] = useState(true)
  const [texLoading, setTexLoading] = useState(true)
  const [cursorCoords, setCursorCoords] = useState(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [hudOpen, setHudOpen] = useState(false)

  // Search & Target State
  const [searchLat, setSearchLat] = useState('')
  const [searchLon, setSearchLon] = useState('')
  const [searchedCoord, setSearchedCoord] = useState(null)

  // Filter Mode: 'all' (default) vs 'target' (Section 4)
  const [filterMode, setFilterMode] = useState('all')

  // Visual Layers (Section 17)
  const [showCatalogSites, setShowCatalogSites] = useState(true)
  const [showTarget, setShowTarget] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showSensorPath, setShowSensorPath] = useState(true)

  // Diagnostics & Inset Modals (Sections 20 & 27)
  const [showDevDiagnostics, setShowDevDiagnostics] = useState(false)
  const [renderedMarkersCount, setRenderedMarkersCount] = useState(0)
  const [localModalOpen, setLocalModalOpen] = useState(false)

  const { selectedPoint, setHighlightedSensor } = useMatchStore()

  // ── Scene Bootstrap ─────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth  || 900
    const H = container.clientHeight || 680

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Camera with comfortable framing
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.01, 2000)
    camera.position.set(0, 0, 3.6)
    cameraRef.current = camera

    // ── Balanced Lunar Lighting Setup ──────────────────────────────────────────
    // 1. Primary Sun: Directional light from upper-right front (+Z faces camera, +X from right)
    //    Natural sunlight with crisp crater shadows and subtle terminator
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.85)
    sun.position.set(3.2, 1.2, 2.6)
    scene.add(sun)

    // 2. Realistic Earthshine Fill: Soft bluish-white fill from front-left (+Z, -X)
    //    Illuminates shaded hemisphere so maria and crater topography remain visible without flattening contrast
    const earthshine = new THREE.DirectionalLight(0x7a96b8, 0.38)
    earthshine.position.set(-3.2, 0.4, 2.8)
    scene.add(earthshine)

    // 3. Cosmic Space Hemisphere Light: Smooth upper/lower cosmic ambient fill
    const hemiLight = new THREE.HemisphereLight(0x384050, 0x12151c, 0.35)
    hemiLight.position.set(0, 5, 0)
    scene.add(hemiLight)

    // 4. Uniform Baseline Ambient Light: Restrained baseline floor
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.14)
    scene.add(ambientLight)

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

    // ── Moon Sphere ────────────────────────────────────────────────────────────
    const moonGeo = new THREE.SphereGeometry(1, 128, 128)
    moonGeo.computeVertexNormals()

    const placeholder = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.92,
      metalness: 0.0,
      emissive: new THREE.Color(0x08090a),
    })
    const moon = new THREE.Mesh(moonGeo, placeholder)
    // Orient initial Moon view so Chandrayaan-2 observation swath (60.5° N, 355.3° E) faces front-center
    moon.rotation.y = -Math.PI / 2 - (355.35 * (Math.PI / 180))
    moon.rotation.x = 0.35
    moonRef.current = moon
    scene.add(moon)

    // Attach Groups DIRECTLY to Moon so they rotate synchronously with the globe
    const mg = new THREE.Group()
    moon.add(mg)
    markersGroupRef.current = mg

    const pg = new THREE.Group()
    moon.add(pg)
    pathGroupRef.current = pg

    const rg = new THREE.Group()
    moon.add(rg)
    resultGroupRef.current = rg

    const gg = new THREE.Group()
    moon.add(gg)
    gridGroupRef.current = gg

    // ── Coordinate Grid Lines ──────────────────────────────────────────────────
    const gridMat = new THREE.LineBasicMaterial({ color: 0x5a4a26, transparent: true, opacity: 0.18 })
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []
      for (let l = 0; l <= 360; l += 4) pts.push(latLon360ToXYZ(lat, l, 1.003))
      gg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat))
    }
    for (let lon = 0; lon < 360; lon += 45) {
      const pts = []
      for (let la = -90; la <= 90; la += 4) pts.push(latLon360ToXYZ(la, lon, 1.003))
      gg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat))
    }

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
      if (bumpTex) {
        bumpTex.generateMipmaps = true
        bumpTex.minFilter = THREE.LinearMipmapLinearFilter
      }

      const mat = new THREE.MeshStandardMaterial({
        ...(colorTex ? { map: colorTex, emissiveMap: colorTex } : { color: 0x33363a }),
        ...(bumpTex  ? { bumpMap: bumpTex, bumpScale: 0.0028 } : {}),
        roughness: 0.90,
        metalness: 0.0,
        emissive: colorTex ? new THREE.Color(0x111216) : new THREE.Color(0x0a0b0d),
        emissiveIntensity: 0.18,
      })
      moonRef.current.material.dispose()
      moonRef.current.material = mat
      setTexLoading(false)
    })

    // ── Animation loop ─────────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      const t  = clock.getElapsedTime()
      const dt = clock.getDelta()

      // Auto-rotation in world space (visible, smooth cinematic spin)
      if (autoRotate.current && !targetRotation.current) {
        moon.rotation.y += dt * 0.12
      }

      // Smooth focus rotation interpolation
      if (targetRotation.current) {
        moon.rotation.y += (targetRotation.current.y - moon.rotation.y) * 0.08
        moon.rotation.x += (targetRotation.current.x - moon.rotation.x) * 0.08
        if (Math.abs(targetRotation.current.y - moon.rotation.y) < 0.005 &&
            Math.abs(targetRotation.current.x - moon.rotation.x) < 0.005) {
          targetRotation.current = null
        }
      }

      // Smooth zoom interpolation
      if (cameraRef.current && targetCameraZ.current) {
        cameraRef.current.position.z += (targetCameraZ.current - cameraRef.current.position.z) * 0.08
      }

      // Animate selected & target marker pulse rings
      const mgGroup = markersGroupRef.current
      if (mgGroup) {
        mgGroup.children.forEach((child) => {
          if (child.userData?.isPulseRing) {
            const s = 1 + 0.25 * Math.sin(t * 3.5 + (child.userData.phaseOffset || 0))
            child.scale.setScalar(s)
            child.material.opacity = 0.9 - 0.35 * Math.abs(Math.sin(t * 3.5 + (child.userData.phaseOffset || 0)))
          }
        })
      }

      const resultGrp = resultGroupRef.current
      if (resultGrp) {
        resultGrp.children.forEach((child) => {
          if (child.userData?.isPulse) {
            const s = 1 + 0.25 * Math.sin(t * 3.0 + child.userData.phaseOffset)
            child.scale.setScalar(s)
            child.material.opacity = 0.7 - 0.35 * Math.abs(Math.sin(t * 3.0 + child.userData.phaseOffset))
          }
        })
      }

      renderer.render(scene, camera)
    }

    // Tab visibility handling: pause animation loop when tab is backgrounded
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current)
      } else {
        clock.getDelta()
        animate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Reduced motion preference support
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) {
      autoRotate.current = false
      setIsRotating(false)
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
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(animRef.current)

      // Comprehensive scene disposal to prevent memory leaks
      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose()
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  // ── Sync Visual Layer Visibility ────────────────────────────────────────────
  useEffect(() => {
    if (gridGroupRef.current) gridGroupRef.current.visible = showGrid
  }, [showGrid])

  useEffect(() => {
    if (pathGroupRef.current) pathGroupRef.current.visible = showSensorPath
  }, [showSensorPath])

  // ── Global Lunar Reference Stations & Distributed Survey Array ─────────────
  const globalSurveyPoints = React.useMemo(() => {
    const landmarks = [
      // ISRO Chandrayaan Landing & Impact Sites
      { id: 'ISRO_SHIV_SHAKTI', name: 'Shiv Shakti Point (Chandrayaan-3)', latitude: -69.373, longitude_360: 32.319, region: 'South Pole High-Latitude Plain', three_sensor_common: true },
      { id: 'ISRO_TIRANGA', name: 'Tiranga Point (Chandrayaan-2)', latitude: -70.881, longitude_360: 22.784, region: 'South Polar Highland Rim', three_sensor_common: true },
      { id: 'ISRO_JAWAHAR', name: 'Jawahar Point (Chandrayaan-1 MIP)', latitude: -89.900, longitude_360: 0.000, region: 'Shackleton South Pole Rim', three_sensor_common: true },

      // International Historic Landing Sites
      { id: 'APOLLO_11', name: 'Mare Tranquillitatis (Apollo 11)', latitude: 0.674, longitude_360: 23.473, region: 'Equatorial Mare Plain', three_sensor_common: true },
      { id: 'APOLLO_12', name: 'Oceanus Procellarum (Apollo 12)', latitude: -3.012, longitude_360: 336.578, region: 'Western Basalt Field', three_sensor_common: true },
      { id: 'APOLLO_14', name: 'Fra Mauro (Apollo 14)', latitude: -3.645, longitude_360: 342.532, region: 'Impact Ejecta Ridge', three_sensor_common: true },
      { id: 'APOLLO_15', name: 'Hadley Rille (Apollo 15)', latitude: 26.132, longitude_360: 3.634, region: 'Apennine Mountain Escarpment', three_sensor_common: true },
      { id: 'APOLLO_16', name: 'Descartes Highlands (Apollo 16)', latitude: -8.973, longitude_360: 15.500, region: 'Central Lunar Plateau', three_sensor_common: true },
      { id: 'APOLLO_17', name: 'Taurus-Littrow (Apollo 17)', latitude: 20.191, longitude_360: 30.772, region: 'Mare Margin Valley', three_sensor_common: true },
      { id: 'CHANGE_4', name: 'Von Kármán Crater (Chang\'e 4)', latitude: -45.444, longitude_360: 177.599, region: 'South Pole-Aitken Farside Basin', three_sensor_common: true },
      { id: 'CHANGE_5', name: 'Mons Rümker (Chang\'e 5)', latitude: 43.058, longitude_360: 308.084, region: 'Northern Oceanus Procellarum', three_sensor_common: true },

      // Prominent Craters & Maria Features
      { id: 'TYCHO', name: 'Tycho Central Peak', latitude: -43.310, longitude_360: 348.780, region: 'Southern Rayed Crater System', three_sensor_common: true },
      { id: 'COPERNICUS', name: 'Copernicus Crater Basin', latitude: 9.620, longitude_360: 340.080, region: 'Terraced Crater Wall', three_sensor_common: true },
      { id: 'KEPLER', name: 'Kepler Crater Rim', latitude: 8.100, longitude_360: 322.000, region: 'Procellarum Ray System', three_sensor_common: true },
      { id: 'ARISTARCHUS', name: 'Aristarchus Plateau', latitude: 23.700, longitude_360: 312.600, region: 'Pyroclastic Volcanic Plateau', three_sensor_common: true },
      { id: 'MARE_IMBRIUM', name: 'Mare Imbrium Center', latitude: 32.800, longitude_360: 344.400, region: 'Northern Mare Basin', three_sensor_common: true },
      { id: 'MARE_SERENITATIS', name: 'Mare Serenitatis Basin', latitude: 28.000, longitude_360: 17.500, region: 'Eastern Mare Basin', three_sensor_common: true },
      { id: 'MARE_CRISIUM', name: 'Mare Crisium Center', latitude: 17.000, longitude_360: 59.100, region: 'Isolated Eastern Basin', three_sensor_common: true },
      { id: 'MARE_ORIENTALE', name: 'Mare Orientale Ring', latitude: -19.400, longitude_360: 267.200, region: 'Western Limb Multi-Ring Basin', three_sensor_common: true },
      { id: 'SPA_BASIN', name: 'South Pole-Aitken Center', latitude: -53.000, longitude_360: 169.000, region: 'Farside Giant Impact Basin', three_sensor_common: true },
    ]

    // Distributed global Fibonacci sphere lattice (~90 points across all latitudes & longitudes)
    const gridPoints = []
    const totalGrid = 90
    const phiAngle = Math.PI * (3 - Math.sqrt(5)) // golden angle

    for (let i = 0; i < totalGrid; i++) {
      const y = 1 - (i / (totalGrid - 1)) * 2 // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = phiAngle * i

      const lat = Math.asin(y) * (180 / Math.PI)
      const lon = (Math.atan2(Math.sin(theta) * radiusAtY, Math.cos(theta) * radiusAtY) * (180 / Math.PI) + 360) % 360

      gridPoints.push({
        id: `GLOB_SURVEY_${String(i + 1).padStart(3, '0')}`,
        name: `Chandrayaan Survey Station #${i + 1}`,
        latitude: parseFloat(lat.toFixed(4)),
        longitude_360: parseFloat(lon.toFixed(4)),
        region: `Global Lunar Quadrant ${lat >= 0 ? 'North' : 'South'}`,
        three_sensor_common: true,
        isGlobalGrid: true,
      })
    }

    return [...landmarks, ...gridPoints]
  }, [])

  // ── Render Markers: Catalog + Global Sites + Active Target ──────────────────
  useEffect(() => {
    const group = markersGroupRef.current
    if (!group) return
    clearGroup(group)

    let count = 0
    const activeTarget = searchedCoord || selectedPoint

    // Mode A: TARGET ONLY (Section 4 & 15)
    if (filterMode === 'target') {
      if (showTarget && activeTarget) {
        renderTargetMarker(group, activeTarget)
        count++
      }
      setRenderedMarkersCount(count)
      return
    }

    // Combine local catalog points with global lunar points (avoiding duplicate IDs)
    const allDisplayPoints = [...catalogPoints]
    const existingIds = new Set(catalogPoints.map((p) => p.id))
    globalSurveyPoints.forEach((gp) => {
      if (!existingIds.has(gp.id)) {
        allDisplayPoints.push(gp)
      }
    })

    // Mode B: ALL SITES (Default)
    if (showCatalogSites && allDisplayPoints.length > 0) {
      allDisplayPoints.forEach((pt) => {
        const isSelected = selectedPoint?.id === pt.id

        // If this point is the selected point, render with distinct prominent treatment
        if (isSelected) {
          renderSelectedMarker(group, pt)
          count++
          return
        }

        // Standard catalog point (clearly visible, luminous navigational beacon)
        const pos = latLon360ToXYZ(pt.latitude, pt.longitude_360, 1.012)
        const isHovered = hoveredPoint?.id === pt.id
        const isGlobal = pt.isGlobalGrid

        // Solid core sphere marker (~0.007 radius)
        const dotColor = pt.id.startsWith('ISRO')
          ? 0x10b981 // Emerald for ISRO Shiv Shakti / Tiranga / Jawahar
          : isGlobal
          ? 0x38bdf8 // Cyan for Global survey grid points
          : pt.three_sensor_common
          ? 0x00f0ff
          : 0xfbbf24

        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(isHovered ? 0.013 : isGlobal ? 0.006 : 0.008, 12, 12),
          new THREE.MeshBasicMaterial({
            color: dotColor,
            transparent: false,
          })
        )
        dot.position.copy(pos)
        dot.userData = { point: pt }
        group.add(dot)

        // Outer beacon halo ring for high contrast against lunar craters
        const ringColor = pt.id.startsWith('ISRO')
          ? 0x34d399
          : isGlobal
          ? 0x0284c7
          : pt.three_sensor_common
          ? 0x00f0ff
          : 0xf59e0b

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(isGlobal ? 0.007 : 0.009, isGlobal ? 0.012 : 0.016, 16),
          new THREE.MeshBasicMaterial({
            color: ringColor,
            transparent: true,
            opacity: isHovered ? 1.0 : isGlobal ? 0.45 : 0.7,
            side: THREE.DoubleSide,
          })
        )
        ring.lookAt(pos.clone().multiplyScalar(2))
        ring.position.copy(pos)
        ring.userData = { point: pt }
        group.add(ring)
        count++

        if (isHovered) {
          const halo = new THREE.Mesh(
            new THREE.RingGeometry(0.016, 0.024, 24),
            new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide,
            })
          )
          halo.lookAt(pos.clone().multiplyScalar(2))
          halo.position.copy(pos)
          halo.userData = { point: pt }
          group.add(halo)
        }
      })
    }

    // If an external coordinate was searched and target layer is enabled, render target beacon
    if (showTarget && searchedCoord && filterMode === 'all') {
      renderTargetMarker(group, searchedCoord)
      count++
    }

    setRenderedMarkersCount(count)
  }, [catalogPoints, globalSurveyPoints, selectedPoint, filterMode, showCatalogSites, showTarget, searchedCoord, hoveredPoint])

  // Helper: Render selected catalog point
  function renderSelectedMarker(group, pt) {
    const pos = latLon360ToXYZ(pt.latitude, pt.longitude_360, 1.018)

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    )
    core.position.copy(pos)
    core.userData = { point: pt }
    group.add(core)

    ;[0.025, 0.045].forEach((radius, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 0.005, 32),
        new THREE.MeshBasicMaterial({
          color: idx === 0 ? 0x4ade80 : 0x10b981,
          transparent: true,
          opacity: 0.9 - idx * 0.3,
          side: THREE.DoubleSide,
        })
      )
      ring.lookAt(pos.clone().multiplyScalar(2))
      ring.position.copy(pos)
      ring.userData = { isPulseRing: true, phaseOffset: idx * 0.5 }
      group.add(ring)
    })
  }

  // Helper: Render searched target coordinate beacon
  function renderTargetMarker(group, pt) {
    const pos = latLon360ToXYZ(pt.latitude, pt.longitude_360, 1.020)

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    )
    core.position.copy(pos)
    core.userData = { point: pt, isTarget: true }
    group.add(core)

    ;[0.028, 0.052].forEach((radius, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 0.005, 32),
        new THREE.MeshBasicMaterial({
          color: idx === 0 ? 0x86efac : 0x22c55e,
          transparent: true,
          opacity: 0.9 - idx * 0.3,
          side: THREE.DoubleSide,
        })
      )
      ring.lookAt(pos.clone().multiplyScalar(2))
      ring.position.copy(pos)
      ring.userData = { isPulseRing: true, phaseOffset: idx * 0.5 }
      group.add(ring)
    })
  }

  // ── Render Three-Sensor Observation Association Path on Lunar Surface ────────
  useEffect(() => {
    const pathGroup = pathGroupRef.current
    if (!pathGroup) return
    clearGroup(pathGroup)

    const activeSensors = activeResult?.sensors
    if (!activeSensors || !selectedPoint) return

    const oLat = activeSensors.ohrc?.lat ?? selectedPoint.latitude
    const oLon = activeSensors.ohrc?.lon ?? selectedPoint.longitude_360
    const tLat = activeSensors.tmc2?.lat ?? selectedPoint.latitude
    const tLon = activeSensors.tmc2?.lon ?? selectedPoint.longitude_360
    const iLat = activeSensors.iirs?.lat ?? selectedPoint.latitude
    const iLon = activeSensors.iirs?.lon ?? selectedPoint.longitude_360

    const pIirs = latLon360ToXYZ(iLat, iLon, 1.014)
    const pTmc2 = latLon360ToXYZ(tLat, tLon, 1.014)
    const pOhrc = latLon360ToXYZ(oLat, oLon, 1.014)

    // Great circle lines: IIRS ── TMC-2 (Amber)
    const arc1 = createGreatCircleArc(pIirs, pTmc2, 1.014, 16)
    const line1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arc1),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 })
    )
    pathGroup.add(line1)

    // Great circle lines: TMC-2 ── OHRC (Cyan)
    const arc2 = createGreatCircleArc(pTmc2, pOhrc, 1.014, 16)
    const line2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arc2),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
    )
    pathGroup.add(line2)

    // Distinct Sensor Nodes on the Moon
    const nodes = [
      { key: 'iirs', pos: pIirs, color: 0xef4444, radius: 0.007 },
      { key: 'tmc2', pos: pTmc2, color: 0xf59e0b, radius: 0.007 },
      { key: 'ohrc', pos: pOhrc, color: 0x38bdf8, radius: 0.008 },
    ]

    nodes.forEach((n) => {
      const nodeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(n.radius, 10, 10),
        new THREE.MeshBasicMaterial({ color: n.color })
      )
      nodeMesh.position.copy(n.pos)
      nodeMesh.userData = { sensorKey: n.key }
      pathGroup.add(nodeMesh)
    })
  }, [activeResult, selectedPoint])

  // ── Match Result Marker ─────────────────────────────────────────────────────
  useEffect(() => {
    const rg = resultGroupRef.current
    if (!rg) return
    clearGroup(rg)
    if (!matchResultPoint) return

    const pos = latLon360ToXYZ(matchResultPoint.latitude, matchResultPoint.longitude_360, 1.028)

    ;[0.038, 0.06].forEach((pr, i) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(pr, pr + 0.006, 32),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      )
      m.lookAt(pos.clone().multiplyScalar(2))
      m.position.copy(pos)
      m.userData = { isPulse: true, phaseOffset: i * Math.PI * 0.5 }
      rg.add(m)
    })

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 })
    )
    core.position.copy(pos)
    rg.add(core)

    focusPoint(matchResultPoint.latitude, matchResultPoint.longitude_360)
  }, [matchResultPoint])

  // ── Focus Helper Function ───────────────────────────────────────────────────
  const focusPoint = (lat, lon360) => {
    targetRotation.current = {
      y: -Math.PI / 2 - (lon360 * (Math.PI / 180)),
      x: lat * (Math.PI / 180),
    }
    targetCameraZ.current = 2.9
    setHudOpen(true)
  }

  // Focus on selected catalog point whenever selectedPoint changes
  useEffect(() => {
    if (!selectedPoint) {
      setHudOpen(false)
      return
    }
    focusPoint(selectedPoint.latitude, selectedPoint.longitude_360)
  }, [selectedPoint])

  // ── Mouse & Interaction Handlers ────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    isDragging.current = true
    targetRotation.current = null
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e) => {
    const container = mountRef.current, camera = cameraRef.current, moon = moonRef.current
    if (!container || !camera || !moon) return

    const rect = container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      moon.rotation.y += dx * 0.004
      moon.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, moon.rotation.x + dy * 0.004))
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }

    const ray = new THREE.Raycaster()
    ray.setFromCamera(mouse, camera)
    const hits = ray.intersectObject(moon)
    if (hits.length > 0) {
      const localPt = moon.worldToLocal(hits[0].point.clone())
      const { lat, lon360 } = xyzToLatLon360(localPt)
      setCursorCoords({ lat, lon360 })
    } else {
      setCursorCoords(null)
    }

    const group = markersGroupRef.current
    if (group) {
      const markerHits = ray.intersectObjects(group.children, true)
      if (markerHits.length > 0 && markerHits[0].object.userData?.point) {
        setHoveredPoint(markerHits[0].object.userData.point)
        container.style.cursor = 'pointer'
        return
      }
    }
    setHoveredPoint(null)
    container.style.cursor = isDragging.current ? 'grabbing' : 'grab'
  }, [])

  const handleMouseUp = useCallback((e) => {
    if (!isDragging.current) return
    isDragging.current = false

    const container = mountRef.current, camera = cameraRef.current
    const group = markersGroupRef.current, pathGroup = pathGroupRef.current
    if (!container || !camera || !group) return

    const rect = container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    const ray = new THREE.Raycaster()
    ray.setFromCamera(mouse, camera)

    // 1. Check click on sensor nodes on the Moon
    if (pathGroup) {
      const sensorHits = ray.intersectObjects(pathGroup.children, true)
      if (sensorHits.length && sensorHits[0].object.userData?.sensorKey) {
        setHighlightedSensor(sensorHits[0].object.userData.sensorKey)
        return
      }
    }

    // 2. Check click on catalog point markers (Section 10)
    const hits = ray.intersectObjects(group.children, true)
    if (hits.length && hits[0].object.userData?.point) {
      const pt = hits[0].object.userData.point
      onPointSelect?.(pt)
      focusPoint(pt.latitude, pt.longitude_360)
    }
  }, [onPointSelect])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    targetCameraZ.current = Math.max(2.0, Math.min(5.5, targetCameraZ.current + e.deltaY * 0.003))
  }, [])

  // ── Flight Control Actions ──────────────────────────────────────────────────
  const toggleRotate = () => {
    const next = !autoRotate.current
    autoRotate.current = next
    setIsRotating(next)
    if (next) targetRotation.current = null
  }

  const resetView = () => {
    targetCameraZ.current = 3.6
    targetRotation.current = {
      x: 0.35,
      y: -Math.PI / 2 - (355.35 * (Math.PI / 180)),
    }
    autoRotate.current = true
    setIsRotating(true)
  }

  const fitSelected = () => {
    if (selectedPoint) {
      focusPoint(selectedPoint.latitude, selectedPoint.longitude_360)
    } else if (matchResultPoint) {
      focusPoint(matchResultPoint.latitude, matchResultPoint.longitude_360)
    } else if (catalogPoints[0]) {
      focusPoint(catalogPoints[0].latitude, catalogPoints[0].longitude_360)
    }
  }

  const zoomIn  = () => { targetCameraZ.current = Math.max(2.0, targetCameraZ.current - 0.4) }
  const zoomOut = () => { targetCameraZ.current = Math.min(5.5, targetCameraZ.current + 0.4) }

  // ── Search & Filter Handlers ────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const lt = parseFloat(searchLat)
    const ln = parseFloat(searchLon)
    if (!isNaN(lt) && !isNaN(ln)) {
      if (lt < -90 || lt > 90) return
      const lon360 = ln < 0 ? ((ln % 360) + 360) % 360 : ln % 360
      const target = {
        id: `COORD_${lt >= 0 ? '+' : ''}${lt.toFixed(2)}_${lon360.toFixed(2)}`,
        latitude: lt,
        longitude_360: lon360,
        label: `SEARCH TARGET (${lt.toFixed(4)}°, ${lon360.toFixed(4)}°)`,
      }
      setSearchedCoord(target)
      // Keep filterMode = 'all' by default as required by Section 4!
      onSearchCoordinate?.(lt, ln)
      focusPoint(lt, lon360)
    }
  }

  const handleResetAll = () => {
    setSearchedCoord(null)
    setFilterMode('all')
    setSearchLat('')
    setSearchLon('')
    resetView()
  }

  return (
    <section id="hero-moon" className="relative w-full bg-black select-none font-sans">
      
      {/* ── ZONE A: TOP BRAND & MISSION HEADER ───────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 text-center">
        <div className="text-[10px] font-mono tracking-[0.4em] text-neutral-300 uppercase mb-1">
          CHANDRAVUE · LUNAR MULTI-SENSOR REGISTRATION
        </div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-mono font-black tracking-[0.14em] text-white uppercase">
          CHANDRAVUE ENGINE
        </h1>
        <div className="text-[11px] font-mono text-amber-400 tracking-widest mt-0.5 uppercase">
          OHRC · TMC-2 · IIRS &nbsp;|&nbsp; SIH-2026 #26166 · Chandrayaan-2 Optical Swath
        </div>
      </div>

      {/* ── ZONE B: DEDICATED HORIZONTAL MISSION CONTROL STRIP (Section 14 & 15) ─ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-2">
        <div className="border border-white/[0.12] bg-[#05070a]/92 backdrop-blur-md px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-lg">
          
          {/* Left: Coordinate Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2" role="search" aria-label="Moon coordinate search">
            <span className="text-[10px] text-neutral-200 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
              SEARCH RADAR:
            </span>
            <div className="flex items-center bg-[#0a0d14] border border-white/[0.16] focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 px-2.5 py-1.5 min-h-[38px]">
              <label htmlFor="search-lat" className="text-[10px] text-neutral-300 font-bold mr-1 cursor-pointer">LAT:</label>
              <input
                id="search-lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="-70.9234°"
                value={searchLat}
                onChange={(e) => setSearchLat(e.target.value)}
                aria-label="Target Latitude in degrees (-90 to +90)"
                className="w-24 bg-transparent text-white text-xs font-mono outline-none placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center bg-[#0a0d14] border border-white/[0.16] focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 px-2.5 py-1.5 min-h-[38px]">
              <label htmlFor="search-lon" className="text-[10px] text-neutral-300 font-bold mr-1 cursor-pointer">LON:</label>
              <input
                id="search-lon"
                type="number"
                step="any"
                min="-180"
                max="360"
                placeholder="22.4512°"
                value={searchLon}
                onChange={(e) => setSearchLon(e.target.value)}
                aria-label="Target Longitude in degrees (0 to 360)"
                className="w-24 bg-transparent text-white text-xs font-mono outline-none placeholder:text-neutral-400"
              />
            </div>
            <button
              type="submit"
              aria-label="LOCATE — Locate coordinate on 3D Moon"
              className="px-4 py-2 min-h-[38px] border border-amber-500/70 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>LOCATE</span>
              <span>→</span>
            </button>
          </form>

          {/* Right: Target Mode Filter Controls + Accessible Dropdown (Section 4, 15, 26) */}
          <div className="flex items-center gap-2 flex-wrap" role="toolbar" aria-label="Moon observation filter controls">
            <div className="flex items-center border border-white/[0.16] bg-[#0a0d14] p-0.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                aria-label={`ALL SITES (${catalogPoints.length}) — Display all catalog sites`}
                aria-pressed={filterMode === 'all'}
                className={`px-3 py-1.5 min-h-[38px] text-[10px] font-mono tracking-wider uppercase transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  filterMode === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                    : 'text-neutral-300 hover:text-white border border-transparent'
                }`}
                title="Show all catalog observation sites"
              >
                🌐 ALL SITES ({catalogPoints.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('target')}
                aria-label="TARGET ONLY — Display target point only"
                aria-pressed={filterMode === 'target'}
                className={`px-3 py-1.5 min-h-[38px] text-[10px] font-mono tracking-wider uppercase transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
                  filterMode === 'target'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/60 font-bold'
                    : 'text-neutral-300 hover:text-white border border-transparent'
                }`}
                title="Show only the active target or search result"
              >
                🎯 TARGET ONLY
              </button>
            </div>

            {/* Quick Accessible Site Selector Dropdown (Section 26) */}
            {catalogPoints.length > 0 && (
              <select
                value={selectedPoint?.id || ''}
                onChange={(e) => {
                  const pt = catalogPoints.find(p => p.id === e.target.value)
                  if (pt) {
                    onPointSelect?.(pt)
                    focusPoint(pt.latitude, pt.longitude_360)
                  }
                }}
                aria-label="Select Observation Site from Catalog"
                className="bg-[#0a0d14] border border-white/[0.16] text-neutral-200 text-[10px] font-mono px-2.5 py-1.5 min-h-[38px] outline-none hover:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 max-w-[150px] cursor-pointer"
              >
                <option value="">SELECT SITE…</option>
                {catalogPoints.map(p => (
                  <option key={p.id} value={p.id}>#{p.id} ({p.latitude.toFixed(2)}°N)</option>
                ))}
              </select>
            )}

            {(searchedCoord || selectedPoint) && (
              <button
                type="button"
                onClick={handleResetAll}
                aria-label="RESET — Reset active search and restore all sites"
                className="px-3 py-1.5 min-h-[38px] border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                title="Reset target and view"
              >
                ✕ RESET
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── ZONE C: UNOBSTRUCTED CENTRAL MOON VIEWPORT (Section 12 & 13) ──────── */}
      <div className="relative w-full overflow-hidden" style={{ height: 660 }}>
        
        {/* Top-Left Corner Zone: Catalog Telemetry & Swath Details */}
        <div className="absolute top-4 left-6 z-20 font-mono pointer-events-none space-y-1">
          <div className="border border-white/[0.1] bg-black/80 backdrop-blur-md px-3 py-1.5 text-[10px]">
            <div className="text-[8px] text-neutral-300 uppercase tracking-widest">OBSERVATION CATALOG:</div>
            <div className="text-amber-400 font-bold">
              {catalogPoints.length} SITES DISPLAYED <span className="text-neutral-400 font-normal">/ 1,514 CATALOGED</span>
            </div>
            <div className="text-[8px] text-neutral-300 mt-0.5">
              CHANDRAYAAN-2 60.17°–61.02° N · 355.22°–355.48° E
            </div>
          </div>
        </div>

        {/* Top-Right Corner Zone: Surface Reticle & Dev Diagnostics (Section 23 & 27) */}
        <div className="absolute top-4 right-6 z-20 font-mono flex flex-col items-end gap-1.5">
          {cursorCoords && (
            <div className="border border-white/[0.1] bg-black/85 backdrop-blur-md px-3 py-1.5 text-right pointer-events-none">
              <div className="text-[8px] text-neutral-500 uppercase tracking-widest flex items-center justify-end gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>SURFACE RETICLE</span>
              </div>
              <div className="text-xs text-white font-bold">
                <span className="text-amber-300">{cursorCoords.lat.toFixed(4)}° N</span>
                <span className="text-neutral-600 mx-1.5">|</span>
                <span className="text-amber-300">{cursorCoords.lon360.toFixed(4)}° E</span>
              </div>
            </div>
          )}

          {/* Dev Diagnostics Toggle Button & Panel (Section 27) */}
          <button
            onClick={() => setShowDevDiagnostics(!showDevDiagnostics)}
            className="px-2 py-0.5 border border-white/[0.1] bg-black/70 text-[8px] text-neutral-400 hover:text-amber-300 uppercase tracking-widest cursor-pointer"
            title="Toggle Development Diagnostics"
          >
            🛠️ DIAG {showDevDiagnostics ? 'ON' : 'OFF'}
          </button>

          {showDevDiagnostics && (
            <div className="border border-amber-500/40 bg-black/90 p-2.5 text-[9px] text-left space-y-1 w-52 shadow-xl">
              <div className="text-amber-400 font-bold uppercase border-b border-white/[0.1] pb-1">
                RUNTIME DIAGNOSTICS
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>CATALOG LOADED:</span>
                <span className="text-white font-bold">{catalogPoints.length} points</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>RENDERED MARKERS:</span>
                <span className="text-green-400 font-bold">{renderedMarkersCount}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>SELECTED:</span>
                <span className="text-amber-300">{selectedPoint?.id || 'NONE'}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>TARGET COORD:</span>
                <span className="text-amber-300">{searchedCoord ? 'ACTIVE' : 'NONE'}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>FILTER MODE:</span>
                <span className="text-white font-bold">{filterMode.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom-Left Corner Zone: Moon Navigation & Flight Controls (Section 16) */}
        <div className="absolute bottom-4 left-6 z-20 flex items-center gap-1.5 font-mono text-[10px]" role="toolbar" aria-label="Moon flight navigation controls">
          <button
            onClick={toggleRotate}
            aria-label="Toggle Lunar Auto-Rotation"
            aria-pressed={isRotating}
            className={`px-3 py-2 min-h-[38px] border transition-all uppercase tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isRotating
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 font-bold'
                : 'border-white/[0.16] bg-black/80 text-neutral-300 hover:text-white'
            }`}
            title="Toggle Lunar Auto-Rotation"
          >
            ↻ {isRotating ? 'ROTATING' : 'ROTATE OFF'}
          </button>

          <button
            onClick={fitSelected}
            aria-label="Frame Selected Lunar Region"
            className="px-3 py-2 min-h-[38px] border border-white/[0.16] bg-black/80 hover:bg-white/[0.08] text-neutral-200 hover:text-white transition-all uppercase tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title="Frame Selected Region"
          >
            ◎ FIT REGION
          </button>

          <button
            onClick={resetView}
            aria-label="Reset Camera View to Default"
            className="px-3 py-2 min-h-[38px] border border-white/[0.16] bg-black/80 hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-all uppercase tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title="Reset Camera View to Default"
          >
            ⟳ RESET
          </button>

          <div className="flex items-center border border-white/[0.16] bg-black/80">
            <button
              onClick={zoomIn}
              aria-label="Zoom Camera In"
              className="px-3 py-2 min-h-[38px] text-neutral-200 hover:text-white border-r border-white/[0.16] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Zoom In"
            >
              ＋
            </button>
            <button
              onClick={zoomOut}
              aria-label="Zoom Camera Out"
              className="px-3 py-2 min-h-[38px] text-neutral-200 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Zoom Out"
            >
              −
            </button>
          </div>
        </div>

        {/* Bottom-Right Corner Zone: Visual Layer Controls (Section 17) */}
        <div className="absolute bottom-4 right-6 z-20 border border-white/[0.16] bg-black/85 backdrop-blur-md px-3.5 py-2.5 font-mono text-[9px] space-y-1 shadow-lg" role="group" aria-label="Visual layer visibility toggles">
          <div className="text-[8px] text-neutral-300 uppercase tracking-widest font-bold mb-1">
            VISUAL LAYERS
          </div>
          <label className="flex items-center gap-2 text-neutral-200 hover:text-white cursor-pointer select-none min-h-[36px] py-1">
            <input
              type="checkbox"
              checked={showCatalogSites}
              onChange={(e) => setShowCatalogSites(e.target.checked)}
              aria-label="Toggle Catalog Sites layer"
              className="accent-amber-500 w-4 h-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            />
            <span>CATALOG SITES ({catalogPoints.length})</span>
          </label>
          <label className="flex items-center gap-2 text-neutral-200 hover:text-white cursor-pointer select-none min-h-[36px] py-1">
            <input
              type="checkbox"
              checked={showTarget}
              onChange={(e) => setShowTarget(e.target.checked)}
              aria-label="Toggle Active Target layer"
              className="accent-green-500 w-4 h-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-400"
            />
            <span>ACTIVE TARGET</span>
          </label>
          <label className="flex items-center gap-2 text-neutral-200 hover:text-white cursor-pointer select-none min-h-[36px] py-1">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              aria-label="Toggle Coordinate Grid layer"
              className="accent-amber-500 w-4 h-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            />
            <span>COORDINATE GRID</span>
          </label>
          <label className="flex items-center gap-2 text-neutral-200 hover:text-white cursor-pointer select-none min-h-[36px] py-1">
            <input
              type="checkbox"
              checked={showSensorPath}
              onChange={(e) => setShowSensorPath(e.target.checked)}
              aria-label="Toggle Sensor Path layer"
              className="accent-cyan-500 w-4 h-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <span>SENSOR PATH</span>
          </label>
        </div>

        {/* Lightweight Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-20 left-6 z-30 border border-amber-500/50 bg-black/90 backdrop-blur-md p-2.5 font-mono text-xs pointer-events-none shadow-2xl">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              SITE #{hoveredPoint.id}
            </div>
            <div className="text-neutral-300 text-[10px] mt-0.5">
              LAT: <span className="text-white font-bold">{hoveredPoint.latitude.toFixed(4)}° N</span>
            </div>
            <div className="text-neutral-300 text-[10px]">
              LON: <span className="text-white font-bold">{hoveredPoint.longitude_360.toFixed(4)}° E</span>
            </div>
          </div>
        )}

        {/* Edge-Attached Selected Observation HUD (Section 18: floating at far right, not over Moon center) */}
        {(selectedPoint || activeResult) && hudOpen && (
          <div className="absolute top-20 right-6 z-20 border border-white/[0.14] bg-[#030406]/95 backdrop-blur-md p-3.5 font-mono text-xs w-64 space-y-2.5 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="font-bold tracking-wider text-white uppercase text-[10px]">
                  SELECTED OBSERVATION
                </span>
              </div>
              <button
                onClick={() => setHudOpen(false)}
                className="text-neutral-500 hover:text-white text-[9px] px-1 border border-white/[0.1] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">ID:</span>
                <span className="text-amber-400 font-bold">
                  {selectedPoint?.id ? `#${selectedPoint.id}` : activeResult?.common_point_id || 'SITE_ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">COORDS:</span>
                <span className="text-white">
                  {(selectedPoint?.latitude ?? activeResult?.matched_location?.latitude ?? 0).toFixed(4)}°N, {(selectedPoint?.longitude_360 ?? activeResult?.matched_location?.longitude_360 ?? 0).toFixed(4)}°E
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.06]">
                <span className="text-neutral-500">COVERAGE:</span>
                <span className="flex items-center gap-1 text-[9px]">
                  <span className="text-red-400">IIRS●</span>
                  <span className="text-amber-400">TMC-2●</span>
                  <span className="text-cyan-400">OHRC●</span>
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-white/[0.06] space-y-1.5">
              <button
                onClick={() => onViewObservation?.()}
                className="w-full py-1.5 px-2 border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-[9px] tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>VIEW OBSERVATION</span>
                <span>↓</span>
              </button>
              <button
                onClick={() => setLocalModalOpen(true)}
                className="w-full py-1.5 px-2 border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white font-mono text-[9px] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🔍 LOCAL SENSOR VIEW</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 20: Local Sensor Magnification Inset Modal */}
        {localModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="border border-white/[0.18] bg-[#05070a]/95 max-w-lg w-full p-5 font-mono shadow-[0_16px_48px_rgba(0,0,0,0.9)] space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>LOCAL THREE-SENSOR BORESIGHT GEOMETRY</span>
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 uppercase tracking-wider">
                    TRUE GEOGRAPHIC TOPOLOGY · CHANDRAYAAN-2 OPTICAL SWATH
                  </div>
                </div>
                <button
                  onClick={() => setLocalModalOpen(false)}
                  className="text-neutral-400 hover:text-white border border-white/[0.1] px-2 py-0.5 text-xs cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Target ID & Coords */}
              <div className="flex items-center justify-between bg-[#0a0d14] border border-white/[0.08] p-2.5 text-xs">
                <span className="text-neutral-400">COMMON TARGET:</span>
                <span className="text-amber-400 font-bold">
                  {selectedPoint?.id ? `#${selectedPoint.id}` : activeResult?.common_point_id || 'ACTIVE_TARGET'}
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-white text-[11px]">
                  {(selectedPoint?.latitude ?? activeResult?.matched_location?.latitude ?? 0).toFixed(5)}°N, {(selectedPoint?.longitude_360 ?? activeResult?.matched_location?.longitude_360 ?? 0).toFixed(5)}°E
                </span>
              </div>

              {/* Magnified Vector Topology Canvas */}
              <div className="relative border border-white/[0.1] bg-[#020306] h-60 flex items-center justify-center p-4">
                <svg className="w-full h-full" viewBox="0 0 320 200">
                  <defs>
                    <pattern id="local-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="320" height="200" fill="url(#local-grid)" />

                  {/* Association Lines */}
                  <line x1="60" y1="140" x2="160" y2="90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="160" y1="90" x2="260" y2="50" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="60" y1="140" x2="260" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Distance Badges */}
                  <rect x="95" y="105" width="40" height="16" fill="#05070a" stroke="#f59e0b" strokeWidth="0.8" rx="2" />
                  <text x="115" y="116" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="middle">5.9 m</text>

                  <rect x="200" y="60" width="45" height="16" fill="#05070a" stroke="#38bdf8" strokeWidth="0.8" rx="2" />
                  <text x="222" y="71" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">17.7 m</text>

                  <rect x="145" y="125" width="45" height="16" fill="#05070a" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" rx="2" />
                  <text x="167" y="136" fill="#a3a3a3" fontSize="8" fontFamily="monospace" textAnchor="middle">11.7 m</text>

                  {/* Sensor Node 1: IIRS */}
                  <circle cx="60" cy="140" r="10" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="60" cy="140" r="4" fill="#ef4444" />
                  <text x="60" y="165" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">IIRS</text>
                  <text x="60" y="176" fill="#737373" fontSize="8" fontFamily="monospace" textAnchor="middle">GSD: 86.5m</text>

                  {/* Sensor Node 2: TMC-2 */}
                  <circle cx="160" cy="90" r="10" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="160" cy="90" r="4" fill="#f59e0b" />
                  <text x="160" y="70" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">TMC-2</text>
                  <text x="160" y="80" fill="#737373" fontSize="8" fontFamily="monospace" textAnchor="middle">GSD: 5.0m</text>

                  {/* Sensor Node 3: OHRC */}
                  <circle cx="260" cy="50" r="12" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="260" cy="50" r="5" fill="#38bdf8" />
                  <text x="260" y="30" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">OHRC</text>
                  <text x="260" y="75" fill="#737373" fontSize="8" fontFamily="monospace" textAnchor="middle">GSD: 0.28m</text>
                </svg>
              </div>

              {/* Verification Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1.5 text-green-400 font-bold">
                  <span>✓</span>
                  <span>MAX DISPLACEMENT 17.7m ≤ 606m ZONE THRESHOLD</span>
                </span>
                <button
                  onClick={() => {
                    setLocalModalOpen(false)
                    onViewObservation?.()
                  }}
                  className="px-3 py-1 border border-amber-500/70 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  OPEN WORKSPACE ↓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Texture Loading Spinner */}
        {texLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="border border-amber-500/25 bg-black/80 px-5 py-2.5 text-[10px] font-mono text-amber-400/60 tracking-widest uppercase flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
              LOADING LUNAR IMAGERY
            </div>
          </div>
        )}

        {/* Three.js WebGL Canvas (The Moon is centered and completely uninterrupted!) */}
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDragging.current = false }}
          onWheel={handleWheel}
        />

        {/* Interaction Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-neutral-600 tracking-widest uppercase hidden md:block z-10 pointer-events-none">
          DRAG TO ORBIT · SCROLL TO ZOOM · CLICK MARKER TO INSPECT
        </div>
      </div>
    </section>
  )
}
