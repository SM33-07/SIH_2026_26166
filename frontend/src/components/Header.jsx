import { useEffect } from 'react'
import useMatchStore from '../store/matchStore'
import { checkHealth } from '../api/client'

const MODE_DOT = {
  true: 'bg-green-400',
  false: 'bg-red-400',
}

export default function Header() {
  const { health, healthError, setHealth, setHealthError } = useMatchStore()

  useEffect(() => {
    let mounted = true
    checkHealth()
      .then((h) => mounted && setHealth(h))
      .catch(() => mounted && setHealthError())
    // Poll every 60 seconds
    const id = setInterval(() => {
      checkHealth()
        .then((h) => mounted && setHealth(h))
        .catch(() => mounted && setHealthError())
    }, 60_000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const online = health?.status === 'ok'
  const device = health?.device ?? '—'
  const models = health?.models_loaded ?? false
  const indexes = health?.indexes_loaded ?? false

  return (
    <header className="w-full bg-lunar-card border-b border-lunar-border relative z-40">
      {/* Top bar */}
      <div className="px-5 py-3 flex items-center justify-between gap-4">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 border border-lunar-accent/50 bg-lunar-accent/10 shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-lunar-accent" fill="currentColor">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-3-8a3 3 0 1 0 3-3 3.003 3.003 0 0 0-3 3z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-slate-100 font-bold text-sm tracking-wider uppercase truncate">
              Lunar Correspondence Engine
            </div>
            <div className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">
              SIH26166 · Chandrayaan-2 Multi-Sensor Registration
            </div>
          </div>
        </div>

        {/* System status telemetry */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase shrink-0">
          {healthError ? (
            <span className="flex items-center gap-1.5 text-red-400 border border-red-800 bg-red-950/50 px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              BACKEND UNAVAILABLE
            </span>
          ) : health == null ? (
            <span className="flex items-center gap-1.5 text-slate-500 border border-slate-800 px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 skeleton inline-block" />
              CONNECTING…
            </span>
          ) : (
            <div className="flex items-center gap-3 border border-lunar-border px-3 py-1.5 bg-lunar-surface">
              <span className={`flex items-center gap-1.5 ${online ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${online ? 'bg-green-400' : 'bg-red-400'}`} />
                {online ? 'ONLINE' : 'DEGRADED'}
              </span>
              <span className="text-lunar-border">|</span>
              <span className={`flex items-center gap-1 ${models ? 'text-amber-400' : 'text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${models ? 'bg-amber-400' : 'bg-amber-400'}`} />
                MODEL {models ? 'READY' : 'LOADING'}
              </span>
              <span className="text-lunar-border">|</span>
              <span className="text-slate-400">DEV: <span className="text-slate-200">{device.toUpperCase()}</span></span>
              {health?.common_points && (
                <>
                  <span className="text-lunar-border">|</span>
                  <span className="text-slate-400">
                    PTS: <span className="text-slate-200">{health.common_points.toLocaleString()}</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation / Sensor tag row */}
      <div className="border-t border-lunar-border/40 px-5 py-1.5 flex items-center justify-between gap-3 overflow-x-auto text-[10px] font-mono">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-mono tracking-widest text-slate-600 uppercase mr-1">SENSORS:</span>
          {[
            { name: 'IIRS', color: 'text-sensor-iirs border-sensor-iirs/40 bg-sensor-iirs/5' },
            { name: 'TMC-2', color: 'text-sensor-tmc2 border-sensor-tmc2/40 bg-sensor-tmc2/5' },
            { name: 'OHRC', color: 'text-sensor-ohrc border-sensor-ohrc/40 bg-sensor-ohrc/5' },
          ].map(({ name, color }) => (
            <span key={name} className={`text-[9px] font-mono border px-1.5 py-0.2 ${color}`}>
              {name}
            </span>
          ))}
        </div>

        <nav className="flex items-center gap-3 text-slate-500 shrink-0">
          <a href="#integration-section" className="hover:text-amber-300 transition-colors uppercase text-[9px] tracking-wider">
            Integration
          </a>
          <span>·</span>
          <a href="#performance-section" className="hover:text-amber-300 transition-colors uppercase text-[9px] tracking-wider">
            Performance
          </a>
          <span>·</span>
          <a href="#methodology-section" className="hover:text-amber-300 transition-colors uppercase text-[9px] tracking-wider">
            Methodology
          </a>
          <span>·</span>
          <a href="#limitations-section" className="hover:text-amber-300 transition-colors uppercase text-[9px] tracking-wider">
            Limitations
          </a>
        </nav>
      </div>
    </header>
  )
}
