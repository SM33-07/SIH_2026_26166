import React, { useState } from 'react'
import { BENCHMARKS } from '../data/demoData'

export default function PerformanceSection() {
  const [activePreset, setActivePreset] = useState('standard')

  const presetData = BENCHMARKS?.[activePreset] || BENCHMARKS?.standard || {
    name: 'Standard Illumination Conditions',
    sunAngleRange: '15°–45°',
    evaluatedPairs: 500,
    meanErrorPx: 0.3801,
    inlierRatio: 99.42,
    runtimeMs: 29.4
  }

  const ablations = BENCHMARKS?.ablations || [
    { name: 'Classical SIFT + RANSAC', inlier_ratio_pct: 22.58, reprojection_rmse_px: 2.65, repeatability_pct: 35.4, scale_invariance: 'Low', sun_angle_robustness: 'Low' },
    { name: 'Classical AKAZE + RANSAC', inlier_ratio_pct: 30.77, reprojection_rmse_px: 2.14, repeatability_pct: 42.1, scale_invariance: 'Moderate', sun_angle_robustness: 'Moderate' },
    { name: 'Proposed Fine-Adapted LoFTR (Ours)', inlier_ratio_pct: 99.42, reprojection_rmse_px: 0.38, repeatability_pct: 98.6, scale_invariance: 'Very High', sun_angle_robustness: 'High' }
  ]

  return (
    <section id="performance" className="py-12 px-6 max-w-7xl mx-auto border-b border-[#252525] font-mono bg-transparent">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] text-amber-500 uppercase tracking-widest block mb-1">
            EXPERIMENT CONSOLE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2F2F2] uppercase tracking-tight">
            Algorithm Performance & Ablation Matrix
          </h2>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Comparative evaluation across classical descriptors (SIFT, AKAZE) vs proposed learned matcher (Fine-Adapted LoFTR)
          </p>
        </div>

        {/* Condition Suite Switcher */}
        <div className="flex items-center space-x-2 bg-[#080808]/80 backdrop-blur-sm p-1.5 border border-[#252525] self-start">
          <button
            onClick={() => setActivePreset('standard')}
            className={`px-3 py-1.5 text-xs transition-colors cursor-pointer border ${
              activePreset === 'standard'
                ? 'bg-[#151515] text-[#F2F2F2] border-amber-500 font-bold'
                : 'text-[#A0A0A0] hover:text-[#F2F2F2] border-transparent'
            }`}
          >
            STANDARD SUITE
          </button>
          <button
            onClick={() => setActivePreset('stress')}
            className={`px-3 py-1.5 text-xs transition-colors cursor-pointer border ${
              activePreset === 'stress'
                ? 'bg-[#151515] text-amber-500 border-amber-500 font-bold'
                : 'text-[#A0A0A0] hover:text-[#F2F2F2] border-transparent'
            }`}
          >
            EXTREME STRESS SUITE
          </button>
        </div>
      </div>

      {/* Synthetic Benchmark Scientific Caveat Banner */}
      <div className="mb-6 p-3.5 bg-[#0D0D0D]/85 backdrop-blur-sm border border-amber-500/40 text-amber-500 text-xs flex items-start space-x-3">
        <span className="font-bold border border-amber-500 px-1.5 py-0.5 text-[10px] uppercase flex-shrink-0 mt-0.5">CAVEAT</span>
        <div className="leading-relaxed">
          <span className="font-bold text-[#F2F2F2] block mb-0.5 uppercase">SYNTHETIC IIRS BENCHMARK DATASET</span>
          <span className="text-[#A0A0A0] text-[11px]">
            {BENCHMARKS?.warning || BENCHMARKS?.caveats?.synthetic_data_note || 'Metrics evaluate algorithm robustness against simulated illumination shifts and synthetic degradation. Do not confuse synthetic benchmark validation with full-Moon deployment.'}
          </span>
        </div>
      </div>

      {/* Ablation Console Table */}
      <div className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] overflow-hidden">

        <div className="p-4 border-b border-[#252525] flex items-center justify-between text-xs">
          <span className="font-bold text-[#F2F2F2] uppercase">
            MATRIX EVALUATION ({presetData.name.toUpperCase()})
          </span>
          <span className="text-[#5F5F5F]">TESTED SAMPLES: {presetData.evaluatedPairs || 500} PAIRS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#050505] text-[#5F5F5F] uppercase text-[10px] border-b border-[#252525]">
                <th className="py-3 px-4">ALGORITHM PIPELINE</th>
                <th className="py-3 px-4">INLIER RATIO (%)</th>
                <th className="py-3 px-4">RMSE ERROR (PX)</th>
                <th className="py-3 px-4">REPEATABILITY (%)</th>
                <th className="py-3 px-4">SCALE INVARIANCE</th>
                <th className="py-3 px-4">SUN-ANGLE ROBUSTNESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252525]">
              {ablations.map((alg) => {
                const algName = alg.method || alg.name
                const isLoFTR = algName.includes('LoFTR') || algName.includes('Proposed')
                return (
                  <tr
                    key={algName}
                    className={`transition-colors ${
                      isLoFTR
                        ? 'bg-[#151515] text-[#F2F2F2] font-bold'
                        : 'hover:bg-[#080808] text-[#A0A0A0]'
                    }`}
                  >
                    <td className="py-3.5 px-4 flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 ${isLoFTR ? 'bg-amber-500' : 'bg-[#5F5F5F]'}`} />
                      <span>{algName}</span>
                      {isLoFTR && (
                        <span className="ml-2 text-[9px] border border-amber-500 text-amber-500 px-1 py-0.2">PROPOSED</span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 ${isLoFTR ? 'text-amber-500 font-bold' : ''}`}>{alg.inlierRatio || alg.inlier_ratio_pct}%</td>
                    <td className={`py-3.5 px-4 ${isLoFTR ? 'text-[#F2F2F2] font-bold' : ''}`}>{alg.rmse || alg.reprojection_rmse_px} px</td>
                    <td className="py-3.5 px-4">{alg.repeatability_pct || (isLoFTR ? '98.6' : '38.2')}%</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] border ${
                        isLoFTR
                          ? 'border-amber-500/40 text-amber-500 bg-[#080808]'
                          : 'border-[#252525] text-[#5F5F5F]'
                      }`}>
                        {alg.scale_invariance || (isLoFTR ? 'VERY HIGH' : 'LOW')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] border ${
                        isLoFTR
                          ? 'border border-[#303030] text-[#F2F2F2] bg-[#080808]'
                          : 'border-[#252525] text-[#5F5F5F]'
                      }`}>
                        {alg.sun_angle_robustness || (isLoFTR ? 'HIGH' : 'MODERATE')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


