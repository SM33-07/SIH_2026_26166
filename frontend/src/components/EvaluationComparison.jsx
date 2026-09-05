import React, { useEffect } from 'react'
import { BarChart2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function EvaluationComparison() {
  const { benchmarkResults, isBenchmarking, runBenchmark } = useMatchStore()

  useEffect(() => {
    if (!benchmarkResults) {
      runBenchmark()
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">SYSTEM EVALUATION & ABLATION MATRIX</h2>
          <p className="text-xs text-slate-400">Benchmarking Classical SIFT/AKAZE Baselines vs Proposed Learned LoFTR Engine</p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={isBenchmarking}
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
          <span>{isBenchmarking ? 'Running Evaluation...' : 'Re-Run Evaluation Harness'}</span>
        </button>
      </div>

      {benchmarkResults && benchmarkResults.map((item, idx) => (
        <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-sky-400">{item.name}</h3>
            <span className="text-xs font-mono text-slate-400">Modality: {item.ablation?.modality_pair}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-mono">
                <tr>
                  <th className="p-3">CONFIGURATION</th>
                  <th className="p-3">KEYPOINTS A / B</th>
                  <th className="p-3">RAW MATCHES</th>
                  <th className="p-3">INLIERS</th>
                  <th className="p-3">INLIER RATIO</th>
                  <th className="p-3">RMSE (PX)</th>
                  <th className="p-3">CYCLE ERROR</th>
                  <th className="p-3">RUNTIME (MS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {item.ablation?.benchmark_runs &&
                  Object.entries(item.ablation.benchmark_runs).map(([cfgName, run], rIdx) => {
                    const isProposed = cfgName === 'Proposed_Learned'
                    return (
                      <tr key={rIdx} className={isProposed ? 'bg-sky-500/10 font-semibold text-white' : 'text-slate-300'}>
                        <td className="p-3 font-mono">
                          {cfgName} {isProposed && <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.5 rounded ml-2">PROPOSED</span>}
                        </td>
                        <td className="p-3 font-mono">{run.num_keypoints_a} / {run.num_keypoints_b}</td>
                        <td className="p-3 font-mono">{run.num_matches}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{run.num_inliers}</td>
                        <td className="p-3 font-mono text-sky-400 font-bold">{(run.inlier_ratio * 100).toFixed(1)}%</td>
                        <td className="p-3 font-mono">{run.rmse !== null ? `${run.rmse} px` : '-'}</td>
                        <td className="p-3 font-mono">{run.cycle_consistency_error !== null ? `${run.cycle_consistency_error} px` : '-'}</td>
                        <td className="p-3 font-mono">{run.runtime_ms} ms</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
