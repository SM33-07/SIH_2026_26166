import React, { useEffect, useState } from 'react'
import { getProvenance } from '../api/client'

export default function LimitationsSection() {
  const [provenance, setProvenance] = useState(null)

  useEffect(() => {
    getProvenance()
      .then((data) => setProvenance(data))
      .catch(() => {})
  }, [])

  const limits = [
    {
      key: 'IIRS Spatial Resolution',
      body: 'Current proxy products operate at ~80 m/px. Precise sub-meter boresight registration relies on TMC-2 intermediate triangulation to bridge the 308.9× cumulative scale gap.',
    },
    {
      key: 'Polar Shadowing',
      body: 'High-latitude permanently shadowed regions (PSRs) lack sufficient radiometric signal for LoFTR dense feature extraction and homography convergence.',
    },
    {
      key: 'Non-Calibrated Score',
      body: 'Consistency scores measure normalized evidence alignment across geometry and retrieval axes. They do not represent statistical probabilities or confidence intervals.',
    },
    {
      key: 'Planar Homography',
      body: 'High-relief escarpments and steep crater walls introduce 3D parallax requiring local affine mesh warping rather than global 3×3 projective homography.',
    },
  ]

  const artifacts = [
    { label: 'TMC-2 LoFTR Matcher', val: 'tmc2_loftr_available.pt · 11.56M params' },
    { label: 'OHRC Embedder', val: 'ResNet-18 · 256-dim feature vector' },
    { label: 'Observation Catalog', val: '1,514 verified points (KDTree index)' },
    { label: 'Same-Zone Threshold', val: '0.020° ≈ 606 m surface radius' },
  ]

  return (
    <section id="limitations-section" className="tech-card">
      {/* Header */}
      <div className="tech-header flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
            Scientific Limitations &amp; Model Provenance
          </div>
          <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
            Transparent disclosure of hardware constraints, proxy assumptions, and data provenance.
          </p>
        </div>
        <span className="text-[8px] font-mono border border-white/[0.1] text-amber-400/70 px-2 py-0.5 uppercase tracking-widest shrink-0 hidden sm:block">
          PROVENANCE &amp; AUDIT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        {/* Limitations column */}
        <div className="p-0 divide-y divide-white/[0.05]">
          {limits.map((l) => (
            <div key={l.key} className="px-4 py-3 flex gap-3">
              <div className="w-1.5 h-1.5 bg-amber-600/60 rounded-full mt-1.5 shrink-0" />
              <div>
                <div className="text-[10px] font-mono font-semibold text-neutral-200 mb-0.5">{l.key}</div>
                <p className="text-[10px] font-mono text-neutral-500 leading-relaxed">{l.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Provenance column */}
        <div className="divide-y divide-white/[0.05]">
          <div className="px-4 py-2.5 bg-black/20 text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
            Model Artifacts &amp; Architecture
          </div>
          {artifacts.map((a) => (
            <div key={a.label} className="px-4 py-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-neutral-500">{a.label}</span>
              <span className="text-neutral-200 text-right">{a.val}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
