import React from 'react'

/**
 * DataAvailabilityBar — PRD v4 Section 41
 * 100% computed checklist of returned vs missing data layers
 */
export default function DataAvailabilityBar({ availability = {} }) {
  const items = [
    { key: 'iirsImage', label: 'IIRS' },
    { key: 'tmc2Image', label: 'TMC-2' },
    { key: 'ohrcImage', label: 'OHRC' },
    { key: 'correspondences', label: 'Correspondences' },
    { key: 'confidenceValues', label: 'Confidence' },
    { key: 'geometricVerification', label: 'Geometric Verification' },
    { key: 'spatialConsistency', label: 'Spatial Consistency' },
    { key: 'benchmark', label: 'Synthetic Benchmark' },
    { key: 'topography', label: 'Topography / DEM' },
    { key: 'warpedAlignedImage', label: 'Warped Image' },
  ]

  return (
    <div className="w-full bg-[#07090c] border border-neutral-800 rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
          AVAILABLE DATA:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        {items.map((item) => {
          const isAvail = Boolean(availability[item.key])
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1 font-mono transition-colors ${
                isAvail ? 'text-emerald-400' : 'text-neutral-600'
              }`}
            >
              <span>{isAvail ? '✓' : '○'}</span>
              <span>{item.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
