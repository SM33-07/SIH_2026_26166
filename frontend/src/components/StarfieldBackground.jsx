import { useEffect, useRef } from 'react'

/**
 * Fullscreen Realistic Space Starfield
 * - Thousands of tiny stars with realistic depth and subtle twinkle
 * - Different star brightness and sizes (no colorful disco particles)
 * - Slow gentle parallax / cosmic drift
 * - Stays active behind the entire application
 */
export default function StarfieldBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Generate 1,200 stars with variable depths and subtle twinkle speeds
    const starCount = Math.min(1200, Math.floor((width * height) / 1200))
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.85 ? Math.random() * 0.9 + 0.3 : Math.random() * 1.5 + 1.0,
      baseAlpha: Math.random() * 0.7 + 0.2,
      alpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: (Math.random() * 0.008 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
      twinklePhase: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: (Math.random() - 0.5) * 0.02,
    }))

    let time = 0

    const render = () => {
      time += 0.016
      ctx.fillStyle = '#010204'
      ctx.fillRect(0, 0, width, height)

      // Very faint deep-space galactic gradient
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.1,
        width * 0.5,
        height * 0.4,
        width * 0.8
      )
      grad.addColorStop(0, 'rgba(12, 14, 20, 0.4)')
      grad.addColorStop(1, 'rgba(1, 2, 4, 1)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Draw all stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        s.x += s.speedX
        s.y += s.speedY

        if (s.x < 0) s.x = width
        if (s.x > width) s.x = 0
        if (s.y < 0) s.y = height
        if (s.y > height) s.y = 0

        const alpha = Math.max(
          0.1,
          Math.min(0.95, s.baseAlpha + Math.sin(time * 1.5 + s.twinklePhase) * 0.25)
        )

        ctx.fillStyle = `rgba(240, 243, 250, ${alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ background: '#010204' }}
    />
  )
}
