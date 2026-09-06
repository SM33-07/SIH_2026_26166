/**
 * GeoMap
 * 2D SVG geographic evidence visualization.
 * All coordinate values come from backend response props.
 * No hardcoded geographic constants except the lunar degree-to-meters conversion,
 * which is a well-known physical constant (not a dataset value).
 */

// Physical constant: 1 degree on the Moon ≈ 30,324 m (based on lunar mean radius 1737.4 km)
const LUNAR_DEG_TO_METERS = 30324

function fmtDist(deg) {
  if (deg == null || isNaN(deg)) return '—'
  const m = deg * LUNAR_DEG_TO_METERS
  return m < 1000 ? `${m.toFixed(1)} m` : `${(m / 1000).toFixed(2)} km`
}

export default function GeoMap({ lat, lon, ohrcLat, ohrcLon, iirsLat, iirsLon, sameZoneThresholdDeg }) {
  const cx = 200, cy = 150
  const radiusPx = 100

  const centerLat = lat ?? 0
  const centerLon = lon ?? 0

  const oLat = ohrcLat ?? centerLat
  const oLon = ohrcLon ?? centerLon
  const iLat = iirsLat ?? centerLat
  const iLon = iirsLon ?? centerLon
  const tLat = centerLat
  const tLon = centerLon

  const dOhrcX = oLon - centerLon
  const dOhrcY = -(oLat - centerLat)
  const dIirsX = iLon - centerLon
  const dIirsY = -(iLat - centerLat)
  const dTmc2X = tLon - centerLon
  const dTmc2Y = -(tLat - centerLat)

  const maxDelta = Math.max(
    Math.hypot(dOhrcX, dOhrcY),
    Math.hypot(dIirsX, dIirsY),
    0.001,
  )
  const scale = radiusPx / Math.max(maxDelta * 1.5, 0.001)

  const pOhrc = { x: cx + dOhrcX * scale, y: cy + dOhrcY * scale }
  const pIirs = { x: cx + dIirsX * scale, y: cy + dIirsY * scale }
  const pTmc2 = { x: cx + dTmc2X * scale, y: cy + dTmc2Y * scale }

  const d_OT = Math.hypot(oLat - tLat, oLon - tLon)
  const d_OI = Math.hypot(oLat - iLat, oLon - iLon)
  const d_TI = Math.hypot(tLat - iLat, tLon - iLon)
  const maxSep = Math.max(d_OT, d_OI, d_TI)

  // Threshold from backend (GET /health → same_zone_threshold_deg, or from /cases response)
  const threshold = sameZoneThresholdDeg ?? null

  return (
    <div className="border border-lunar-border bg-lunar-card p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-lunar-border pb-3">
        <div>
          <div className="tele-label">Sensor Boresight Topology</div>
          <div className="text-[9px] font-mono text-slate-600">Relative surface alignment of three-sensor observation</div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          {[
            { label: 'OHRC', color: 'bg-sensor-ohrc text-sensor-ohrc' },
            { label: 'TMC-2', color: 'bg-sensor-tmc2 text-sensor-tmc2' },
            { label: 'IIRS', color: 'bg-sensor-iirs text-sensor-iirs' },
          ].map(({ label, color }) => (
            <span key={label} className={`flex items-center gap-1.5 ${color.split(' ')[1]}`}>
              <span className={`w-2 h-2 rounded-full inline-block ${color.split(' ')[0]}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* SVG radar */}
        <div className="md:col-span-2 bg-lunar-bg border border-lunar-border/40 relative flex items-center justify-center p-2">
          <svg viewBox="0 0 400 300" className="w-full h-64 select-none">
            {[40, 80, 120].map((r) => (
              <circle key={r} cx="200" cy="150" r={r} fill="none" stroke="#1a2540" strokeWidth="1" strokeDasharray="3 3" />
            ))}
            <line x1="200" y1="20" x2="200" y2="280" stroke="#1a2540" strokeWidth="1" />
            <line x1="40" y1="150" x2="360" y2="150" stroke="#1a2540" strokeWidth="1" />

            <polygon
              points={`${pOhrc.x},${pOhrc.y} ${pTmc2.x},${pTmc2.y} ${pIirs.x},${pIirs.y}`}
              fill="rgba(99,102,241,0.06)"
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {[
              [pOhrc, pTmc2, d_OT],
              [pOhrc, pIirs, d_OI],
              [pTmc2, pIirs, d_TI],
            ].map(([a, b, d], i) => (
              <text
                key={i}
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 6}
                fill="#64748b"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {fmtDist(d)}
              </text>
            ))}

            {[
              { p: pOhrc, label: 'OHRC', color: '#f97316' },
              { p: pTmc2, label: 'TMC-2', color: '#818cf8' },
              { p: pIirs, label: 'IIRS', color: '#ef4444' },
            ].map(({ p, label, color }) => (
              <g key={label}>
                <circle cx={p.x} cy={p.y} r="6" fill={color} stroke="#fff" strokeWidth="1.5" />
                <text x={p.x} y={p.y - 10} fill={color} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {label}
                </text>
              </g>
            ))}

            <circle cx="200" cy="150" r="2.5" fill="#fff" opacity="0.6" />
          </svg>
          <span className="absolute bottom-2 right-2 text-[8px] text-slate-600 font-mono bg-lunar-card/80 px-1.5 py-0.5 border border-lunar-border">
            1° ≈ {(LUNAR_DEG_TO_METERS / 1000).toFixed(2)} km (lunar)
          </span>
        </div>

        {/* Distance breakdown */}
        <div className="space-y-2 font-mono text-xs">
          <div className="tele-label border-b border-lunar-border pb-1">Surface Separation</div>
          {[
            { label: 'OHRC ↔ TMC-2', d: d_OT },
            { label: 'OHRC ↔ IIRS',  d: d_OI },
            { label: 'TMC-2 ↔ IIRS', d: d_TI },
          ].map(({ label, d }) => (
            <div key={label} className="flex justify-between items-center py-1 border-b border-lunar-border/40">
              <span className="text-slate-400">{label}</span>
              <div className="text-right">
                <span className="text-slate-100 font-bold">{fmtDist(d)}</span>
                <span className="text-[9px] text-slate-600 block">{d.toFixed(6)}°</span>
              </div>
            </div>
          ))}

          {threshold != null && (
            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                <span>Same-Zone Threshold</span>
                <span className="text-green-400">{threshold}°</span>
              </div>
              <div className="w-full bg-lunar-dim h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${maxSep < threshold ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, (maxSep / threshold) * 100).toFixed(1)}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-1 text-right">
                Max sep: {fmtDist(maxSep)}
              </div>
            </div>
          )}

          {iirsLat != null && (
            <p className="text-[9px] text-slate-600 italic pt-2 border-t border-lunar-border/40">
              IIRS boresight position is approximate (product-level geometry).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
