import React, { useState, useRef, useEffect } from 'react'

function DualImageCorrespondenceCanvas({
  img0,
  img1,
  matches = [],
  filter = 'all',
  label0 = 'SOURCE IMAGE',
  label1 = 'REFERENCE IMAGE',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !img0 || !img1) return
    const ctx = canvas.getContext('2d')
    const W = (canvas.width = 900)
    const H = (canvas.height = 380)
    const HW = W / 2

    const drawImg = (src, x) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, x, 0, HW, H)
          resolve()
        }
        img.onerror = resolve
        img.src = `data:image/png;base64,${src}`
      })
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#020305'
    ctx.fillRect(0, 0, W, H)

    Promise.all([drawImg(img0, 0), drawImg(img1, HW)]).then(() => {
      // Technical center dividing hairline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(HW, 0)
      ctx.lineTo(HW, H)
      ctx.stroke()

      // Filter matches according to mode
      let visible = matches
      if (filter === 'high') visible = matches.filter((m) => (m.confidence ?? 0) >= 0.75)
      if (filter === 'inliers') visible = matches.filter((m) => m.inlier !== false)
      if (filter === 'outliers') visible = matches.filter((m) => m.inlier === false)

      // Draw real correspondence lines and keypoint crosshairs
      visible.forEach((m) => {
        const conf = m.confidence ?? 0.5
        const inlier = m.inlier !== false

        let color = inlier
          ? conf >= 0.8
            ? `rgba(245, 158, 11, ${0.6 + conf * 0.4})` // Warm amber for high-confidence inliers
            : `rgba(220, 220, 220, ${0.4 + conf * 0.4})`
          : 'rgba(239, 68, 68, 0.65)' // Red for outliers

        const [p0x, p0y] = m.p0 || [0, 0]
        const [p1x, p1y] = m.p1 || [0, 0]

        const sx0 = (p0x / (m.src_w || 512)) * HW
        const sy0 = (p0y / (m.src_h || 512)) * H
        const sx1 = HW + (p1x / (m.ref_w || 512)) * HW
        const sy1 = (p1y / (m.ref_h || 512)) * H

        ctx.strokeStyle = color
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.moveTo(sx0, sy0)
        ctx.lineTo(sx1, sy1)
        ctx.stroke()

        // Keypoint dots
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(sx0, sy0, 2.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx1, sy1, 2.2, 0, Math.PI * 2)
        ctx.fill()
      })
    })
  }, [img0, img1, matches, filter])

  return (
    <div className="relative border border-white/[0.1] bg-[#020305] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-auto block select-none" />
      <div className="absolute top-2 left-3 text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/[0.08]">
        {label0}
      </div>
      <div className="absolute top-2 right-3 text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/[0.08]">
        {label1}
      </div>
    </div>
  )
}

export default function DeepCorrespondenceWorkspace({ activeResult, sensorSpecs }) {
  const [pairView, setPairView] = useState('ohrc_tmc2')
  const [filter, setFilter] = useState('all')

  const images = activeResult?.images || {}
  const featureMatches = activeResult?.feature_matches

  // Build labels dynamically from backend sensor specs
  const specs = sensorSpecs?.sensors || {}
  const ohrcLabel = specs.ohrc?.gsd_m_per_px != null ? `OHRC · ${specs.ohrc.gsd_m_per_px} m/px` : 'OHRC'
  const tmc2Label = specs.tmc2?.gsd_m_per_px != null ? `TMC-2 · ${specs.tmc2.gsd_m_per_px} m/px` : 'TMC-2'
  const iirsLabel = specs.iirs?.gsd_m_per_px != null ? `IIRS · ${specs.iirs.gsd_m_per_px} m/px` : 'IIRS'

  const pairs = {
    ohrc_tmc2: {
      img0: images.ohrc,
      img1: images.tmc2,
      label0: `${ohrcLabel} (Source)`,
      label1: `${tmc2Label} (Reference)`,
      matches: featureMatches?.ohrc_tmc2 || [],
    },
    tmc2_iirs: {
      img0: images.tmc2,
      img1: images.iirs,
      label0: `${tmc2Label} (Source)`,
      label1: `${iirsLabel} (Reference)`,
      matches: featureMatches?.tmc2_iirs || [],
    },
    ohrc_iirs: {
      img0: images.ohrc,
      img1: images.iirs,
      label0: `${ohrcLabel} (Source)`,
      label1: `${iirsLabel} (Reference)`,
      matches: featureMatches?.ohrc_iirs || [],
    },
  }

  const currentPair = pairs[pairView]
  const totalMatches = currentPair.matches.length
  const inlierCount = currentPair.matches.filter((m) => m.inlier !== false).length
  const inlierRatio = totalMatches > 0 ? (inlierCount / totalMatches) * 100 : null
  const meanConf = featureMatches?.mean_confidence != null ? featureMatches.mean_confidence.toFixed(4) : '—'

  // RMSE: only show if backend actually provides it — never fabricate
  const geomEvidence = activeResult?.evidence?.geometric_verification
  const rmse = geomEvidence?.reprojection_rmse != null
    ? `${Number(geomEvidence.reprojection_rmse).toFixed(3)} px`
    : '—'

  return (
    <section id="correspondence-workspace" className="w-full my-8 space-y-4">
      {/* Section Header & Pair Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.1] pb-3">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-white uppercase">
            LoFTR Dual-Softmax Dense Correspondence Engine
          </div>
          <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
            Transformer cross-attention resolving multi-modal crater correspondences under extreme scale & sun angles.
          </p>
        </div>

        {/* Pair Switcher Strip */}
        <div className="flex items-center gap-1 border border-white/[0.1] p-1 bg-[#050608]">
          {[
            { id: 'ohrc_tmc2', label: 'OHRC ↔ TMC-2' },
            { id: 'tmc2_iirs', label: 'TMC-2 ↔ IIRS' },
            { id: 'ohrc_iirs', label: 'OHRC ↔ IIRS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPairView(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all ${
                pairView === tab.id
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual Correspondence Canvas */}
      {currentPair.img0 && currentPair.img1 ? (
        <DualImageCorrespondenceCanvas
          img0={currentPair.img0}
          img1={currentPair.img1}
          matches={currentPair.matches}
          filter={filter}
          label0={currentPair.label0}
          label1={currentPair.label1}
        />
      ) : (
        <div className="h-64 border border-white/[0.1] bg-[#020305] flex flex-col items-center justify-center text-center p-6">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            NO CORRESPONDENCES AVAILABLE
          </div>
          <div className="text-[10px] font-mono text-neutral-600 mt-1 max-w-md">
            Select an observation target from the 3D Moon or run Coordinate Search to load deep LoFTR correspondence lines.
          </div>
        </div>
      )}

      {/* Telemetry Measurement Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-b border-white/[0.08] py-3 bg-[#030406]/60 text-xs font-mono">
        <div>
          <span className="text-[9px] text-neutral-500 block uppercase">MATCH COUNT</span>
          <span className="text-white font-bold">{totalMatches > 0 ? totalMatches : '—'}</span>
        </div>
        <div>
          <span className="text-[9px] text-neutral-500 block uppercase">INLIERS</span>
          <span className="text-green-400 font-bold">{totalMatches > 0 ? inlierCount : '—'}</span>
        </div>
        <div>
          <span className="text-[9px] text-neutral-500 block uppercase">INLIER RATIO</span>
          <span className="text-amber-300 font-bold">{inlierRatio != null ? `${inlierRatio.toFixed(1)}%` : '—'}</span>
        </div>
        <div>
          <span className="text-[9px] text-neutral-500 block uppercase">MEAN CONFIDENCE</span>
          <span className="text-neutral-200 font-bold">{meanConf}</span>
        </div>
        <div>
          <span className="text-[9px] text-neutral-500 block uppercase">REPROJECTION RMSE</span>
          <span className="text-amber-400 font-bold">{rmse}</span>
        </div>
      </div>

      {/* Filter Action Controls */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[10px] font-mono text-neutral-500 uppercase mr-2">FILTER:</span>
        {[
          { id: 'all', label: `ALL (${totalMatches})` },
          { id: 'inliers', label: `INLIERS (${inlierCount})` },
          { id: 'outliers', label: `OUTLIERS (${Math.max(0, totalMatches - inlierCount)})` },
          { id: 'high', label: 'HIGH CONFIDENCE (≥ 0.75)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 text-[10px] font-mono uppercase border transition-all ${
              filter === f.id
                ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                : 'border-white/[0.08] text-neutral-400 hover:text-white hover:border-neutral-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </section>
  )
}
