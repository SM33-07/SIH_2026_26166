import { useState } from 'react'
import SensorComparison from './SensorComparison'
import FeatureCorrespondenceViewer from './FeatureCorrespondenceViewer'
import GeometricVerification from './GeometricVerification'
import GeoMap from './GeoMap'
import DecisionBadge from './DecisionBadge'
import WhyThisDecision from './WhyThisDecision'
import TechnicalDrawer from './TechnicalDrawer'
import ExportModal from './ExportModal'

/**
 * PairwiseTable
 * Renders the cross-sensor boresight separation table.
 */
export function PairwiseTable({ pairwise, threshold }) {
  const DEG_TO_M = 30324 // Lunar surface meters per degree
  const pairs = [
    { label: 'OHRC ↔ TMC-2', data: pairwise?.ohrc_tmc2 },
    { label: 'OHRC ↔ IIRS',  data: pairwise?.ohrc_iirs },
    { label: 'TMC-2 ↔ IIRS', data: pairwise?.tmc2_iirs },
  ]

  return (
    <div className="border border-lunar-border bg-lunar-card overflow-x-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-lunar-border">
        <span className="tele-label">Cross-Sensor Geographic Verification</span>
        {threshold != null && (
          <span className="text-[9px] font-mono text-slate-500">
            THRESHOLD: {threshold}° (≈{(threshold * DEG_TO_M).toFixed(0)}m)
          </span>
        )}
      </div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-lunar-border bg-lunar-bg text-[10px] text-slate-500 uppercase tracking-wider">
            <th className="text-left px-4 py-2">Sensor Pair</th>
            <th className="text-right px-4 py-2">Distance (°)</th>
            <th className="text-right px-4 py-2">Surface (m)</th>
            <th className="text-right px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p, i) => {
            const isPass = p.data?.status === 'PASS'
            const deg = p.data?.distance_deg != null ? Number(p.data.distance_deg) : null
            const meters = deg != null ? (deg * DEG_TO_M).toFixed(1) + ' m' : '—'
            return (
              <tr key={i} className={i < pairs.length - 1 ? 'border-b border-lunar-border' : ''}>
                <td className="px-4 py-2.5 text-slate-300 font-semibold">{p.label}</td>
                <td className="px-4 py-2.5 text-right text-slate-400">
                  {deg != null ? `${deg.toFixed(6)}°` : '—'}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-400">{meters}</td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`text-[9px] px-2 py-0.5 border font-bold ${
                      isPass
                        ? 'border-green-700 text-green-400 bg-green-950/30'
                        : 'border-red-700 text-red-400 bg-red-950/30'
                    }`}
                  >
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

/**
 * CurrentAnalysisResult
 * Strict layout specified by Point 6:
 * CURRENT ANALYSIS
 * → sensor imagery
 * → correspondence
 * → registration
 * → geographic verification
 * → decision
 * 
 * Controlled demonstration uses isDemo=true with distinct styling and labels.
 */
export default function CurrentAnalysisResult({
  result,
  sensorSpecs,
  sameZoneThreshold,
  isDemo = false,
}) {
  const [exportOpen, setExportOpen] = useState(false)

  if (!result) return null

  const s = result.sensors

  return (
    <div className={`space-y-6 fade-in-up ${isDemo ? 'border-l-2 border-amber-600 pl-3 sm:pl-4' : ''}`}>
      <div className="sci-divider" />

      {/* ─── 0. Header (Current Analysis or Controlled Demonstration) ─────── */}
      {isDemo ? (
        <div className="border border-amber-600/60 bg-amber-950/20 p-3 sm:p-4 rounded-none">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-amber-400 text-base font-bold">⚡</span>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300">
                  CONTROLLED DEMONSTRATION
                </span>
                <span className="ml-2 text-[10px] font-mono text-amber-400/80">
                  {result.judge_point_id || result.common_point_id || 'Verification Sample'}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono border border-amber-500/70 text-amber-300 px-2 py-0.5 uppercase tracking-widest bg-amber-500/10">
              BENCHMARK GROUND TRUTH
            </span>
          </div>
          <div className="text-[10px] font-mono text-amber-400/60 mt-1">
            Pre-staged ground-truth demonstration from judge image library. Distinct from live image upload.
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-lunar-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lunar-accent animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-200">
              CURRENT ANALYSIS
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
            FLOW: IMAGERY → CORRESPONDENCE → REGISTRATION → GEOGRAPHY → DECISION
          </span>
        </div>
      )}

      {/* ─── 1. Sensor Imagery ───────────────────────────────────────────── */}
      {result.images && (
        <section aria-label="Sensor Imagery">
          <SensorComparison images={result.images} sensors={s} sensorSpecs={sensorSpecs} />
        </section>
      )}

      {/* ─── 2. Correspondence ────────────────────────────────────────────── */}
      {result.feature_matches && (
        <section aria-label="Correspondence Analysis">
          <FeatureCorrespondenceViewer
            images={result.images}
            featureMatches={result.feature_matches}
            sensors={s}
          />
        </section>
      )}

      {/* ─── 3. Registration & Geometric Verification ─────────────────────── */}
      {(result.evidence?.geometric_verification || result.feature_matches) && (
        <section aria-label="Registration & Geometric Verification">
          <GeometricVerification
            geometricEvidence={result.evidence?.geometric_verification}
            featureMatches={result.feature_matches}
            provenance={result.provenance}
          />
        </section>
      )}

      {/* ─── 4. Geographic Verification ───────────────────────────────────── */}
      <section aria-label="Geographic Verification" className="space-y-4">
        {result.pairwise && (
          <PairwiseTable pairwise={result.pairwise} threshold={sameZoneThreshold} />
        )}

        {s && (
          <GeoMap
            lat={result.matched_location?.latitude ?? result.query?.latitude}
            lon={result.matched_location?.longitude_360 ?? result.query?.longitude}
            ohrcLat={s.ohrc?.lat}
            ohrcLon={s.ohrc?.lon}
            iirsLat={s.iirs?.lat}
            iirsLon={s.iirs?.lon}
            sameZoneThresholdDeg={sameZoneThreshold}
          />
        )}
      </section>

      {/* ─── 5. Final Decision & Explainability ───────────────────────────── */}
      <section aria-label="Final Decision" className="space-y-3">
        <DecisionBadge
          decision={result.decision}
          consistencyScore={result.consistency_score}
          isDemo={isDemo}
        />
        <WhyThisDecision
          decision={result.decision}
          evidence={result}
          pairwise={result.pairwise}
        />
      </section>

      {/* ─── Export & Technical Drawer ───────────────────────────────────── */}
      <div className="flex items-center gap-3 justify-end pt-2">
        <button
          id={`btn-export-${isDemo ? 'demo' : 'analysis'}`}
          onClick={() => setExportOpen(true)}
          className="text-xs font-mono border border-lunar-border text-slate-400 hover:border-lunar-accent hover:text-lunar-accent px-4 py-2 uppercase tracking-wider transition-all"
        >
          EXPORT RESULT REPORT
        </button>
      </div>

      <TechnicalDrawer result={result} />
      <ExportModal result={result} open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
