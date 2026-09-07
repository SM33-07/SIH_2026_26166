import React from 'react'

export default function DecisionVerdictCard({ decision = 'UNKNOWN', explanation = null, consistencyScore = null }) {
  const isSame = decision.includes('SAME')
  const isDiff = decision.includes('DIFFERENT')

  const badgeClass = isSame
    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
    : isDiff
    ? 'border-red-500/50 bg-red-950/40 text-red-400'
    : 'border-amber-500/50 bg-amber-950/40 text-amber-400'

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-5 font-mono text-xs text-neutral-200 text-center flex flex-col items-center justify-center">
      <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-500 mb-2">
        FINAL SYNTHESIZED MODEL VERDICT
      </span>

      <div className={`px-6 py-2 rounded-full border text-sm font-bold tracking-widest uppercase mb-3 flex items-center gap-2 shadow-lg ${badgeClass}`}>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span>{decision}</span>
      </div>

      {consistencyScore != null && (
        <div className="text-[11px] text-neutral-400 mb-2">
          COMPOSITE CONSISTENCY SCORE:{' '}
          <strong className="text-amber-400 font-semibold">{consistencyScore.toFixed(4)}</strong>
        </div>
      )}

      {explanation && (
        <p className="text-[10.5px] text-neutral-400 max-w-xl leading-relaxed mt-1">
          {explanation}
        </p>
      )}
    </div>
  )
}
