import React from 'react'
import { METHODOLOGY } from '../data/demoData'

export default function MethodologySection() {
  return (
    <section id="methodology" className="py-12 px-6 max-w-7xl mx-auto border-b border-[#252525] font-mono bg-transparent">
      {/* Section Header */}
      <div className="max-w-3xl mb-8">
        <span className="text-[11px] text-amber-500 uppercase tracking-widest block mb-1">
          ALGORITHMIC ARCHITECTURE
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2F2F2] uppercase tracking-tight">
          7-Stage Image Alignment Pipeline
        </h2>
        <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
          From raw PDS4 optical telemetry ingest to sub-pixel co-registration and 3-way cycle error verification.
        </p>
      </div>

      {/* Linear Technical Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METHODOLOGY.pipeline_steps.map((step, idx) => {
          const isCompleted = step.status === 'completed'
          return (
            <div
              key={step.step}
              className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] p-4 flex flex-col justify-between space-y-3"
            >

              {/* Header: Numbered Stage */}
              <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                <span className="px-2 py-0.5 border border-[#303030] bg-[#151515] text-amber-500 font-bold text-xs">
                  0{step.step}
                </span>
                <span className={`text-[9px] uppercase border px-1.5 py-0.2 ${
                  isCompleted
                    ? 'border-[#303030] text-[#F2F2F2] bg-[#080808]'
                    : 'border-amber-500/40 text-amber-500 bg-[#080808]'
                }`}>
                  {isCompleted ? 'VERIFIED' : 'ACTIVE'}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#F2F2F2] uppercase tracking-tight">
                  {step.title}
                </h4>
                <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Technical Detail Footer */}
              <div className="pt-2 border-t border-[#252525] text-[10px] text-[#5F5F5F] truncate">
                SPEC: {step.detail}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

