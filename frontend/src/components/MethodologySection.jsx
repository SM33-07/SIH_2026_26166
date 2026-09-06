import React from 'react'
import { METHODOLOGY_STEPS } from '../data/demoData'

export default function MethodologySection() {
  return (
    <section id="methodology-section" className="tech-card">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
            Scientific Methodology & Processing Pipeline
          </div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1">
            Scale-invariant co-registration pipeline for Chandrayaan-2 multi-sensor optical imagery.
          </p>
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {METHODOLOGY_STEPS.map((step, idx) => (
          <div key={idx} className="tech-card-inset p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-1 bg-amber-400 rounded-full" />
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>
              <div className="text-[11px] font-mono font-medium text-neutral-200 mb-1.5">{step.title}</div>
              <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
