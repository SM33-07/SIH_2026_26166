import React, { useState } from 'react'

/**
 * Interactive Registration Workspace
 * - SOURCE (OHRC) / REFERENCE (TMC-2) / REGISTERED (Warped)
 * - Modes: Blend Opacity, Split Wipe, Flicker, Checkerboard, Difference Heatmap
 */
export default function InteractiveRegistrationWorkspace({ activeResult }) {
  const [mode, setMode] = useState('blend')
  const [opacity, setOpacity] = useState(0.5)
  const [splitPos, setSplitPos] = useState(50)

  const images = activeResult?.images || {}
  const hasImages = images.ohrc && images.tmc2

  if (!hasImages) return null

  return (
    <section className="w-full my-8 space-y-4 border border-white/[0.1] bg-[#030406] p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-xs font-mono font-bold tracking-wider text-white uppercase">
            Interactive Co-Registration & Visual Overlay
          </div>
          <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
            Micro-alignment inspection using estimated MAGSAC++ homography matrix.
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 border border-white/[0.1] p-1 bg-[#050608] overflow-x-auto text-[10px] font-mono">
          {[
            { id: 'blend', label: 'OPACITY BLEND' },
            { id: 'split', label: 'SPLIT WIPE' },
            { id: 'flicker', label: 'FLICKER' },
            { id: 'checkerboard', label: 'CHECKERBOARD' },
            { id: 'difference', label: 'DIFFERENCE' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-2.5 py-1 uppercase tracking-wider transition-all whitespace-nowrap ${
                mode === m.id
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative w-full aspect-[16/9] max-h-[440px] bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center select-none">
        {/* Underlay Reference (TMC-2) */}
        <img
          src={`data:image/png;base64,${images.tmc2}`}
          alt="TMC-2 Reference"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlay Source (OHRC) */}
        {mode === 'blend' && (
          <img
            src={`data:image/png;base64,${images.ohrc}`}
            alt="OHRC Source Blend"
            className="absolute inset-0 w-full h-full object-contain transition-opacity duration-75"
            style={{ opacity: opacity, imageRendering: 'pixelated' }}
          />
        )}

        {mode === 'split' && (
          <div
            className="absolute inset-0 overflow-hidden border-r-2 border-amber-400"
            style={{ width: `${splitPos}%` }}
          >
            <img
              src={`data:image/png;base64,${images.ohrc}`}
              alt="OHRC Source Split"
              className="absolute inset-0 w-full h-full object-contain max-w-none"
              style={{ width: '100%', imageRendering: 'pixelated' }}
            />
          </div>
        )}

        {mode === 'flicker' && (
          <img
            src={`data:image/png;base64,${images.ohrc}`}
            alt="OHRC Flicker"
            className="absolute inset-0 w-full h-full object-contain flicker-a"
            style={{ imageRendering: 'pixelated' }}
          />
        )}

        {mode === 'checkerboard' && (
          <div className="absolute inset-0 checkerboard pointer-events-none" />
        )}

        {mode === 'difference' && (
          <img
            src={`data:image/png;base64,${images.ohrc}`}
            alt="OHRC Difference"
            className="absolute inset-0 w-full h-full object-contain mix-blend-difference"
            style={{ filter: 'invert(1)', imageRendering: 'pixelated' }}
          />
        )}

        {/* Overlay Labels */}
        <div className="absolute top-3 left-3 text-[9px] font-mono bg-black/80 px-2 py-1 border border-white/[0.1] text-neutral-400">
          SOURCE: OHRC (0.28m) ↔ REFERENCE: TMC-2 (5.0m)
        </div>
      </div>

      {/* Controller Sliders */}
      {mode === 'blend' && (
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
          <span className="text-[10px] uppercase">Blend Alpha:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="flex-1 accent-amber-400 h-1 bg-neutral-800"
          />
          <span className="text-amber-400 font-bold w-12 text-right">{(opacity * 100).toFixed(0)}%</span>
        </div>
      )}

      {mode === 'split' && (
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
          <span className="text-[10px] uppercase">Wipe Position:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(parseFloat(e.target.value))}
            className="flex-1 accent-amber-400 h-1 bg-neutral-800"
          />
          <span className="text-amber-400 font-bold w-12 text-right">{splitPos.toFixed(0)}%</span>
        </div>
      )}
    </section>
  )
}
