import { useEffect, useRef, useState } from 'react'
import useMatchStore from './store/matchStore'
import {
  listCommonPoints,
  getSensors,
  getSensorCharacteristics,
  searchCoordinate,
  listCases,
} from './api/client'

import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import MoonHero from './components/MoonHero'
import SelectedRegion from './components/SelectedRegion'
import CoordinateTab from './components/CoordinateTab'
import ImageTab from './components/ImageTab'
import ControlledDemo from './components/ControlledDemo'
import CurrentAnalysisResult from './components/CurrentAnalysisResult'
import Footer from './components/Footer'
import ErrorAlert from './components/ErrorAlert'

// ─── Explore Mode ────────────────────────────────────────────────────────────
function ExploreMode({ sensorSpecs, sameZoneThreshold }) {
  const {
    catalogPoints, setCatalogPoints, setCatalogLoading, setCatalogError,
    selectedPoint, setSelectedPoint, clearSelectedPoint,
    activeResult, setActiveResult, clearResult,
    error, setError, clearError, loading, setLoading,
  } = useMatchStore()

  const resultRef = useRef(null)

  // Load catalog on mount (geographically spread sample from backend)
  useEffect(() => {
    let mounted = true
    setCatalogLoading(true)
    listCommonPoints({ limit: 80, sample: true })
      .then((d) => mounted && setCatalogPoints(d.points || []))
      .catch(() => mounted && setCatalogError('Could not load observation catalog.'))
    return () => { mounted = false }
  }, [])

  async function handleMarkerSelect(point) {
    setSelectedPoint(point)
    clearResult()
    clearError()
    setLoading(true)
    try {
      const result = await searchCoordinate(
        point.latitude,
        point.longitude_360 > 180 ? point.longitude_360 - 360 : point.longitude_360
      )
      setActiveResult(result, 'coordinate')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err.message || 'Lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  const r = activeResult

  return (
    <div className="space-y-5">
      {/* 3D Moon + selected region */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="border border-lunar-border overflow-hidden" style={{ height: '480px' }}>
            <MoonHero catalogPoints={catalogPoints} onPointSelect={handleMarkerSelect} />
          </div>
        </div>
        <div className="space-y-4">
          <SelectedRegion
            point={selectedPoint}
            onClear={clearSelectedPoint}
          />
          <div className="border border-lunar-border bg-lunar-card p-4 space-y-2">
            <div className="tele-label">Observatory Catalog</div>
            <div className="text-xs font-mono text-slate-500">
              {catalogPoints.length} observation sites loaded from the backend master catalog.
              Click any marker on the 3D Moon to retrieve three-sensor imagery.
            </div>
            {catalogPoints.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Stat label="Sites shown" value={catalogPoints.length} />
                <Stat label="Three-sensor" value={catalogPoints.filter((p) => p.three_sensor_common).length} />
                <Stat label="OHRC avail" value={catalogPoints.filter((p) => p.ohrc_available).length} />
                <Stat label="IIRS avail" value={catalogPoints.filter((p) => p.iirs_available).length} />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="border border-lunar-border bg-lunar-card px-4 py-3 flex items-center gap-3">
          <div className="w-3 h-3 border border-lunar-accent rounded-full animate-spin border-t-transparent" />
          <span className="text-xs font-mono text-slate-500">Retrieving observation data…</span>
        </div>
      )}

      {error && <ErrorAlert error={error} onDismiss={clearError} />}

      {/* Current Analysis Result */}
      {r && !loading && (
        <div ref={resultRef}>
          <CurrentAnalysisResult
            result={r}
            sensorSpecs={sensorSpecs}
            sameZoneThreshold={sameZoneThreshold}
            isDemo={false}
          />
        </div>
      )}
    </div>
  )
}

// ─── Coordinate Mode ────────────────────────────────────────────────────────
function CoordinateMode({ sensorSpecs, sameZoneThreshold }) {
  const { activeResult, setActiveResult, clearError } = useMatchStore()
  const resultRef = useRef(null)

  function handleResult(result, mode) {
    setActiveResult(result, mode)
    clearError()
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
  }

  const r = activeResult

  return (
    <div className="space-y-5">
      <CoordinateTab onResult={handleResult} />

      {r && (
        <div ref={resultRef}>
          <CurrentAnalysisResult
            result={r}
            sensorSpecs={sensorSpecs}
            sameZoneThreshold={sameZoneThreshold}
            isDemo={false}
          />
        </div>
      )}
    </div>
  )
}

// ─── Stat helper ─────────────────────────────────────────────────────────────
function Stat({ label, value }) {
  return (
    <div className="bg-lunar-bg border border-lunar-border p-2">
      <div className="tele-label">{label}</div>
      <div className="tele-value font-bold">{value}</div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const { activeMode } = useMatchStore()
  const [sensorSpecs, setSensorSpecs] = useState(null)
  const [sameZoneThreshold, setSameZoneThreshold] = useState(null)

  // Load sensor specs using GET /api/v1/sensors with fallback to characteristics
  useEffect(() => {
    getSensors()
      .catch(() => getSensorCharacteristics())
      .then((d) => d && setSensorSpecs(d))
      .catch(() => {})
  }, [])

  // Derive same-zone threshold from /cases which returns same_zone_threshold_deg
  useEffect(() => {
    listCases({ limit: 1 })
      .then((d) => d.same_zone_threshold_deg != null && setSameZoneThreshold(d.same_zone_threshold_deg))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-lunar-bg mission-grid text-slate-300 flex flex-col">
      {/* Ambient scan-line */}
      <div className="scan-line" />

      <Header />
      <ModeSelector />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeMode === 'explore' && (
          <ExploreMode sensorSpecs={sensorSpecs} sameZoneThreshold={sameZoneThreshold} />
        )}
        {activeMode === 'coordinate' && (
          <CoordinateMode sensorSpecs={sensorSpecs} sameZoneThreshold={sameZoneThreshold} />
        )}
        {activeMode === 'match' && (
          <ImageTab sensorSpecs={sensorSpecs} sameZoneThreshold={sameZoneThreshold} />
        )}
        {activeMode === 'demo' && (
          <ControlledDemo sensorSpecs={sensorSpecs} sameZoneThreshold={sameZoneThreshold} />
        )}
      </main>

      <Footer />
    </div>
  )
}
