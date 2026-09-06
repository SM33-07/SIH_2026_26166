import useMatchStore from '../store/matchStore'

const MODES = [
  { key: 'explore',    label: 'Orbit & Explore',      icon: '◉' },
  { key: 'coordinate', label: 'Coordinate Search',     icon: '⊕' },
  { key: 'match',      label: '3-Image Analysis',      icon: '⋮⋮' },
  { key: 'demo',       label: 'Controlled Demo',       icon: '⚡' },
]

export default function ModeSelector() {
  const { activeMode, setActiveMode } = useMatchStore()

  return (
    <div className="border-b border-lunar-border bg-lunar-surface/80">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center gap-0 overflow-x-auto">
          {MODES.map(({ key, label, icon }) => {
            const active = activeMode === key
            return (
              <button
                key={key}
                id={`mode-${key}`}
                onClick={() => setActiveMode(key)}
                className={[
                  'flex items-center gap-2 px-5 py-3.5 text-xs font-mono font-semibold uppercase tracking-widest',
                  'border-b-2 transition-all whitespace-nowrap shrink-0',
                  active
                    ? 'border-lunar-accent text-lunar-accent bg-lunar-accent/8'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600',
                ].join(' ')}
                aria-selected={active}
                role="tab"
              >
                <span className={active ? 'text-lunar-accent' : 'text-slate-600'}>{icon}</span>
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
