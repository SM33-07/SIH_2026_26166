import React from 'react'

/**
 * AnalysisEntry: Mode switcher between Preset SIH/Catalog Exploration and Manual Three-Sensor Upload
 */
export default function AnalysisEntry({
  mode = 'preset', // 'preset' | 'upload'
  onModeChange,
  selectedPreset = null,
  activeResult = null,
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-[#0a0c10] border border-neutral-800/90 rounded-lg text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-neutral-500 uppercase tracking-wider text-[11px]">ANALYSIS SOURCE:</span>
        <div className="inline-flex rounded-md p-0.5 bg-neutral-950 border border-neutral-800">
          <button
            type="button"
            onClick={() => onModeChange?.('preset')}
            className={`px-3 py-1 rounded text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'preset'
                ? 'bg-neutral-800 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>🛰️</span>
            <span>PRESET DEMO REGION</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('upload')}
            className={`px-3 py-1 rounded text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'upload'
                ? 'bg-neutral-800 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>📤</span>
            <span>UPLOAD THREE IMAGES</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-neutral-400">
        {mode === 'preset' ? (
          <span>
            TARGET:{' '}
            <strong className="text-amber-400 font-semibold">
              {selectedPreset ? `${selectedPreset.name || selectedPreset.id}` : 'Select beacon on 3D Moon above'}
            </strong>
          </span>
        ) : (
          <span className="text-cyan-400 font-semibold">
            CUSTOM USER EXPERIMENT (IIRS + TMC-2 + OHRC)
          </span>
        )}
      </div>
    </div>
  )
}
