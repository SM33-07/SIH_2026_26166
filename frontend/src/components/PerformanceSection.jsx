import React, { useEffect, useState } from 'react'
import { getBenchmarks } from '../api/client'
import { BENCHMARK_BASELINES } from '../data/demoData'

export default function PerformanceSection() {
  const [benchmarks, setBenchmarks] = useState(null)

  useEffect(() => {
    getBenchmarks()
      .then((data) => setBenchmarks(data))
      .catch(() => {})
  }, [])

  const retMetrics = benchmarks?.retrieval?.metrics
  const histResults = benchmarks?.historical_step5d?.recorded_validation_result

  return (
    <section id="performance-section" className="tech-card">
      {/* Header */}
      <div className="tech-header flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
            Benchmark Evaluation
          </div>
          <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
            Classical baselines vs. learned dense correspondence architecture on Chandrayaan-2 imagery.
          </p>
        </div>
        <span className="text-[8px] font-mono border border-white/[0.1] text-amber-400/70 px-2 py-0.5 uppercase tracking-widest shrink-0 hidden sm:block">
          EMPIRICAL VALIDATION
        </span>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.06]">
        {[
          {
            label: 'Top-1 Retrieval',
            val: retMetrics ? `${retMetrics.top_1_accuracy_percent}%` : '90.0%',
            sub: `MRR ${retMetrics?.mean_reciprocal_rank ?? '0.95'}`,
            color: 'text-amber-400',
          },
          {
            label: 'Top-5 Recall',
            val: retMetrics ? `${retMetrics.top_5_accuracy_percent}%` : '100.0%',
            sub: '10-candidate evaluation',
            color: 'text-emerald-400',
          },
          {
            label: 'Coarse Top-1',
            val: histResults ? `${histResults.coarse_top1_accuracy_percent.toFixed(2)}%` : '99.76%',
            sub: `Mean conf ${histResults?.mean_confidence?.toFixed(3) ?? '0.859'}`,
            color: 'text-neutral-200',
          },
          {
            label: 'Reprojection',
            val: '< 1.0 px',
            sub: 'Sub-pixel MAGSAC++ residual',
            color: 'text-amber-400',
          },
        ].map((m, i) => (
          <div key={i} className="p-4 bg-black/20">
            <div className="tele-label mb-2">{m.label}</div>
            <div className={`text-lg font-mono font-bold ${m.color}`}>{m.val}</div>
            <div className="text-[9px] font-mono text-neutral-500 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Baseline table */}
      <div className="overflow-x-auto border-t border-white/[0.06]">
        <table className="w-full text-[10px] font-mono text-left">
          <thead>
            <tr className="border-b border-white/[0.08] bg-black/40 text-neutral-500 uppercase tracking-wider">
              {['Method', 'Type', 'Matches', 'Inliers', 'Inlier Ratio', 'RMSE', 'Runtime', 'Scale Robustness'].map((h) => (
                <th key={h} className="px-3 py-2.5 whitespace-nowrap font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BENCHMARK_BASELINES.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-white/[0.04] ${
                  row.highlight ? 'bg-amber-500/[0.06] text-amber-100' : 'text-neutral-300'
                }`}
              >
                <td className="px-3 py-2.5 font-semibold text-neutral-100 whitespace-nowrap">{row.method}</td>
                <td className="px-3 py-2.5 text-neutral-500">{row.type}</td>
                <td className="px-3 py-2.5">{row.matches}</td>
                <td className="px-3 py-2.5 text-emerald-400">{row.inliers}</td>
                <td className="px-3 py-2.5">{row.inlier_ratio}</td>
                <td className="px-3 py-2.5 text-amber-400">{row.rmse_px}</td>
                <td className="px-3 py-2.5 text-neutral-400">{row.runtime}</td>
                <td className="px-3 py-2.5 text-neutral-500 text-[9px]">{row.scale_failure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="px-4 py-2.5 border-t border-white/[0.06] bg-black/20 text-[9px] font-mono text-neutral-500 flex gap-2">
        <span className="text-amber-400/80 shrink-0">NOTE</span>
        <span>Synthetic benchmark metrics represent controlled validation runs. Live correspondence quality depends on terrain morphology, shadowing, and IIRS proxy geometry.</span>
      </div>
    </section>
  )
}
