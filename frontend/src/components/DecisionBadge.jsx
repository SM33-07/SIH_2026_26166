/**
 * DecisionBadge
 * Renders the tri-state decision (SAME LUNAR ZONE / DIFFERENT LUNAR ZONES / INSUFFICIENT EVIDENCE).
 * Consistency score is displayed as a numeric score, never as probability %.
 * When isDemo is true, clearly labels as CONTROLLED DEMONSTRATION.
 */

const DECISION_CONFIG = {
  'SAME LUNAR ZONE': {
    icon: '✓',
    colorClass: 'border-decision-same bg-decision-same/10 text-decision-same shadow-glow-green',
    subColor: 'text-green-400',
  },
  'DIFFERENT LUNAR ZONES': {
    icon: '✗',
    colorClass: 'border-decision-diff bg-decision-diff/10 text-decision-diff shadow-glow-red',
    subColor: 'text-red-400',
  },
  'INSUFFICIENT EVIDENCE': {
    icon: '◎',
    colorClass: 'border-decision-insuf bg-decision-insuf/10 text-decision-insuf shadow-glow-amber',
    subColor: 'text-amber-400',
  },
}

export default function DecisionBadge({ decision, consistencyScore, isDemo = false }) {
  if (!decision) return null

  const cfg = DECISION_CONFIG[decision] || {
    icon: '◌',
    colorClass: 'border-slate-600 bg-slate-800/40 text-slate-300',
    subColor: 'text-slate-400',
  }

  const scoreLabel = isDemo ? 'DEMO CONSISTENCY SCORE' : 'CONSISTENCY SCORE'

  return (
    <div className="flex flex-col items-center gap-2 py-3 decision-appear">
      {/* Optional Mode Tag */}
      {isDemo && (
        <span className="text-[9px] font-mono border border-amber-600/70 text-amber-300 bg-amber-950/40 px-3 py-0.5 uppercase tracking-widest font-bold">
          CONTROLLED DEMONSTRATION VERDICT
        </span>
      )}

      <div
        className={`border-2 px-8 py-4 text-center w-full max-w-xl ${cfg.colorClass} ${
          isDemo ? 'ring-2 ring-amber-500/30' : ''
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="font-black text-2xl sm:text-3xl tracking-widest uppercase flex items-center justify-center gap-3">
          <span>{cfg.icon}</span>
          <span>{decision}</span>
        </span>
      </div>

      {consistencyScore != null && (
        <div className="text-xs font-mono tracking-wider text-slate-400 flex items-center gap-2 flex-wrap justify-center">
          <span className="uppercase text-[11px] text-slate-400">{scoreLabel}:</span>
          <span className={`font-bold text-base ${cfg.subColor}`}>
            {Number(consistencyScore).toFixed(6)}
          </span>
          <span className="text-slate-600 text-[10px] italic">(not a calibrated probability)</span>
        </div>
      )}
    </div>
  )
}
