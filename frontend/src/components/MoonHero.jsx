import React, { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useMatchStore } from '../store/matchStore'
import { JUDGE_POINTS } from '../data/demoData'

// Convert Lat/Lon to 3D Sphere Vector3
function latLonToVector3(lat, lon, radius = 2.04) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

// Fallback procedural Moon material while texture loads
function FallbackMoon() {
  const meshRef = useRef()
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.015
    }
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.05} />
    </mesh>
  )
}

// Moon Mesh Component
function MoonMesh() {
  const meshRef = useRef()
  const texture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg')

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.015
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  )
}

// Marker on Sphere Component - All 4 pair locations rendered accurately
function GeographicMarker({ point, isSelected, onSelect }) {
  const position = useMemo(() => latLonToVector3(point.lat, point.lon, 2.04), [point.lat, point.lon])
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      {/* 3D Restrained Sphere Marker */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(point.id)
        }}
      >
        <sphereGeometry args={[isSelected ? 0.038 : 0.024, 16, 16]} />
        <meshBasicMaterial color={isSelected ? '#F59E0B' : hovered ? '#FFFFFF' : '#CCCCCC'} />
      </mesh>

      {/* Outer Ring for Selected Marker */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.048, 0.06, 32]} />
          <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* HTML Tooltip on Hover or Selection */}
      {(hovered || isSelected) && (
        <Html occlude distanceFactor={10} position={[0, 0.06, 0]} center>
          <div
            onClick={(e) => {
              e.stopPropagation()
              onSelect(point.id)
            }}
            className={`px-2 py-0.5 border text-[10px] font-mono cursor-pointer whitespace-nowrap shadow-md ${
              isSelected
                ? 'bg-[#0D0D0D] text-[#F2F2F2] border-amber-500 font-bold z-30'
                : 'bg-[#080808]/95 text-[#A0A0A0] border-[#252525] hover:text-[#F2F2F2] z-20'
            }`}
          >
            <span>PAIR {point.caseId || point.id}</span>
            <span className="ml-1 text-[9px] text-[#5F5F5F]">[{point.lat.toFixed(2)}°, {point.lon.toFixed(2)}°]</span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function MoonHero() {
  const { selectedPairId, setSelectedPairId, getSelectedPoint } = useMatchStore()
  const activePoint = getSelectedPoint ? getSelectedPoint() : (JUDGE_POINTS.find((p) => p.id === selectedPairId || p.caseId === String(selectedPairId)) || JUDGE_POINTS[0])

  const handleSelectPair = (pairId) => {
    setSelectedPairId(pairId)
  }

  return (
    <section id="hero" className="relative min-h-[calc(100vh-50px)] bg-transparent overflow-hidden flex flex-col justify-between border-b border-[#252525]">
      {/* Header & Title - Scientific Mission Control Style */}
      <div className="relative z-10 pt-8 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 border border-[#252525] bg-[#0D0D0D]/80 backdrop-blur-sm text-[11px] font-mono text-[#A0A0A0] mb-4">
          <span className="w-1.5 h-1.5 bg-amber-500" />
          <span>MISSION CONTROL • SPATIAL TARGET SELECTION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F2F2F2] tracking-tight leading-tight uppercase font-mono">
          Chandrayaan-2 Image Correspondence Engine
        </h1>
        <p className="mt-3 text-[#A0A0A0] text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-mono">
          Sun-angle & scale-invariant cross-modal co-registration across OHRC (0.28m), TMC-2 (5.0m), and IIRS (86.5m).
        </p>
      </div>

      {/* 3D Moon Canvas Container */}
      <div className="relative w-full h-[540px] my-2">
        <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[6, 3, 4]} intensity={2.0} color="#FFFFFF" />
          <directionalLight position={[-6, -2, -3]} intensity={0.15} color="#5F5F5F" />
          <Suspense fallback={<FallbackMoon />}>
            <MoonMesh />
          </Suspense>
          {JUDGE_POINTS.map((point) => (
            <GeographicMarker
              key={point.id}
              point={point}
              isSelected={activePoint.id === point.id || activePoint.caseId === point.caseId}
              onSelect={handleSelectPair}
            />
          ))}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3.2}
            maxDistance={8}
            rotateSpeed={0.6}
            dampingFactor={0.05}
          />
        </Canvas>

        {/* LOCATE Coordinate Readout Overlay */}
        <div className="absolute bottom-4 left-6 z-10 bg-[#0D0D0D]/90 backdrop-blur-sm border border-[#252525] p-3.5 text-xs font-mono text-[#A0A0A0] min-w-[210px] space-y-1">
          <div className="text-amber-500 font-bold tracking-widest border-b border-[#252525] pb-1 mb-1.5 uppercase text-[11px]">
            LOCATE
          </div>
          <div className="flex justify-between">
            <span className="text-[#5F5F5F]">LAT</span>
            <span className="text-[#F2F2F2] font-bold">{activePoint.lat.toFixed(6)}° N</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5F5F5F]">LON</span>
            <span className="text-[#F2F2F2] font-bold">{activePoint.lon.toFixed(6)}° E</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#252525]/60 mt-1">
            <span className="text-[#5F5F5F]">PAIR</span>
            <span className="text-amber-500 font-bold">{activePoint.caseId || activePoint.id}</span>
          </div>
        </div>
      </div>

      {/* Target Pair Selector Strip */}
      <div className="relative z-10 bg-[#080808]/85 backdrop-blur-sm border-t border-[#252525] px-6 py-3 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[#5F5F5F] uppercase text-[11px] whitespace-nowrap mr-2">SPATIAL TARGETS:</span>
            {JUDGE_POINTS.map((pt) => {
              const active = activePoint.id === pt.id || activePoint.caseId === pt.caseId
              return (
                <button
                  key={pt.id}
                  onClick={() => handleSelectPair(pt.id)}
                  className={`px-3 py-1.5 text-xs transition-colors flex items-center space-x-2 cursor-pointer whitespace-nowrap border ${
                    active
                      ? 'bg-[#151515]/90 text-[#F2F2F2] border-amber-500 font-bold'
                      : 'bg-[#0D0D0D]/80 text-[#A0A0A0] hover:text-[#F2F2F2] border-[#252525]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 ${active ? 'bg-amber-500' : 'bg-[#5F5F5F]'}`} />
                  <span>PAIR {pt.caseId || pt.id}</span>
                  <span className="text-[10px] text-[#5F5F5F]">({pt.lat.toFixed(1)}°, {pt.lon.toFixed(1)}°)</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('region')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap uppercase tracking-wider flex items-center space-x-1"
          >
            <span>INSPECT REGION DATA ↓</span>
          </button>
        </div>
      </div>
    </section>
  )
}
