/**
 * ExportModal
 * Allows the user to export a JSON bundle of the backend-returned result.
 * Only exports what the backend actually returned — never fabricates export content.
 */
export default function ExportModal({ result, open, onClose }) {
  if (!open || !result) return null

  function buildExportBundle() {
    return {
      exported_at: new Date().toISOString(),
      source: 'SIH26166 Lunar Correspondence Engine',
      decision: result.decision,
      consistency_score: result.consistency_score,
      common_point_id: result.common_point_id,
      matched_location: result.matched_location,
      sensors: result.sensors,
      pairwise: result.pairwise,
      evidence: result.evidence,
      provenance: result.provenance,
      feature_match_summary: result.feature_matches
        ? {
            ohrc_tmc2_count: result.feature_matches.ohrc_tmc2?.length,
            tmc2_iirs_count: result.feature_matches.tmc2_iirs?.length,
            mean_confidence: result.feature_matches.mean_confidence,
          }
        : null,
      note: result.note,
      warnings: result.warnings,
    }
  }

  function downloadJson() {
    const bundle = buildExportBundle()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lunar_correspondence_result_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyJson() {
    const bundle = buildExportBundle()
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2))
      .then(() => alert('Copied to clipboard'))
      .catch(() => alert('Copy failed — check browser permissions'))
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-lunar-card border border-lunar-border max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-lunar-border">
          <div>
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">EXPORT RESULT</div>
            <div className="text-[9px] font-mono text-slate-600 mt-0.5">
              Backend-generated data bundle — no client-side values
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-sm transition-colors">✕</button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">
            {JSON.stringify(buildExportBundle(), null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-lunar-border">
          <button
            id="btn-export-download"
            onClick={downloadJson}
            className="flex items-center gap-2 bg-lunar-accent text-white px-5 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors border border-lunar-accent"
          >
            ⬇ DOWNLOAD JSON
          </button>
          <button
            onClick={copyJson}
            className="px-4 py-2 text-xs font-mono text-slate-400 border border-lunar-border hover:border-slate-500 hover:text-slate-200 transition-colors uppercase tracking-wider"
          >
            COPY
          </button>
          <button
            onClick={onClose}
            className="ml-auto text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
