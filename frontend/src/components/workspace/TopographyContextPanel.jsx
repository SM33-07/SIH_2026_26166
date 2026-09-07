import React from 'react'
import DataState from '../common/DataState'

export default function TopographyContextPanel({ topography = null }) {
  const isAvailable = Boolean(topography?.available && topography?.dem)

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Topographic Elevation & DEM Context
          </h4>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase">
          TMC-2 STEREO DERIVED ELEVATION
        </span>
      </div>

      {isAvailable ? (
        <div className="p-4 bg-neutral-950 rounded border border-neutral-800 text-center">
          <p className="text-neutral-300 mb-2">Digital Elevation Model (DEM) Available</p>
          <img
            src={topography.dem}
            alt="DEM Elevation Map"
            className="w-full max-h-64 object-contain mx-auto rounded"
          />
        </div>
      ) : (
        <DataState
          status="unavailable"
          title="TOPOGRAPHIC CONTEXT"
          message={topography?.message || 'No elevation / DEM representation was returned for this analysis. Synthetic decorative terrain is strictly suppressed.'}
        />
      )}
    </div>
  )
}
