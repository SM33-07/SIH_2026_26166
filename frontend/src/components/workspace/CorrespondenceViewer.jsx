import React, { useRef, useEffect, useState, useCallback } from 'react'

export default function CorrespondenceViewer({
  imgSrc0 = null,
  imgSrc1 = null,
  label0 = 'SOURCE (OHRC)',
  label1 = 'REFERENCE (TMC-2)',
  matches = [],
  selectedMatchIndex = null,
  onSelectMatch,
  viewMode = 'sideBySide',
  showMatches = true,
  showInliers = true,
  showOutliers = false,
  showGrid = false,
  zoom = 1,
  onZoomChange,
  alignedImageUrl = null,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  // Images loaded state
  const [image0, setImage0] = useState(null)
  const [image1, setImage1] = useState(null)
  const [alignedImage, setAlignedImage] = useState(null)

  // Overlay & Split sliders
  const [overlayOpacity, setOverlayOpacity] = useState(0.5)
  const [splitPos, setSplitPos] = useState(0.5) // [0, 1] horizontal split

  // Load HTML Image elements
  useEffect(() => {
    if (!imgSrc0) {
      setImage0(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage0(img)
    img.src = imgSrc0
  }, [imgSrc0])

  useEffect(() => {
    if (!imgSrc1) {
      setImage1(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage1(img)
    img.src = imgSrc1
  }, [imgSrc1])

  useEffect(() => {
    if (!alignedImageUrl) {
      setAlignedImage(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setAlignedImage(img)
    img.src = alignedImageUrl
  }, [alignedImageUrl])

  // Draw Canvas — Stationary, crisp, non-draggable images
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.save()

    // Background
    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, W, H)

    // Filter matches
    const visibleMatches = matches.filter((m) => {
      if (m.inlier && !showInliers) return false
      if (!m.inlier && !showOutliers) return false
      return true
    })

    if (viewMode === 'sideBySide') {
      const paneW = W / 2 - 8
      const paneH = H - 36
      const paneY = 24

      // Draw Pane 0 (Source)
      ctx.fillStyle = '#0a0d14'
      ctx.fillRect(4, paneY, paneW, paneH)
      if (image0) {
        ctx.drawImage(image0, 4, paneY, paneW, paneH)
      } else {
        ctx.fillStyle = '#1e293b'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Awaiting Source Imagery...', 4 + paneW / 2, paneY + paneH / 2)
      }

      // Draw Pane 1 (Reference)
      const pane1X = W / 2 + 4
      ctx.fillStyle = '#0a0d14'
      ctx.fillRect(pane1X, paneY, paneW, paneH)
      if (image1) {
        ctx.drawImage(image1, pane1X, paneY, paneW, paneH)
      } else {
        ctx.fillStyle = '#1e293b'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Awaiting Reference Imagery...', pane1X + paneW / 2, paneY + paneH / 2)
      }

      // Draw optional grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)'
        ctx.lineWidth = 1
        for (let x = 4; x <= W - 4; x += 40) {
          ctx.beginPath()
          ctx.moveTo(x, paneY)
          ctx.lineTo(x, paneY + paneH)
          ctx.stroke()
        }
        for (let y = paneY; y <= paneY + paneH; y += 40) {
          ctx.beginPath()
          ctx.moveTo(4, y)
          ctx.lineTo(W - 4, y)
          ctx.stroke()
        }
      }

      // Draw Correspondence lines and keypoints
      if (showMatches && visibleMatches.length > 0) {
        visibleMatches.forEach((m, idx) => {
          const pt0X = 4 + m.x0 * paneW
          const pt0Y = paneY + m.y0 * paneH
          const pt1X = pane1X + m.x1 * paneW
          const pt1Y = paneY + m.y1 * paneH

          const isSelected = selectedMatchIndex === idx
          const isPrimaryInlier = m.inlier

          // Connecting line
          ctx.beginPath()
          ctx.moveTo(pt0X, pt0Y)
          ctx.lineTo(pt1X, pt1Y)
          ctx.strokeStyle = isSelected
            ? '#f59e0b'
            : isPrimaryInlier
            ? 'rgba(52, 211, 153, 0.45)'
            : 'rgba(239, 68, 68, 0.4)'
          ctx.lineWidth = isSelected ? 2.5 : 1
          ctx.stroke()

          // Source point
          ctx.beginPath()
          ctx.arc(pt0X, pt0Y, isSelected ? 4 : 2.5, 0, Math.PI * 2)
          ctx.fillStyle = isSelected ? '#f59e0b' : isPrimaryInlier ? '#34d399' : '#ef4444'
          ctx.fill()

          // Reference point
          ctx.beginPath()
          ctx.arc(pt1X, pt1Y, isSelected ? 4 : 2.5, 0, Math.PI * 2)
          ctx.fillStyle = isSelected ? '#f59e0b' : isPrimaryInlier ? '#34d399' : '#ef4444'
          ctx.fill()

          // Crosshair on selected match
          if (isSelected) {
            ctx.strokeStyle = '#f59e0b'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pt0X - 7, pt0Y)
            ctx.lineTo(pt0X + 7, pt0Y)
            ctx.moveTo(pt0X, pt0Y - 7)
            ctx.lineTo(pt0X, pt0Y + 7)
            ctx.moveTo(pt1X - 7, pt1Y)
            ctx.lineTo(pt1X + 7, pt1Y)
            ctx.moveTo(pt1X, pt1Y - 7)
            ctx.lineTo(pt1X, pt1Y + 7)
            ctx.stroke()
          }
        })
      }

      // Headers
      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(label0, 6, 16)
      ctx.fillText(label1, pane1X + 2, 16)
    } else if (viewMode === 'overlay') {
      const paneW = W - 16
      const paneH = H - 36
      const paneX = 8
      const paneY = 24

      if (image1) {
        ctx.globalAlpha = 1.0
        ctx.drawImage(image1, paneX, paneY, paneW, paneH)
      }
      if (image0) {
        ctx.globalAlpha = overlayOpacity
        ctx.drawImage(image0, paneX, paneY, paneW, paneH)
        ctx.globalAlpha = 1.0
      }

      // Match dots
      if (showMatches) {
        visibleMatches.forEach((m, idx) => {
          const isSelected = selectedMatchIndex === idx
          const ptX = paneX + m.x1 * paneW
          const ptY = paneY + m.y1 * paneH
          ctx.beginPath()
          ctx.arc(ptX, ptY, isSelected ? 4 : 2.5, 0, Math.PI * 2)
          ctx.fillStyle = isSelected ? '#f59e0b' : m.inlier ? '#34d399' : '#ef4444'
          ctx.fill()
        })
      }
    } else if (viewMode === 'split') {
      const paneW = W - 16
      const paneH = H - 36
      const paneX = 8
      const paneY = 24
      const splitX = paneX + splitPos * paneW

      if (image1) ctx.drawImage(image1, paneX, paneY, paneW, paneH)

      // Clip left side for image0
      if (image0) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(paneX, paneY, splitPos * paneW, paneH)
        ctx.clip()
        ctx.drawImage(image0, paneX, paneY, paneW, paneH)
        ctx.restore()
      }

      // Curtain Line
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(splitX, paneY)
      ctx.lineTo(splitX, paneY + paneH)
      ctx.stroke()
    } else if (viewMode === 'difference') {
      const paneW = W - 16
      const paneH = H - 36
      const paneX = 8
      const paneY = 24

      if (alignedImage) {
        ctx.drawImage(alignedImage, paneX, paneY, paneW, paneH)
      } else {
        ctx.fillStyle = '#1e293b'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Scientific Difference requires an aligned transformed representation.', paneX + paneW / 2, paneY + paneH / 2)
      }
    }

    ctx.restore()
  }, [
    image0,
    image1,
    alignedImage,
    matches,
    selectedMatchIndex,
    viewMode,
    showMatches,
    showInliers,
    showOutliers,
    showGrid,
    overlayOpacity,
    splitPos,
    label0,
    label1,
  ])

  useEffect(() => {
    draw()
  }, [draw])

  // Canvas click to select match nearest to click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas || matches.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Approximate nearest match
    const W = canvas.width
    const H = canvas.height
    const paneW = W / 2 - 8
    const paneH = H - 36
    const paneY = 24

    let nearestIdx = null
    let minDist = 25 // 25px tolerance

    matches.forEach((m, idx) => {
      const p0X = 4 + m.x0 * paneW
      const p0Y = paneY + m.y0 * paneH
      const d0 = Math.hypot(clickX - p0X, clickY - p0Y)

      const p1X = W / 2 + 4 + m.x1 * paneW
      const p1Y = paneY + m.y1 * paneH
      const d1 = Math.hypot(clickX - p1X, clickY - p1Y)

      const d = Math.min(d0, d1)
      if (d < minDist) {
        minDist = d
        nearestIdx = idx
      }
    })

    if (nearestIdx !== null) {
      onSelectMatch?.(nearestIdx)
    }
  }

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth || 800
      canvas.height = 420
      draw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  return (
    <div className="w-full flex flex-col bg-[#05070a] relative select-none">
      {/* Interactive Canvas — Stationary & Locked (Not Draggable or Movable) */}
      <div
        ref={containerRef}
        className="w-full h-[420px] relative overflow-hidden cursor-pointer select-none"
        onClick={handleCanvasClick}
        style={{ userSelect: 'none' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-auto" style={{ userSelect: 'none' }} />

        {/* Overlay slider control */}
        {viewMode === 'overlay' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 border border-neutral-700 rounded px-4 py-1.5 flex items-center gap-3 text-xs font-mono backdrop-blur-sm z-20">
            <span className="text-neutral-400 text-[10px]">OHRC OPACITY:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className="w-32 accent-amber-400 cursor-pointer"
            />
            <span className="text-amber-400 text-[10px] w-8">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
        )}

        {/* Split slider control */}
        {viewMode === 'split' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 border border-neutral-700 rounded px-4 py-1.5 flex items-center gap-3 text-xs font-mono backdrop-blur-sm z-20">
            <span className="text-neutral-400 text-[10px]">SPLIT CURTAIN:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={splitPos}
              onChange={(e) => setSplitPos(parseFloat(e.target.value))}
              className="w-32 accent-amber-400 cursor-pointer"
            />
            <span className="text-amber-400 text-[10px] w-8">
              {Math.round(splitPos * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
