/**
 * GeometricVerification
 * Displays actual backend-returned geometric verification metrics as telemetry cards.
 * Zero hardcoded metric values.
 */

function TeleCard({ label, value, unit = '', highlight }) {
  if (value == null) return null
  return (
    <div className="bg-lunar-bg border border-lunar-border p-3">
      <div className="tele-label mb-1.5">{label}</div>
      <div className={`font-mono text-sm font-bold ${highlight || 'text-slate-200'}`}>
        {value}{unit && <span className="text-slate-500 text-xs ml-1 font-normal">{unit}</span>}
      </div>
    </div>
  )
}

export default function GeometricVerification({ geometricEvidence, featureMatches, provenance }) {
  if (!geometricEvidence && !featureMatches) return null

  const ge = geometricEvidence || {}
  const fm = featureMatches || {}

  const inlierCount = ge.inlier_count ?? null
  const totalMatches = fm.ohrc_tmc2?.length + fm.tmc2_iirs?.length || null
  const inlierRatio = (inlierCount != null && totalMatches != null && totalMatches > 0)
    ? (inlierCount / totalMatches).toFixed(3)
    : null

  const rmse = ge.reprojection_rmse != null ? Number(ge.reprojection_rmse).toFixed(4) : null
  const meanConf = fm.mean_confidence != null ? Number(fm.mean_confidence).toFixed(4) : null
  const status = ge.status || null
  const runtime = ge.runtime_ms != null ? `${Number(ge.runtime_ms).toFixed(0)} ms` : null

  const noData = !inlierCount && !rmse && !meanConf && !totalMatches

  return (
    <div className="border border-lunar-border bg-lunar-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="tele-label">Geometric Verification Metrics</div>
        {status && (
          <span className={`text-[9px] font-mono border px-2 py-0.5 uppercase tracking-wider ${
            status === 'ok' ? 'border-green-700 text-green-400 bg-green-950/30'
            : status === 'insufficient_points' ? 'border-amber-700 text-amber-400 bg-amber-950/30'
            : 'border-lunar-border text-slate-500'
          }`}>
            {status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {noData ? (
        <div className="text-[10px] font-mono text-slate-600 py-2">
          No geometric verification metrics were returned for this result.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TeleCard label="Total Matches"   value={totalMatches} />
          <TeleCard label="Inlier Count"    value={inlierCount} highlight="text-green-400" />
          <TeleCard label="Inlier Ratio"    value={inlierRatio} />
          <TeleCard label="Reprojection RMSE" value={rmse} unit="px" />
          <TeleCard label="Mean Confidence"  value={meanConf} highlight="text-indigo-300" />
          <TeleCard label="Runtime"          value={runtime} />
        </div>
      )}

      {provenance && (
        <div className="mt-3 pt-3 border-t border-lunar-border/40 text-[9px] font-mono text-slate-600 space-y-0.5">
          {provenance.model && <div>Model: <span className="text-slate-400">{provenance.model}</span></div>}
          {provenance.pipeline && <div>Pipeline: <span className="text-slate-400">{provenance.pipeline}</span></div>}
          {provenance.architecture && <div>Arch: <span className="text-slate-400">{provenance.architecture}</span></div>}
        </div>
      )}
    </div>
  )
}
