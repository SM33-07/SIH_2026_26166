import { useEffect, useRef, useState } from 'react'
import useMatchStore from './store/matchStore'
import {
  listCommonPoints,
  getSensors,
  getSensorCharacteristics,
  searchCoordinate,
  listCases,
} from './api/client'

import StarfieldBackground from './components/StarfieldBackground'
import MissionControlHeader from './components/MissionControlHeader'
import CinematicMoonHero from './components/CinematicMoonHero'
import InlineImageUpload from './components/InlineImageUpload'
import SelectedObservationWorkspace from './components/SelectedObservationWorkspace'
import DeepCorrespondenceWorkspace from './components/DeepCorrespondenceWorkspace'
import InteractiveRegistrationWorkspace from './components/InteractiveRegistrationWorkspace'
import DecisionVerdictSection from './components/DecisionVerdictSection'
import ThreeWayIntegration from './components/ThreeWayIntegration'
import PerformanceSection from './components/PerformanceSection'
import MethodologySection from './components/MethodologySection'
import LimitationsSection from './components/LimitationsSection'
import CoordinateTab from './components/CoordinateTab'
import ErrorAlert from './components/ErrorAlert'
import Footer from './components/Footer'

export default function App() {
  const {
    catalogPoints,
    setCatalogPoints,
    setCatalogLoading,
    setCatalogError,
    selectedPoint,
    setSelectedPoint,
    clearSelectedPoint,
    activeResult,
    setActiveResult,
    clearResult,
    error,
    setError,
    clearError,
    loading,
    setLoading,
    setHealth,
    setHealthError,
  } = useMatchStore()

  const [activeTab, setActiveTab] = useState('explore') // 'explore' | 'coordinate'
  const [sensorSpecs, setSensorSpecs] = useState(null)
  const [sameZoneThreshold, setSameZoneThreshold] = useState(0.02)
  // Point on the globe from a 3-image match result (shown as pulsing green marker)
  const [matchResultPoint, setMatchResultPoint] = useState(null)
  const observationRef = useRef(null)

  // Load Observation Sites Catalog on mount
  useEffect(() => {
    let mounted = true
    setCatalogLoading(true)
    listCommonPoints({ limit: 120, sample: true })
      .then((d) => mounted && setCatalogPoints(d.points || []))
      .catch(() => mounted && setCatalogError('Catalog buffer unavailable.'))
    return () => {
      mounted = false
    }
  }, [])

  // Load Sensor Specs
  useEffect(() => {
    getSensors()
      .catch(() => getSensorCharacteristics())
      .then((d) => d && setSensorSpecs(d))
      .catch(() => {})
  }, [])

  // Derive Same-zone Threshold
  useEffect(() => {
    listCases({ limit: 1 })
      .then((d) => d?.same_zone_threshold_deg && setSameZoneThreshold(d.same_zone_threshold_deg))
      .catch(() => {})
  }, [])

  async function handleSelectPoint(point) {
    setSelectedPoint(point)
    clearResult()
    clearError()
    setLoading(true)
    try {
      const lon = point.longitude_360 > 180 ? point.longitude_360 - 360 : point.longitude_360
      const result = await searchCoordinate(point.latitude, lon)
      setActiveResult(result, 'coordinate')
      setTimeout(() => observationRef.current?.scrollIntoView({ behavior: 'smooth' }), 120)
    } catch (err) {
      setError(err.message || 'Spatial lookup failed. Inference backend may be starting.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-300 font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Fullscreen Realistic Dynamic Starfield */}
      <StarfieldBackground />

      {/* Floating Spacecraft Mission Control Header */}
      <MissionControlHeader />

      {/* Operational Mode Bar */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 overflow-x-auto">
          <div className="flex items-center gap-1 font-mono text-xs">
            {[
              { id: 'explore', label: 'ORBIT & EXPLORE' },
              { id: 'coordinate', label: 'COORDINATE SEARCH' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  clearError()
                }}
                className={`px-3 py-1.5 uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-amber-400 text-amber-300 font-bold bg-amber-500/10'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest hidden md:block">
            MISSION FLOW: LOCATE → OBSERVE → CORRESPOND → VERIFY → DECIDE
          </div>
        </div>
      </div>

      {/* Main Workspace Stream */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-12">
        {/* Mode 1: Planetary Exploration Hero */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* Interactive 3D Lunar Globe */}
            <CinematicMoonHero
              catalogPoints={catalogPoints}
              onPointSelect={handleSelectPoint}
              matchResultPoint={matchResultPoint}
            />

            {/* Inline 3-Image Upload — directly below the moon */}
            <InlineImageUpload
              onResult={({ result, point }) => {
                const lat = result?.location?.latitude ?? point?.latitude ?? 60.9894
                const lon = result?.location?.longitude_360 ?? point?.longitude_360 ?? 355.3225
                setMatchResultPoint({
                  latitude: lat,
                  longitude_360: lon,
                  label: `VERIFIED: ${result?.decision || 'SAME LUNAR ZONE'}`,
                })
                setActiveResult(result, 'match')
                setTimeout(() => observationRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
              }}
            />
          </div>
        )}

        {/* Mode 2: Coordinate Search */}
        {activeTab === 'coordinate' && (
          <div className="my-8 border border-white/[0.1] bg-[#030406]/90 p-6 space-y-4">
            <CoordinateTab
              onResult={(res) => {
                setActiveResult(res, 'coordinate')
                setTimeout(() => observationRef.current?.scrollIntoView({ behavior: 'smooth' }), 120)
              }}
            />
          </div>
        )}

        {/* Loading HUD Bar */}
        {loading && (
          <div className="border border-amber-500/40 bg-amber-950/20 px-4 py-3 flex items-center gap-3 text-xs font-mono text-amber-300">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 rounded-full animate-spin border-t-transparent" />
            <span>BUFFERING MULTI-SENSOR INFERENCE TELEMETRY FROM FASTAPI ENGINE…</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && <ErrorAlert error={error} onDismiss={clearError} />}

        {/* Selected Observation & Multi-Sensor Imagery */}
        <div ref={observationRef}>
          <SelectedObservationWorkspace
            point={selectedPoint}
            activeResult={activeResult}
            sensorSpecs={sensorSpecs}
            onClear={() => {
              clearSelectedPoint()
              clearResult()
            }}
          />
        </div>

        {/* Core Deep Correspondence Workspace */}
        {activeResult && <DeepCorrespondenceWorkspace activeResult={activeResult} />}

        {/* Interactive Co-Registration Workspace */}
        {activeResult && <InteractiveRegistrationWorkspace activeResult={activeResult} />}

        {/* Tri-State Decision Verdict & Evidence */}
        {activeResult && <DecisionVerdictSection activeResult={activeResult} isDemo={activeTab === 'demo'} />}

        {/* Scientific Deep-Dive Sections */}
        <div className="pt-8 space-y-12 border-t border-white/[0.08]">
          <ThreeWayIntegration sensorSpecs={sensorSpecs} />
          <PerformanceSection />
          <MethodologySection />
          <LimitationsSection />
        </div>
      </main>

      {/* Scientific Footer */}
      <Footer />
    </div>
  )
}
