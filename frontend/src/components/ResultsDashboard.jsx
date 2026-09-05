import React, { useState } from 'react'
import { Layers, Activity, ShieldCheck, Download, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function ResultsDashboard() {
  const { matchResult, resultsSubTab, setResultsSubTab } = useMatchStore()
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [alignmentMode, setAlignmentMode] = useState('blended') // 'blended', 'flicker', 'warped'

  if (!matchResult) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl max-w-md mx-auto space-y-4">
          <Activity className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Correspondence Results Yet</h3>
          <p className="text-xs text-slate-400">Select a demo pair or upload images in the Match Engine tab and click "Run Correspondence Engine".</p>
        </div>
      </div>
    )
  }

  const { metrics, visualizations, job_id, modality_pair_type, homography } = matchResult

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">MATCH QUALITY</span>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">{metrics.quality_score}/100</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              metrics.quality_score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {metrics.confidence_level}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">INLIER RATIO</span>
          <span className="text-xl font-bold text-sky-400">{(metrics.inlier_ratio * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block">{metrics.num_inliers} / {metrics.num_matches} inliers</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">REPROJECTION RMSE</span>
          <span className="text-xl font-bold text-indigo-400">{metrics.rmse !== null ? `${metrics.rmse} px` : 'N/A'}</span>
          <span className="text-[10px] text-slate-500 block">MAGSAC++ residual</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">CYCLE ERROR</span>
          <span className="text-xl font-bold text-emerald-400">{metrics.cycle_consistency_error !== null ? `${metrics.cycle_consistency_error} px` : 'N/A'}</span>
          <span className="text-[10px] text-slate-500 block">A → B → A round-trip</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">SCALE RATIO</span>
          <span className="text-xl font-bold text-amber-400">{metrics.scale_ratio ? `${metrics.scale_ratio}x` : '1.0x'}</span>
          <span className="text-[10px] text-slate-500 block">GSD pyramid scale</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">RUNTIME</span>
          <span className="text-xl font-bold text-slate-200">{metrics.runtime_ms} ms</span>
          <span className="text-[10px] text-slate-500 block">{modality_pair_type}</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex space-x-2">
          {[
            { id: 'correspondences', label: 'Correspondences' },
            { id: 'alignment', label: 'Warp & Alignment' },
            { id: 'confidence', label: 'Spatial Confidence Map' },
            { id: 'matrix', label: 'Homography Matrix' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResultsSubTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                resultsSubTab === tab.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex space-x-2">
          <a
            href={`/api/export/${job_id}/json`}
            download
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </a>
          <a
            href={`/api/export/${job_id}/csv`}
            download
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Sub-Tab 1: Correspondences */}
      {resultsSubTab === 'correspondences' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Side-by-Side Keypoint Match Lines</h4>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Geometric Inliers</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Rejected Outliers</span>
              </span>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <img src={visualizations.correspondences} alt="Keypoint Correspondences" className="w-full h-auto object-contain" />
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Alignment Overlay */}
      {resultsSubTab === 'alignment' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Image B Warped into Image A Coordinate Frame</h4>
            <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setAlignmentMode('blended')}
                className={`px-3 py-1 rounded ${alignmentMode === 'blended' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400'}`}
              >
                Blended Overlay
              </button>
              <button
                onClick={() => setAlignmentMode('flicker')}
                className={`px-3 py-1 rounded ${alignmentMode === 'flicker' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400'}`}
              >
                Cyan-Red Registration
              </button>
              <button
                onClick={() => setAlignmentMode('warped')}
                className={`px-3 py-1 rounded ${alignmentMode === 'warped' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400'}`}
              >
                Warped B Only
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden max-h-[550px] flex items-center justify-center">
            <img
              src={
                alignmentMode === 'blended'
                  ? visualizations.blended_overlay
                  : alignmentMode === 'flicker'
                  ? visualizations.flicker_composite
                  : visualizations.warped_b
              }
              alt="Alignment Overlay"
              className="max-h-[550px] w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Confidence Heatmap */}
      {resultsSubTab === 'confidence' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Explainable 2D Spatial Confidence Map</h4>
              <p className="text-xs text-slate-400">Combines keypoint density, MAGSAC++ inlier status, and shadow suppression.</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">Mean: {metrics.confidence_mean}</span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
            <img src={visualizations.confidence_heatmap} alt="Spatial Confidence Map" className="w-full max-h-[500px] object-contain" />
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Homography Matrix */}
      {resultsSubTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white">Estimated 3x3 Homography Matrix H</h4>
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-xs text-sky-400 overflow-x-auto">
            {homography ? (
              <pre className="space-y-1">
                {homography.map((row, idx) => (
                  <div key={idx}>[ {row.map((val) => val.toFixed(6).padStart(12, ' ')).join(', ')} ]</div>
                ))}
              </pre>
            ) : (
              <p className="text-slate-500">Homography matrix not estimated due to insufficient inliers.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
