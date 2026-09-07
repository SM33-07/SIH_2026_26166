import React, { useState } from 'react'

export default function ProvenancePanel({ provenance = {} }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-500 group-hover:bg-amber-400 transition-colors" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 group-hover:text-neutral-100 transition-colors">
            Scientific Provenance & Model Checkpoints
          </h4>
        </div>
        <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
          {isOpen ? '▾ COLLAPSE' : '▸ EXPAND AUDIT TELEMETRY'}
        </span>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-2 text-[10.5px] text-neutral-400 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-neutral-950/70 p-2.5 rounded border border-neutral-800">
              <span className="text-amber-400 block font-semibold mb-1">FEATURE MATCHER</span>
              <div>ARCHITECTURE: LoFTR (Coarse-to-Fine Dense Cross-Attention)</div>
              <div>PARAMETERS: 11.56M Parameters (8 Coarse + 2 Fine Layers)</div>
              <div>CHECKPOINT: tmc2_loftr_available.pt</div>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded border border-neutral-800">
              <span className="text-cyan-400 block font-semibold mb-1">SENSOR EMBEDDER</span>
              <div>ARCHITECTURE: ResNet-18 Grayscale Feature Backbone</div>
              <div>EMBEDDING DIM: 256-D L2 Unit Sphere Projection</div>
              <div>CHECKPOINT: ohrc_feature_weights.pt</div>
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 pt-1 italic">
            Pipeline: 01 SELECT → 02 ACQUIRE → 03 NORMALIZE → 04 REPRESENT → 05 MATCH → 06 VERIFY → 07 ALIGN → 08 REPORT
          </p>
        </div>
      )}
    </div>
  )
}
