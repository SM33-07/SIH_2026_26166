import { useEffect, useRef } from 'react'

/**
 * Pure Black Dynamic Cosmic Starfield Background
 * - Pure pitch-black background (#000000)
 * - Crisp white & silver twinkling stars with 3D depth parallax
 * - Dynamic periodic shooting stars / meteors
 * - Subtle diffraction flares on bright stars
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

    // Mouse tracking for dynamic 3D depth parallax
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 }

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initStars()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    // Crisp white, silver & neutral warm star color tones (NO blue tints)
    const STAR_COLORS = [
      'rgba(255, 255, 255, ',   // Pure white
      'rgba(240, 240, 245, ',   // Silver white
      'rgba(255, 248, 235, ',   // Warm soft starlight
      'rgba(230, 230, 235, ',   // Platinum
    ]

    let stars = []
    let meteors = []

    function initStars() {
      const densityFactor = (width * height) / 1000
      const starCount = Math.min(1400, Math.floor(densityFactor))

      stars = []
      for (let i = 0; i < starCount; i++) {
        const depth = Math.random() // 0 (far away) to 1 (near foreground)
        const isBright = depth > 0.88
        const colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          size: isBright ? Math.random() * 1.8 + 1.2 : Math.random() * 1.0 + 0.3,
          colorPrefix,
          baseAlpha: Math.random() * 0.6 + 0.2,
          alpha: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.03 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          speedX: (Math.random() - 0.5) * (0.05 + depth * 0.15),
          speedY: (Math.random() - 0.5) * (0.05 + depth * 0.15),
          hasFlare: isBright && Math.random() > 0.4,
        })
      }
    }

    function createMeteor() {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3 // ~45 deg streak
      const speed = Math.random() * 12 + 10
      const startX = Math.random() * (width * 1.2) - width * 0.1
      const startY = Math.random() * (height * 0.4) - height * 0.2

      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 120 + 80,
        life: 1,
        decay: Math.random() * 0.015 + 0.012,
        size: Math.random() * 1.5 + 1.0,
      })
    }

    // Check prefers-reduced-motion preference
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    initStars()

    let time = 0
    let lastMeteorTime = 0

    const render = () => {
      time += 0.016

      // Smooth cursor parallax interpolation (suppressed in reduced motion)
      if (!prefersReducedMotion) {
        mouse.x += (mouse.targetX - mouse.x) * 0.03
        mouse.y += (mouse.targetY - mouse.y) * 0.03
      }

      const parallaxX = prefersReducedMotion ? 0 : (mouse.x - width / 2) * 0.02
      const parallaxY = prefersReducedMotion ? 0 : (mouse.y - height / 2) * 0.02

      // Pure pitch-black background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Spawn meteors periodically (disabled if reduced motion requested)
      if (!prefersReducedMotion && time - lastMeteorTime > Math.random() * 2.5 + 2.5) {
        if (meteors.length < 3) {
          createMeteor()
          lastMeteorTime = time
        }
      }

      // Draw & Update Meteors / Shooting Stars
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        m.x += m.vx
        m.y += m.vy
        m.life -= m.decay

        if (m.life <= 0 || m.x > width * 1.3 || m.y > height * 1.3) {
          meteors.splice(i, 1)
          continue
        }

        const headX = m.x
        const headY = m.y
        const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length
        const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length

        const meteorGrad = ctx.createLinearGradient(headX, headY, tailX, tailY)
        meteorGrad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`)
        meteorGrad.addColorStop(0.3, `rgba(220, 220, 230, ${m.life * 0.7})`)
        meteorGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.strokeStyle = meteorGrad
        ctx.lineWidth = m.size
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(headX, headY)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()

        // Glowing head of meteor
        ctx.fillStyle = `rgba(255, 255, 255, ${m.life})`
        ctx.beginPath()
        ctx.arc(headX, headY, m.size * 1.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Render All Stars with multi-depth Parallax & Lens Flares
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]

        s.x += s.speedX
        s.y += s.speedY

        if (s.x < 0) s.x = width
        if (s.x > width) s.x = 0
        if (s.y < 0) s.y = height
        if (s.y > height) s.y = 0

        const drawX = s.x + parallaxX * (s.depth * 1.5)
        const drawY = s.y + parallaxY * (s.depth * 1.5)

        const currentAlpha = Math.max(
          0.08,
          Math.min(0.98, s.baseAlpha + Math.sin(time * s.twinkleSpeed * 100 + s.twinklePhase) * 0.35)
        )

        ctx.fillStyle = `${s.colorPrefix}${currentAlpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(drawX, drawY, s.size, 0, Math.PI * 2)
        ctx.fill()

        // Soft halo glow on bright stars
        if (s.size > 1.2) {
          ctx.fillStyle = `${s.colorPrefix}${(currentAlpha * 0.2).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(drawX, drawY, s.size * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // 4-point Diffraction Cross Flare
        if (s.hasFlare && currentAlpha > 0.5) {
          const flareLen = s.size * (4 + Math.sin(time * 3 + s.twinklePhase) * 1.5)
          const flareAlpha = (currentAlpha * 0.35).toFixed(3)
          ctx.strokeStyle = `${s.colorPrefix}${flareAlpha})`
          ctx.lineWidth = 0.5

          ctx.beginPath()
          ctx.moveTo(drawX - flareLen, drawY)
          ctx.lineTo(drawX + flareLen, drawY)
          ctx.moveTo(drawX, drawY - flareLen)
          ctx.lineTo(drawX, drawY + flareLen)
          ctx.stroke()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // Pause rendering loop when browser tab is inactive to preserve CPU & GPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId)
      } else {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = requestAnimationFrame(render)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    render()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ background: '#000000' }}
    />
  )
}
