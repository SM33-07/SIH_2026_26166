import React from 'react'
import useMatchStore from '../store/matchStore'

export default function MissionControlHeader() {
  const { health, healthError } = useMatchStore()

  const online = health?.status === 'ok'
  const device = health?.device ?? 'CPU'
  const pointsCount = health?.common_points ?? '1,514'

  return (
    <header className="relative z-30 w-full border-b border-white/[0.08] bg-[#020305]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Mission Identity */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500/90 rounded-none transform rotate-45 border border-amber-300/40 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase">
              CHANDRAYAAN-2
            </span>
            <span className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase">
              SIH26166 · MULTI-SENSOR CORRESPONDENCE ENGINE
            </span>
          </div>
        </div>

        {/* Minimal Mission Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-[11px] font-mono tracking-widest text-neutral-400">
          <a href="#hero-moon" className="hover:text-amber-400 transition-colors uppercase">
            EXPLORE
          </a>
          <span className="text-neutral-700">/</span>
          <a href="#observation-workspace" className="hover:text-amber-400 transition-colors uppercase">
            OBSERVE
          </a>
          <span className="text-neutral-700">/</span>
          <a href="#correspondence-workspace" className="hover:text-amber-400 transition-colors uppercase">
            CORRESPOND
          </a>
          <span className="text-neutral-700">/</span>
          <a href="#integration-section" className="hover:text-amber-400 transition-colors uppercase">
            VERIFY
          </a>
          <span className="text-neutral-700">/</span>
          <a href="#performance-section" className="hover:text-amber-400 transition-colors uppercase">
            RESULTS
          </a>
        </nav>

        {/* Live Telemetry Status Strip */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono">
          {healthError ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-red-800/80 bg-red-950/40 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>BACKEND OFFLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-1 border border-white/[0.08] bg-black/40 text-neutral-300">
              <span className="flex items-center gap-1.5 text-neutral-200">
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400' : 'bg-amber-400'}`} />
                {online ? 'ONLINE' : 'CONNECTING'}
              </span>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-400">
                DEV: <span className="text-neutral-200 font-bold">{device.toUpperCase()}</span>
              </span>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-400">
                PTS: <span className="text-amber-400 font-bold">{pointsCount}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
