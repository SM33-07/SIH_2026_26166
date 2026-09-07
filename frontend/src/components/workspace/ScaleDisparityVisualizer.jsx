import React from 'react'

export default function ScaleDisparityVisualizer({ scale = {} }) {
  const { ohrcGsd, tmc2Gsd, iirsGsd, ratios } = scale

  // Visual proportions normalized to IIRS max width (100%)
  const iirsPct = 100
  const tmc2Pct = iirsGsd && tmc2Gsd ? Math.max(3, (tmc2Gsd / iirsGsd) * 100) : 6
  const ohrcPct = iirsGsd && ohrcGsd ? Math.max(1, (ohrcGsd / iirsGsd) * 100) : 1

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Scale Disparity Visualizer
          </h4>
        </div>
        <span className="text-[10px] text-neutral-500">
          PROPORTIONAL GROUND SAMPLE DISTANCE (GSD)
        </span>
      </div>

      <div className="space-y-3.5 my-2">
        {/* IIRS */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-400 font-semibold">IIRS (Hyperspectral)</span>
            <span className="text-red-400 font-semibold">{iirsGsd != null ? `${iirsGsd} m/px` : '86.5 m/px'}</span>
          </div>
          <div className="w-full h-4 bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
            <div
              className="h-full bg-red-500/80 rounded transition-all duration-500"
              style={{ width: `${iirsPct}%` }}
            />
          </div>
        </div>

        {/* TMC-2 */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-400 font-semibold">TMC-2 (Stereo Panchromatic)</span>
            <span className="text-amber-400 font-semibold">{tmc2Gsd != null ? `${tmc2Gsd} m/px` : '5.0 m/px'}</span>
          </div>
          <div className="w-full h-4 bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
            <div
              className="h-full bg-amber-500/80 rounded transition-all duration-500"
              style={{ width: `${tmc2Pct}%` }}
            />
          </div>
        </div>

        {/* OHRC */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-400 font-semibold">OHRC (High Resolution Hazard)</span>
            <span className="text-cyan-400 font-semibold">{ohrcGsd != null ? `${ohrcGsd} m/px` : '0.28 m/px'}</span>
          </div>
          <div className="w-full h-4 bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded transition-all duration-500"
              style={{ width: `${ohrcPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cross-scale Ratios Callout */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="bg-neutral-950/70 p-1.5 rounded border border-neutral-800">
          <span className="text-neutral-500 block">TMC-2 / OHRC</span>
          <span className="text-amber-400 font-semibold">{ratios?.tmc2_to_ohrc || '17.9×'}</span>
        </div>
        <div className="bg-neutral-950/70 p-1.5 rounded border border-neutral-800">
          <span className="text-neutral-500 block">IIRS / TMC-2</span>
          <span className="text-amber-400 font-semibold">{ratios?.iirs_to_tmc2 || '17.3×'}</span>
        </div>
        <div className="bg-neutral-950/70 p-1.5 rounded border border-neutral-800">
          <span className="text-neutral-500 block">IIRS / OHRC</span>
          <span className="text-red-400 font-semibold">{ratios?.iirs_to_ohrc || '308.9×'}</span>
        </div>
      </div>
      <p className="text-[10px] text-neutral-500 mt-2 italic leading-relaxed">
        Direct matching across 300× scale disparity is mathematically ill-posed; TMC-2 serves as the vital intermediate resolution bridge.
      </p>
    </div>
  )
}
