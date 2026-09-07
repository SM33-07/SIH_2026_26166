import React from 'react'

export default function ImageMetadataPanel({
  activePair = 'OHRC_TMC2',
  sensors = {},
  specs = {},
}) {
  const isOhrcTmc2 = activePair === 'OHRC_TMC2'
  const isTmc2Iirs = activePair === 'TMC2_IIRS'

  const sensorAKey = isOhrcTmc2 ? 'ohrc' : isTmc2Iirs ? 'tmc2' : 'ohrc'
  const sensorBKey = isOhrcTmc2 ? 'tmc2' : isTmc2Iirs ? 'iirs' : 'iirs'

  const specA = specs[sensorAKey] || {}
  const specB = specs[sensorBKey] || {}

  const telemetryA = sensors[sensorAKey] || {}
  const telemetryB = sensors[sensorBKey] || {}

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Payload Specifications ({sensorAKey.toUpperCase()} & {sensorBKey.toUpperCase()})
          </h4>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase">
          ISRO CHANDRAYAAN-2 SCIENCE PAYLOAD
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sensor A */}
        <div className="bg-neutral-950/70 p-3 rounded border border-neutral-800/80">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-amber-400 font-bold uppercase text-[11px]">
              {specA.name || sensorAKey.toUpperCase()}
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold">
              {specA.gsd_m_per_px ? `${specA.gsd_m_per_px} m/px` : 'Dynamic GSD'}
            </span>
          </div>
          <div className="space-y-1 text-[10px] text-neutral-400">
            <div><span className="text-neutral-500">TYPE:</span> {specA.instrument_type || 'Optical Sensor'}</div>
            <div><span className="text-neutral-500">BAND:</span> {specA.spectral_band || 'Panchromatic / Hyperspectral'}</div>
            {telemetryA.tile_id != null && <div><span className="text-neutral-500">TILE ID:</span> {telemetryA.tile_id}</div>}
            {telemetryA.patch_id != null && <div><span className="text-neutral-500">PATCH ID:</span> {telemetryA.patch_id}</div>}
            {telemetryA.lat != null && (
              <div><span className="text-neutral-500">BORESIGHT:</span> ({telemetryA.lat.toFixed(3)}°, {telemetryA.lon?.toFixed(3)}°)</div>
            )}
          </div>
        </div>

        {/* Sensor B */}
        <div className="bg-neutral-950/70 p-3 rounded border border-neutral-800/80">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-cyan-400 font-bold uppercase text-[11px]">
              {specB.name || sensorBKey.toUpperCase()}
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold">
              {specB.gsd_m_per_px ? `${specB.gsd_m_per_px} m/px` : 'Dynamic GSD'}
            </span>
          </div>
          <div className="space-y-1 text-[10px] text-neutral-400">
            <div><span className="text-neutral-500">TYPE:</span> {specB.instrument_type || 'Optical Sensor'}</div>
            <div><span className="text-neutral-500">BAND:</span> {specB.spectral_band || 'Panchromatic / Hyperspectral'}</div>
            {telemetryB.tile_id != null && <div><span className="text-neutral-500">TILE ID:</span> {telemetryB.tile_id}</div>}
            {telemetryB.patch_id != null && <div><span className="text-neutral-500">PATCH ID:</span> {telemetryB.patch_id}</div>}
            {telemetryB.lat != null && (
              <div><span className="text-neutral-500">BORESIGHT:</span> ({telemetryB.lat.toFixed(3)}°, {telemetryB.lon?.toFixed(3)}°)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
