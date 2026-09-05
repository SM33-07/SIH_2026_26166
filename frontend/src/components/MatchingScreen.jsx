import React, { useEffect } from 'react'
import { Play, Settings2, Sliders, Info, Sparkles, AlertCircle } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function MatchingScreen() {
  const {
    demoPairs,
    selectedPairId,
    selectDemoPair,
    setDemoPairs,
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
    error
  } = useMatchStore()

  useEffect(() => {
    fetch('/api/demo/pairs')
      .then((res) => res.json())
      .then((data) => {
        if (data.pairs) {
          setDemoPairs(data.pairs)
        }
      })
      .catch((err) => console.error('Failed to load demo pairs', err))
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      {/* Demo Preset Selector */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">CHANDRAYAAN-2 DEMO DATASET PRESETS</h3>
          </div>
          <span className="text-xs text-slate-400">Offline Hackathon Safe</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoPairs.map((pair) => {
            const isSelected = selectedPairId === pair.id
            return (
              <button
                key={pair.id}
                onClick={() => selectDemoPair(pair.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white">{pair.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                    {pair.instrument_a} ↔ {pair.instrument_b}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{pair.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dual Image Selection & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image A */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-sky-400">IMAGE A (REFERENCE)</h4>
            <span className="text-xs font-mono text-slate-400">{modalityA}</span>
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
              <span className="text-slate-400 block text-[10px]">GSD (M/PIXEL)</span>
              <span className="text-white font-mono font-semibold">{gsdA} m/px</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SUN ELEVATION</span>
              <span className="text-white font-mono font-semibold">{sunElevationA}°</span>
            </div>
          </div>
        </div>

        {/* Image B */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-indigo-400">IMAGE B (TARGET TO WARP)</h4>
            <span className="text-xs font-mono text-slate-400">{modalityB}</span>
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
              <span className="text-slate-400 block text-[10px]">GSD (M/PIXEL)</span>
              <span className="text-white font-mono font-semibold">{gsdB} m/px</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SUN ELEVATION</span>
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
          {/* Pipeline Type */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Matcher Engine</label>
            <select
              value={options.pipeline}
              onChange={(e) => setOptions({ pipeline: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:border-sky-500 focus:outline-none"
            >
              <option value="proposed">Proposed Learned (LoFTR PyTorch)</option>
              <option value="classical">Classical Baseline (SIFT / AKAZE)</option>
            </select>
          </div>

          {/* Classical Algorithm choice */}
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

          {/* Illumination toggle */}
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

          {/* Shadow Mask toggle */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Shadow Feature Masking</label>
            <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={options.use_shadow_mask}
                onChange={(e) => setOptions({ use_shadow_mask: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <span className="text-slate-300">Mask Low-Signal Shadows</span>
            </div>
          </div>

          {/* Scale Pyramid toggle */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Multi-Scale Pyramid</label>
            <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={options.use_scale_pyramid}
                onChange={(e) => setOptions({ use_scale_pyramid: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <span className="text-slate-300">Pyramid Rescaling (20x Gap)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
