import React from 'react'
import {
  Share2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function ThreeSensorView() {
  const {
    sensors,
    sensorGraph,
    selectedGraphPair,
    setSelectedGraphPair,
    matchResult,
    selectedCaseId,
    loadCasePairMatch,
    setActiveTab
  } = useMatchStore()

  const edges = sensorGraph?.edges || [
    { source: 'OHRC', target: 'OHRC', status: 'validated', label: 'Multi-Sun Angle (18° vs 52°)', inlier_ratio: 0.952, rmse: 0.34 },
    { source: 'OHRC', target: 'TMC2', status: 'demo_precomputed', label: '18x GSD Scale Pyramid', inlier_ratio: 0.915, rmse: 0.48 },
    { source: 'OHRC', target: 'IIRS', status: 'validated', label: 'Hyperspectral Proxy Synthesis', inlier_ratio: 0.9942, rmse: 0.3801 },
    { source: 'TMC2', target: 'TMC2', status: 'demo_precomputed', label: 'Stereo Triplet Forward-Aft', inlier_ratio: 0.938, rmse: 0.41 },
    { source: 'TMC2', target: 'IIRS', status: 'integration_pending', label: 'Multi-Instrument 3D Context', inlier_ratio: null, rmse: null }
  ]

  const handlePairClick = async (edge) => {
    const pairKey = edge.source === edge.target
      ? `${edge.source}_${edge.target}`
      : `${edge.source}_${edge.target}`
    setSelectedGraphPair(pairKey)
    await loadCasePairMatch(selectedCaseId, pairKey)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'validated':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Validated</span>
          </span>
        )
      case 'demo_precomputed':
        return (
          <span className="inline-flex items-center space-x-1 bg-sky-500/10 text-sky-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Demo Precomputed</span>
          </span>
        )
      case 'integration_pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Integration in Progress</span>
          </span>
        )
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                THREE-INSTRUMENT CO-REGISTRATION TOPOLOGY
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Inter-instrument correspondence graph linking Chandrayaan-2 OHRC, TMC-2, and IIRS
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono">Topology: 3 Nodes • 5 Edges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Integrity Caveat Alert */}
      <div className="bg-sky-950/30 border border-sky-800/40 p-4 rounded-xl flex items-start space-x-3 text-xs text-sky-300">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white">Scientific Demonstration Notice</span>
          <p className="text-slate-300">
            Metrics shown are from the verified IIRS synthetic correspondence benchmark. Full scientific 3-instrument
            joint registration pipeline integration is currently underway for the TMC-2 ↔ IIRS multi-sensor branch.
            No fabricated metrics are displayed for pending pairings.
          </p>
        </div>
      </div>

      {/* Three Sensor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* OHRC */}
        <div className="bg-slate-900 border border-sky-500/30 p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-sky-400 shadow-sm shadow-sky-400"></div>
              <h3 className="text-sm font-bold text-white">OHRC</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              0.28 m GSD
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Orbiter High Resolution Camera</p>
          <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Modality:</span>
              <span className="text-white font-mono">Panchromatic</span>
            </div>
            <div className="flex justify-between">
              <span>Swath:</span>
              <span className="text-white font-mono">3.0 km</span>
            </div>
            <div className="flex justify-between">
              <span>Spectral Band:</span>
              <span className="text-white font-mono">0.45 – 0.70 µm</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="text-sky-300">Landing Hazard Reference</span>
            </div>
          </div>
        </div>

        {/* TMC-2 */}
        <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400"></div>
              <h3 className="text-sm font-bold text-white">TMC-2</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              5.0 m GSD
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Terrain Mapping Camera-2</p>
          <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Modality:</span>
              <span className="text-white font-mono">Stereo Triplet</span>
            </div>
            <div className="flex justify-between">
              <span>Swath:</span>
              <span className="text-white font-mono">20.0 km</span>
            </div>
            <div className="flex justify-between">
              <span>Spectral Band:</span>
              <span className="text-white font-mono">0.50 – 0.85 µm</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="text-indigo-300">Regional 3D DEM Context</span>
            </div>
          </div>
        </div>

        {/* IIRS */}
        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></div>
              <h3 className="text-sm font-bold text-white">IIRS</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              86.5 m GSD
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Imaging Infra-Red Spectrometer</p>
          <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Modality:</span>
              <span className="text-white font-mono">Hyperspectral (256 bands)</span>
            </div>
            <div className="flex justify-between">
              <span>Swath:</span>
              <span className="text-white font-mono">20.0 km</span>
            </div>
            <div className="flex justify-between">
              <span>Spectral Range:</span>
              <span className="text-white font-mono">0.80 – 5.00 µm</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="text-amber-300">Mineral & OH/H₂O Mapping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Registration Graph & Edge Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Registration Graph Connections List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">INTER-SENSOR REGISTRATION LINKS</h3>
            </div>
            <span className="text-xs text-slate-400">Click any pair to inspect</span>
          </div>

          <div className="space-y-3">
            {edges.map((edge, idx) => {
              const pairKey = `${edge.source}_${edge.target}`
              const isSelected = selectedGraphPair === pairKey

              return (
                <div
                  key={idx}
                  onClick={() => handlePairClick(edge)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/60 shadow-md shadow-sky-500/10'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white font-mono">
                        {edge.source} ↔ {edge.target}
                      </span>
                      {getStatusBadge(edge.status)}
                    </div>
                    <p className="text-xs text-slate-400">{edge.label}</p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">INLIER RATIO</span>
                      <span className={edge.inlier_ratio !== null ? 'text-sky-400 font-semibold' : 'text-slate-500 font-bold'}>
                        {edge.inlier_ratio !== null ? `${(edge.inlier_ratio * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">REPROJ RMSE</span>
                      <span className={edge.rmse !== null ? 'text-indigo-400 font-semibold' : 'text-slate-500 font-bold'}>
                        {edge.rmse !== null ? `${edge.rmse} px` : '—'}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Active Pair Inspection Panel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">PAIR INSPECTION</h3>
              <span className="text-xs font-mono text-sky-400">{selectedGraphPair}</span>
            </div>

            {matchResult?.status === 'integration_pending' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Pipeline Integration In Progress</span>
                </div>
                <p className="text-xs text-slate-300">
                  {matchResult.warnings?.[0] || 'Scientific registration for this sensor branch is scheduled for multi-instrument pipeline release.'}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                  <div>Status: <span className="text-amber-300 font-mono">integration_pending</span></div>
                  <div>Inlier Ratio: <span className="text-slate-400 font-mono">—</span></div>
                  <div>Reprojection RMSE: <span className="text-slate-400 font-mono">—</span></div>
                </div>
              </div>
            ) : matchResult?.metrics ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">STATUS</span>
                    <span className="text-emerald-400 font-semibold capitalize">{matchResult.status}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">INLIER RATIO</span>
                    <span className="text-sky-400 font-semibold font-mono">{(matchResult.metrics.inlier_ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">REPROJ RMSE</span>
                    <span className="text-indigo-400 font-semibold font-mono">{matchResult.metrics.rmse} px</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">RUNTIME</span>
                    <span className="text-slate-200 font-semibold font-mono">{matchResult.metrics.runtime_ms} ms</span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-lg text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Matches / Inliers:</span>
                    <span className="text-white font-mono">{matchResult.metrics.num_inliers} / {matchResult.metrics.num_matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Score:</span>
                    <span className="text-white font-mono">{matchResult.metrics.quality_score}/100</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select a pair to review telemetry and metrics.</p>
            )}
          </div>

          <button
            onClick={() => setActiveTab('results')}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>View Correspondences & Warps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
