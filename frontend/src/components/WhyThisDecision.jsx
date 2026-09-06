import { useState } from 'react'

/**
 * WhyThisDecision
 * Expandable explanation panel driven entirely by backend evidence data.
 * The "pillars" are rendered from backend-returned evidence fields, not hardcoded strings.
 */

const EVIDENCE_MAP = {
  geographic: {
    label: 'Geographic Evidence',
    icon: '⊙',
    color: 'text-amber-400',
  },
  correspondence: {
    label: 'Correspondence Evidence',
    icon: '⋮⋮',
    color: 'text-green-300',
  },
  geometric: {
    label: 'Geometric Verification',
    icon: '◻',
    color: 'text-amber-300',
  },
  retrieval: {
    label: 'Retrieval Evidence',
    icon: '≡',
    color: 'text-slate-300',
  },
}

function EvidencePillar({ evidenceKey, value }) {
  const meta = EVIDENCE_MAP[evidenceKey]
  if (!meta || !value) return null

  const isPass = String(value).toUpperCase().includes('PASS')
    || String(value).toUpperCase().includes('SAME')
    || String(value).toUpperCase().includes('PRESENT')
    || String(value).toUpperCase().includes('OK')

  const isNeutral = !isPass
    && !String(value).toUpperCase().includes('FAIL')
    && !String(value).toUpperCase().includes('MISSING')
    && !String(value).toUpperCase().includes('DIFFERENT')

  return (
    <div className="flex items-start gap-3 py-2 border-b border-lunar-border/40 last:border-0">
      <span className={`text-lg shrink-0 mt-0.5 ${meta.color}`}>{meta.icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{meta.label}</div>
        <div className={`text-xs font-mono mt-0.5 ${isPass ? 'text-green-400' : isNeutral ? 'text-slate-300' : 'text-red-400'}`}>
          {String(value)}
        </div>
      </div>
    </div>
  )
}

export default function WhyThisDecision({ decision, evidence, pairwise }) {
  const [open, setOpen] = useState(false)

  if (!decision) return null

  // Build evidence from backend response
  const geoEvidence = (() => {
    if (!pairwise) return null
    const allPass = Object.values(pairwise).every((p) => p?.status === 'PASS')
    const count = Object.values(pairwise).filter((p) => p?.status === 'PASS').length
    return `${count}/${Object.keys(pairwise).length} pairwise checks PASSED`
  })()

  const corrEvidence = (() => {
    const fm = evidence?.feature_matches
    if (!fm) return null
    const total = (fm.ohrc_tmc2?.length || 0) + (fm.tmc2_iirs?.length || 0)
    if (total === 0) return 'No correspondence points returned'
    return `${total} total matches (mean confidence: ${fm.mean_confidence?.toFixed(4) ?? '—'})`
  })()

  const geomEvidence = (() => {
    const ge = evidence?.geometric_verification || evidence?.evidence?.geometric_verification
    if (!ge) return null
    if (ge.status === 'insufficient_points') return 'Insufficient points for RANSAC'
    if (ge.inlier_count != null) return `${ge.inlier_count} inliers, RMSE: ${ge.reprojection_rmse?.toFixed(4) ?? '—'}`
    return ge.status
  })()

  const retEvidence = evidence?.explanation || null

  const hasAny = geoEvidence || corrEvidence || geomEvidence || retEvidence

  return (
    <div className="border border-lunar-border bg-lunar-card overflow-hidden">
      <button
        id="btn-why-decision"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-lunar-surface/40 transition-colors"
      >
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          WHY THIS DECISION?
        </span>
        <span className="text-slate-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-lunar-border px-4 py-3 space-y-0">
          {!hasAny ? (
            <div className="text-[10px] font-mono text-slate-600 py-2">
              No detailed evidence data was returned by the backend for this result.
            </div>
          ) : (
            <>
              <EvidencePillar evidenceKey="geographic" value={geoEvidence} />
              <EvidencePillar evidenceKey="correspondence" value={corrEvidence} />
              <EvidencePillar evidenceKey="geometric" value={geomEvidence} />
              {retEvidence && (
                <div className="pt-2 text-[10px] font-mono text-slate-500 italic">
                  {retEvidence}
                </div>
              )}
            </>
          )}

          <div className="pt-3 border-t border-lunar-border/40 mt-2">
            <div className="tele-label mb-1">FINAL VERDICT</div>
            <div className="text-sm font-mono font-bold text-slate-200 uppercase tracking-widest">
              {decision}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
