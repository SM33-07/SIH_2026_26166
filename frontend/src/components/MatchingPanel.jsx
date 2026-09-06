import { useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { matchThreeImages } from '../api/client'
import ErrorAlert from './ErrorAlert'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

const SLOT_CONFIG = [
  {
    key: 'iirs',
    label: 'IIRS',
    description: 'Hyperspectral regional observation',
    color: 'border-sensor-iirs/60 hover:border-sensor-iirs',
    activeColor: 'border-sensor-iirs bg-sensor-iirs/5',
    fieldName: 'iirs_image',
  },
  {
    key: 'tmc2',
    label: 'TMC-2',
    description: 'Medium-resolution optical context',
    color: 'border-sensor-tmc2/60 hover:border-sensor-tmc2',
    activeColor: 'border-sensor-tmc2 bg-sensor-tmc2/5',
    fieldName: 'tmc2_image',
  },
  {
    key: 'ohrc',
    label: 'OHRC',
    description: 'High-resolution optical imagery',
    color: 'border-sensor-ohrc/60 hover:border-sensor-ohrc',
    activeColor: 'border-sensor-ohrc bg-sensor-ohrc/5',
    fieldName: 'ohrc_image',
  },
]

function FileSlot({ config, file, onFile, onRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(config.key, f)
  }

  function handleChange(e) {
    const f = e.target.files[0]
    if (f) onFile(config.key, f)
    e.target.value = ''
  }

  const hasFile = !!file

  return (
    <div className="flex flex-col gap-2">
      <div className="tele-label">{config.label}</div>
      <div
        className={[
          'border-2 border-dashed transition-all cursor-pointer min-h-[120px] flex flex-col items-center justify-center gap-2 p-3 relative',
          dragging ? config.activeColor : hasFile ? config.activeColor : config.color,
        ].join(' ')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !hasFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tif,.tiff,.npy"
          className="hidden"
          onChange={handleChange}
        />

        {hasFile ? (
          <div className="text-center w-full">
            <div className="text-xs font-mono text-slate-300 truncate px-2">{file.name}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              {(file.size / 1024).toFixed(1)} KB
              {file.size > MAX_BYTES && <span className="text-red-400 ml-1">— EXCEEDS 20 MB</span>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(config.key) }}
              className="text-[10px] font-mono text-slate-600 hover:text-red-400 mt-2 border border-slate-700 hover:border-red-800 px-2 py-0.5 transition-colors"
            >
              REMOVE
            </button>
          </div>
        ) : (
          <>
            <div className="text-2xl opacity-20">⊕</div>
            <div className="text-[10px] font-mono text-slate-500 text-center">
              {config.description}
            </div>
            <div className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">
              Drop file or click to browse
            </div>
            <div className="text-[9px] font-mono text-slate-700">PNG · JPEG · TIFF · NPY</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function MatchingPanel({ onResult }) {
  const [files, setFiles] = useState({ iirs: null, tmc2: null, ohrc: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(key, file) {
    setFiles((prev) => ({ ...prev, [key]: file }))
    setError(null)
  }

  function handleRemove(key) {
    setFiles((prev) => ({ ...prev, [key]: null }))
  }

  const allReady = files.iirs && files.tmc2 && files.ohrc
  const anyOversized = Object.values(files).some((f) => f && f.size > MAX_BYTES)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allReady || loading || anyOversized) return
    setLoading(true)
    setError(null)
    try {
      const result = await matchThreeImages(files.ohrc, files.tmc2, files.iirs)
      onResult?.(result, 'match')
    } catch (err) {
      setError(err.message || 'Matching failed. Backend may be unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="tele-label mb-2">Three-Image Correspondence Analysis</div>
        <p className="text-xs text-slate-500 font-mono">
          Upload one image per sensor. The backend runs the full LOCATE → MATCH → VERIFY → DECIDE pipeline.
          All correspondence and decision data comes from the server.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SLOT_CONFIG.map((cfg) => (
            <FileSlot
              key={cfg.key}
              config={cfg}
              file={files[cfg.key]}
              onFile={handleFile}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {anyOversized && (
          <div className="text-xs font-mono text-red-400 border border-red-800 bg-red-950/30 px-3 py-2">
            One or more files exceed the 20 MB maximum. Please reduce file size before uploading.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            id="btn-check-correspondence"
            type="submit"
            disabled={!allReady || loading || anyOversized}
            className="flex items-center gap-2 bg-lunar-accent text-white px-6 py-2.5 text-xs font-mono font-bold
                       uppercase tracking-widest border border-lunar-accent hover:bg-indigo-500
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            CHECK CORRESPONDENCE
          </button>
          {!allReady && (
            <span className="text-[10px] font-mono text-slate-600">
              {3 - Object.values(files).filter(Boolean).length} image{Object.values(files).filter(Boolean).length !== 2 ? 's' : ''} remaining
            </span>
          )}
        </div>
      </form>

      {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
    </div>
  )
}
