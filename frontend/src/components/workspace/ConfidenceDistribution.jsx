import React from 'react'
import DataState from '../common/DataState'

export default function ConfidenceDistribution({ confidences = [] }) {
  if (!confidences || confidences.length === 0) {
    return (
      <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-3">
          Confidence Distribution
        </h4>
        <DataState status="unavailable" message="No individual keypoint confidence metrics available." />
      </div>
    )
  }

  // Generate 5 discrete bins: 0.0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
  const bins = [
    { label: '0.0–0.2', count: 0, color: 'bg-red-500/60' },
    { label: '0.2–0.4', count: 0, color: 'bg-orange-500/60' },
    { label: '0.4–0.6', count: 0, color: 'bg-amber-500/60' },
    { label: '0.6–0.8', count: 0, color: 'bg-emerald-500/60' },
    { label: '0.8–1.0', count: 0, color: 'bg-emerald-400' },
  ]

  confidences.forEach((c) => {
    const val = Math.max(0, Math.min(1, c))
    const idx = Math.min(4, Math.floor(val * 5))
    bins[idx].count += 1
  })

  const maxCount = Math.max(1, ...bins.map((b) => b.count))
  const meanConf = confidences.reduce((a, b) => a + b, 0) / confidences.length

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Confidence Distribution
          </h4>
        </div>
        <span className="text-[10px] text-amber-400">
          MEAN: {meanConf.toFixed(3)} ({confidences.length} samples)
        </span>
      </div>

      {/* Histogram bars */}
      <div className="flex items-end justify-between gap-3 h-24 pt-2 pb-1 border-b border-neutral-800">
        {bins.map((bin) => {
          const heightPct = Math.round((bin.count / maxCount) * 100)
          return (
            <div key={bin.label} className="flex-1 flex flex-col items-center justify-end h-full group">
              <span className="text-[9px] text-neutral-400 mb-1 opacity-70 group-hover:opacity-100">
                {bin.count}
              </span>
              <div
                className={`w-full rounded-t transition-all duration-300 ${bin.color} group-hover:brightness-125`}
                style={{ height: `${Math.max(4, heightPct)}%` }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-[9px] text-neutral-500 pt-1.5 font-mono">
        {bins.map((b) => (
          <span key={b.label} className="flex-1 text-center">{b.label}</span>
        ))}
      </div>

      <p className="text-[10px] text-neutral-500 mt-3 italic leading-relaxed">
        Note: Transformer softmax attention weights measure matching distinctiveness; confidence is distinct from absolute sub-pixel geometric accuracy.
      </p>
    </div>
  )
}
