import React from 'react'

export default function CorrespondenceToolbar({
  viewMode = 'sideBySide',
  onViewModeChange,
  showMatches = true,
  onToggleMatches,
  showInliers = true,
  onToggleInliers,
  showOutliers = false,
  onToggleOutliers,
  showGrid = false,
  onToggleGrid,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  differenceSupported = false,
}) {
  const modes = [
    { id: 'sideBySide', label: 'SIDE BY SIDE', disabled: false },
    { id: 'overlay', label: 'OVERLAY', disabled: false },
    { id: 'split', label: 'SPLIT CURTAIN', disabled: false },
    { id: 'difference', label: 'DIFFERENCE', disabled: !differenceSupported, note: !differenceSupported ? 'Requires aligned representation' : null },
  ]

  return (
    <div className="w-full bg-[#0d1017] border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Primary View Modes */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={m.disabled}
            onClick={() => onViewModeChange?.(m.id)}
            title={m.note || m.label}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase transition-all ${
              viewMode === m.id
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : m.disabled
                ? 'text-neutral-600 cursor-not-allowed'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Feature Visibility Toggles */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMatches}
          className={`px-2 py-1 rounded text-[10px] uppercase font-mono tracking-wider border transition-colors ${
            showMatches
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
              : 'border-neutral-800 bg-neutral-950 text-neutral-500'
          }`}
        >
          {showMatches ? '✓ MATCH LINES' : '○ MATCH LINES'}
        </button>

        <button
          type="button"
          onClick={onToggleInliers}
          className={`px-2 py-1 rounded text-[10px] uppercase font-mono tracking-wider border transition-colors ${
            showInliers
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-neutral-800 bg-neutral-950 text-neutral-500'
          }`}
        >
          {showInliers ? '✓ INLIERS' : '○ INLIERS'}
        </button>

        <button
          type="button"
          onClick={onToggleOutliers}
          className={`px-2 py-1 rounded text-[10px] uppercase font-mono tracking-wider border transition-colors ${
            showOutliers
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-neutral-800 bg-neutral-950 text-neutral-500'
          }`}
        >
          {showOutliers ? '✓ OUTLIERS' : '○ OUTLIERS'}
        </button>

        <button
          type="button"
          onClick={onToggleGrid}
          className={`px-2 py-1 rounded text-[10px] uppercase font-mono tracking-wider border transition-colors ${
            showGrid
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              : 'border-neutral-800 bg-neutral-950 text-neutral-500'
          }`}
        >
          {showGrid ? '✓ GRID' : '○ GRID'}
        </button>
      </div>

      {/* Zoom / Navigation */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800 text-[11px]">
        <button
          type="button"
          onClick={onZoomOut}
          className="w-6 h-6 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
          title="Zoom Out"
        >
          −
        </button>
        <button
          type="button"
          onClick={onZoomReset}
          className="px-1.5 h-6 flex items-center justify-center rounded text-neutral-300 hover:text-amber-400 font-mono text-[10px]"
          title="Reset 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className="w-6 h-6 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={onZoomFit}
          className="px-2 h-6 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-100 text-[10px] border-l border-neutral-800 ml-1"
          title="Fit to Window"
        >
          FIT
        </button>
      </div>
    </div>
  )
}
