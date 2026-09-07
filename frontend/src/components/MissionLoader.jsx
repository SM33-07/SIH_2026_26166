import React, { useState, useEffect } from 'react'

const SEQUENCE_STEPS = [
  { label: 'INITIALIZING MISSION CONSOLE', progress: 15 },
  { label: 'LOADING LUNAR SURFACE ASSETS', progress: 38 },
  { label: 'INDEXING THREE-SENSOR SPATIAL CATALOG', progress: 62 },
  { label: 'CALIBRATING CORRESPONDENCE ENGINE (LoFTR)', progress: 85 },
  { label: 'ESTABLISHING ISRO CHANDRAYAAN LINK', progress: 96 },
  { label: 'MISSION READY', progress: 100 },
]

export default function MissionLoader({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(5)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      onComplete?.()
      return
    }

    const totalDuration = 5200 // ~5.2 seconds total
    const intervalTime = totalDuration / SEQUENCE_STEPS.length

    const timer = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1
        if (next >= SEQUENCE_STEPS.length) {
          clearInterval(timer)
          setProgress(100)
          setTimeout(() => {
            setIsDone(true)
            setTimeout(() => onComplete?.(), 400)
          }, 600)
          return prev
        }
        setProgress(SEQUENCE_STEPS[next].progress)
        return next
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [onComplete])

  const currentStep = SEQUENCE_STEPS[stepIndex] || SEQUENCE_STEPS[0]

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050608] text-neutral-200 transition-opacity duration-700 select-none ${
        isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Starfield & Subtle Radar Scan */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,25,35,0.7)_0%,#030406_80%)]" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Subtle scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* ChandraVue Brand Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-neutral-700/60 flex items-center justify-center bg-black/60 shadow-[0_0_24px_rgba(245,158,11,0.08)]">
            {/* Wireframe Moon Silhouette */}
            <div className="w-14 h-14 rounded-full border border-dashed border-amber-500/40 animate-[spin_24s_linear_infinite]" />
            <div className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-mono tracking-[0.35em] text-neutral-100 font-bold mb-1">
          CHANDRA<span className="text-amber-400">VUE</span>
        </h1>
        <p className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 mb-8 uppercase">
          SIH26166 • Lunar Three-Sensor Correspondence System
        </p>

        {/* Dynamic Status Readout */}
        <div className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded px-4 py-3 mb-4 backdrop-blur-sm">
          <div className="flex justify-between items-center text-[10px] font-mono mb-2 text-neutral-400">
            <span className="tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              {currentStep.label}
            </span>
            <span className="text-amber-400 font-semibold">{progress}%</span>
          </div>

          {/* Restrained Progress Bar */}
          <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick telemetry note */}
        <div className="flex items-center gap-4 text-[9px] font-mono text-neutral-500 tracking-wider uppercase">
          <span>OHRC 0.28m</span>
          <span>•</span>
          <span>TMC-2 5.0m</span>
          <span>•</span>
          <span>IIRS 86.5m</span>
        </div>
      </div>
    </div>
  )
}
