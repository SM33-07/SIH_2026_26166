import React from 'react'
import DataState from '../common/DataState'

export default function HomographyPanel({ alignment = {} }) {
  const { homography, rmse, status } = alignment

  const isVerified = status === 'VERIFIED' && homography && homography.length === 3

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Geometric Verification & 3×3 Homography
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded border ${
            isVerified
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-neutral-700 bg-neutral-900 text-neutral-400'
          }`}
        >
          {status || 'UNAVAILABLE'}
        </span>
      </div>

      {isVerified ? (
        <div>
          <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-2">
            <span>PROJECTIVE HOMOGRAPHY MATRIX H (3×3):</span>
            <span className="text-amber-400">
              REPROJECTION RMSE: {rmse != null ? `${rmse.toFixed(3)} px` : 'Sub-pixel'}
            </span>
          </div>

          {/* 3x3 Matrix Grid */}
          <div className="bg-neutral-950 p-3 rounded border border-neutral-800 font-mono text-[11px] text-neutral-300 grid grid-rows-3 gap-1.5 shadow-inner">
            {homography.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-3 gap-2 text-center">
                {row.map((val, cIdx) => (
                  <span
                    key={cIdx}
                    className={`px-2 py-1 rounded bg-black/40 border border-neutral-800/80 ${
                      rIdx === cIdx ? 'text-amber-400' : 'text-neutral-300'
                    }`}
                  >
                    {typeof val === 'number' ? (Math.abs(val) < 0.0001 ? val.toExponential(3) : val.toFixed(4)) : val}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 text-[10px] text-neutral-500 flex justify-between">
            <span>SOLVER: Normalized DLT + RANSAC</span>
            <span>INLIER CRITERIA: Symmetric Transfer Error</span>
          </div>
        </div>
      ) : (
        <DataState
          status="unavailable"
          title="GEOMETRIC HOMOGRAPHY"
          message="Fewer than 4 valid correspondence inliers were returned; a mathematically non-degenerate 3x3 homography matrix could not be computed."
        />
      )}
    </div>
  )
}
