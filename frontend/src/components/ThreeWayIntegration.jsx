import React from 'react'

export default function ThreeWayIntegration({ sensorSpecs }) {
  const specs = sensorSpecs?.sensors || {
    iirs: { name: 'IIRS', gsd_m_per_px: 86.5, spectral_band: '0.8 – 5.0 µm' },
    tmc2: { name: 'TMC-2', gsd_m_per_px: 5.0, spectral_band: '500 – 850 nm' },
    ohrc: { name: 'OHRC', gsd_m_per_px: 0.28, spectral_band: '450 – 900 nm' },
  }

  const sensors = [
    {
      key: 'iirs',
      label: 'IIRS',
      role: 'Hyperspectral Context',
      gsd: specs.iirs?.gsd_m_per_px || 86.5,
      band: specs.iirs?.spectral_band || '0.8 – 5.0 µm',
      desc: 'Regional mineralogical survey with 256 spectral bands across 0.8–5.0 µm. Coarse spatial footprint covers large lunar surface sectors.',
      accentClass: 'text-red-400',
      dotClass: 'bg-red-400',
      borderClass: 'border-l-red-700/60',
    },
    {
      key: 'tmc2',
      label: 'TMC-2',
      role: 'Stereo Bridge',
      gsd: specs.tmc2?.gsd_m_per_px || 5.0,
      band: specs.tmc2?.spectral_band || '500 – 850 nm',
      desc: 'Stereo terrain mapper. Bridges 308.9× cumulative scale gap between IIRS and OHRC. Geometric anchor for hierarchical co-registration.',
      accentClass: 'text-amber-400',
      dotClass: 'bg-amber-400',
      borderClass: 'border-l-amber-600/60',
      isAnchor: true,
    },
    {
      key: 'ohrc',
      label: 'OHRC',
      role: 'High-Res Target',
      gsd: specs.ohrc?.gsd_m_per_px || 0.28,
      band: specs.ohrc?.spectral_band || '450 – 900 nm',
      desc: 'Sub-meter hazard-avoidance imaging. Resolves boulders, crater rims and fine surface morphology at landing-site precision.',
      accentClass: 'text-neutral-300',
      dotClass: 'bg-neutral-400',
      borderClass: 'border-l-neutral-600/40',
    },
  ]

  return (
    <section id="integration-section" className="tech-card">
      {/* Header bar */}
      <div className="tech-header flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
            Chandrayaan-2 Sensor Integration
          </div>
          <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
            TMC-2 bridges 308.9× cumulative scale disparity between IIRS and OHRC.
          </p>
        </div>
        <span className="text-[8px] font-mono border border-amber-600/30 text-amber-500/70 px-2 py-0.5 uppercase tracking-widest shrink-0 hidden sm:block">
          RESOLUTION BRIDGE
        </span>
      </div>

      {/* Sensor rows */}
      <div className="divide-y divide-white/[0.05]">
        {sensors.map((s) => (
          <div
            key={s.key}
            className={`flex items-start gap-4 px-4 py-3.5 border-l-2 ${s.borderClass} ${s.isAnchor ? 'bg-amber-500/[0.03]' : ''}`}
          >
            {/* Sensor ID column */}
            <div className="w-16 shrink-0">
              <div className={`text-sm font-mono font-bold tracking-wide ${s.accentClass}`}>{s.label}</div>
              <div className="text-[9px] font-mono text-neutral-600 mt-0.5 uppercase tracking-wider">{s.role}</div>
            </div>

            {/* GSD + band telemetry */}
            <div className="w-32 shrink-0 hidden sm:block">
              <div className="text-[10px] font-mono text-neutral-400">
                <span className="text-neutral-600">GSD</span>&nbsp;
                <span className={`font-bold ${s.accentClass}`}>{s.gsd} m/px</span>
              </div>
              <div className="text-[10px] font-mono text-neutral-500 mt-0.5">{s.band}</div>
            </div>

            {/* Description */}
            <p className="text-[10px] font-mono text-neutral-400 leading-relaxed flex-1">{s.desc}</p>

            {/* Anchor badge */}
            {s.isAnchor && (
              <span className="shrink-0 text-[8px] font-mono border border-amber-600/30 text-amber-500/70 px-1.5 py-0.5 uppercase tracking-widest self-center hidden md:block">
                ANCHOR
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Scale ratio strip */}
      <div className="px-4 py-2 border-t border-white/[0.06] bg-black/30 text-[9px] font-mono text-neutral-500 flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="text-neutral-600 uppercase tracking-wider">Scale ratios</span>
        <span>IIRS → TMC-2 <strong className="text-amber-500/80 ml-1">17.30×</strong></span>
        <span>TMC-2 → OHRC <strong className="text-amber-500/80 ml-1">17.86×</strong></span>
        <span>IIRS → OHRC <strong className="text-red-400/70 ml-1">308.93×</strong></span>
      </div>
    </section>
  )
}
