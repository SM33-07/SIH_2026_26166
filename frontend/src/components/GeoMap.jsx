import React, { useState } from 'react'
import useMatchStore from '../store/matchStore'

/**
 * Three-Sensor Geographic Mapping (Primary Spatial Evidence Panel)
 * - Explicit local lunar coordinate frame with latitude and longitude axes/grid.
 * - Auto-zoomed bounding box centered on the three sensor observation positions.
 * - Real backend coordinates for OHRC, TMC-2, and IIRS.
 * - Interactivity: Hover sensor node for telemetry tooltip; Click sensor to highlight card in workspace.
 * - Numerical Geographic Consistency evidence table with pairwise distances and PASS/FAIL badges.
 * - Collapsible "Sensor Boresight Topology" technical section underneath.
 */

// Physical constant: 1 degree on lunar surface ≈ 30,323.35 m (lunar radius 1737.4 km)
const LUNAR_DEG_TO_METERS = 30323.35

function fmtDist(deg, distM) {
  if (distM != null && !isNaN(distM)) {
    return distM < 1000 ? `${Number(distM).toFixed(1)} m` : `${(distM / 1000).toFixed(2)} km`
  }
  if (deg == null || isNaN(deg)) return '—'
  const m = deg * LUNAR_DEG_TO_METERS
  return m < 1000 ? `${m.toFixed(1)} m` : `${(m / 1000).toFixed(2)} km`
}

export default function GeoMap({
  lat,
  lon,
  ohrcLat,
  ohrcLon,
  iirsLat,
  iirsLon,
  sameZoneThresholdDeg,
  activeResult,
  sensorSpecs,
  onSelectSensor,
}) {
  const { highlightedSensor, setHighlightedSensor } = useMatchStore()
  const [hoveredSensor, setHoveredSensor] = useState(null)
  const [showTopology, setShowTopology] = useState(false)

  // Extract coordinates from activeResult or direct props
  const matched = activeResult?.matched_location || {}
  const query = activeResult?.query || {}
  const sensors = activeResult?.sensors || {}
  const pairwise = activeResult?.pairwise || {}
  const specs = sensorSpecs?.sensors || {}

  const centerLat = lat ?? matched.latitude ?? matched.lat ?? query.latitude ?? query.lat ?? sensors.tmc2?.lat ?? null
  const centerLon = lon ?? matched.longitude ?? matched.lon ?? query.longitude ?? query.lon ?? sensors.tmc2?.lon ?? null

  if (centerLat == null || centerLon == null) {
    return null
  }

  // Real sensor observation coordinates
  const oLat = ohrcLat ?? sensors.ohrc?.lat ?? centerLat
  const oLon = ohrcLon ?? sensors.ohrc?.lon ?? centerLon
  const tLat = sensors.tmc2?.lat ?? centerLat
  const tLon = sensors.tmc2?.lon ?? centerLon
  const iLat = iirsLat ?? sensors.iirs?.lat ?? centerLat
  const iLon = iirsLon ?? sensors.iirs?.lon ?? centerLon

  // Real pairwise distances (prefer backend-calculated if available)
  const d_OT = pairwise.ohrc_tmc2?.distance_deg ?? Math.hypot(oLat - tLat, oLon - tLon)
  const d_OI = pairwise.ohrc_iirs?.distance_deg ?? Math.hypot(oLat - iLat, oLon - iLon)
  const d_TI = pairwise.tmc2_iirs?.distance_deg ?? Math.hypot(tLat - iLat, tLon - iLon)

  const m_OT = pairwise.ohrc_tmc2?.distance_m
  const m_OI = pairwise.ohrc_iirs?.distance_m
  const m_TI = pairwise.tmc2_iirs?.distance_m

  const maxSep = Math.max(d_OT, d_OI, d_TI)
  const threshold = sameZoneThresholdDeg ?? activeResult?.same_zone_threshold_deg ?? sensorSpecs?.same_zone_threshold_deg ?? 0.02

  // ── Auto-zoomed local coordinate frame calculations ─────────────────────────
  const lats = [oLat, tLat, iLat]
  const lons = [oLon, tLon, iLon]

  const rawMinLat = Math.min(...lats)
  const rawMaxLat = Math.max(...lats)
  const rawMinLon = Math.min(...lons)
  const rawMaxLon = Math.max(...lons)

  const latSpan = Math.max(rawMaxLat - rawMinLat, 0.0012)
  const lonSpan = Math.max(rawMaxLon - rawMinLon, 0.0012)

  // Add 35% margin for comfortable visualization with axis ticks
  const padLat = Math.max(latSpan * 0.45, 0.0006)
  const padLon = Math.max(lonSpan * 0.45, 0.0006)

  const minLat = rawMinLat - padLat
  const maxLat = rawMaxLat + padLat
  const minLon = rawMinLon - padLon
  const maxLon = rawMaxLon + padLon

  // SVG dimensions & margins
  const svgW = 560
  const svgH = 340
  const mLeft = 70
  const mRight = 35
  const mTop = 35
  const mBottom = 45
  const plotW = svgW - mLeft - mRight
  const plotH = svgH - mTop - mBottom

  // Projection helper: maps (lat, lon) to SVG (x, y)
  const toX = (lng) => mLeft + ((lng - minLon) / (maxLon - minLon)) * plotW
  const toY = (lt) => mTop + plotH - ((lt - minLat) / (maxLat - minLat)) * plotH

  const pOhrc = { x: toX(oLon), y: toY(oLat) }
  const pTmc2 = { x: toX(tLon), y: toY(tLat) }
  const pIirs = { x: toX(iLon), y: toY(iLat) }

  // 4 Grid lines along Lat and Lon
  const latTicks = [
    minLat + (maxLat - minLat) * 0.15,
    minLat + (maxLat - minLat) * 0.5,
    minLat + (maxLat - minLat) * 0.85,
  ]
  const lonTicks = [
    minLon + (maxLon - minLon) * 0.2,
    minLon + (maxLon - minLon) * 0.5,
    minLon + (maxLon - minLon) * 0.8,
  ]

  // Sensor definitions
  const sensorNodes = [
    {
      key: 'ohrc',
      label: 'OHRC',
      sub: 'Sub-meter Target',
      gsd: specs.ohrc?.gsd_m_per_px != null ? `${specs.ohrc.gsd_m_per_px} m/px` : '0.28 m/px',
      lat: oLat,
      lon: oLon,
      pt: pOhrc,
      color: '#38bdf8', // bright cyan
      glowColor: 'rgba(56, 189, 248, 0.35)',
      ringColor: 'rgba(56, 189, 248, 0.9)',
    },
    {
      key: 'tmc2',
      label: 'TMC-2',
      sub: 'Stereo Bridge',
      gsd: specs.tmc2?.gsd_m_per_px != null ? `${specs.tmc2.gsd_m_per_px} m/px` : '5.0 m/px',
      lat: tLat,
      lon: tLon,
      pt: pTmc2,
      color: '#f59e0b', // amber
      glowColor: 'rgba(245, 158, 11, 0.35)',
      ringColor: 'rgba(245, 158, 11, 0.9)',
    },
    {
      key: 'iirs',
      label: 'IIRS',
      sub: 'Hyperspectral Context',
      gsd: specs.iirs?.gsd_m_per_px != null ? `${specs.iirs.gsd_m_per_px} m/px` : '86.5 m/px',
      lat: iLat,
      lon: iLon,
      pt: pIirs,
      color: '#ef4444', // red
      glowColor: 'rgba(239, 68, 68, 0.35)',
      ringColor: 'rgba(239, 68, 68, 0.9)',
    },
  ]

  const handleNodeClick = (sensorKey) => {
    setHighlightedSensor(sensorKey)
    onSelectSensor?.(sensorKey)
  }

  return (
    <section id="geographic-mapping-panel" className="tech-card p-6 space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-amber-400 rounded-none transform rotate-45 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-widest text-white">
              THREE-SENSOR GEOGRAPHIC MAPPING
            </h2>
            <span className="text-[9px] font-mono border border-amber-500/40 text-amber-300 bg-amber-500/10 px-2 py-0.5 uppercase tracking-wider font-semibold">
              LOCAL SENSOR GEOMETRY
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-400 mt-1">
            Selected observation • local lunar coordinate frame with explicit latitude/longitude positioning
          </p>
        </div>

        {/* Local Coordinate Extent Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono bg-[#030405] border border-white/[0.08] px-3.5 py-2 flex-wrap">
          <div>
            <span className="text-[9px] text-neutral-500 block">LAT EXTENT</span>
            <span className="text-neutral-200 font-bold">
              {rawMinLat.toFixed(5)}° — {rawMaxLat.toFixed(5)}° N
            </span>
          </div>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <div>
            <span className="text-[9px] text-neutral-500 block">LON EXTENT</span>
            <span className="text-neutral-200 font-bold">
              {rawMinLon.toFixed(5)}° — {rawMaxLon.toFixed(5)}° E
            </span>
          </div>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <div className="text-[9px] text-amber-400/90 italic">
            1° ≈ 30.32 km (lunar surface)
          </div>
        </div>
      </div>

      {/* Main Composition: Interactive Zoomed Geographic Map (Left) + Evidence Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Local Coordinate Map (7 cols) */}
        <div className="lg:col-span-7 bg-[#020305] border border-white/[0.08] relative p-2 select-none">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-[9px] font-mono text-neutral-400 bg-black/80 px-2.5 py-1 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>AUTO-ZOOMED LOCAL OBSERVATION FRAME</span>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
            <defs>
              {/* Radial gradient glow for nodes */}
              <radialGradient id="glow-ohrc" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.6)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
              </radialGradient>
              <radialGradient id="glow-tmc2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
              </radialGradient>
              <radialGradient id="glow-iirs" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
              </radialGradient>
            </defs>

            {/* Plot boundary rectangle */}
            <rect
              x={mLeft}
              y={mTop}
              width={plotW}
              height={plotH}
              fill="#030406"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />

            {/* Horizontal Grid lines & Latitude Ticks (Y-Axis) */}
            {latTicks.map((lt, idx) => {
              const y = toY(lt)
              return (
                <g key={`lat-${idx}`}>
                  <line
                    x1={mLeft}
                    y1={y}
                    x2={mLeft + plotW}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={mLeft - 5}
                    y1={y}
                    x2={mLeft}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />
                  <text
                    x={mLeft - 8}
                    y={y + 3}
                    fill="#a3a3a3"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="end"
                  >
                    {lt.toFixed(5)}°
                  </text>
                </g>
              )
            })}

            {/* Vertical Grid lines & Longitude Ticks (X-Axis) */}
            {lonTicks.map((lng, idx) => {
              const x = toX(lng)
              return (
                <g key={`lon-${idx}`}>
                  <line
                    x1={x}
                    y1={mTop}
                    x2={x}
                    y2={mTop + plotH}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={x}
                    y1={mTop + plotH}
                    x2={x}
                    y2={mTop + plotH + 5}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={mTop + plotH + 18}
                    fill="#a3a3a3"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {lng.toFixed(5)}°
                  </text>
                </g>
              )
            })}

            {/* Axis Titles */}
            <text
              x={mLeft + plotW / 2}
              y={svgH - 8}
              fill="#d4d4d4"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
              letterSpacing="0.1em"
              textAnchor="middle"
            >
              LONGITUDE (° EAST)
            </text>
            <text
              x={14}
              y={mTop + plotH / 2}
              fill="#d4d4d4"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
              letterSpacing="0.1em"
              textAnchor="middle"
              transform={`rotate(-90 14 ${mTop + plotH / 2})`}
            >
              LATITUDE (° NORTH)
            </text>

            {/* Enclosing Polygon (Observation Coverage Area) */}
            <polygon
              points={`${pOhrc.x},${pOhrc.y} ${pTmc2.x},${pTmc2.y} ${pIirs.x},${pIirs.y}`}
              fill="rgba(245, 158, 11, 0.04)"
              stroke="rgba(245, 158, 11, 0.2)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Connecting Lines: Sensor Geographic Association */}
            {/* IIRS ── TMC-2 */}
            <line
              x1={pIirs.x}
              y1={pIirs.y}
              x2={pTmc2.x}
              y2={pTmc2.y}
              stroke="rgba(245, 158, 11, 0.7)"
              strokeWidth="2"
            />
            {/* TMC-2 ── OHRC */}
            <line
              x1={pTmc2.x}
              y1={pTmc2.y}
              x2={pOhrc.x}
              y2={pOhrc.y}
              stroke="rgba(56, 189, 248, 0.7)"
              strokeWidth="2"
            />
            {/* OHRC ── IIRS baseline */}
            <line
              x1={pOhrc.x}
              y1={pOhrc.y}
              x2={pIirs.x}
              y2={pIirs.y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {/* Distance Badges along lines */}
            {/* TMC-2 ↔ IIRS distance */}
            <g transform={`translate(${(pTmc2.x + pIirs.x) / 2}, ${(pTmc2.y + pIirs.y) / 2 - 8})`}>
              <rect x="-24" y="-8" width="48" height="15" fill="#020305" rx="2" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="0.8" />
              <text x="0" y="2" fill="#f59e0b" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="bold" textAnchor="middle">
                {fmtDist(d_TI, m_TI)}
              </text>
            </g>

            {/* OHRC ↔ TMC-2 distance */}
            <g transform={`translate(${(pOhrc.x + pTmc2.x) / 2}, ${(pOhrc.y + pTmc2.y) / 2 - 8})`}>
              <rect x="-24" y="-8" width="48" height="15" fill="#020305" rx="2" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.8" />
              <text x="0" y="2" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="bold" textAnchor="middle">
                {fmtDist(d_OT, m_OT)}
              </text>
            </g>

            {/* Interactive Sensor Nodes */}
            {sensorNodes.map((sensor) => {
              const isHighlighted = highlightedSensor === sensor.key
              const isHovered = hoveredSensor === sensor.key

              return (
                <g
                  key={sensor.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${sensor.label} sensor footprint: latitude ${sensor.lat.toFixed(5)} degrees North, longitude ${sensor.lon.toFixed(5)} degrees East, GSD ${sensor.gsd}`}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => handleNodeClick(sensor.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNodeClick(sensor.key)
                    }
                  }}
                  onMouseEnter={() => setHoveredSensor(sensor.key)}
                  onMouseLeave={() => setHoveredSensor(null)}
                >
                  {/* Outer Glow Halo */}
                  <circle
                    cx={sensor.pt.x}
                    cy={sensor.pt.y}
                    r={isHighlighted ? 22 : isHovered ? 18 : 14}
                    fill={sensor.key === 'ohrc' ? 'url(#glow-ohrc)' : sensor.key === 'tmc2' ? 'url(#glow-tmc2)' : 'url(#glow-iirs)'}
                    className="transition-all duration-300"
                  />

                  {/* Pulsing selection ring */}
                  {isHighlighted && (
                    <circle
                      cx={sensor.pt.x}
                      cy={sensor.pt.y}
                      r={15}
                      fill="none"
                      stroke={sensor.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="animate-spin origin-center"
                    />
                  )}

                  {/* Target Node Point */}
                  <circle
                    cx={sensor.pt.x}
                    cy={sensor.pt.y}
                    r={isHighlighted || isHovered ? 6.5 : 5}
                    fill={sensor.color}
                    stroke="#ffffff"
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    className="transition-all duration-150 shadow-lg"
                  />

                  {/* Sensor Label Tag */}
                  <g transform={`translate(${sensor.pt.x}, ${sensor.pt.y - 12})`}>
                    <rect
                      x="-28"
                      y="-12"
                      width="56"
                      height="14"
                      fill="#000000"
                      rx="1"
                      stroke={isHighlighted ? sensor.color : 'rgba(255, 255, 255, 0.2)'}
                      strokeWidth={isHighlighted ? 1.5 : 0.8}
                    />
                    <text
                      x="0"
                      y="-2"
                      fill={isHighlighted ? '#ffffff' : sensor.color}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {sensor.label}
                    </text>
                  </g>
                </g>
              )
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredSensor && (() => {
            const sn = sensorNodes.find((s) => s.key === hoveredSensor)
            if (!sn) return null
            return (
              <div className="absolute bottom-4 left-4 bg-black/90 border border-white/[0.2] p-2.5 font-mono text-[10px] space-y-1 z-20 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 font-bold" style={{ color: sn.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sn.color }} />
                  <span>{sn.label} · {sn.sub}</span>
                </div>
                <div className="text-neutral-300">
                  LAT: <span className="text-white">{sn.lat.toFixed(6)}° N</span>
                </div>
                <div className="text-neutral-300">
                  LON: <span className="text-white">{sn.lon.toFixed(6)}° E</span>
                </div>
                <div className="text-neutral-400">
                  GSD: <span className="text-white font-bold">{sn.gsd}</span>
                </div>
                <div className="text-[9px] text-amber-400/80 pt-0.5 border-t border-white/[0.1]">
                  CLICK NODE TO HIGHLIGHT SENSOR CARD
                </div>
              </div>
            )
          })()}

          {/* Hint overlay */}
          <div className="absolute bottom-2 right-3 text-[8px] font-mono text-neutral-500 uppercase tracking-widest pointer-events-none">
            HOVER FOR TELEMETRY · CLICK NODE TO HIGHLIGHT CARD
          </div>
        </div>

        {/* Evidence & Sensor Telemetry Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          {/* Sensor Positions Table */}
          <div className="border border-white/[0.08] bg-[#030405] p-3.5 space-y-2.5">
            <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest border-b border-white/[0.06] pb-1.5 flex items-center justify-between">
              <span>Sensor Observation Footprints</span>
              <span className="text-[9px] text-neutral-500 font-normal">REAL BORESIGHT POSITIONS</span>
            </div>

            <div className="space-y-2 text-xs">
              {sensorNodes.map((s) => {
                const isHighlighted = highlightedSensor === s.key
                return (
                  <div
                    key={s.key}
                    onClick={() => handleNodeClick(s.key)}
                    className={`p-2 border transition-all cursor-pointer ${
                      isHighlighted
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.15] text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5" style={{ color: s.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold border border-white/[0.1] px-1.5 py-0.2">
                        {s.gsd}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 flex justify-between">
                      <span>{s.lat.toFixed(5)}° N, {s.lon.toFixed(5)}° E</span>
                      <span className="text-[9px] text-neutral-500 uppercase">{s.sub}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Geographic Consistency Table */}
          <div className="border border-white/[0.08] bg-[#030405] p-3.5 space-y-3">
            <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest border-b border-white/[0.06] pb-1.5 flex items-center justify-between">
              <span>Geographic Consistency</span>
              <span className="text-[9px] text-neutral-500 font-normal">PHYSICAL VERIFICATION</span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  label: 'OHRC ↔ TMC-2',
                  role: 'High-Res to Bridge',
                  deg: d_OT,
                  distM: m_OT,
                  status: pairwise.ohrc_tmc2?.status,
                },
                {
                  label: 'TMC-2 ↔ IIRS',
                  role: 'Bridge to Context',
                  deg: d_TI,
                  distM: m_TI,
                  status: pairwise.tmc2_iirs?.status,
                },
                {
                  label: 'OHRC ↔ IIRS',
                  role: 'Direct Baseline',
                  deg: d_OI,
                  distM: m_OI,
                  status: pairwise.ohrc_iirs?.status,
                },
              ].map(({ label, deg, distM, status }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-white/[0.03]">
                  <div>
                    <span className="text-neutral-200 font-semibold">{label}</span>
                    <span className="text-[9px] text-neutral-500 block">{deg != null ? `${deg.toFixed(6)}°` : '—'}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-white font-bold">{fmtDist(deg, distM)}</span>
                    {status ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border font-bold ${
                          status === 'PASS'
                            ? 'border-green-800 text-green-400 bg-green-950/40'
                            : 'border-red-800 text-red-400 bg-red-950/40'
                        }`}
                      >
                        {status}
                      </span>
                    ) : (
                      <span className="text-neutral-600 text-[10px]">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Same-Zone Verification Bar */}
            {threshold != null && (
              <div className="pt-2 border-t border-white/[0.04]">
                <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                  <span>Same-Zone Physical Threshold</span>
                  <span className="text-amber-400 font-bold">{threshold}° (≈ {Math.round(threshold * LUNAR_DEG_TO_METERS)} m)</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 border border-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full transition-all ${maxSep <= threshold ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (maxSep / threshold) * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-1">
                  <span>Max separation: <strong className="text-white">{fmtDist(maxSep)}</strong></span>
                  <span className={`font-bold ${maxSep <= threshold ? 'text-green-400' : 'text-red-400'}`}>
                    {maxSep <= threshold ? '✓ WITHIN ZONE (PASS)' : '✕ EXCEEDS ZONE (FAIL)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Technical Details: Sensor Boresight Topology */}
      <div className="pt-2 border-t border-white/[0.08]">
        <button
          onClick={() => setShowTopology(!showTopology)}
          className="w-full flex items-center justify-between text-left px-3 py-2 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] text-xs font-mono text-neutral-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-400">{showTopology ? '▾' : '▸'}</span>
            <span className="font-bold uppercase tracking-wider">
              ADVANCED GEOMETRIC EVIDENCE: SENSOR BORESIGHT TOPOLOGY
            </span>
            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              (Polar Radar Relative Geometry View)
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
            {showTopology ? 'COLLAPSE' : 'EXPAND TO INSPECT'}
          </span>
        </button>

        {showTopology && (
          <div className="mt-3 p-4 border border-white/[0.06] bg-[#020304] space-y-3">
            <div className="text-[10px] font-mono text-neutral-500">
              Polar radar representation of relative optical boresight alignments centered on observation coordinate anchor.
            </div>

            <div className="flex justify-center p-3 bg-black/60 border border-white/[0.04]">
              <svg viewBox="0 0 400 260" className="w-full max-w-lg h-56 select-none">
                {/* Range rings */}
                {[30, 65, 95].map((r) => (
                  <circle
                    key={r}
                    cx="200"
                    cy="130"
                    r={r}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                ))}
                <line x1="200" y1="15" x2="200" y2="245" stroke="#1e293b" strokeWidth="1" />
                <line x1="40" y1="130" x2="360" y2="130" stroke="#1e293b" strokeWidth="1" />

                {/* Relative Radar Sensor Points */}
                {(() => {
                  const dOhrcX = oLon - centerLon
                  const dOhrcY = -(oLat - centerLat)
                  const dIirsX = iLon - centerLon
                  const dIirsY = -(iLat - centerLat)
                  const dTmc2X = tLon - centerLon
                  const dTmc2Y = -(tLat - centerLat)

                  const maxD = Math.max(Math.hypot(dOhrcX, dOhrcY), Math.hypot(dIirsX, dIirsY), Math.hypot(dTmc2X, dTmc2Y), 0.0005)
                  const sc = 90 / Math.max(maxD * 1.5, 0.0008)

                  const rO = { x: 200 + dOhrcX * sc, y: 130 + dOhrcY * sc }
                  const rT = { x: 200 + dTmc2X * sc, y: 130 + dTmc2Y * sc }
                  const rI = { x: 200 + dIirsX * sc, y: 130 + dIirsY * sc }

                  return (
                    <>
                      <polygon
                        points={`${rO.x},${rO.y} ${rT.x},${rT.y} ${rI.x},${rI.y}`}
                        fill="rgba(99, 102, 241, 0.05)"
                        stroke="rgba(99, 102, 241, 0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                      {[
                        { p: rO, label: 'OHRC', color: '#38bdf8' },
                        { p: rT, label: 'TMC-2', color: '#f59e0b' },
                        { p: rI, label: 'IIRS', color: '#ef4444' },
                      ].map(({ p, label, color }) => (
                        <g key={label}>
                          <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="#fff" strokeWidth="1.5" />
                          <text x={p.x} y={p.y - 8} fill={color} fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                            {label}
                          </text>
                        </g>
                      ))}
                      <circle cx="200" cy="130" r="2.5" fill="#f59e0b" />
                    </>
                  )
                })()}
              </svg>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
