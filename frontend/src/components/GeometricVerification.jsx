import { useState } from 'react'

/**
 * GeometricVerification
 * Displays every metric actually returned by the backend:
 * - total matches
 * - inlier count
 * - inlier ratio
 * - mean confidence
 * - RMSE / reprojection error when available
 * - runtime when available
 * 
 * Strictly data-driven. Missing metrics display '—', never fabricated.
 */

function MetricCard({ label, value, unit = '', highlight, tooltip }) {
  const displayVal = value != null ? value : '—'
  return (
    <div className="bg-lunar-bg border border-lunar-border p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="tele-label">{label}</span>
        {tooltip && <span className="text-[9px] text-slate-600 font-mono" title={tooltip}>ⓘ</span>}
      </div>
      <div className={`font-mono text-base font-bold tracking-tight ${highlight || (value != null ? 'text-slate-200' : 'text-slate-600')}`}>
        {displayVal}
        {unit && value != null && (
          <span className="text-slate-500 text-xs ml-1 font-normal font-sans">{unit}</span>
        )}
      </div>
    </div>
  )
}

export default function GeometricVerification({ geometricEvidence, featureMatches, provenance }) {
  const [showHomography, setShowHomography] = useState(false)

  if (!geometricEvidence && !featureMatches) return null

  const ge = geometricEvidence || {}
  const fm = featureMatches || {}

  // 1. Total matches
  const totalMatches = fm.total_matches != null
    ? fm.total_matches
    : (Array.isArray(fm.ohrc_tmc2) || Array.isArray(fm.tmc2_iirs))
      ? ((fm.ohrc_tmc2?.length || 0) + (fm.tmc2_iirs?.length || 0))
      : null

  // 2. Inlier count
  const inlierCount = ge.inlier_count != null
    ? ge.inlier_count
    : (fm.total_inliers != null ? fm.total_inliers : null)

  // 3. Inlier ratio
  const inlierRatio = ge.inlier_ratio != null
    ? Number(ge.inlier_ratio).toFixed(4)
    : (inlierCount != null && totalMatches != null && totalMatches > 0)
      ? (inlierCount / totalMatches).toFixed(4)
      : null

  // 4. Mean confidence
  const meanConf = fm.mean_confidence != null
    ? Number(fm.mean_confidence).toFixed(4)
    : (ge.mean_confidence != null ? Number(ge.mean_confidence).toFixed(4) : null)

  // 5. RMSE / reprojection error
  const rmse = ge.reprojection_rmse != null ? Number(ge.reprojection_rmse).toFixed(4) : null

  // 6. Runtime when available
  const runtime = ge.runtime_ms != null
    ? `${Number(ge.runtime_ms).toFixed(1)} ms`
    : (provenance?.runtime_ms != null ? `${provenance.runtime_ms} ms` : null)

  // Status
  const status = ge.status || (inlierCount != null && inlierCount >= 4 ? 'ok' : null)
  const homography = Array.isArray(ge.homography) ? ge.homography : null

  return (
    <div className="border border-lunar-border bg-lunar-card p-4 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-lunar-border pb-2.5">
        <div className="flex items-center gap-2">
          <span className="tele-label">Registration & Geometric Verification</span>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            (RANSAC / DLT Homography)
          </span>
        </div>
        {status && (
          <span
            className={`text-[9px] font-mono border px-2 py-0.5 uppercase tracking-wider font-bold ${
              status === 'ok'
                ? 'border-green-700 text-green-400 bg-green-950/30'
                : status === 'insufficient_points'
                ? 'border-amber-700 text-amber-400 bg-amber-950/30'
                : 'border-lunar-border text-slate-500'
            }`}
          >
            STATUS: {status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Primary Metrics Grid (all 6 returned metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetricCard
          label="Total Matches"
          value={totalMatches}
          tooltip="LoFTR cross-attention point correspondences across sensor pairs"
        />
        <MetricCard
          label="Inlier Count"
          value={inlierCount}
          highlight="text-green-400"
          tooltip="Correspondences consistent with planar homography within threshold"
        />
        <MetricCard
          label="Inlier Ratio"
          value={inlierRatio}
          highlight="text-emerald-300"
          tooltip="Ratio of inlier keypoints to total retrieved keypoints"
        />
        <MetricCard
          label="Reprojection RMSE"
          value={rmse}
          unit="px"
          highlight="text-amber-300"
          tooltip="Root Mean Square Error of inliers under estimated homography"
        />
        <MetricCard
          label="Mean Confidence"
          value={meanConf}
          highlight="text-amber-400"
          tooltip="Average confidence of LoFTR correspondence matches"
        />
        <MetricCard
          label="Runtime"
          value={runtime}
          tooltip="Computation execution time for geometric registration"
        />
      </div>

      {/* Homography 3x3 Matrix toggle if returned */}
      {homography && (
        <div className="pt-2 border-t border-lunar-border/40">
          <button
            onClick={() => setShowHomography(!showHomography)}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <span>{showHomography ? '▾ Hide' : '▸ Show'} Homography Matrix (3×3)</span>
          </button>
          {showHomography && (
            <div className="mt-2 p-2 bg-lunar-bg border border-lunar-border font-mono text-[10px] text-slate-400 space-y-1">
              {homography.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-4">
                  {row.map((val, cIdx) => (
                    <span key={cIdx} className="w-24 text-right text-slate-300">
                      {typeof val === 'number' ? val.toFixed(6) : String(val)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provenance Footer */}
      {provenance && (
        <div className="pt-2 border-t border-lunar-border/40 flex flex-wrap items-center gap-x-6 gap-y-1 text-[9px] font-mono text-slate-600">
          {provenance.model && (
            <div>Model: <span className="text-slate-400">{provenance.model}</span></div>
          )}
          {provenance.pipeline && (
            <div>Pipeline: <span className="text-slate-400">{provenance.pipeline}</span></div>
          )}
          {provenance.architecture && (
            <div>Arch: <span className="text-slate-400">{provenance.architecture}</span></div>
          )}
        </div>
      )}
    </div>
  )
}
