import React, { useState } from 'react'
import {
  Layers,
  Activity,
  ShieldCheck,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function ResultsDashboard() {
  const { matchResult, resultsSubTab, setResultsSubTab, selectedCaseId, selectedGraphPair } = useMatchStore()
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [alignmentMode, setAlignmentMode] = useState('blended') // 'blended', 'flicker', 'warped'

  if (!matchResult) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl max-w-md mx-auto space-y-4">
          <Activity className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Correspondence Results Yet</h3>
          <p className="text-xs text-slate-400">
            Select any lunar case or click "Run Correspondence Engine" in the Match Engine tab to inspect results.
          </p>
        </div>
      </div>
    )
  }

  const { metrics, visualizations, job_id, modality_pair_type, homography, status, warnings } = matchResult
  const isPending = status === 'integration_pending' || !metrics

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Top Status & Info Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white font-mono">{modality_pair_type}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">Job: {job_id}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">Case: {selectedCaseId}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Chandrayaan-2 Inter-Instrument Correspondence Evaluation Frame
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isPending ? (
            <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>Integration in Progress</span>
            </span>
          ) : status === 'validated' ? (
            <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Validated Benchmark</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 bg-sky-500/10 text-sky-400 text-xs font-semibold px-3 py-1 rounded-full border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Precomputed</span>
            </span>
          )}
        </div>
      </div>

      {/* Pending Warning Banner (if applicable) */}
      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">Multi-Instrument Registration in Progress</span>
            <p className="text-slate-300 leading-relaxed">
              {warnings?.[0] || 'Scientific registration for this sensor branch is scheduled for multi-instrument pipeline release.'}
              <br />
              Notice: In adherence to ISRO hackathon integrity requirements, metrics for unintegrated pairs are presented as null (—) rather than simulated numbers.
            </p>
          </div>
        </div>
      )}

      {/* Top Metrics Cards (Strict Null Handling) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Match Quality */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">MATCH QUALITY</span>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">
              {metrics?.quality_score !== undefined ? `${metrics.quality_score}/100` : '—'}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                isPending
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : metrics?.quality_score >= 70
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isPending ? 'Pending' : metrics?.confidence_level || '—'}
            </span>
          </div>
        </div>

        {/* Inlier Ratio */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">INLIER RATIO</span>
          <span className={metrics ? 'text-xl font-bold text-sky-400' : 'text-xl font-bold text-slate-500'}>
            {metrics ? `${(metrics.inlier_ratio * 100).toFixed(1)}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {metrics ? `${metrics.num_inliers} / ${metrics.num_matches} inliers` : 'MAGSAC++ solver pending'}
          </span>
        </div>

        {/* Reprojection RMSE */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">REPROJECTION RMSE</span>
          <span className={metrics?.rmse !== null && metrics?.rmse !== undefined ? 'text-xl font-bold text-indigo-400' : 'text-xl font-bold text-slate-500'}>
            {metrics?.rmse !== null && metrics?.rmse !== undefined ? `${metrics.rmse} px` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">Geometric residual</span>
        </div>

        {/* Cycle Error */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">CYCLE ERROR</span>
          <span className={metrics?.cycle_consistency_error !== null && metrics?.cycle_consistency_error !== undefined ? 'text-xl font-bold text-emerald-400' : 'text-xl font-bold text-slate-500'}>
            {metrics?.cycle_consistency_error !== null && metrics?.cycle_consistency_error !== undefined ? `${metrics.cycle_consistency_error} px` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">A → B → A round-trip</span>
        </div>

        {/* Scale Ratio */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">SCALE RATIO</span>
          <span className={metrics?.scale_ratio ? 'text-xl font-bold text-amber-400' : 'text-xl font-bold text-slate-500'}>
            {metrics?.scale_ratio ? `${metrics.scale_ratio}x` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">GSD pyramid ratio</span>
        </div>

        {/* Runtime */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block">RUNTIME</span>
          <span className={metrics?.runtime_ms ? 'text-xl font-bold text-slate-200' : 'text-xl font-bold text-slate-500'}>
            {metrics?.runtime_ms ? `${metrics.runtime_ms} ms` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">GPU/CPU execution</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-3">
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
        <div className="flex items-center space-x-2">
          <a
            href={`/api/export/${job_id}/json`}
            download
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </a>
          <a
            href={`/api/export/${job_id}/csv`}
            download
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Sub-Tab Content Views */}

      {/* 1. Correspondences Tab */}
      {resultsSubTab === 'correspondences' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Bilateral Keypoint Correspondences (Green = Inliers, Red = Rejected Outliers)
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              {metrics ? `${metrics.num_inliers} Inliers (${(metrics.inlier_ratio * 100).toFixed(1)}%)` : 'Correspondences pending'}
            </span>
          </div>

          <div className="aspect-[21/9] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
            <img
              src={visualizations?.correspondences || '/static/demo/ohrc_sun18deg.png'}
              alt="Correspondences"
              className="w-full h-full object-contain"
            />
            {isPending && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400" />
                <span className="text-sm font-bold text-white">Three-Instrument Joint Pipeline Integration Pending</span>
                <p className="text-xs text-slate-300 max-w-md">
                  Live inter-sensor correspondences for {modality_pair_type} will be rendered here once the joint optimization solver completes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Warp & Alignment Tab */}
      {resultsSubTab === 'alignment' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Geometric Registration Overlay
            </h4>
            <div className="flex items-center space-x-2 text-xs">
              {['blended', 'flicker', 'warped'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAlignmentMode(mode)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                    alignmentMode === mode
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
            <img
              src={
                alignmentMode === 'warped'
                  ? visualizations?.warped_b || '/static/demo/tmc2_lowres_5m.png'
                  : alignmentMode === 'flicker'
                  ? visualizations?.flicker_composite || '/static/demo/ohrc_highres_025m.png'
                  : visualizations?.blended_overlay || '/static/demo/ohrc_sun52deg.png'
              }
              alt="Alignment"
              className="w-full h-full object-contain"
            />
            {isPending && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400" />
                <span className="text-sm font-bold text-white">Homography Alignment Pending</span>
                <p className="text-xs text-slate-300 max-w-md">
                  Projective warp composite for {modality_pair_type} will activate upon multi-sensor solver integration.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Spatial Confidence Map Tab */}
      {resultsSubTab === 'confidence' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              2D Spatial Confidence Heatmap (JET Colormap)
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Blue = Low Signal/Shadow, Red = High Reliability Inlier
            </span>
          </div>

          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
            <img
              src={visualizations?.confidence_heatmap || '/static/demo/iirs_composite_proxy.png'}
              alt="Confidence Heatmap"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 4. Homography Matrix Tab */}
      {resultsSubTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Projective Homography Transform Matrix (H)
          </h4>

          {homography ? (
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl font-mono text-xs text-sky-400 space-y-2 max-w-lg mx-auto">
              <div className="text-slate-500 text-[10px] pb-2 border-b border-slate-800">
                // 3x3 Projective Matrix mapping Image B coordinates to Image A
              </div>
              {homography.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-between px-4 py-1.5 bg-slate-900/50 rounded">
                  {row.map((val, cIdx) => (
                    <span key={cIdx} className="w-24 text-right">
                      {typeof val === 'number' ? val.toFixed(6) : val}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl text-center space-y-2 text-xs text-slate-400">
              <p className="text-amber-400 font-semibold">Homography matrix pending for {modality_pair_type}</p>
              <p className="text-slate-500">
                Robust transform parameters will be derived once multi-instrument correspondence integration completes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
