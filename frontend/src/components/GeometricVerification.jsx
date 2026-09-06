import React, { useState } from 'react'

/**
 * GeometricVerification
 * Displays every metric actually returned by the backend:
 * - Pairwise geographic distance verification table (OHRC↔TMC-2, TMC-2↔IIRS, OHRC↔IIRS)
 * - LoFTR dense correspondences count
 * - Inlier count & Inlier ratio
 * - Mean confidence
 * - Reprojection RMSE (only if calculated by backend, never fabricated)
 * - Estimated 3×3 projective homography matrix
 * - Execution runtime and model provenance
 */

function MetricCard({ label, value, unit = '', highlight, tooltip }) {
  const displayVal = value != null ? value : '—'
  return (
    <div className="bg-[#030405] border border-white/[0.06] p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">{label}</span>
        {tooltip && <span className="text-[9px] text-neutral-600 font-mono" title={tooltip}>ⓘ</span>}
      </div>
      <div className={`font-mono text-base font-bold tracking-tight ${highlight || (value != null ? 'text-neutral-100' : 'text-neutral-600')}`}>
        {displayVal}
        {unit && value != null && (
          <span className="text-neutral-500 text-xs ml-1 font-normal font-sans">{unit}</span>
        )}
      </div>
    </div>
  )
}

export default function GeometricVerification({
  geometricEvidence,
  featureMatches,
  provenance,
  activeResult,
  sensorSpecs,
}) {
  const [showHomography, setShowHomography] = useState(false)

  // Extract from activeResult or direct props
  const ge = geometricEvidence || activeResult?.evidence?.geometric_verification || activeResult?.geometric_verification || {}
  const fm = featureMatches || activeResult?.feature_matches || {}
  const prov = provenance || activeResult?.provenance
  const pairwise = activeResult?.pairwise || {}

  if (!geometricEvidence && !featureMatches && !activeResult) return null

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
    : (prov?.runtime_ms != null ? `${prov.runtime_ms} ms` : null)

  // Status
  const status = ge.status || (inlierCount != null && inlierCount >= 4 ? 'ok' : null)
  const homography = Array.isArray(ge.homography) ? ge.homography : null

  const pairwisePairs = [
    { key: 'ohrc_tmc2', label: 'OHRC ↔ TMC-2', role: 'High-Res to Intermediate Bridge', data: pairwise.ohrc_tmc2 },
    { key: 'tmc2_iirs', label: 'TMC-2 ↔ IIRS', role: 'Intermediate to Hyperspectral Context', data: pairwise.tmc2_iirs },
    { key: 'ohrc_iirs', label: 'OHRC ↔ IIRS', role: 'Direct End-to-End Baseline', data: pairwise.ohrc_iirs },
  ]

  const hasPairwise = pairwisePairs.some((p) => p.data != null)

  return (
    <section className="tech-card p-5 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
            Geometric Verification &amp; Spatial Alignment
          </span>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest hidden md:inline">
            (RANSAC / MAGSAC++ Projective Homography)
          </span>
        </div>

        {status && (
          <span
            className={`text-[9px] font-mono border px-2 py-0.5 uppercase tracking-wider font-bold ${
              status === 'ok'
                ? 'border-green-800 text-green-400 bg-green-950/30'
                : status === 'insufficient_points'
                ? 'border-amber-700 text-amber-400 bg-amber-950/30'
                : 'border-white/[0.1] text-neutral-500'
            }`}
          >
            STATUS: {status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Pairwise Distance Verification Table */}
      {hasPairwise && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
            Pairwise Sensor Consistency Matrix
          </div>
          <div className="overflow-x-auto border border-white/[0.06]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#030405] text-[10px] text-neutral-500 uppercase tracking-wider border-b border-white/[0.06]">
                <tr>
                  <th className="px-4 py-2">Sensor Pair</th>
                  <th className="px-4 py-2">Pair Role</th>
                  <th className="px-4 py-2">Angular Distance</th>
                  <th className="px-4 py-2">Surface Distance</th>
                  <th className="px-4 py-2">Physical Constraint</th>
                  <th className="px-4 py-2 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] bg-[#07080a]">
                {pairwisePairs.map(({ key, label, role, data }) => (
                  <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-bold text-neutral-200">{label}</td>
                    <td className="px-4 py-2.5 text-[10px] text-neutral-500">{role}</td>
                    <td className="px-4 py-2.5 text-neutral-300">
                      {data?.distance_deg != null ? `${Number(data.distance_deg).toFixed(6)}°` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-300">
                      {data?.distance_m != null
                        ? data.distance_m < 1000
                          ? `${Number(data.distance_m).toFixed(1)} m`
                          : `${(data.distance_m / 1000).toFixed(2)} km`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-neutral-500">
                      ≤ 0.020° (≈ 606 m)
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {data?.status ? (
                        <span
                          className={`inline-block text-[9px] px-2 py-0.5 border font-bold ${
                            data.status === 'PASS'
                              ? 'border-green-800 text-green-400 bg-green-950/40'
                              : 'border-red-800 text-red-400 bg-red-950/40'
                          }`}
                        >
                          {data.status}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
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
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => setShowHomography(!showHomography)}
            className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <span>{showHomography ? '▾ Hide' : '▸ Show'} Homography Matrix (3×3)</span>
          </button>
          {showHomography && (
            <div className="mt-2 p-3 bg-[#030405] border border-white/[0.06] font-mono text-[10px] text-neutral-400 space-y-1">
              {homography.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-4">
                  {row.map((val, cIdx) => (
                    <span key={cIdx} className="w-24 text-right text-neutral-200">
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
      {prov && (
        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-x-6 gap-y-1 text-[9px] font-mono text-neutral-500">
          {prov.model && (
            <div>Model: <span className="text-neutral-300">{prov.model}</span></div>
          )}
          {prov.pipeline && (
            <div>Pipeline: <span className="text-neutral-300">{prov.pipeline}</span></div>
          )}
          {prov.architecture && (
            <div>Arch: <span className="text-neutral-300">{prov.architecture}</span></div>
          )}
        </div>
      )}
    </section>
  )
}
