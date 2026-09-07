import React, { useState, useRef } from 'react'
import { uploadThreeSensorImages } from '../../api/client'
import { normalizeResult } from '../../utils/resultModel'

const SENSOR_CONFIGS = [
  {
    key: 'iirs',
    label: 'IIRS',
    fullName: 'Imaging Infrared Spectrometer',
    gsd: '86.5 m/px',
    role: 'Regional Hyperspectral Context',
    accept: 'image/png,image/jpeg,image/tiff,.npy',
    accentColor: 'border-red-500/40 hover:border-red-400',
    badgeColor: 'text-red-400 bg-red-950/40 border-red-900/50',
  },
  {
    key: 'tmc2',
    label: 'TMC-2',
    fullName: 'Terrain Mapping Camera-2',
    gsd: '5.0 m/px',
    role: 'Intermediate Stereo Bridge',
    accept: 'image/png,image/jpeg,image/tiff,.npy',
    accentColor: 'border-amber-500/40 hover:border-amber-400',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-900/50',
  },
  {
    key: 'ohrc',
    label: 'OHRC',
    fullName: 'Orbital High Resolution Camera',
    gsd: '0.28 m/px',
    role: 'Sub-Meter Target Verification',
    accept: 'image/png,image/jpeg,image/tiff,.npy',
    accentColor: 'border-cyan-500/40 hover:border-cyan-400',
    badgeColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-900/50',
  },
]

export default function ThreeSensorUploadWorkspace({ onAnalysisComplete, sensorSpecs = null }) {
  const [files, setFiles] = useState({ iirs: null, tmc2: null, ohrc: null })
  const [previews, setPreviews] = useState({ iirs: null, tmc2: null, ohrc: null })
  const [meta, setMeta] = useState({ iirs: null, tmc2: null, ohrc: null })

  // Optional geographic coordinates
  const [showCoords, setShowCoords] = useState(false)
  const [optLat, setOptLat] = useState('')
  const [optLon, setOptLon] = useState('')

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [uploadStep, setUploadStep] = useState(null) // 'VALIDATING' | 'UPLOADING' | 'INFERENCE'

  const fileInputRefs = {
    iirs: useRef(null),
    tmc2: useRef(null),
    ohrc: useRef(null),
  }

  // Handle file drop / selection
  const handleFile = (sensorKey, file) => {
    if (!file) return
    setErrorMsg(null)

    // Max 20MB check
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg(`File "${file.name}" exceeds maximum allowed limit of 20MB.`)
      return
    }

    const isNpy = file.name.toLowerCase().endsWith('.npy')
    const format = isNpy ? 'NPY Tensor' : file.type.split('/')[1]?.toUpperCase() || 'IMAGE'

    setFiles((prev) => ({ ...prev, [sensorKey]: file }))
    setMeta((prev) => ({
      ...prev,
      [sensorKey]: {
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2),
        format,
        isNpy,
      },
    }))

    if (!isNpy) {
      const url = URL.createObjectURL(file)
      setPreviews((prev) => ({ ...prev, [sensorKey]: url }))
    } else {
      setPreviews((prev) => ({ ...prev, [sensorKey]: null }))
    }
  }

  const removeFile = (sensorKey) => {
    if (previews[sensorKey]) URL.revokeObjectURL(previews[sensorKey])
    setFiles((prev) => ({ ...prev, [sensorKey]: null }))
    setPreviews((prev) => ({ ...prev, [sensorKey]: null }))
    setMeta((prev) => ({ ...prev, [sensorKey]: null }))
  }

  const loadSampleSameZoneTriplet = async () => {
    setErrorMsg(null)
    try {
      const resOhrc = await fetch('/sample_triplets/same_lunar_zone/ohrc_same_zone.png')
      const blobOhrc = await resOhrc.blob()
      const fileOhrc = new File([blobOhrc], 'ohrc_same_zone.png', { type: 'image/png' })

      const resTmc2 = await fetch('/sample_triplets/same_lunar_zone/tmc2_same_zone.png')
      const blobTmc2 = await resTmc2.blob()
      const fileTmc2 = new File([blobTmc2], 'tmc2_same_zone.png', { type: 'image/png' })

      const resIirs = await fetch('/sample_triplets/same_lunar_zone/iirs_same_zone.png')
      const blobIirs = await resIirs.blob()
      const fileIirs = new File([blobIirs], 'iirs_same_zone.png', { type: 'image/png' })

      setFiles({ ohrc: fileOhrc, tmc2: fileTmc2, iirs: fileIirs })
      setPreviews({
        ohrc: '/sample_triplets/same_lunar_zone/ohrc_same_zone.png',
        tmc2: '/sample_triplets/same_lunar_zone/tmc2_same_zone.png',
        iirs: '/sample_triplets/same_lunar_zone/iirs_same_zone.png',
      })
      setMeta({
        ohrc: { name: 'ohrc_same_zone.png', size: '512×512 (0.28m GSD)', isNpy: false },
        tmc2: { name: 'tmc2_same_zone.png', size: '48×48 (5.0m GSD)', isNpy: false },
        iirs: { name: 'iirs_same_zone.png', size: '70×256 (86.5m GSD)', isNpy: false },
      })
      setOptLat('60.9894')
      setOptLon('355.3225')
      setShowCoords(true)
    } catch {
      setErrorMsg('Failed to auto-load sample same-zone triplet. You can also drag the files from sample_triplets/same_lunar_zone/ on disk.')
    }
  }

  const isReady = files.iirs && files.tmc2 && files.ohrc

  const runAnalysis = async () => {
    if (!isReady) return
    setIsProcessing(true)
    setErrorMsg(null)
    setUploadStep('VALIDATING RESOURCE LIMITS')

    try {
      const formData = new FormData()
      formData.append('iirs_image', files.iirs)
      formData.append('tmc2_image', files.tmc2)
      formData.append('ohrc_image', files.ohrc)

      if (optLat && optLon && !isNaN(Number(optLat)) && !isNaN(Number(optLon))) {
        formData.append('latitude', Number(optLat))
        formData.append('longitude', Number(optLon))
      }

      setUploadStep('UPLOADING MULTI-MODAL FRAMES')
      const rawRes = await uploadThreeSensorImages(formData)

      setUploadStep('PARSING HOMOGRAPHY & CORRESPONDENCE')
      const normalized = normalizeResult(rawRes, sensorSpecs, {
        sourceType: 'user_upload',
        localPreviews: previews,
      })

      // Store in local experiment history
      try {
        const historyItem = {
          timestamp: new Date().toISOString(),
          decision: normalized.decision,
          inlierCount: normalized.inlierCount,
          rmse: normalized.alignment?.rmse,
          region: normalized.region,
        }
        const existing = JSON.parse(localStorage.getItem('chandravue_experiments') || '[]')
        localStorage.setItem('chandravue_experiments', JSON.stringify([historyItem, ...existing].slice(0, 10)))
      } catch {
        // Safe fallback for private browsing
      }

      onAnalysisComplete?.(normalized)
    } catch (err) {
      setErrorMsg(err.message || 'Multi-sensor inference failed. Check server connection or input formats.')
    } finally {
      setIsProcessing(false)
      setUploadStep(null)
    }
  }

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800 rounded-lg p-6 shadow-xl text-neutral-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-mono tracking-widest uppercase font-bold text-neutral-100">
              Manual Three-Sensor Analysis Workspace
            </h2>
          </div>
          <p className="text-xs font-mono text-neutral-400">
            Upload exactly one observation frame per sensor: <strong className="text-neutral-200">IIRS + TMC-2 + OHRC</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadSampleSameZoneTriplet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-emerald-500/60 rounded bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
            title="Load authentic Chandrayaan-2 triplet from the same lunar zone (North Crater Rim Site, 60.99°N)"
          >
            <span>⚡ LOAD SAME-ZONE TRIPLET</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCoords(!showCoords)}
            className="px-3 py-1.5 text-xs font-mono border border-neutral-700 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            {showCoords ? '▾ HIDE TELEMETRY' : '▸ OPTIONAL LUNAR COORDINATES'}
          </button>
        </div>
      </div>

      {/* Same-zone files helper banner */}
      <div className="mb-5 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>📁</span>
          <span>
            Verified same-zone triplet saved on disk at:{' '}
            <code className="text-white bg-black/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
              sample_triplets/same_lunar_zone/
            </code>
          </span>
        </div>
        <button
          type="button"
          onClick={loadSampleSameZoneTriplet}
          className="text-amber-400 hover:text-white font-bold underline cursor-pointer"
        >
          1-Click Preload Triplet →
        </button>
      </div>

      {/* Optional Coordinates Drawer */}
      {showCoords && (
        <div className="p-3.5 mb-6 bg-neutral-950/70 border border-neutral-800 rounded text-xs font-mono flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
          <span className="text-neutral-400 uppercase tracking-wider text-[11px]">OPTIONAL GEOLOCATION:</span>
          <div className="flex items-center gap-2">
            <label className="text-neutral-500">LAT:</label>
            <input
              type="number"
              step="any"
              placeholder="-69.37"
              value={optLat}
              onChange={(e) => setOptLat(e.target.value)}
              className="w-24 px-2 py-1 bg-black border border-neutral-700 rounded text-neutral-200 text-xs focus:border-amber-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-neutral-500">LON:</label>
            <input
              type="number"
              step="any"
              placeholder="32.32"
              value={optLon}
              onChange={(e) => setOptLon(e.target.value)}
              className="w-24 px-2 py-1 bg-black border border-neutral-700 rounded text-neutral-200 text-xs focus:border-amber-400 outline-none"
            />
          </div>
          <span className="text-[10px] text-neutral-500 italic">
            Zero fabrication: coordinates are strictly optional and not assumed to match.
          </span>
        </div>
      )}

      {/* 3 Dedicated Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {SENSOR_CONFIGS.map((cfg) => {
          const file = files[cfg.key]
          const preview = previews[cfg.key]
          const fileMeta = meta[cfg.key]

          return (
            <div
              key={cfg.key}
              className={`relative border rounded-lg p-4 bg-neutral-950/60 flex flex-col justify-between transition-all ${
                file ? 'border-neutral-700' : `${cfg.accentColor} border-dashed`
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded border uppercase ${cfg.badgeColor}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{cfg.gsd}</span>
              </div>

              {/* Sensor details */}
              <p className="text-[11px] font-mono text-neutral-300 font-semibold mb-0.5">{cfg.fullName}</p>
              <p className="text-[10px] font-mono text-neutral-500 mb-3">{cfg.role}</p>

              {/* Upload Drop Zone / Preview Area */}
              <div
                onClick={() => !file && fileInputRefs[cfg.key].current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) handleFile(cfg.key, e.dataTransfer.files[0])
                }}
                className={`w-full aspect-[4/3] rounded border border-neutral-800 bg-black/50 flex flex-col items-center justify-center p-3 text-center overflow-hidden transition-colors ${
                  !file ? 'cursor-pointer hover:bg-neutral-900/40' : ''
                }`}
              >
                {preview ? (
                  <img src={preview} alt={cfg.label} className="w-full h-full object-cover" />
                ) : fileMeta?.isNpy ? (
                  <div className="flex flex-col items-center gap-1 text-neutral-400">
                    <span className="text-xl font-mono text-cyan-400">📊</span>
                    <span className="text-[11px] font-mono font-semibold text-neutral-200">NPY TENSOR</span>
                    <span className="text-[9px] font-mono text-neutral-500">Decoded in backend</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                    <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-xs font-mono text-neutral-400">
                      +
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                      UPLOAD {cfg.label}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500">
                      Drag & drop PNG, JPG, TIFF, or NPY
                    </span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRefs[cfg.key]}
                type="file"
                accept={cfg.accept}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(cfg.key, e.target.files[0])}
              />

              {/* Metadata & Controls */}
              {file ? (
                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono">
                  <div className="truncate max-w-[170px]" title={fileMeta.name}>
                    <span className="text-neutral-300 font-medium block truncate">{fileMeta.name}</span>
                    <span className="text-neutral-500">{fileMeta.sizeMb} MB • {fileMeta.format}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRefs[cfg.key].current?.click()}
                      className="text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      REPLACE
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(cfg.key)}
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-neutral-800/60 text-center text-[10px] font-mono text-neutral-500">
                  Required: 1 observation frame
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
        <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
          <span>
            {isReady
              ? 'All 3 sensor frames validated and staged.'
              : `Awaiting frames (${[files.iirs, files.tmc2, files.ohrc].filter(Boolean).length}/3 loaded)`}
          </span>
        </div>

        <button
          type="button"
          disabled={!isReady || isProcessing}
          onClick={runAnalysis}
          className={`px-6 py-2.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
            isReady && !isProcessing
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_16px_rgba(245,158,11,0.25)]'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
          }`}
        >
          {isProcessing ? (
            <>
              <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>{uploadStep || 'PROCESSING INFERENCE...'}</span>
            </>
          ) : (
            <>
              <span>EXECUTE THREE-SENSOR CORRESPONDENCE</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
