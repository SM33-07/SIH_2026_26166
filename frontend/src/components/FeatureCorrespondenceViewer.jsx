import { useState, useRef, useEffect } from 'react'

/**
 * FeatureCorrespondenceViewer
 * Renders actual LoFTR point correspondences returned by the backend.
 * Never generates fake points for visual effect.
 */

function CorrespondenceCanvas({ img0, img1, matches = [], filter = 'all', label0 = 'SOURCE', label1 = 'REFERENCE' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !img0 || !img1) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const HW = W / 2

    const drawImg = (src, x) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => { ctx.drawImage(img, x, 0, HW, H); resolve() }
        img.onerror = resolve
        img.src = `data:image/png;base64,${src}`
      })
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0d1424'
    ctx.fillRect(0, 0, W, H)

    Promise.all([drawImg(img0, 0), drawImg(img1, HW)]).then(() => {
      // Divider line
      ctx.strokeStyle = 'rgba(99,102,241,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(HW, 0)
      ctx.lineTo(HW, H)
      ctx.stroke()

      // Filter matches
      let visible = matches
      if (filter === 'high') visible = matches.filter((m) => (m.confidence ?? 0) >= 0.7)
      if (filter === 'inliers') visible = matches.filter((m) => m.inlier !== false)
      if (filter === 'outliers') visible = matches.filter((m) => m.inlier === false)

      // Draw correspondence lines
      visible.forEach((m, i) => {
        const conf = m.confidence ?? 0.5
        const inlier = m.inlier !== false

        // Color: inliers green/indigo by confidence, outliers red
        let color
        if (!inlier) {
          color = `rgba(239,68,68,${0.4 + conf * 0.3})`
        } else if (conf >= 0.8) {
          color = `rgba(34,197,94,${0.5 + conf * 0.4})`
        } else {
          color = `rgba(129,140,248,${0.4 + conf * 0.4})`
        }

        // p0 is in source image space, p1 in reference space
        const [p0x, p0y] = m.p0 || [0, 0]
        const [p1x, p1y] = m.p1 || [0, 0]

        // Scale points to canvas dims (assuming model inputs are normalised)
        // Backend returns pixel coordinates in original image space
        const sx0 = p0x / (m.src_w || 512) * HW
        const sy0 = p0y / (m.src_h || 512) * H
        const sx1 = HW + p1x / (m.ref_w || 512) * HW
        const sy1 = p1y / (m.ref_h || 512) * H

        ctx.strokeStyle = color
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(sx0, sy0)
        ctx.lineTo(sx1, sy1)
        ctx.stroke()

        // Keypoint dots
        ctx.fillStyle = color
        ctx.beginPath(); ctx.arc(sx0, sy0, 2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(sx1, sy1, 2, 0, Math.PI * 2); ctx.fill()
      })
    })
  }, [img0, img1, matches, filter])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={800} height={350} className="w-full border border-lunar-border" />
      <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider">{label0}</div>
      <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider">{label1}</div>
    </div>
  )
}

export default function FeatureCorrespondenceViewer({ images = {}, featureMatches, sensors }) {
  const [filter, setFilter] = useState('all')
  const [pairView, setPairView] = useState('ohrc_tmc2')

  if (!featureMatches) return null

  const pairConfig = {
    ohrc_tmc2: { img0: images?.ohrc, img1: images?.tmc2, label0: 'OHRC (Source)', label1: 'TMC-2 (Reference)', matches: featureMatches.ohrc_tmc2 || [] },
    tmc2_iirs: { img0: images?.tmc2, img1: images?.iirs, label0: 'TMC-2 (Source)', label1: 'IIRS (Reference)', matches: featureMatches.tmc2_iirs || [] },
    ohrc_iirs: { img0: images?.ohrc, img1: images?.iirs, label0: 'OHRC (Source)', label1: 'IIRS (Reference)', matches: featureMatches.ohrc_iirs || [] },
  }

  const current = pairConfig[pairView]
  const totalMatches = current.matches.length
  const inlierCount = current.matches.filter((m) => m.inlier !== false).length
  const meanConf = featureMatches.mean_confidence != null
    ? featureMatches.mean_confidence.toFixed(4)
    : null

  const FILTER_OPTIONS = [
    { key: 'all',      label: `All (${totalMatches})` },
    { key: 'inliers',  label: `Inliers (${inlierCount})` },
    { key: 'outliers', label: `Outliers (${totalMatches - inlierCount})` },
    { key: 'high',     label: 'High Confidence' },
  ]

  return (
    <div className="border border-lunar-border bg-lunar-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-lunar-border bg-lunar-surface/60">
        <div>
          <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            LoFTR Feature Correspondence
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
            Checkpoint: <span className="text-amber-400">{featureMatches.checkpoint || 'tmc2_loftr_available.pt'}</span>
            {featureMatches.architecture && <span className="ml-2">· {featureMatches.architecture}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {meanConf && (
            <span className="text-[10px] font-mono text-slate-400 border border-lunar-border px-2 py-1">
              Mean conf: <span className="text-amber-400">{meanConf}</span>
            </span>
          )}
        </div>
      </div>

      {/* Pair selector */}
      <div className="flex items-center gap-0 border-b border-lunar-border px-4 overflow-x-auto">
        {Object.entries(pairConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setPairView(key)}
            className={[
              'px-3 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-all whitespace-nowrap',
              pairView === key
                ? 'border-lunar-accent text-lunar-accent'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {cfg.label0.split(' ')[0]} ↔ {cfg.label1.split(' ')[0]} ({cfg.matches.length})
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="p-3">
        {(current.img0 && current.img1) ? (
          <CorrespondenceCanvas
            img0={current.img0}
            img1={current.img1}
            matches={current.matches}
            filter={filter}
            label0={current.label0}
            label1={current.label1}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-600 font-mono text-xs border border-lunar-border">
            IMAGE DATA UNAVAILABLE FOR THIS PAIR
          </div>
        )}
      </div>

      {/* Filter controls */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'text-[9px] font-mono border px-2.5 py-1 uppercase tracking-wider transition-all',
              filter === key
                ? 'border-lunar-accent text-lunar-accent bg-lunar-accent/10'
                : 'border-lunar-border text-slate-500 hover:border-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {totalMatches === 0 && (
        <div className="px-4 pb-3 text-[10px] font-mono text-slate-600">
          No correspondence points were returned for this sensor pair.
        </div>
      )}
    </div>
  )
}
