import React, { useEffect } from 'react'
import {
  Play,
  Settings2,
  Sliders,
  Info,
  Sparkles,
  AlertCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function MatchingScreen() {
  const {
    cases,
    selectedCaseId,
    selectCase,
    selectedGraphPair,
    loadCasePairMatch,
    matchResult,
    imageAId,
    imageBId,
    modalityA,
    modalityB,
    sunElevationA,
    sunElevationB,
    gsdA,
    gsdB,
    options,
    setOptions,
    runMatch,
    isLoading,
    progressStage,
    error,
    setActiveTab
  } = useMatchStore()

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0]

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

  const isPending = matchResult?.status === 'integration_pending'

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* 10 Cases Selector Carousel / Pills */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              CHANDRAYAAN-2 DEMONSTRATION CASES (10 CASES)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Select any case to evaluate</span>
        </div>

        {/* Case Cards Carousel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {cases.map((c, idx) => {
            const isSelected = selectedCaseId === c.id
            return (
              <button
                key={c.id}
                onClick={() => selectCase(c.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500 shadow-md shadow-sky-500/10 text-white'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold text-sky-400">CASE {idx + 1}</span>
                  <span className="text-[9px] font-mono text-slate-500 truncate">{c.pairs?.length || 0} pairs</span>
                </div>
                <p className="text-xs font-semibold truncate text-white">{c.region}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{c.name}</p>
              </button>
            )
          })}
        </div>

        {/* Active Case Details & Available Sensor Pairs */}
        {currentCase && (
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Case: {currentCase.name} ({currentCase.region})
                </h4>
                <p className="text-xs text-slate-400">{currentCase.description}</p>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Coords: {currentCase.latitude}°, {currentCase.longitude}°
              </div>
            </div>

            {/* Available Sensor Pairs in this Case */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Sensor Pairs:</span>
              {currentCase.pairs?.map((p) => {
                const isSelected = selectedGraphPair === p.pair_key
                return (
                  <button
                    key={p.pair_key}
                    onClick={() => loadCasePairMatch(currentCase.id, p.pair_key)}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-500 text-white font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{p.instrument_a} ↔ {p.instrument_b}</span>
                    {getStatusBadge(p.status)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Integration Pending Notice (if active pair is pending) */}
      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-200">
          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">Three-Instrument Joint Registration In Progress</span>
            <p className="text-slate-300 leading-relaxed">
              The cross-modal registration pipeline for this pair ({modalityA} ↔ {modalityB}) is actively in integration.
              In accordance with scientific rigor, no fabricated metrics are generated. You can inspect the pre-registered
              lunar imaging footprints below or test our validated OHRC and IIRS pipeline branches.
            </p>
          </div>
        </div>
      )}

      {/* Dual Image Selection & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image A */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-sky-400">IMAGE A (REFERENCE FRAME)</h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {modalityA}
            </span>
          </div>

          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
            <img
              src={`/static/demo/${imageAId}`}
              alt="Image A"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/90 text-slate-300 text-[11px] font-mono px-2.5 py-1 rounded border border-slate-800 backdrop-blur">
              {imageAId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">GROUND SAMPLING DISTANCE</span>
              <span className="text-white font-mono font-semibold">{gsdA} m/pixel</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SUN ELEVATION ANGLE</span>
              <span className="text-white font-mono font-semibold">{sunElevationA}°</span>
            </div>
          </div>
        </div>

        {/* Image B */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-indigo-400">IMAGE B (TARGET TO WARP)</h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {modalityB}
            </span>
          </div>

          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
            <img
              src={`/static/demo/${imageBId}`}
              alt="Image B"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/90 text-slate-300 text-[11px] font-mono px-2.5 py-1 rounded border border-slate-800 backdrop-blur">
              {imageBId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">GROUND SAMPLING DISTANCE</span>
              <span className="text-white font-mono font-semibold">{gsdB} m/pixel</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SUN ELEVATION ANGLE</span>
              <span className="text-white font-mono font-semibold">{sunElevationB}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Pipeline Configuration */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
          <Settings2 className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">PIPELINE CONFIGURATION</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* Matcher Engine */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Matcher Engine</label>
            <select
              value={options.pipeline}
              onChange={(e) => setOptions({ pipeline: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:border-sky-500 focus:outline-none"
            >
              <option value="proposed">Proposed Learned (LoFTR Cross-Attention)</option>
              <option value="classical">Classical Baseline (SIFT / AKAZE)</option>
            </select>
          </div>

          {/* Classical Feature Algorithm */}
          {options.pipeline === 'classical' && (
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Classical Feature Algorithm</label>
              <select
                value={options.classical_algorithm}
                onChange={(e) => setOptions({ classical_algorithm: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:border-sky-500 focus:outline-none"
              >
                <option value="SIFT">SIFT (Scale-Invariant Feature Transform)</option>
                <option value="AKAZE">AKAZE (Accelerated KAZE)</option>
                <option value="ORB">ORB (Oriented FAST and Rotated BRIEF)</option>
              </select>
            </div>
          )}

          {/* Illumination Normalization */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Illumination Normalization</label>
            <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={options.use_illumination_normalization}
                onChange={(e) => setOptions({ use_illumination_normalization: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <span className="text-slate-300">Lunar-Lambertian + CLAHE</span>
            </div>
          </div>

          {/* Shadow Mask */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Shadow Feature Masking</label>
            <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={options.use_shadow_mask}
                onChange={(e) => setOptions({ use_shadow_mask: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <span className="text-slate-300">Mask Low-Signal Cast Shadows</span>
            </div>
          </div>

          {/* Scale Pyramid */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Multi-Scale Pyramid</label>
            <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={options.use_scale_pyramid}
                onChange={(e) => setOptions({ use_scale_pyramid: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <span className="text-slate-300">Pyramid Rescaling (18x-300x Gap)</span>
            </div>
          </div>
        </div>

        {/* Error / Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={runMatch}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-xl shadow-sky-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isLoading ? progressStage : 'Run Correspondence Engine'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
