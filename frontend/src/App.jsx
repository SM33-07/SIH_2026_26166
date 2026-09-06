import { useEffect, useRef, useState } from 'react'
import useMatchStore from './store/matchStore'
import {
  listCommonPoints,
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
import SensorComparison from './components/SensorComparison'
import DecisionBadge from './components/DecisionBadge'
import GeoMap from './components/GeoMap'
import FeatureCorrespondenceViewer from './components/FeatureCorrespondenceViewer'
import GeometricVerification from './components/GeometricVerification'
import WhyThisDecision from './components/WhyThisDecision'
import TechnicalDrawer from './components/TechnicalDrawer'
import ExportModal from './components/ExportModal'
import Footer from './components/Footer'
import ErrorAlert from './components/ErrorAlert'

function PairwiseTable({ pairwise }) {
  const DEG_TO_M = 30324
  const pairs = [
    { label: 'OHRC ↔ TMC-2', data: pairwise?.ohrc_tmc2 },
    { label: 'OHRC ↔ IIRS',  data: pairwise?.ohrc_iirs },
    { label: 'TMC-2 ↔ IIRS', data: pairwise?.tmc2_iirs },
  ]
  return (
    <div className="border border-lunar-border overflow-x-auto">
      <div className="tele-label px-4 pt-3 pb-2 border-b border-lunar-border">Cross-Sensor Verification</div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-lunar-border bg-lunar-bg text-[10px] text-slate-500 uppercase tracking-wider">
            <th className="text-left px-4 py-2">Pair</th>
            <th className="text-right px-4 py-2">Distance (°)</th>
            <th className="text-right px-4 py-2">Surface</th>
            <th className="text-right px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p, i) => {
            const isPass = p.data?.status === 'PASS'
            const deg = p.data?.distance_deg != null ? Number(p.data.distance_deg) : null
            return (
              <tr key={i} className={i < pairs.length - 1 ? 'border-b border-lunar-border' : ''}>
                <td className="px-4 py-2 text-slate-300 font-semibold">{p.label}</td>
                <td className="px-4 py-2 text-right text-slate-400">{deg != null ? deg.toFixed(6) : '—'}°</td>
                <td className="px-4 py-2 text-right text-slate-400">
                  {deg != null ? `${(deg * DEG_TO_M).toFixed(1)} m` : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  <span className={`text-[9px] px-2 py-0.5 border font-bold ${isPass ? 'border-green-700 text-green-400 bg-green-950/30' : 'border-red-700 text-red-400 bg-red-950/30'}`}>
                    {p.data?.status || '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Explore Mode ────────────────────────────────────────────────────────────
function ExploreMode({ sensorSpecs, sameZoneThreshold }) {
  const {
    catalogPoints, setCatalogPoints, setCatalogLoading, setCatalogError,
    selectedPoint, setSelectedPoint, clearSelectedPoint,
    activeResult, setActiveResult, clearResult,
    error, setError, clearError, loading, setLoading,
  } = useMatchStore()

  const [exportOpen, setExportOpen] = useState(false)
  const resultRef = useRef(null)

  // Load catalog on mount (geographically spread sample)
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
      const result = await searchCoordinate(point.latitude, point.longitude_360 > 180 ? point.longitude_360 - 360 : point.longitude_360)
      setActiveResult(result, 'coordinate')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err.message || 'Lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  const r = activeResult
  const s = r?.sensors

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
              {catalogPoints.length} common observation sites loaded from the backend master catalog.
              Click a marker to retrieve three-sensor imagery.
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

      {/* Result section */}
      {r && !loading && (
        <div className="space-y-5 fade-in-up" ref={resultRef}>
          <div className="sci-divider" />

          <DecisionBadge decision={r.decision} consistencyScore={r.consistency_score} />
          <WhyThisDecision decision={r.decision} evidence={r} pairwise={r.pairwise} />

          {r.images && (
            <SensorComparison images={r.images} sensors={s} sensorSpecs={sensorSpecs} />
          )}

          {r.feature_matches && (
            <FeatureCorrespondenceViewer
              images={r.images}
              featureMatches={r.feature_matches}
              sensors={s}
            />
          )}

          {(r.evidence?.geometric_verification || r.feature_matches) && (
            <GeometricVerification
              geometricEvidence={r.evidence?.geometric_verification}
              featureMatches={r.feature_matches}
              provenance={r.provenance}
            />
          )}

          {r.pairwise && <PairwiseTable pairwise={r.pairwise} />}

          {s && (
            <GeoMap
              lat={r.matched_location?.latitude ?? r.query?.latitude}
              lon={r.matched_location?.longitude_360 ?? r.query?.longitude}
              ohrcLat={s.ohrc?.lat}
              ohrcLon={s.ohrc?.lon}
              iirsLat={s.iirs?.lat}
              iirsLon={s.iirs?.lon}
              sameZoneThresholdDeg={sameZoneThreshold}
            />
          )}

          <div className="flex justify-end">
            <button
              id="btn-export-explore"
              onClick={() => setExportOpen(true)}
              className="text-xs font-mono border border-lunar-border text-slate-400 hover:border-lunar-accent hover:text-lunar-accent px-4 py-2 uppercase tracking-wider transition-all"
            >
              EXPORT RESULT
            </button>
          </div>
          <TechnicalDrawer result={r} />
          <ExportModal result={r} open={exportOpen} onClose={() => setExportOpen(false)} />
        </div>
      )}
    </div>
  )
}

// ─── Coordinate Mode ────────────────────────────────────────────────────────
function CoordinateMode({ sensorSpecs, sameZoneThreshold }) {
  const { activeResult, setActiveResult, error, setError, clearError } = useMatchStore()
  const [exportOpen, setExportOpen] = useState(false)
  const resultRef = useRef(null)

  function handleResult(result, mode) {
    setActiveResult(result, mode)
    clearError()
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
  }

  const r = activeResult
  const s = r?.sensors

  return (
    <div className="space-y-5">
      <CoordinateTab onResult={handleResult} />

      {r && (
        <div className="space-y-5 fade-in-up" ref={resultRef}>
          <div className="sci-divider" />
          <DecisionBadge decision={r.decision} consistencyScore={r.consistency_score} />
          <WhyThisDecision decision={r.decision} evidence={r} pairwise={r.pairwise} />

          {r.images && (
            <SensorComparison images={r.images} sensors={s} sensorSpecs={sensorSpecs} />
          )}

          {r.feature_matches && (
            <FeatureCorrespondenceViewer
              images={r.images}
              featureMatches={r.feature_matches}
              sensors={s}
            />
          )}

          {(r.evidence?.geometric_verification || r.feature_matches) && (
            <GeometricVerification
              geometricEvidence={r.evidence?.geometric_verification}
              featureMatches={r.feature_matches}
              provenance={r.provenance}
            />
          )}

          {r.pairwise && <PairwiseTable pairwise={r.pairwise} />}

          {s && (
            <GeoMap
              lat={r.matched_location?.latitude ?? r.query?.latitude}
              lon={r.matched_location?.longitude_360 ?? r.query?.longitude}
              ohrcLat={s.ohrc?.lat}
              ohrcLon={s.ohrc?.lon}
              iirsLat={s.iirs?.lat}
              iirsLon={s.iirs?.lon}
              sameZoneThresholdDeg={sameZoneThreshold}
            />
          )}

          <div className="flex justify-end">
            <button
              id="btn-export-coordinate"
              onClick={() => setExportOpen(true)}
              className="text-xs font-mono border border-lunar-border text-slate-400 hover:border-lunar-accent hover:text-lunar-accent px-4 py-2 uppercase tracking-wider transition-all"
            >
              EXPORT RESULT
            </button>
          </div>
          <TechnicalDrawer result={r} />
          <ExportModal result={r} open={exportOpen} onClose={() => setExportOpen(false)} />
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

  // Load sensor specs (shared by all modes)
  useEffect(() => {
    getSensorCharacteristics()
      .then((d) => setSensorSpecs(d))
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
      </main>

      <Footer />
    </div>
  )
}
