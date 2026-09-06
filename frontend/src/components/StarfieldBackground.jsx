import React, { useEffect, useRef } from 'react'

export default function StarfieldBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let stars = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      stars = []
      // Density for visible deep space starfield across entire workstation view
      const numStars = Math.floor((canvas.width * canvas.height) / 7000)
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.4 + 0.4,
          alpha: Math.random() * 0.6 + 0.2,
          twinkleSpeed: (Math.random() * 0.01 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
          speedY: Math.random() * 0.08 + 0.02,
        })
      }
    }

    const render = () => {
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        star.alpha += star.twinkleSpeed
        if (star.alpha > 0.85 || star.alpha < 0.15) {
          star.twinkleSpeed = -star.twinkleSpeed
        }

        star.y -= star.speedY
        if (star.y < 0) {
          star.y = canvas.height
          star.x = Math.random() * canvas.width
        }

        ctx.fillStyle = `rgba(240, 240, 248, ${Math.max(0.1, star.alpha).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  )
}

