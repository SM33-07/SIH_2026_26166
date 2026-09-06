import React from 'react'
import useMatchStore from '../store/matchStore'

/**
 * Editorial / Scientific Selected Observation Section
 * - Replaces generic repeated card layouts with an asymmetrical scientific workstation composition.
 * - Large real sensor imagery with technical telemetry overlays and sensor metadata.
 * - ALL scientific values (GSD, scale ratios) are backend-driven via sensorSpecs prop.
 * - Synchronized sensor highlighting when clicked on 3D Moon or 2D Geographic Map.
 */
export default function SelectedObservationWorkspace({ point, activeResult, sensorSpecs, isDemo = false, onClear }) {
  const { highlightedSensor } = useMatchStore()
  if (!point && !activeResult) return null

  const p = point || activeResult?.matched_location || {}
  const images = activeResult?.images || {}
  const sensors = activeResult?.sensors || {}
  const specs = sensorSpecs?.sensors || {}
  const scaleInfo = sensorSpecs?.scale_invariance || {}

  // Backend-driven GSD values
  const ohrcGsd = specs.ohrc?.gsd_m_per_px ?? null
  const tmc2Gsd = specs.tmc2?.gsd_m_per_px ?? null
  const iirsGsd = specs.iirs?.gsd_m_per_px ?? null
  const scaleGapTmc2Ohrc = scaleInfo.ohrc_to_tmc2_ratio ?? null

  const displayLat = p.latitude != null ? Number(p.latitude).toFixed(6) : '—'
  const displayLon = p.longitude_360 != null
    ? p.longitude_360 > 180
      ? (p.longitude_360 - 360).toFixed(6)
      : Number(p.longitude_360).toFixed(6)
    : '—'

  return (
    <section id="observation-workspace" className="w-full my-8 space-y-6">
      {/* Demo label */}
      {isDemo && (
        <div className="flex justify-center">
          <span className="text-[9px] font-mono border border-amber-500/50 text-amber-400 bg-amber-500/10 px-3 py-1 uppercase tracking-widest font-semibold">
            CONTROLLED EVALUATION CASE
          </span>
        </div>
      )}

      {/* Editorial Header HUD */}
      <div className="border-t border-b border-white/[0.1] py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#030406]/70">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
            TARGET IDENTIFIER:
          </div>
          <div className="text-sm font-mono font-bold text-amber-400">
            {point?.id || activeResult?.judge_point_id || activeResult?.common_point_id || 'OBS_SELECTED'}
          </div>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <div className="text-xs font-mono text-neutral-300">
            LAT: <span className="text-white">{displayLat}° N</span>
          </div>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <div className="text-xs font-mono text-neutral-300">
            LON: <span className="text-white">{displayLon}° E</span>
          </div>
          {p.region && (
            <>
              <span className="text-neutral-700 hidden md:inline">|</span>
              <div className="text-[11px] font-mono text-neutral-400">
                ZONE: <span className="text-neutral-200">{p.region}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[10px] text-neutral-500 uppercase">SPATIAL STATUS:</span>
          <span className="px-2.5 py-0.5 border border-green-800 bg-green-950/40 text-green-400 font-bold">
            SPATIALLY PAIRED
          </span>
          {onClear && (
            <button
              onClick={onClear}
              className="text-[10px] text-neutral-500 hover:text-white border border-white/[0.1] px-2 py-0.5 ml-2"
            >
              CLEAR ✕
            </button>
          )}
        </div>
      </div>

      {/* Editorial Three-Sensor Imagery Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Primary OHRC Large Observation (7 Cols) */}
        <div id="sensor-card-ohrc" className={`lg:col-span-7 border p-4 flex flex-col justify-between transition-all duration-300 ${
          highlightedSensor === 'ohrc'
            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_28px_rgba(56,189,248,0.35)] ring-1 ring-cyan-400'
            : 'border-white/[0.1] bg-[#050608]'
        }`}>
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-3">
            <div>
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                OHRC (Orbital High-Resolution Camera)
              </span>
              <div className="text-[10px] font-mono text-neutral-500">
                Panchromatic Hazard Avoidance · {specs.ohrc?.spectral_band || '450–900 nm'} · Swath: {specs.ohrc?.swath_width_km ?? '—'} km
              </div>
            </div>
            <span className="text-[10px] font-mono border border-white/20 text-white px-2 py-0.5 font-bold">
              {ohrcGsd != null ? `${ohrcGsd} m/px` : '— m/px'}
            </span>
          </div>

          {/* Large imagery viewer */}
          <div className="w-full aspect-[4/3] bg-black border border-white/[0.05] overflow-hidden flex items-center justify-center relative">
            {images.ohrc ? (
              <img
                src={`data:image/png;base64,${images.ohrc}`}
                alt="OHRC High-Res Lunar Observation"
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="text-center font-mono text-xs text-neutral-600">
                OHRC OBSERVATION DATA BUFFERING…
              </div>
            )}
            <div className="absolute top-2 left-2 text-[9px] font-mono bg-black/80 px-2 py-1 border border-white/[0.1] text-neutral-400">
              TARGET VIEW · SUB-METER CRATER DETAIL
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <div>
              TILE: <span className="text-white">{sensors.ohrc?.tile_id ? `#${sensors.ohrc.tile_id}` : 'STAGED'}</span>
            </div>
            <div>
              COORDS: <span className="text-neutral-300">{sensors.ohrc?.lat ? `${Number(sensors.ohrc.lat).toFixed(4)}°N, ${Number(sensors.ohrc.lon).toFixed(4)}°E` : `${displayLat}°N, ${displayLon}°E`}</span>
            </div>
          </div>
        </div>

        {/* Supporting Sensors: TMC-2 & IIRS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* TMC-2 */}
          <div id="sensor-card-tmc2" className={`border p-4 transition-all duration-300 ${
            highlightedSensor === 'tmc2'
              ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_28px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
              : 'border-white/[0.1] bg-[#050608]'
          }`}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2">
              <div>
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  TMC-2 (Terrain Mapping Camera-2)
                </span>
                <div className="text-[10px] font-mono text-neutral-500">
                  Stereo Panchromatic · {specs.tmc2?.spectral_band || '500–850 nm'} · Intermediate Bridge
                </div>
              </div>
              <span className="text-[10px] font-mono border border-amber-500/40 text-amber-300 px-2 py-0.5 font-bold">
                {tmc2Gsd != null ? `${tmc2Gsd} m/px` : '— m/px'}
              </span>
            </div>

            <div className="w-full aspect-[16/9] bg-black border border-white/[0.05] overflow-hidden flex items-center justify-center">
              {images.tmc2 ? (
                <img
                  src={`data:image/png;base64,${images.tmc2}`}
                  alt="TMC-2 Stereo Panchromatic"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="font-mono text-xs text-neutral-600">TMC-2 BUFFERING…</span>
              )}
            </div>

            <div className="mt-2 text-[10px] font-mono text-neutral-400 flex justify-between">
              <span>PATCH: <strong className="text-neutral-200">{sensors.tmc2?.patch_id ? `#${sensors.tmc2.patch_id}` : 'STAGED'}</strong></span>
              <span>SCALE GAP: <strong className="text-amber-400">{scaleGapTmc2Ohrc != null ? `${scaleGapTmc2Ohrc}× to OHRC` : '— ×'}</strong></span>
            </div>
          </div>

          {/* IIRS */}
          <div id="sensor-card-iirs" className={`border p-4 transition-all duration-300 ${
            highlightedSensor === 'iirs'
              ? 'border-red-500 bg-red-950/20 shadow-[0_0_28px_rgba(239,68,68,0.35)] ring-1 ring-red-500'
              : 'border-white/[0.1] bg-[#050608]'
          }`}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2">
              <div>
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  IIRS (Imaging Infrared Spectrometer)
                </span>
                <div className="text-[10px] font-mono text-neutral-500">
                  {specs.iirs?.spectral_band || 'Hyperspectral'} · {specs.iirs?.geolocation_status === 'approximate_product_level' ? 'Approximate Product Geolocation' : 'Product Geolocation'}
                </div>
              </div>
              <span className="text-[10px] font-mono border border-red-800 text-red-300 px-2 py-0.5 font-bold">
                {iirsGsd != null ? `${iirsGsd} m/px` : '— m/px'}
              </span>
            </div>

            <div className="w-full aspect-[16/9] bg-black border border-white/[0.05] overflow-hidden flex items-center justify-center">
              {images.iirs ? (
                <img
                  src={`data:image/png;base64,${images.iirs}`}
                  alt="IIRS Hyperspectral Composite"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="font-mono text-xs text-neutral-600">IIRS BUFFERING…</span>
              )}
            </div>

            <div className="mt-2 text-[10px] font-mono text-neutral-400 flex justify-between">
              <span>PIXEL: <strong className="text-neutral-200">({sensors.iirs?.iirs_row ?? '—'}, {sensors.iirs?.iirs_col ?? '—'})</strong></span>
              <span className="text-amber-400/80 italic">{activeResult?.note || 'Approximate proxy geometry'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
