import { useEffect, useRef, useState } from 'react'
import useMatchStore from '../store/matchStore'
import MatchingPanel from './MatchingPanel'
import ControlledDemo from './ControlledDemo'
import DecisionBadge from './DecisionBadge'
import GeoMap from './GeoMap'
import FeatureCorrespondenceViewer from './FeatureCorrespondenceViewer'
import GeometricVerification from './GeometricVerification'
import WhyThisDecision from './WhyThisDecision'
import TechnicalDrawer from './TechnicalDrawer'
import ExportModal from './ExportModal'
import ProcessingTimeline, { useProcessingSimulator } from './ProcessingTimeline'
import SensorComparison from './SensorComparison'

/**
 * ImageTab
 * Wraps matching panel + controlled demo.
 * No hardcoded judge IDs, coordinates, or decisions anywhere in this file.
 */
export default function ImageTab({ sensorSpecs, sameZoneThreshold }) {
  const { activeResult, setActiveResult, sensorSpecs: storeSensorSpecs } = useMatchStore()
  const [exportOpen, setExportOpen] = useState(false)
  const [stage, setStage] = useState(0)
  const simulator = useProcessingSimulator(false, 8000)
  const resultRef = useRef(null)

  const specs = sensorSpecs || storeSensorSpecs

  function handleResult(result, mode) {
    setActiveResult(result, mode)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    setStage(9) // done
  }

  function handleMatchStart() {
    setStage(1)
    simulator.start(setStage)
  }

  const r = activeResult
  const s = r?.sensors

  return (
    <div className="space-y-6">
      {/* Two-column: match panel + demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="tele-label mb-3">Upload Three-Sensor Images</div>
          <MatchingPanel
            onResult={(result, mode) => {
              simulator.stop()
              handleResult(result, mode)
            }}
            onProcessingStart={handleMatchStart}
          />
        </div>
        <div>
          <div className="tele-label mb-3">Controlled Demonstration</div>
          <ControlledDemo onResult={handleResult} />
        </div>
      </div>

      {stage > 0 && stage < 9 && <ProcessingTimeline currentStage={stage} />}

      {r && (
        <div className="space-y-5 fade-in-up" ref={resultRef}>
          <div className="sci-divider" />

          <DecisionBadge decision={r.decision} consistencyScore={r.consistency_score} />
          <WhyThisDecision decision={r.decision} evidence={r} pairwise={r.pairwise} />

          {/* Sensor images */}
          {r.images && (
            <SensorComparison images={r.images} sensors={s} sensorSpecs={specs} />
          )}

          {/* Correspondence */}
          {r.feature_matches && (
            <FeatureCorrespondenceViewer
              images={r.images}
              featureMatches={r.feature_matches}
              sensors={s}
            />
          )}

          {/* Geometry */}
          {(r.evidence?.geometric_verification || r.feature_matches) && (
            <GeometricVerification
              geometricEvidence={r.evidence?.geometric_verification}
              featureMatches={r.feature_matches}
              provenance={r.provenance}
            />
          )}

          {/* Pairwise table */}
          {r.pairwise && (
            <PairwiseTable pairwise={r.pairwise} threshold={sameZoneThreshold} />
          )}

          {/* Geo map */}
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

          {/* Export + Technical */}
          <div className="flex items-center gap-3 justify-end">
            <button
              id="btn-export-result"
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

function PairwiseTable({ pairwise, threshold }) {
  const pairs = [
    { label: 'OHRC ↔ TMC-2', data: pairwise?.ohrc_tmc2 },
    { label: 'OHRC ↔ IIRS',  data: pairwise?.ohrc_iirs },
    { label: 'TMC-2 ↔ IIRS', data: pairwise?.tmc2_iirs },
  ]
  const DEG_TO_M = 30324

  return (
    <div className="border border-lunar-border overflow-x-auto">
      <div className="tele-label px-4 pt-3 pb-2 border-b border-lunar-border">Cross-Sensor Verification</div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-lunar-border bg-lunar-bg text-[10px] text-slate-500 uppercase tracking-wider">
            <th className="text-left px-4 py-2">Sensor Pair</th>
            <th className="text-right px-4 py-2">Distance (°)</th>
            <th className="text-right px-4 py-2">Surface</th>
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
                  {deg != null ? deg.toFixed(6) : '—'}°
                </td>
                <td className="px-4 py-2.5 text-right text-slate-400">{meters}</td>
                <td className="px-4 py-2.5 text-right">
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
