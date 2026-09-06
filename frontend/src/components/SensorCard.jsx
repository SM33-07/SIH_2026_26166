import { useState } from 'react'

/**
 * SensorCard
 * Renders one sensor's observation image and backend-provided metadata.
 * Uses GET /api/v1/sensors for:
 * - GSD
 * - Sensor name
 * - Characteristics (spectral band, swath width, dimensions)
 * - Availability
 * 
 * Strictly data-driven. Zero hardcoded scientific values.
 */
const SENSOR_THEME = {
  iirs:  { border: 'border-sensor-iirs/60', header: 'text-sensor-iirs', badge: 'border-sensor-iirs/40 text-sensor-iirs bg-sensor-iirs/5' },
  tmc2:  { border: 'border-sensor-tmc2/60', header: 'text-sensor-tmc2', badge: 'border-sensor-tmc2/40 text-sensor-tmc2 bg-sensor-tmc2/5' },
  ohrc:  { border: 'border-sensor-ohrc/60', header: 'text-sensor-ohrc', badge: 'border-sensor-ohrc/40 text-sensor-ohrc bg-sensor-ohrc/5' },
}

export default function SensorCard({ sensorKey, sensorName, imageBase64, metadata = {}, specData = {}, isApproximate }) {
  const [zoomed, setZoomed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const theme = SENSOR_THEME[sensorKey] || SENSOR_THEME.ohrc

  // Extract metadata directly from backend specs and observations
  const { gsd_m_per_px, name, spectral_band, swath_width_km, patch_dimensions, tile_dimensions, proxy_dimensions } = specData
  const { lat, lon, tile_id, patch_id, iirs_row, iirs_col } = metadata

  const hasImage = !!imageBase64
  const displayName = sensorName || name || sensorKey?.toUpperCase()
  const dimensions = tile_dimensions || patch_dimensions || proxy_dimensions

  return (
    <>
      <div className={`bg-lunar-card border ${theme.border} flex flex-col gap-0 overflow-hidden`}>
        {/* Header with name and GSD from backend */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-lunar-border bg-lunar-surface/60">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest ${theme.header}`}>
              {displayName}
            </span>
            <span className={`text-[8px] font-mono border px-1 py-0.2 uppercase ${hasImage ? 'border-green-800 text-green-400 bg-green-950/20' : 'border-slate-700 text-slate-500'}`}>
              {hasImage ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {gsd_m_per_px != null && (
              <span className={`text-[9px] font-mono border px-1.5 py-0.5 font-bold ${theme.badge}`}>
                {gsd_m_per_px < 1 ? `${gsd_m_per_px} m/px` : `≈${gsd_m_per_px} m/px`}
              </span>
            )}
            {hasImage && (
              <button
                onClick={() => setZoomed(true)}
                className="text-[9px] font-mono text-slate-500 hover:text-slate-300 border border-lunar-border px-1.5 py-0.5 transition-colors"
                title="Fullscreen View"
              >
                ⤢
              </button>
            )}
          </div>
        </div>

        {/* Image Display */}
        <div
          className={`relative aspect-square bg-lunar-bg overflow-hidden flex items-center justify-center cursor-pointer ${hasImage ? 'hover:brightness-110 transition-all' : ''}`}
          onClick={() => hasImage && setZoomed(true)}
        >
          {hasImage ? (
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt={`${displayName} observation`}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-700">
              <div className="w-8 h-8 border border-slate-700 flex items-center justify-center text-lg opacity-30">
                ◌
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">No Image</span>
            </div>
          )}

          {isApproximate && (
            <div className="absolute top-1.5 right-1.5 bg-amber-950/90 border border-amber-700/60 text-amber-400 text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
              APPROX
            </div>
          )}
        </div>

        {/* Geographic Coordinates & Tile IDs */}
        <div className="px-3 py-2 font-mono text-[10px] space-y-1 bg-lunar-bg/40 border-t border-lunar-border/40">
          {lat != null && (
            <div className="flex justify-between text-slate-400">
              <span>LATITUDE</span>
              <span className="text-slate-200">{Number(lat).toFixed(6)}°</span>
            </div>
          )}
          {lon != null && (
            <div className="flex justify-between text-slate-400">
              <span>LONGITUDE</span>
              <span className="text-slate-200">{Number(lon).toFixed(6)}°</span>
            </div>
          )}
          {tile_id != null && (
            <div className="flex justify-between text-slate-400">
              <span>TILE ID</span>
              <span className="text-slate-200">#{tile_id}</span>
            </div>
          )}
          {patch_id != null && (
            <div className="flex justify-between text-slate-400">
              <span>PATCH ID</span>
              <span className="text-slate-200">#{patch_id}</span>
            </div>
          )}
          {iirs_row != null && (
            <div className="flex justify-between text-slate-400">
              <span>PIXEL (R, C)</span>
              <span className="text-slate-200">({iirs_row}, {iirs_col})</span>
            </div>
          )}
        </div>

        {/* Backend Sensor Characteristics (collapsible/expandable) */}
        {(spectral_band || swath_width_km || dimensions) && (
          <div className="px-3 py-1.5 border-t border-lunar-border/40 bg-lunar-surface/30">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-[9px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider"
            >
              <span>Characteristics</span>
              <span>{showDetails ? '▴' : '▾'}</span>
            </button>
            {showDetails && (
              <div className="pt-1.5 space-y-0.5 text-[9px] font-mono text-slate-400">
                {spectral_band && (
                  <div className="text-slate-400">
                    <span className="text-slate-600 mr-1">Band:</span>{spectral_band}
                  </div>
                )}
                {swath_width_km != null && (
                  <div>
                    <span className="text-slate-600 mr-1">Swath:</span>{swath_width_km} km
                  </div>
                )}
                {dimensions && (
                  <div>
                    <span className="text-slate-600 mr-1">Dims:</span>{dimensions}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isApproximate && (
          <div className="px-3 py-1.5 border-t border-lunar-border/40 text-[9px] text-slate-600 font-mono italic">
            Geolocation is approximate in the current proxy product.
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {zoomed && hasImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-lunar-card border border-lunar-border p-2">
              <div className={`text-xs font-mono mb-2 px-2 pt-1 ${theme.header} flex justify-between`}>
                <span>{displayName} {gsd_m_per_px ? `— ${gsd_m_per_px} m/px` : ''}</span>
                <button onClick={() => setZoomed(false)} className="text-slate-500 hover:text-slate-200 ml-4">✕</button>
              </div>
              <img
                src={`data:image/png;base64,${imageBase64}`}
                alt={`${displayName} fullscreen`}
                className="max-w-full max-h-[80vh] object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
