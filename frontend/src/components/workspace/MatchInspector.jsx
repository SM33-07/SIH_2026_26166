import React, { useRef, useEffect } from 'react'

export default function MatchInspector({
  match = null,
  matchIndex = 0,
  imgSrc0 = null,
  imgSrc1 = null,
  label0 = 'OHRC',
  label1 = 'TMC-2',
}) {
  const cropCanvas0Ref = useRef(null)
  const cropCanvas1Ref = useRef(null)

  // Render 40x40 local crops around match coordinates with crosshair reticle
  useEffect(() => {
    if (!match) return

    const renderCrop = (canvasRef, src, nx, ny) => {
      const canvas = canvasRef.current
      if (!canvas || !src) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const cw = canvas.width
        const ch = canvas.height
        ctx.clearRect(0, 0, cw, ch)

        const px = nx * img.naturalWidth
        const py = ny * img.naturalHeight
        const cropSize = 40 // 40x40 pixel neighborhood

        const sx = Math.max(0, Math.min(img.naturalWidth - cropSize, px - cropSize / 2))
        const sy = Math.max(0, Math.min(img.naturalHeight - cropSize, py - cropSize / 2))

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, cw, ch)

        // Draw reticle crosshair
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cw / 2 - 8, ch / 2)
        ctx.lineTo(cw / 2 + 8, ch / 2)
        ctx.moveTo(cw / 2, ch / 2 - 8)
        ctx.lineTo(cw / 2, ch / 2 + 8)
        ctx.stroke()

        // Circular sight ring
        ctx.beginPath()
        ctx.arc(cw / 2, ch / 2, 6, 0, Math.PI * 2)
        ctx.stroke()
      }
      img.src = src
    }

    renderCrop(cropCanvas0Ref, imgSrc0, match.x0, match.y0)
    renderCrop(cropCanvas1Ref, imgSrc1, match.x1, match.y1)
  }, [match, imgSrc0, imgSrc1])

  if (!match) {
    return (
      <div className="p-4 bg-[#0a0c10] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-500 text-center">
        Click any correspondence point on the viewer above to inspect local crop & keypoint telemetry.
      </div>
    )
  }

  const confidencePct = Math.round(match.confidence * 100)
  const filledBlocks = Math.round((match.confidence || 0) * 10)
  const confBar = '█'.repeat(filledBlocks) + '░'.repeat(Math.max(0, 10 - filledBlocks))

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-bold tracking-wider uppercase text-neutral-100">
            MATCH #{String(matchIndex + 1).padStart(2, '0')}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded border ${
            match.inlier
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          {match.inlier ? 'INLIER ✓' : 'OUTLIER ✕'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Source Crop */}
        <div className="flex items-center gap-3 bg-neutral-950/60 p-2.5 rounded border border-neutral-800/70">
          <canvas
            ref={cropCanvas0Ref}
            width={72}
            height={72}
            className="w-16 h-16 rounded border border-neutral-700/80 bg-black flex-shrink-0"
          />
          <div className="text-[10px]">
            <span className="text-neutral-500 block uppercase">{label0} (SOURCE)</span>
            <span className="text-neutral-300 block">X: {(match.x0 * 512).toFixed(1)} px</span>
            <span className="text-neutral-300 block">Y: {(match.y0 * 512).toFixed(1)} px</span>
          </div>
        </div>

        {/* Reference Crop */}
        <div className="flex items-center gap-3 bg-neutral-950/60 p-2.5 rounded border border-neutral-800/70">
          <canvas
            ref={cropCanvas1Ref}
            width={72}
            height={72}
            className="w-16 h-16 rounded border border-neutral-700/80 bg-black flex-shrink-0"
          />
          <div className="text-[10px]">
            <span className="text-neutral-500 block uppercase">{label1} (REFERENCE)</span>
            <span className="text-neutral-300 block">X: {(match.x1 * 512).toFixed(1)} px</span>
            <span className="text-neutral-300 block">Y: {(match.y1 * 512).toFixed(1)} px</span>
          </div>
        </div>

        {/* Confidence & Vector Telemetry */}
        <div className="bg-neutral-950/60 p-2.5 rounded border border-neutral-800/70 flex flex-col justify-center text-[10px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-neutral-500 uppercase">CONFIDENCE:</span>
            <span className="text-amber-400 font-semibold">{match.confidence.toFixed(3)} ({confidencePct}%)</span>
          </div>
          <div className="text-amber-400/90 font-mono tracking-wider mb-2">{confBar}</div>
          <div className="text-[9px] text-neutral-500 flex justify-between">
            <span>NORM COORD:</span>
            <span>[{match.x0.toFixed(3)}, {match.y0.toFixed(3)}] → [{match.x1.toFixed(3)}, {match.y1.toFixed(3)}]</span>
          </div>
        </div>
      </div>
    </div>
  )
}
