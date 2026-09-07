import React from 'react'
import useMatchStore from '../store/matchStore'

export default function MissionControlHeader({ onOpenDemo, onOpenCorrespond }) {
  const { health, healthError } = useMatchStore()

  const online = health?.status === 'ok'
  const device = health?.device ?? 'CPU'
  const pointsCount = health?.common_points != null ? Number(health.common_points).toLocaleString() : '—'

  const handleNavClick = (e, targetId) => {
    e.preventDefault()
    if (targetId === 'results-workspace' && onOpenCorrespond) {
      onOpenCorrespond()
      return
    }
    const elem = document.getElementById(targetId)
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header role="banner" className="relative z-30 w-full border-b border-white/[0.08] bg-[#020305]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Mission Identity */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500/90 rounded-none transform rotate-45 border border-amber-300/40 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase">
              CHANDRAVUE
            </span>
            <span className="text-[9px] font-mono tracking-wider text-neutral-300 uppercase">
              SIH26166 · LUNAR MULTI-SENSOR CORRESPONDENCE
            </span>
          </div>
        </div>

        {/* Minimal Mission Navigation */}
        <nav aria-label="Mission Workspace Sections" className="hidden lg:flex items-center gap-5 text-[11px] font-mono tracking-widest text-neutral-300">
          <button
            type="button"
            onClick={(e) => handleNavClick(e, 'hero-moon')}
            className="py-2 px-1 hover:text-amber-400 transition-colors uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer bg-transparent border-none text-[11px] font-mono tracking-widest text-neutral-300"
          >
            EXPLORE
          </button>
          <span className="text-neutral-600">/</span>
          <button
            type="button"
            onClick={(e) => handleNavClick(e, 'observation-workspace')}
            className="py-2 px-1 hover:text-amber-400 transition-colors uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer bg-transparent border-none text-[11px] font-mono tracking-widest text-neutral-300"
          >
            OBSERVE
          </button>
          <span className="text-neutral-600">/</span>
          <button
            type="button"
            onClick={(e) => handleNavClick(e, 'results-workspace')}
            className="py-2 px-1 hover:text-amber-400 transition-colors uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer bg-transparent border-none text-[11px] font-mono tracking-widest text-neutral-300"
          >
            CORRESPOND
          </button>
          <span className="text-neutral-600">/</span>
          <button
            type="button"
            onClick={(e) => handleNavClick(e, 'science-briefing')}
            className="py-2 px-1 hover:text-amber-400 transition-colors uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer bg-transparent border-none text-[11px] font-mono tracking-widest text-neutral-300"
          >
            SCIENCE
          </button>
          <span className="text-neutral-600">/</span>
          <button
            type="button"
            onClick={(e) => handleNavClick(e, 'technical-faq')}
            className="py-2 px-1 hover:text-amber-400 transition-colors uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer bg-transparent border-none text-[11px] font-mono tracking-widest text-neutral-300"
          >
            FAQ
          </button>
        </nav>

        {/* Actions & Live Telemetry Strip */}
        <div className="flex items-center gap-3">
          {/* Prominent Live Demo Trigger */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-2 px-3.5 py-2 border border-amber-500/80 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_14px_rgba(245,158,11,0.3)] cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title="Open Controlled Evaluation Live Inference Modal"
            aria-label="LIVE DEMO — Open Controlled Evaluation Live Inference Modal"
          >
            <span className="text-amber-400">⚡</span>
            <span>LIVE DEMO</span>
          </button>

          {/* Live Telemetry Status Strip */}
          <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-mono" role="status" aria-live="polite">
            {healthError ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 border border-red-800/80 bg-red-950/40 text-red-400 min-h-[36px]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>BACKEND OFFLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-1.5 border border-white/[0.08] bg-black/40 text-neutral-300 min-h-[36px]">
                <span className="flex items-center gap-1.5 text-neutral-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400' : 'bg-amber-400'}`} />
                  {online ? 'ONLINE' : 'CONNECTING'}
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-neutral-300">
                  DEV: <span className="text-neutral-100 font-bold">{device.toUpperCase()}</span>
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-neutral-300">
                  PTS: <span className="text-amber-400 font-bold">{pointsCount}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
