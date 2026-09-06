import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import useMatchStore from './store/matchStore'
import {
  checkHealth,
  listCommonPoints,
  getSensors,
  searchCoordinate,
  listCases,
  getBenchmarks,
  getProvenance,
} from './api/client'

import StarfieldBackground from './components/StarfieldBackground'
import MissionControlHeader from './components/MissionControlHeader'
import CinematicMoonHero from './components/CinematicMoonHero'
import SelectedObservationWorkspace from './components/SelectedObservationWorkspace'
import GeoMap from './components/GeoMap'
import GeometricVerification from './components/GeometricVerification'
import DeepCorrespondenceWorkspace from './components/DeepCorrespondenceWorkspace'
import InteractiveRegistrationWorkspace from './components/InteractiveRegistrationWorkspace'
import DecisionVerdictSection from './components/DecisionVerdictSection'
import ErrorAlert from './components/ErrorAlert'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'

// Lazy-loaded auxiliary modules & below-the-fold scientific deep dives
const InlineImageUpload = lazy(() => import('./components/InlineImageUpload'))
const ThreeWayIntegration = lazy(() => import('./components/ThreeWayIntegration'))
const PerformanceSection = lazy(() => import('./components/PerformanceSection'))
const MethodologySection = lazy(() => import('./components/MethodologySection'))
const LimitationsSection = lazy(() => import('./components/LimitationsSection'))
const ControlledDemoModal = lazy(() => import('./components/ControlledDemoModal'))

export default function App() {
  const {
    catalogPoints,
    setCatalogPoints,
    setCatalogLoading,
    setCatalogError,
    catalogLoading,
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
    setBenchmarks,
    setProvenance,
    getAbortSignal,
    cancelActiveRequest,
    cleanupBlobUrls,
  } = useMatchStore()

  // Modal & Drawer State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false)

  const [sensorSpecs, setSensorSpecs] = useState(null)
  const [sameZoneThreshold, setSameZoneThreshold] = useState(0.02)
  const [matchResultPoint, setMatchResultPoint] = useState(null)
  const [catalogTotal, setCatalogTotal] = useState(null)

  const observationRef = useRef(null)

  // ── Health check on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    checkHealth()
      .then((h) => mounted && setHealth(h))
      .catch(() => mounted && setHealthError())
    return () => { mounted = false }
  }, [])

  // ── Load Observation Sites Catalog on mount ───────────────────────────────
  useEffect(() => {
    let mounted = true
    setCatalogLoading(true)
    listCommonPoints({ limit: 120, sample: true })
      .then((d) => {
        if (!mounted) return
        setCatalogPoints(d.points || [])
        setCatalogTotal(d.total_in_catalog ?? null)
      })
      .catch(() => mounted && setCatalogError('Catalog buffer unavailable.'))
    return () => { mounted = false }
  }, [])

  // ── Load Sensor Specs ─────────────────────────────────────────────────────
  useEffect(() => {
    getSensors()
      .then((d) => d && setSensorSpecs(d))
      .catch(() => {})
  }, [])

  // ── Load benchmarks + provenance into store for downstream sections ───────
  useEffect(() => {
    getBenchmarks()
      .then((d) => d && setBenchmarks(d))
      .catch(() => {})
    getProvenance()
      .then((d) => d && setProvenance(d))
      .catch(() => {})
  }, [])

  // ── Derive Same-zone Threshold ────────────────────────────────────────────
  useEffect(() => {
    listCases({ limit: 1 })
      .then((d) => d?.same_zone_threshold_deg && setSameZoneThreshold(d.same_zone_threshold_deg))
      .catch(() => {})
  }, [])

  // ── Moon point selection handler ──────────────────────────────────────────
  async function handleSelectPoint(point) {
    cancelActiveRequest()
    setSelectedPoint(point)
    clearResult()
    clearError()
    setLoading(true)
    try {
      const lon = point.longitude_360 > 180 ? point.longitude_360 - 360 : point.longitude_360
      const signal = getAbortSignal()
      const result = await searchCoordinate(point.latitude, lon, { signal })
      if (!signal.aborted) {
        setActiveResult(result, 'coordinate')
        setTimeout(() => observationRef.current?.scrollIntoView({ behavior: 'smooth' }), 120)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !err.isTimeout) {
        setError(err.message || 'Spatial lookup failed. Inference backend may be starting.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Direct Coordinate Search handler ──────────────────────────────────────
  async function handleSearchCoordinate(lat, lon) {
    cancelActiveRequest()
    const lon360 = lon < 0 ? ((lon % 360) + 360) % 360 : lon % 360
    setSelectedPoint({
      id: `LOC_${lat >= 0 ? '+' : ''}${lat.toFixed(2)}_${lon360.toFixed(2)}`,
      latitude: lat,
      longitude_360: lon360,
    })
    clearResult()
    clearError()
    setLoading(true)
    try {
      const signal = getAbortSignal()
      const res = await searchCoordinate(lat, lon, { signal })
      if (!signal.aborted) {
        setActiveResult(res, 'coordinate')
        setTimeout(() => observationRef.current?.scrollIntoView({ behavior: 'smooth' }), 120)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !err.isTimeout) {
        setError(err.message || 'Spatial lookup failed for coordinates.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Load Controlled Demo into Mission Workspace handler ───────────────────
  function handleLoadDemoIntoWorkspace(demoData) {
    cancelActiveRequest()
    clearError()
    setActiveResult(demoData, 'demo')
    if (demoData.matched_location) {
      setSelectedPoint({
        id: demoData.matched_location.common_point_id || demoData.judge_id || 'DEMO_CASE',
        latitude: demoData.matched_location.latitude,
        longitude_360: demoData.matched_location.longitude_360,
      })
    } else if (demoData.latitude != null && demoData.longitude_360 != null) {
      setSelectedPoint({
        id: demoData.judge_id || 'DEMO_CASE',
        latitude: Number(demoData.latitude),
        longitude_360: Number(demoData.longitude_360),
      })
    }
    setIsDemoModalOpen(false)
    setTimeout(() => {
      observationRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }

  // Active target telemetry helpers
  const activeTargetId = selectedPoint?.id || activeResult?.judge_point_id || activeResult?.common_point_id || null
  const targetLat = selectedPoint?.latitude != null
    ? Number(selectedPoint.latitude).toFixed(4)
    : activeResult?.matched_location?.latitude != null
      ? Number(activeResult.matched_location.latitude).toFixed(4)
      : null
  const targetLon = selectedPoint?.longitude_360 != null
    ? Number(selectedPoint.longitude_360 > 180 ? selectedPoint.longitude_360 - 360 : selectedPoint.longitude_360).toFixed(4)
    : activeResult?.matched_location?.longitude_360 != null
      ? Number(activeResult.matched_location.longitude_360 > 180 ? activeResult.matched_location.longitude_360 - 360 : activeResult.matched_location.longitude_360).toFixed(4)
      : null

  const hasObservation = Boolean(selectedPoint || activeResult)
  const hasCorrespondence = Boolean(activeResult?.pairwise_results || activeResult?.evidence)
  const hasVerification = Boolean(activeResult?.evidence?.pairwise_metrics || activeResult?.evidence?.geometric_verification)
  const hasDecision = Boolean(activeResult?.decision)
  const isDemo = activeResult?.inference_mode === 'live' || Boolean(activeResult?.judge_id) || Boolean(activeResult?.reference_label)

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-300 font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Fullscreen Realistic Dynamic Starfield */}
      <StarfieldBackground />

      {/* Floating Spacecraft Mission Control Header */}
      <MissionControlHeader onOpenDemo={() => setIsDemoModalOpen(true)} />

      {/* Mission Workspace Context Bar & Continuous Pipeline Flow */}
      <div className="relative z-20 border-b border-white/[0.08] bg-[#020305]/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Target Telemetry Strip */}
          <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
            {activeTargetId ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-neutral-500 uppercase text-[10px] tracking-wider">ACTIVE TARGET:</span>
                <span className="text-amber-400 font-bold tracking-wider">{activeTargetId}</span>
                <span className="text-neutral-700">|</span>
                <span className="text-neutral-300 text-[11px]">
                  {targetLat}° N, {targetLon}° E
                </span>
                <span className="text-neutral-700 hidden sm:inline">|</span>
                <span className="text-[10px] text-neutral-400 hidden sm:inline">
                  SENSORS: <span className="text-red-400">IIRS</span> · <span className="text-amber-400">TMC-2</span> · <span className="text-cyan-400">OHRC</span>
                </span>
                {isDemo && (
                  <span className="px-1.5 py-0.5 border border-amber-500/50 bg-amber-500/10 text-amber-300 text-[9px] uppercase tracking-wider font-bold">
                    CONTROLLED CASE
                  </span>
                )}
                <button
                  onClick={() => {
                    cancelActiveRequest()
                    cleanupBlobUrls()
                    clearSelectedPoint()
                    clearResult()
                  }}
                  className="ml-2 text-[9px] px-2 py-0.5 border border-white/[0.1] text-neutral-300 hover:text-red-400 hover:border-red-500/40 transition-colors uppercase tracking-wider cursor-pointer min-h-[32px] flex items-center"
                  title="Clear active observation and reset workspace"
                  aria-label="Reset active target selection"
                >
                  ✕ RESET TARGET
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span className="text-neutral-400 uppercase tracking-wider text-[10px]">MISSION STATUS:</span>
                <span>AWAITING TARGET SELECTION</span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400">SELECT ON MOON GLOBE OR USE SEARCH RADAR</span>
              </div>
            )}
          </div>

          {/* Continuous Mission Pipeline Flow Tracker */}
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-neutral-300 overflow-x-auto whitespace-nowrap">
            <span className="text-neutral-500 text-[9px] mr-1 hidden lg:inline">WORKFLOW:</span>
            
            <a href="#hero-moon" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LOCATE</span>
            </a>
            <span className="text-neutral-700">───</span>

            <a
              href="#observation-workspace"
              className={`flex items-center gap-1 transition-colors ${
                hasObservation ? 'text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400' : 'text-neutral-500 pointer-events-none'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasObservation ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span>OBSERVE</span>
            </a>
            <span className="text-neutral-700">───</span>

            <a
              href="#correspondence-workspace"
              className={`flex items-center gap-1 transition-colors ${
                hasCorrespondence ? 'text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400' : 'text-neutral-500 pointer-events-none'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasCorrespondence ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span>CORRESPOND</span>
            </a>
            <span className="text-neutral-700">───</span>

            <a
              href="#geographic-mapping-panel"
              className={`flex items-center gap-1 transition-colors ${
                hasVerification ? 'text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400' : 'text-neutral-500 pointer-events-none'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasVerification ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span>VERIFY</span>
            </a>
            <span className="text-neutral-700">───</span>

            <a
              href="#decision-verdict-section"
              className={`flex items-center gap-1 transition-colors ${
                hasDecision ? 'text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400' : 'text-neutral-500 pointer-events-none'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasDecision ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span>DECIDE</span>
            </a>
          </div>

        </div>
      </div>

      {/* Main Continuous Workspace Stream */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-12">
        
        {/* Section 1: Interactive 3D Lunar Globe & Search Radar */}
        <section className="space-y-4">
          {/* Catalog count indicator */}
          {catalogPoints.length > 0 && (
            <div className="text-[10px] font-mono text-neutral-400 text-center uppercase tracking-widest">
              {catalogPoints.length} SITES DISPLAYED{catalogTotal ? ` OF ${catalogTotal.toLocaleString()} CATALOGED` : ''} · CHANDRAYAAN-2 OPTICAL COVERAGE
            </div>
          )}

          <ErrorBoundary title="3D Lunar Globe & Coordinate Search Subsystem">
            <CinematicMoonHero
              catalogPoints={catalogPoints}
              onPointSelect={handleSelectPoint}
              matchResultPoint={matchResultPoint}
              activeResult={activeResult}
              onViewObservation={() => observationRef.current?.scrollIntoView({ behavior: 'smooth' })}
              onSearchCoordinate={handleSearchCoordinate}
            />
          </ErrorBoundary>
        </section>

        {/* Optional Manual 3-Image Triplet Upload Drawer */}
        <section className="border border-white/[0.08] bg-[#030406]/70 transition-all">
          <button
            onClick={() => setIsUploadDrawerOpen(!isUploadDrawerOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left font-mono text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-expanded={isUploadDrawerOpen}
            aria-label="Toggle custom three-image upload analysis drawer"
          >
            <span className="flex items-center gap-2 uppercase tracking-wider">
              <span className="text-amber-400 font-bold">📁</span>
              <span>CUSTOM THREE-IMAGE UPLOAD ANALYSIS (OPTIONAL TRIPLET INGESTION)</span>
            </span>
            <span className="text-amber-400 text-[10px] tracking-widest font-mono">
              {isUploadDrawerOpen ? '▲ COLLAPSE' : '▼ EXPAND DRAWER'}
            </span>
          </button>
          {isUploadDrawerOpen && (
            <div className="p-4 sm:p-6 border-t border-white/[0.08] bg-[#020204]">
              <Suspense
                fallback={
                  <div className="py-8 text-center font-mono text-xs text-neutral-400 animate-pulse">
                    INITIALIZING THREE-IMAGE INGESTION INTERFACE…
                  </div>
                }
              >
                <ErrorBoundary title="Three-Image Upload Ingestion Subsystem">
                  <InlineImageUpload
                    sensorSpecs={sensorSpecs}
                    onResult={({ result, point }) => {
                      if (point) {
                        setMatchResultPoint({
                          latitude: point.latitude,
                          longitude_360: point.longitude_360,
                          label: `VERIFIED: ${result?.decision || 'ANALYSIS COMPLETE'}`,
                        })
                      }
                      setActiveResult(result, 'match')
                      setTimeout(() => observationRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
                    }}
                  />
                </ErrorBoundary>
              </Suspense>
            </div>
          )}
        </section>

        {/* Loading HUD Bar */}
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="border border-amber-500/40 bg-amber-950/20 px-4 py-3.5 flex items-center gap-3 text-xs font-mono text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <div className="w-4 h-4 border-2 border-amber-400 rounded-full animate-spin border-t-transparent" />
            <div className="flex flex-col">
              <span className="font-bold tracking-wider uppercase">BUFFERING MULTI-SENSOR INFERENCE TELEMETRY…</span>
              <span className="text-[10px] text-amber-400/90">EXECUTING SPATIAL RETRIEVAL & LoFTR CROSS-ATTENTION PASS</span>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && <ErrorAlert error={error} onDismiss={clearError} />}

        {/* Workspace Inactivity Guide (shown before any target is chosen) */}
        {!hasObservation && !loading && (
          <div className="border border-white/[0.08] bg-[#030406]/80 p-8 text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-10 h-10 border border-amber-500/40 rounded-full mx-auto flex items-center justify-center text-amber-400 font-mono text-lg">
              🛰️
            </div>
            <div className="space-y-1 font-mono">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                MISSION WORKSPACE READY
              </h2>
              <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                Click any observation site on the 3D Moon globe above, enter target coordinates into the radar, or run a blind live evaluation case.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs flex-wrap">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-4 py-2 border border-amber-500/80 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Run controlled live demonstration"
              >
                <span>⚡</span>
                <span>RUN CONTROLLED LIVE DEMO</span>
              </button>
              {catalogPoints[0] && (
                <button
                  onClick={() => handleSelectPoint(catalogPoints[0])}
                  className="px-3.5 py-2 border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-200 hover:text-white uppercase tracking-wider transition-all cursor-pointer min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label={`Locate observation site ${catalogPoints[0].id}`}
                >
                  LOCATE SITE #{catalogPoints[0].id}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══ Progressive Analysis Pipeline (Populated by Live Inference / Selection) ═══ */}

        {/* Stage 1: Selected Observation & Multi-Sensor Imagery */}
        <div ref={observationRef}>
          <ErrorBoundary title="Selected Observation Subsystem">
            <SelectedObservationWorkspace
              point={selectedPoint}
              activeResult={activeResult}
              sensorSpecs={sensorSpecs}
              isDemo={isDemo}
              onClear={() => {
                cancelActiveRequest()
                cleanupBlobUrls()
                clearSelectedPoint()
                clearResult()
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Stage 2: Three-Sensor Geographic Mapping (Primary Spatial Evidence Panel) */}
        {activeResult && (
          <ErrorBoundary title="Three-Sensor Geographic Mapping Subsystem">
            <GeoMap
              activeResult={activeResult}
              sensorSpecs={sensorSpecs}
              onSelectSensor={(sensorKey) => {
                const el = document.getElementById(`sensor-card-${sensorKey}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />
          </ErrorBoundary>
        )}

        {/* Stage 3: Geometric Verification (RANSAC Homography & Inliers) */}
        {activeResult && (
          <ErrorBoundary title="Geometric Verification Subsystem">
            <GeometricVerification
              activeResult={activeResult}
              sensorSpecs={sensorSpecs}
            />
          </ErrorBoundary>
        )}

        {/* Stage 4: Core Deep Correspondence Workspace (LoFTR Cross-Attention) */}
        {activeResult && (
          <ErrorBoundary title="LoFTR Deep Correspondence Subsystem">
            <DeepCorrespondenceWorkspace
              activeResult={activeResult}
              sensorSpecs={sensorSpecs}
            />
          </ErrorBoundary>
        )}

        {/* Stage 5: Interactive Co-Registration Workspace */}
        {activeResult && (
          <ErrorBoundary title="Interactive Registration Subsystem">
            <InteractiveRegistrationWorkspace activeResult={activeResult} />
          </ErrorBoundary>
        )}

        {/* Stage 6: Tri-State Decision Verdict & Reference Validation */}
        {activeResult && (
          <ErrorBoundary title="Decision Verdict Subsystem">
            <DecisionVerdictSection activeResult={activeResult} isDemo={isDemo} />
          </ErrorBoundary>
        )}

        {/* Scientific Deep-Dive Sections */}
        <Suspense
          fallback={
            <div className="py-8 text-center font-mono text-xs text-neutral-500 animate-pulse">
              STREAMING SCIENTIFIC DOCUMENTATION & BENCHMARK ARCHIVES…
            </div>
          }
        >
          <div className="pt-8 space-y-12 border-t border-white/[0.08]">
            <ThreeWayIntegration sensorSpecs={sensorSpecs} />
            <PerformanceSection />
            <MethodologySection />
            <LimitationsSection />
          </div>
        </Suspense>
      </main>

      {/* Controlled Live Inference Demonstration Modal */}
      <Suspense fallback={null}>
        <ControlledDemoModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
          onLoadIntoWorkspace={handleLoadDemoIntoWorkspace}
        />
      </Suspense>

      {/* Scientific Footer */}
      <Footer />
    </div>
  )
}
