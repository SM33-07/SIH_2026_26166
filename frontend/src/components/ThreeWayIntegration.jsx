import React from 'react'

export default function ThreeWayIntegration() {
  return (
    <section id="integration" className="py-12 px-6 max-w-7xl mx-auto border-b border-[#252525] font-mono bg-transparent">
      {/* Section Header */}
      <div className="max-w-3xl mb-8">
        <span className="text-[11px] text-amber-500 uppercase tracking-widest block mb-1">
          HIERARCHICAL CHAIN SCHEMATIC
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2F2F2] uppercase tracking-tight">
          Three-Way Hierarchical Integration
        </h2>
        <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
          Direct matching across extreme resolution disparity (86.5 m/px to 0.28 m/px — 308.9× scale gap) degrades descriptor repeatability.
          TMC-2 (5.0 m/px) serves as an intermediate geometric bridge to enforce closed-loop 3-way consistency.
        </p>
      </div>

      {/* Technical Diagram Container */}
      <div className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] p-6 sm:p-8">

        {/* Hierarchical Flow Schematic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#252525] divide-y md:divide-y-0 md:divide-x divide-[#252525]">
          {/* Node 1: IIRS Macro Scale */}
          <div className="p-6 bg-[#080808] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#5F5F5F] uppercase">STAGE 01 • MACRO SCALE</span>
                <span className="px-2 py-0.5 border border-[#303030] text-amber-500 font-bold text-[10px]">
                  ~86.5 m/px
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F2F2F2] uppercase">IIRS SPECTROMETER</h3>
              <span className="text-[11px] text-[#A0A0A0] block mt-1">Hyperspectral Mineral Context</span>
            </div>

            <div className="pt-4 border-t border-[#252525] text-[11px] text-[#A0A0A0] space-y-1">
              <div className="flex justify-between"><span className="text-[#5F5F5F]">RANGE:</span><span>0.8 - 5.0 µm</span></div>
              <div className="flex justify-between"><span className="text-[#5F5F5F]">FUNCTION:</span><span>Global Mineralogy</span></div>
            </div>
          </div>

          {/* Node 2: TMC-2 Intermediate Bridge */}
          <div className="p-6 bg-[#111111] flex flex-col justify-between space-y-4 relative border-amber-500/40">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-amber-500 uppercase font-bold">STAGE 02 • INTERMEDIATE BRIDGE</span>
                <span className="px-2 py-0.5 border border-amber-500 text-amber-500 font-bold text-[10px]">
                  ~5.0 m/px
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F2F2F2] uppercase">TMC-2 STEREO CAMERA</h3>
              <span className="text-[11px] text-[#A0A0A0] block mt-1">Surface Morphology & 3D DEM</span>
            </div>

            <div className="pt-4 border-t border-[#252525] text-[11px] text-[#A0A0A0] space-y-1">
              <div className="flex justify-between"><span className="text-[#5F5F5F]">BRIDGE RATIO:</span><span className="text-amber-500 font-bold">17.3× ↔ 17.86×</span></div>
              <div className="flex justify-between"><span className="text-[#5F5F5F]">ROLE:</span><span>Morphological Anchor</span></div>
            </div>
          </div>

          {/* Node 3: OHRC High Resolution Scale */}
          <div className="p-6 bg-[#080808] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#5F5F5F] uppercase">STAGE 03 • HIGH-RES SCALE</span>
                <span className="px-2 py-0.5 border border-[#303030] text-amber-500 font-bold text-[10px]">
                  ~0.28 m/px
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F2F2F2] uppercase">OHRC HIGH RESOLUTION</h3>
              <span className="text-[11px] text-[#A0A0A0] block mt-1">Sub-Meter Optical Imagery</span>
            </div>

            <div className="pt-4 border-t border-[#252525] text-[11px] text-[#A0A0A0] space-y-1">
              <div className="flex justify-between"><span className="text-[#5F5F5F]">RESOLUTION:</span><span>25 cm Ground Sampling</span></div>
              <div className="flex justify-between"><span className="text-[#5F5F5F]">FUNCTION:</span><span>Hazard Assessment</span></div>
            </div>
          </div>
        </div>

        {/* Chain Flow Line Readout */}
        <div className="mt-6 p-4 bg-[#050505] border border-[#252525] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A0A0A0]">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-amber-500" />
            <span>HIERARCHICAL CHAIN:</span>
            <span className="text-[#F2F2F2] font-bold">IIRS (86.5m) ↓ TMC-2 (5.0m) ↓ OHRC (0.28m)</span>
          </div>

          <div className="text-[11px] text-[#5F5F5F]">
            CLOSED-LOOP CYCLE ERROR: <span className="text-[#F2F2F2] font-bold">|| H_IIRS→OHRC - (H_TMC2→OHRC · H_IIRS→TMC2) || &lt; 1.0 px</span>
          </div>
        </div>
      </div>
    </section>
  )
}

