import React from 'react'
import DataState from '../common/DataState'

export default function VerificationFunnel({ funnel = {} }) {
  const { candidates, confidenceFiltered, inliers, outliers } = funnel

  if (candidates == null && inliers == null) {
    return (
      <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-3">
          Verification Funnel
        </h4>
        <DataState status="unavailable" message="Verification attrition data not returned." />
      </div>
    )
  }

  const steps = [
    { label: 'CANDIDATES', count: candidates ?? 'N/A', pct: 100, color: 'bg-neutral-600' },
    {
      label: 'CONFIDENCE FILTERED',
      count: confidenceFiltered ?? inliers ?? 'N/A',
      pct: candidates ? Math.round(((confidenceFiltered ?? inliers ?? 0) / candidates) * 100) : 100,
      color: 'bg-amber-500/80',
    },
    {
      label: 'RANSAC INLIERS',
      count: inliers ?? 'N/A',
      pct: candidates ? Math.round(((inliers ?? 0) / candidates) * 100) : 100,
      color: 'bg-emerald-400',
    },
  ]

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Verification Attrition Funnel
          </h4>
        </div>
        <span className="text-[10px] text-neutral-500">
          OUTLIERS REJECTED: {outliers ?? 0}
        </span>
      </div>

      <div className="space-y-3 my-2">
        {steps.map((s, idx) => (
          <div key={s.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-neutral-400 font-semibold">{s.label}</span>
              <span className="text-neutral-200 font-bold">{s.count} ({s.pct}%)</span>
            </div>
            <div className="w-full h-3 bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-500 ${s.color}`}
                style={{ width: `${Math.max(4, s.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
        <span>CRITERIA: MAGSAC++ DLT</span>
        <span>INLIER THRESHOLD: 3.0 px</span>
      </div>
    </div>
  )
}
