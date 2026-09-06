/**
 * SelectedRegion
 * Displays the currently selected common point's backend-provided metadata.
 * Never hardcodes coordinates, IDs, or sensor specs.
 */
export default function SelectedRegion({ point, onClear }) {
  if (!point) return null

  // Convert lon_360 to ±180 for display
  const displayLon = point.longitude_360 > 180
    ? (point.longitude_360 - 360).toFixed(6)
    : Number(point.longitude_360).toFixed(6)

  return (
    <div className="border border-lunar-border bg-lunar-card fade-in-up">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-lunar-border bg-lunar-surface/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Selected Region</span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-[10px] font-mono text-slate-600 hover:text-slate-300 transition-colors px-2 py-0.5 border border-transparent hover:border-lunar-border"
          >
            CLEAR ✕
          </button>
        )}
      </div>

      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="tele-label mb-1">Point ID</div>
          <div className="tele-value font-semibold">{point.id}</div>
        </div>
        <div>
          <div className="tele-label mb-1">Latitude</div>
          <div className="tele-value">{Number(point.latitude).toFixed(6)}°</div>
        </div>
        <div>
          <div className="tele-label mb-1">Longitude</div>
          <div className="tele-value">{displayLon}°</div>
        </div>
        <div>
          <div className="tele-label mb-1">Sensor Status</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {[
              { key: 'ohrc_available', label: 'OHRC',  c: 'text-sensor-ohrc border-sensor-ohrc/40' },
              { key: 'tmc2_available', label: 'TMC-2', c: 'text-sensor-tmc2 border-sensor-tmc2/40' },
              { key: 'iirs_available', label: 'IIRS',  c: 'text-sensor-iirs border-sensor-iirs/40' },
            ].map(({ key, label, c }) => (
              point[key] !== false && (
                <span key={key} className={`text-[9px] font-mono border px-1.5 py-0.5 ${c}`}>{label}</span>
              )
            ))}
          </div>
        </div>
      </div>

      {point.consistency_score != null && (
        <div className="px-4 pb-2.5 flex items-center gap-3">
          <div className="tele-label">Consistency Score</div>
          <div className="flex-1 h-1 bg-lunar-dim rounded-full overflow-hidden">
            <div
              className="h-full bg-lunar-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, point.consistency_score * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="tele-value text-lunar-accent2">{point.consistency_score.toFixed(4)}</span>
          <span className="tele-label">SPATIALLY PAIRED</span>
        </div>
      )}
    </div>
  )
}
