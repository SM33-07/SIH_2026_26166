import { useState, useRef } from 'react'
import { matchThreeImages } from '../api/client'

const MAX_MB = 20
const MAX_BYTES = MAX_MB * 1024 * 1024

/**
 * Build sensor metadata from backend sensorSpecs or fall back to '—'.
 */
function buildSensorMeta(sensorSpecs) {
  const specs = sensorSpecs?.sensors || {}
  return [
    {
      key: 'iirs',
      label: 'IIRS',
      sub: specs.iirs?.gsd_m_per_px != null ? `Hyperspectral · ${specs.iirs.gsd_m_per_px} m/px` : 'Hyperspectral',
      field: 'iirs_image',
      accent: '#ef4444',
      accentBg: 'rgba(239,68,68,0.07)',
      border: 'border-red-700/40',
      borderHover: 'hover:border-red-500/70',
      borderActive: 'border-red-500',
      textActive: 'text-red-400',
    },
    {
      key: 'tmc2',
      label: 'TMC-2',
      sub: specs.tmc2?.gsd_m_per_px != null ? `Optical context · ${specs.tmc2.gsd_m_per_px} m/px` : 'Optical context',
      field: 'tmc2_image',
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.07)',
      border: 'border-amber-700/40',
      borderHover: 'hover:border-amber-500/70',
      borderActive: 'border-amber-500',
      textActive: 'text-amber-400',
    },
    {
      key: 'ohrc',
      label: 'OHRC',
      sub: specs.ohrc?.gsd_m_per_px != null ? `High-resolution · ${specs.ohrc.gsd_m_per_px} m/px` : 'High-resolution',
      field: 'ohrc_image',
      accent: '#e2e8f0',
      accentBg: 'rgba(226,232,240,0.05)',
      border: 'border-slate-600/40',
      borderHover: 'hover:border-slate-400/70',
      borderActive: 'border-slate-300',
      textActive: 'text-slate-200',
    },
  ]
}

function DropSlot({ sensor, file, onFile, onRemove }) {
  const inputRef  = useRef(null)
  const [drag, setDrag] = useState(false)

  const hasFile   = !!file
  const oversized = file && file.size > MAX_BYTES

  function handleDrop(e) {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(sensor.key, f)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Sensor label */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: sensor.accent }}>
            {sensor.label}
          </span>
          <span className="text-[9px] font-mono text-neutral-600 ml-2">{sensor.sub}</span>
        </div>
        {hasFile && !oversized && (
          <span className="text-[9px] font-mono text-green-600 uppercase tracking-wider">✓ READY</span>
        )}
        {oversized && (
          <span className="text-[9px] font-mono text-red-500 uppercase tracking-wider">EXCEEDS {MAX_MB} MB</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={[
          'border-2 border-dashed transition-all cursor-pointer min-h-[90px] flex flex-col items-center justify-center gap-1.5 p-3 relative select-none',
          drag
            ? `${sensor.borderActive} bg-[${sensor.accentBg}]`
            : hasFile
            ? `${sensor.borderActive}`
            : `${sensor.border} ${sensor.borderHover}`,
        ].join(' ')}
        style={hasFile || drag ? { background: sensor.accentBg } : {}}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => !hasFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tif,.tiff,.npy"
          className="hidden"
          onChange={(e) => { const f = e.target.files[0]; if (f) onFile(sensor.key, f); e.target.value = '' }}
        />

        {hasFile ? (
          <div className="text-center w-full px-1">
            <div className={`text-[11px] font-mono font-semibold truncate ${sensor.textActive}`}>{file.name}</div>
            <div className="text-[10px] font-mono text-neutral-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB</div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(sensor.key) }}
              className="text-[9px] font-mono text-neutral-600 hover:text-red-400 mt-1.5 border border-neutral-800 hover:border-red-900 px-2 py-0.5 transition-colors"
            >
              REMOVE
            </button>
          </div>
        ) : (
          <>
            <div className="text-xl opacity-20" style={{ color: sensor.accent }}>⊕</div>
            <div className="text-[9px] font-mono text-neutral-600 text-center">Drop or click to upload</div>
            <div className="text-[8px] font-mono text-neutral-700 uppercase tracking-widest">PNG · JPEG · TIFF · NPY</div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * InlineImageUpload
 *
 * Compact 3-sensor upload panel placed directly below the Moon hero.
 * On successful backend inference, calls onResult with:
 *   { result (full API response), point: { latitude, longitude_360, label } }
 * so App.jsx can pass the location to CinematicMoonHero as matchResultPoint.
 *
 * sensorSpecs: backend sensor characteristics for dynamic GSD labels.
 */
export default function InlineImageUpload({ onResult, sensorSpecs }) {
  const [files,   setFiles]   = useState({ iirs: null, tmc2: null, ohrc: null })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [done,    setDone]    = useState(false)

  const sensors = buildSensorMeta(sensorSpecs)

  const allReady    = files.iirs && files.tmc2 && files.ohrc
  const anyOversized = Object.values(files).some((f) => f && f.size > MAX_BYTES)
  const filled      = Object.values(files).filter(Boolean).length

  function handleFile(key, file) { setFiles((p) => ({ ...p, [key]: file })); setError(null); setDone(false) }
  function handleRemove(key)     { setFiles((p) => ({ ...p, [key]: null })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allReady || loading || anyOversized) return
    setLoading(true); setError(null); setDone(false)
    try {
      const result = await matchThreeImages(files.ohrc, files.tmc2, files.iirs)
      setDone(true)
      // Automatically clear uploaded images once processed
      setFiles({ iirs: null, tmc2: null, ohrc: null })

      // Extract location from backend response — NO fallback coordinates
      const loc = result?.location ?? result?.matched_point ?? result?.best_match ?? null
      const point = loc
        ? {
            latitude:      loc.latitude      ?? loc.lat ?? null,
            longitude_360: loc.longitude_360 ?? loc.lon_360 ?? loc.longitude ?? null,
            label:         loc.region_name   ?? loc.id ?? `MATCH #${result?.judge_id ?? '?'}`,
          }
        : null

      onResult?.({ result, point })
    } catch (err) {
      setError(err.message || 'Three-image matching failed. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-white/[0.07] bg-[#040404] relative">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <div className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
              3-IMAGE CORRESPONDENCE ANALYSIS
            </div>
            <div className="text-[9px] font-mono text-neutral-600 mt-0.5">
              Upload IIRS + TMC-2 + OHRC imagery — backend will locate and verify the lunar position
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono text-neutral-700 shrink-0">
          {filled}/3 LOADED
        </div>
      </div>

      {/* Upload slots */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sensors.map((s) => (
            <DropSlot
              key={s.key}
              sensor={s}
              file={files[s.key]}
              onFile={handleFile}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-900/60 bg-red-950/30 px-3 py-2 text-[10px] font-mono text-red-400 flex items-start gap-2">
            <span className="text-red-600 mt-0.5">✕</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {done && !error && (
          <div className="border border-green-900/50 bg-green-950/20 px-3 py-2 text-[10px] font-mono text-green-400 flex items-center gap-2">
            <span>✓</span>
            <span>CORRESPONDENCE RESOLVED — LOCATION PLOTTED ON GLOBE ABOVE</span>
          </div>
        )}

        {/* Submit row */}
        <div className="flex items-center gap-4">
          <button
            id="btn-inline-match"
            type="submit"
            disabled={!allReady || loading || anyOversized}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border transition-all disabled:opacity-40 disabled:cursor-not-allowed border-amber-600/60 text-amber-300 hover:bg-amber-950/30 hover:border-amber-500"
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                PROCESSING…
              </>
            ) : (
              <>⚡ RUN CORRESPONDENCE</>
            )}
          </button>

          {!allReady && (
            <span className="text-[10px] font-mono text-neutral-600">
              {3 - filled} sensor image{3 - filled !== 1 ? 's' : ''} remaining
            </span>
          )}
          {anyOversized && (
            <span className="text-[10px] font-mono text-red-500">Reduce file size to &lt;{MAX_MB} MB</span>
          )}
        </div>
      </form>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <div className="border border-amber-500/30 bg-black/90 px-6 py-4 flex flex-col items-center gap-3">
            <span className="inline-block w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
              RUNNING ML INFERENCE…
            </div>
            <div className="text-[9px] font-mono text-neutral-600">
              LOCATE → MATCH → VERIFY → DECIDE
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
