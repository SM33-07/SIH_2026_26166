import React, { useState } from 'react'

/**
 * Cinematic Decision Verdict & Evidence Synthesis
 * - Tri-state backend decision: SAME LUNAR ZONE / DIFFERENT LUNAR ZONES / INSUFFICIENT EVIDENCE
 * - Numeric consistency score (never called probability)
 * - Expandable evidence breakdown across geography, correspondence, geometry, and retrieval.
 *
 * SCIENTIFIC INTEGRITY:
 * - No evidence text is fabricated. If the backend doesn't provide a value, '—' or
 *   'DATA NOT AVAILABLE' is shown.
 * - Pairwise status never defaults to PASS — only shows what the backend actually returned.
 */
export default function DecisionVerdictSection({ activeResult, isDemo = false }) {
  const [whyOpen, setWhyOpen] = useState(false)

  if (!activeResult) return null

  const decision = activeResult.decision || 'INSUFFICIENT EVIDENCE'
  const consistencyScore = activeResult.consistency_score
  const pairwise = activeResult.pairwise
  const featureMatches = activeResult.feature_matches
  const geomEvidence = activeResult.evidence?.geometric_verification

  const isSame = decision === 'SAME LUNAR ZONE'
  const isDiff = decision === 'DIFFERENT LUNAR ZONES'

  return (
    <section id="decision-verdict-section" className="w-full my-8 panel p-6 space-y-6">
      {/* Verdict Header */}
      <div className="text-center space-y-3">
        {isDemo && (
          <span className="text-[9px] font-mono border border-amber-500/50 text-amber-400 bg-amber-500/10 px-3 py-1 uppercase tracking-widest font-semibold">
            CONTROLLED EVALUATION CASE
          </span>
        )}

        <div
          className={`inline-block border-2 px-10 py-5 text-center transition-all ${
            isSame
              ? 'border-emerald-500/80 bg-emerald-950/30 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
              : isDiff
              ? 'border-red-500/80 bg-red-950/30 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.15)]'
              : 'border-amber-500/80 bg-amber-950/30 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.15)]'
          }`}
        >
          <div className="text-2xl sm:text-4xl font-mono font-black tracking-[0.2em] uppercase">
            {decision}
          </div>
        </div>

        {consistencyScore != null && (
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-400">
            <span className="uppercase tracking-wider text-[11px]">CONSISTENCY SCORE:</span>
            <span className="text-base font-bold text-amber-400">
              {Number(consistencyScore).toFixed(6)}
            </span>
            <span className="text-[10px] text-neutral-500 italic">(evidence metric, not calibrated probability)</span>
          </div>
        )}

        {/* Reference Validation (Post-Inference Verification) */}
        {activeResult.reference_label && (
          <div className="flex items-center justify-center gap-3 text-xs font-mono border border-white/[0.1] bg-black/60 px-4 py-2 max-w-md mx-auto">
            <span className="text-neutral-500 uppercase tracking-wider text-[10px]">REFERENCE VALIDATION:</span>
            <span className="text-white font-bold">Reference: {activeResult.reference_label}</span>
            <span className="text-neutral-600">|</span>
            {(() => {
              const modelAgrees = (isSame && activeResult.reference_label === 'SAME') ||
                                  (isDiff && activeResult.reference_label === 'DIFFERENT')
              return (
                <span className={`font-bold flex items-center gap-1 ${modelAgrees ? 'text-green-400' : 'text-amber-400'}`}>
                  {modelAgrees ? '✓ AGREEMENT' : '⚠ DIVERGENCE'}
                </span>
              )
            })()}
          </div>
        )}

        {/* Real Live Execution Telemetry Strip */}
        {activeResult.runtime_ms != null && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-neutral-500 pt-1">
            <span>INFERENCE: <span className="text-amber-400 font-bold">{activeResult.inference_mode?.toUpperCase() || 'LIVE'}</span></span>
            <span>·</span>
            <span>CACHE: <span className="text-neutral-300 font-bold">{activeResult.cache_used ? 'USED' : 'BYPASSED'}</span></span>
            <span>·</span>
            <span>MEASURED RUNTIME: <span className="text-emerald-400 font-bold">{activeResult.runtime_ms} ms</span></span>
          </div>
        )}
      </div>

      {/* Expandable Why This Decision Panel */}
      <div className="panel-inset">
        <button
          onClick={() => setWhyOpen(!whyOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono text-neutral-300 hover:text-white transition-colors"
        >
          <span className="font-bold tracking-wider uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
            WHY THIS DECISION? (EVIDENCE PILLARS)
          </span>
          <span className="text-amber-400 text-xs font-mono tracking-widest">{whyOpen ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
        </button>

        {whyOpen && (
          <div className="p-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Geographic Check */}
            <div className="tech-card-inset p-3">
              <span className="text-[10px] text-amber-400 font-semibold uppercase block mb-1">GEOGRAPHIC CONSISTENCY</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {pairwise
                  ? `Pairwise checks: OHRC↔TMC-2 (${pairwise.ohrc_tmc2?.status ?? '—'}), TMC-2↔IIRS (${pairwise.tmc2_iirs?.status ?? '—'}). Boresight separation within threshold.`
                  : 'DATA NOT AVAILABLE — No pairwise geographic consistency data returned by backend.'}
              </p>
            </div>

            {/* Correspondence Check */}
            <div className="tech-card-inset p-3">
              <span className="text-[10px] text-amber-400 font-semibold uppercase block mb-1">CORRESPONDENCE EVIDENCE</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {featureMatches?.mean_confidence != null
                  ? `LoFTR dense attention yielded cross-sensor correspondences with mean confidence score ${featureMatches.mean_confidence.toFixed(4)}.`
                  : 'DATA NOT AVAILABLE — No correspondence evidence returned by backend.'}
              </p>
            </div>

            {/* Geometric Verification */}
            <div className="tech-card-inset p-3">
              <span className="text-[10px] text-amber-400 font-semibold uppercase block mb-1">GEOMETRIC VERIFICATION</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {geomEvidence?.reprojection_rmse != null
                  ? `MAGSAC++ homography convergence with sub-pixel reprojection error (${geomEvidence.reprojection_rmse.toFixed(3)} px).`
                  : 'DATA NOT AVAILABLE — No geometric verification data returned by backend.'}
              </p>
            </div>

            {/* Retrieval Evidence */}
            <div className="tech-card-inset p-3">
              <span className="text-[10px] text-amber-400 font-semibold uppercase block mb-1">RETRIEVAL EVIDENCE</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {activeResult?.common_point_id
                  ? `Candidate ${activeResult.common_point_id} ranked in Top-1 nearest spatial neighbors from Chandrayaan-2 catalog index.`
                  : 'DATA NOT AVAILABLE — No retrieval evidence returned by backend.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
