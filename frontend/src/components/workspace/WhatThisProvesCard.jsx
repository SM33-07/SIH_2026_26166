import React from 'react'

export default function WhatThisProvesCard() {
  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 mb-3">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
          Scientific Evaluation Boundaries
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What This Proves */}
        <div className="bg-neutral-950/70 p-3 rounded border border-emerald-900/30">
          <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block mb-2 flex items-center gap-1.5">
            <span>✓</span> WHAT THIS PROVES
          </span>
          <ul className="space-y-1.5 text-[10px] text-neutral-300 leading-relaxed list-disc list-inside">
            <li>Neural cross-attention successfully bridges extreme 18× to 300× GSD disparities.</li>
            <li>Physical Lunar-Lambertian normalization handles extreme sun-azimuth shadow variance.</li>
            <li>RANSAC projective homography confirms these frames observe the exact same surface zone.</li>
          </ul>
        </div>

        {/* What This Does Not Claim */}
        <div className="bg-neutral-950/70 p-3 rounded border border-neutral-800">
          <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider block mb-2 flex items-center gap-1.5">
            <span>⊘</span> WHAT THIS DOES NOT CLAIM
          </span>
          <ul className="space-y-1.5 text-[10px] text-neutral-400 leading-relaxed list-disc list-inside">
            <li>Does not claim full-lunar model coverage beyond the catalog observation swaths.</li>
            <li>Does not equate high confidence scores with ground-truth surveyor positioning.</li>
            <li>Controlled synthetic benchmarks are distinct from unconstrained flight scenes.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
