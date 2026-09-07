import React, { useEffect, useRef, useState } from 'react'
import useMatchStore from './store/matchStore'
import {
  checkHealth,
  listLunarPoints,
  getSensors,
  searchCoordinate,
  loadDemo,
  listCases,
  getBenchmarks,
  getProvenance,
} from './api/client'
import { normalizeResult } from './utils/resultModel'

import MissionLoader from './components/MissionLoader'
import StarfieldBackground from './components/StarfieldBackground'
import MissionControlHeader from './components/MissionControlHeader'
import CinematicMoonHero from './components/CinematicMoonHero'
import AnalysisEntry from './components/AnalysisEntry'
import ThreeSensorUploadWorkspace from './components/upload/ThreeSensorUploadWorkspace'
import SensorScenePanel from './components/SensorScenePanel'
import ProcessingPipeline from './components/ProcessingPipeline'
import CorrespondenceWorkspace from './components/workspace/CorrespondenceWorkspace'
import ScienceBriefing from './components/ScienceBriefing'
import FAQSection from './components/FAQSection'
import ErrorAlert from './components/ErrorAlert'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import ControlledDemoModal from './components/ControlledDemoModal'

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
    setBenchmarks,
    setProvenance,
    getAbortSignal,
    cancelActiveRequest,
    cleanupBlobUrls,
  } = useMatchStore()

  // 5-6s Cinematic Initialization sequence state
  const [missionReady, setMissionReady] = useState(false)

  // Analysis mode: 'preset' | 'upload'
  const [analysisMode, setAnalysisMode] = useState('preset')

  // Normalized Result state
  const [normalizedWorkspaceResult, setNormalizedWorkspaceResult] = useState(null)

  const [sensorSpecs, setSensorSpecs] = useState(null)
  const [sameZoneThreshold, setSameZoneThreshold] = useState(0.02)
  const [matchResultPoint, setMatchResultPoint] = useState(null)
  const [catalogTotal, setCatalogTotal] = useState(null)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  const observationRef = useRef(null)

  // ── Health check on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    checkHealth()
      .then((h) => mounted && setHealth(h))
      .catch(() => mounted && setHealthError())
    return () => { mounted = false }
  }, [])

  // ── Load Authoritative Lunar Points on mount (backend mapped & analysis-ready) ──
  useEffect(() => {
    let mounted = true
    setCatalogLoading(true)
    listLunarPoints({ limit: 32 })
      .then((d) => {
        if (!mounted) return
        const normalized = (d.points || []).map((p) => {
          const id = p.id || p.point_id || p.judge_id || p.preset_id || 'POINT'
          return {
            ...p,
            id,
            point_id: id,
          }
        })
        setCatalogPoints(normalized)
        setCatalogTotal(d.count ?? null)
        // Default selection: Pair 2267 (JUDGE_0001) if available
        if (normalized.length > 0) {
          const defaultBeacon = normalized.find((p) => p.is_sih_beacon || p.judge_id === 'JUDGE_0001') || normalized[0]
          setSelectedPoint(defaultBeacon)
        }
      })
      .catch(() => mounted && setCatalogError('Authoritative lunar catalog buffer unavailable.'))
    return () => { mounted = false }
  }, [])

  // ── Load Sensor Specs ─────────────────────────────────────────────────────
  useEffect(() => {
    getSensors()
      .then((d) => d && setSensorSpecs(d))
      .catch(() => {})
  }, [])

  // ── Load benchmarks + provenance into store ───────────────────────────────
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

  // ── Deterministic SIH Demo & Safe Lunar Point selection handler ───────────
  async function handleSelectPoint(point) {
    cancelActiveRequest()
    const ptId = point.id || point.point_id || point.judge_id || point.preset_id
    const normalizedPt = {
      ...point,
      id: ptId,
      point_id: ptId,
    }
    setSelectedPoint(normalizedPt)
    clearError()

    const isBeacon = Boolean(
      point.is_sih_beacon ||
      point.judge_id ||
      ptId === '2267' || ptId === '3463' || ptId === '5353' || ptId === '7674' ||
      (typeof ptId === 'string' && ptId.startsWith('JUDGE_'))
    )
    const judgeId = point.judge_id || (ptId.startsWith('JUDGE_') ? ptId : 'JUDGE_0001')
    const isAnalysisReady = Boolean(point.analysis_ready)
    const isMapped = Boolean(point.mapped)

    // HARD REQUIREMENT (PRD Section 11):
    // For fixed SIH demo beacons (2267, 3463, 5353, 7674 -> JUDGE_0001-0004):
    // Routes directly to loadDemo(judgeId, false) for fast, reliable live responses without CPU timeout!
    if (isBeacon && judgeId) {
      setLoading(true)
      try {
        const signal = getAbortSignal()
        const rawRes = await loadDemo(judgeId, false, { signal })
        if (!signal.aborted) {
          const normalized = normalizeResult(rawRes, sensorSpecs, { sourceType: 'prepared' })
          setActiveResult(rawRes, 'demo')
          setNormalizedWorkspaceResult(normalized)
          setTimeout(() => {
            document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })
          }, 150)
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !err.isTimeout) {
          setError(err.message || 'Demo point inference failed.')
        }
      } finally {
        setLoading(false)
      }
      return
    }

    // Analysis-ready catalog observation
    if (isMapped && isAnalysisReady) {
      setLoading(true)
      try {
        const lon = point.longitude_360 > 180 ? point.longitude_360 - 360 : point.longitude_360
        const signal = getAbortSignal()
        const rawRes = await searchCoordinate(point.latitude, lon, { signal })
        if (!signal.aborted) {
          const normalized = normalizeResult(rawRes, sensorSpecs, { sourceType: 'coordinate_search' })
          setActiveResult(rawRes, 'coordinate')
          setNormalizedWorkspaceResult(normalized)
          setTimeout(() => {
            document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })
          }, 150)
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !err.isTimeout) {
          setError(err.message || 'Spatial lookup failed.')
        }
      } finally {
        setLoading(false)
      }
      return
    }

    // Non-mapped or Survey Reference Landmark
    // Keep it cleanly selected and focused on the lunar model so the user sees coordinates and telemetry
    clearResult()
    setNormalizedWorkspaceResult(null)
    clearError()
  }

  // ── Direct Coordinate Search handler ──────────────────────────────────────
  async function handleSearchCoordinate(lat, lon) {
    cancelActiveRequest()
    const lon360 = lon < 0 ? ((lon % 360) + 360) % 360 : lon % 360
    setSelectedPoint({
      id: `LOC_${lat >= 0 ? '+' : ''}${lat.toFixed(2)}_${lon360.toFixed(2)}`,
      latitude: lat,
      longitude_360: lon360,
      mapped: true,
      analysis_ready: true,
    })
    clearResult()
    clearError()
    setLoading(true)
    try {
      const signal = getAbortSignal()
      const rawRes = await searchCoordinate(lat, lon, { signal })
      if (!signal.aborted) {
        const normalized = normalizeResult(rawRes, sensorSpecs, { sourceType: 'coordinate_search' })
        setActiveResult(rawRes, 'coordinate')
        setNormalizedWorkspaceResult(normalized)
        setTimeout(() => {
          document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !err.isTimeout) {
        setError(err.message || 'Spatial lookup failed for coordinates.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Manual Upload Completed Handler ───────────────────────────────────────
  function handleUploadComplete(normalized) {
    cancelActiveRequest()
    clearError()
    setNormalizedWorkspaceResult(normalized)
    setActiveResult(normalized.raw, 'match')
    setSelectedPoint({
      id: normalized.jobId,
      name: 'Custom Three-Sensor Upload',
      latitude: normalized.commonLocation?.latitude ?? -69.373,
      longitude_360: normalized.commonLocation?.longitude ? ((normalized.commonLocation.longitude % 360) + 360) % 360 : 32.319,
      is_sih_beacon: false,
      mapped: true,
      analysis_ready: true,
    })
    setTimeout(() => {
      document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  }

  // ── Trigger Correspondence for Selected Preset ────────────────────────────
  function handleRunPresetCorrespondence() {
    if (selectedPoint) {
      handleSelectPoint(selectedPoint)
    }
  }

  // ── Trigger Instant Live Demo from Navbar ──────────────────────────────────
  function handleTriggerLiveDemo() {
    setAnalysisMode('preset')
    const sihPoint = catalogPoints.find((p) => p.judge_id === 'JUDGE_0001' || p.is_sih_beacon) || {
      id: '2267',
      point_id: '2267',
      judge_id: 'JUDGE_0001',
      is_sih_beacon: true,
      name: 'Shiv Shakti / Pair 2267',
      latitude: 60.7928,
      longitude_360: 355.4449,
      mapped: true,
      analysis_ready: true,
    }
    handleSelectPoint(sihPoint)
  }

  // ── Handle Correspond click from header ──────────────────────────────────
  function handleOpenCorrespond() {
    if (normalizedWorkspaceResult) {
      document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      handleTriggerLiveDemo()
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-300 font-sans relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* 5-6s Cinematic System Initialization Sequence */}
      {!missionReady && <MissionLoader onComplete={() => setMissionReady(true)} />}

      {/* Fullscreen Realistic Dynamic Starfield */}
      <StarfieldBackground />

      {/* Floating Spacecraft Mission Control Header */}
      <MissionControlHeader
        onOpenDemo={handleTriggerLiveDemo}
        onOpenCorrespond={handleOpenCorrespond}
      />

      {/* Controlled Evaluation Live Inference Modal */}
      <ControlledDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onLoadIntoWorkspace={(res) => {
          const normalized = normalizeResult(res, sensorSpecs, { sourceType: 'prepared' })
          setActiveResult(res, 'demo')
          setNormalizedWorkspaceResult(normalized)
          setDemoModalOpen(false)
          setTimeout(() => {
            document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })
          }, 150)
        }}
      />

      {/* Main Single-Page Workspace Flow (PRD Section 4) */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-8" style={{ height: 'auto', minHeight: 'unset' }}>
        
        {/* 1. Dominant 3D Moon Hero (PRD Section 6) */}
        <section id="hero-moon" className="space-y-2">
          {catalogPoints.length > 0 && (
            <div className="text-[10px] font-mono text-neutral-400 text-center uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{catalogPoints.length} LUNAR TARGETS LOADED</span>
              <span className="text-neutral-600">•</span>
              <span className="text-emerald-400">GREEN: REAL-DATA OPERATIONAL BEACONS</span>
              <span className="text-neutral-600">•</span>
              <span className="text-cyan-400">BLUE: SURFACE SURVEY SITES</span>
            </div>
          )}

          <ErrorBoundary title="3D Lunar Globe & Coordinate Subsystem">
            <CinematicMoonHero
              catalogPoints={catalogPoints}
              onPointSelect={handleSelectPoint}
              matchResultPoint={matchResultPoint}
              activeResult={activeResult}
              onViewObservation={() => document.getElementById('results-workspace')?.scrollIntoView({ behavior: 'smooth' })}
              onSearchCoordinate={handleSearchCoordinate}
            />
          </ErrorBoundary>
        </section>

        {/* Global Error Banner */}
        {error && <ErrorAlert error={error} onDismiss={clearError} />}

        {/* 2. Analysis Entry Mode Toggle (PRD Section 13) */}
        <section id="mode-selector">
          <AnalysisEntry
            mode={analysisMode}
            onModeChange={setAnalysisMode}
            selectedPreset={selectedPoint}
            activeResult={activeResult}
          />
        </section>

        {/* 3. Ingestion & Scene Acquisition Workspace */}
        <section id="observation-workspace">
          {analysisMode === 'upload' ? (
            <ErrorBoundary title="Manual Three-Sensor Upload Workspace">
              <ThreeSensorUploadWorkspace
                sensorSpecs={sensorSpecs}
                onAnalysisComplete={handleUploadComplete}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary title="Selected Sensor Scene Panel">
              <SensorScenePanel
                selectedPoint={selectedPoint}
                activeResult={activeResult}
                sensorSpecs={sensorSpecs}
                isLoading={loading}
                onRunCorrespondence={handleRunPresetCorrespondence}
              />
            </ErrorBoundary>
          )}
        </section>

        {/* 4. Processing Pipeline Indicator (PRD Section 19) */}
        {loading && (
          <section id="processing-pipeline">
            <ProcessingPipeline isProcessing={loading} />
          </section>
        )}

        {/* 5. Centerpiece Correspondence Analysis Workspace (PRD Section 23 & 56) */}
        <section id="results-workspace">
          {normalizedWorkspaceResult && (
            <ErrorBoundary title="Correspondence Analysis Workspace">
              <CorrespondenceWorkspace
                result={normalizedWorkspaceResult}
                onReplay={handleRunPresetCorrespondence}
              />
            </ErrorBoundary>
          )}
        </section>

        {/* 6. Science Briefing (PRD Section 45) */}
        <section id="science-briefing">
          <ErrorBoundary title="Science Briefing">
            <ScienceBriefing />
          </ErrorBoundary>
        </section>

        {/* 7. Technical FAQ (PRD Section 46) */}
        <section id="technical-faq">
          <ErrorBoundary title="Technical FAQ">
            <FAQSection />
          </ErrorBoundary>
        </section>

      </main>

      {/* Scientific Footer */}
      <Footer />
    </div>
  )
}
