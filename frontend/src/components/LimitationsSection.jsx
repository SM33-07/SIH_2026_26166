import React from 'react'
import { PROVENANCE } from '../data/demoData'

export default function LimitationsSection() {
  return (
    <section id="limitations" className="py-12 px-6 max-w-7xl mx-auto font-mono bg-transparent">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] text-amber-500 uppercase tracking-widest block mb-1">
            SCIENTIFIC BOUNDARIES & PROVENANCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2F2F2] uppercase tracking-tight">
            System Limitations & Provenance
          </h2>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Explicit documentation of sensor caveats, dataset boundaries, and non-claim guarantees.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] text-xs text-[#F2F2F2] self-start">
          <span className="text-[#5F5F5F] font-bold">STANDARD: </span>
          <span className="text-amber-500 font-bold">ISRO PDS4 COMPLIANT</span>
        </div>
      </div>

      {/* Grid: Limitations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PROVENANCE.limitations.map((item) => (
          <div
            key={item.id}
            className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] p-5 flex flex-col justify-between space-y-3"
          >
            <div className="border-b border-[#252525] pb-2 flex items-center justify-between">
              <span className="text-[10px] text-amber-500 font-bold uppercase">
                BOUND: {item.id.toUpperCase()}
              </span>
              <span className="text-[9px] border border-[#303030] text-[#5F5F5F] px-1">
                ENFORCED
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#F2F2F2] uppercase mb-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                {item.detail}
              </p>
            </div>

            <div className="pt-2 border-t border-[#252525] text-[10px] text-[#5F5F5F]">
              DATA PROVENANCE GUARANTEED
            </div>
          </div>
        ))}
      </div>

      {/* Scientific State Definitions Footer Bar */}
      <div className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">

        <div>
          <span className="font-bold text-[#F2F2F2] uppercase block">SCIENTIFIC STATE DEFINITIONS</span>
          <span className="text-[11px] text-[#5F5F5F]">Standardized UI indicators across all multi-modal readouts</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center space-x-1.5 bg-[#050505] px-2.5 py-1 border border-[#252525]">
            <span className="w-1.5 h-1.5 bg-[#F2F2F2]" />
            <span className="text-[#A0A0A0]">REAL DATA CO-REGISTERED</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#050505] px-2.5 py-1 border border-[#252525]">
            <span className="w-1.5 h-1.5 bg-amber-500" />
            <span className="text-[#A0A0A0]">MODEL VALIDATION PENDING</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#050505] px-2.5 py-1 border border-[#252525]">
            <span className="w-1.5 h-1.5 bg-[#5F5F5F]" />
            <span className="text-[#A0A0A0]">SYNTHETIC EVALUATION DATASET</span>
          </div>
        </div>
      </div>
    </section>
  )
}

