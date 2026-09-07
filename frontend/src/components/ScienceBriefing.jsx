import React, { useState } from 'react'

const TOPICS = [
  {
    id: 'sensors',
    title: 'THREE SENSORS',
    subtitle: 'OHRC + TMC-2 + IIRS',
    shortDesc: 'Chandrayaan-2 multi-spectral synergy across panchromatic, stereo, and 256-band infrared.',
    icon: '🛰️',
    details: {
      overview: 'ISRO’s Chandrayaan-2 lunar orbiter carries an unprecedented combination of optical and spectroscopic instruments. Combining high spatial resolution with broad spectral coverage allows simultaneous mineral mapping and fine-scale geologic context.',
      bullets: [
        'OHRC (0.28 m/px): Panchromatic hazardous terrain verifier with sub-meter spatial resolution.',
        'TMC-2 (5.0 m/px): Stereo surface mapper generating 3D digital elevation models.',
        'IIRS (86.5 m/px): Hyperspectral mineralogical scanner covering 0.8 to 5.0 µm in 256 channels.',
      ],
      citation: 'ISRO Space Applications Centre (SAC) Chandrayaan-2 Mission Specifications.',
    },
  },
  {
    id: 'scale',
    title: 'SCALE DISPARITY',
    subtitle: '18× to 300× GSD Normalization',
    shortDesc: 'Bridging the extreme resolution gap between coarse regional context and fine hazard craters.',
    icon: '📐',
    details: {
      overview: 'Direct feature matching between IIRS (86.5m) and OHRC (0.28m) involves an extreme 308× scale disparity, making single-step matching ill-posed. TMC-2 acts as an intermediate geometric bridge.',
      bullets: [
        'Gaussian Scale Pyramids downsample high-resolution features without losing edge topology.',
        'Multi-scale hierarchical matching first anchors TMC-2 to OHRC (17.9×), then anchors IIRS to TMC-2 (17.3×).',
        'Invariant descriptor scaling prevents scale-induced feature collapse.',
      ],
      citation: 'Scale-Space Theory for Cross-Sensor Multi-Resolution Co-Registration.',
    },
  },
  {
    id: 'correspondence',
    title: 'CORRESPONDENCE',
    subtitle: 'Transformer Attention & LoFTR',
    shortDesc: 'Coarse-to-fine dense cross-attention matching under severe shadow and sun-azimuth variance.',
    icon: '⚡',
    details: {
      overview: 'Handcrafted detectors (SIFT, ORB) fail under steep lunar crater shadows. The Local Feature TRansformer (LoFTR) uses self and cross-attention to extract dense, robust matches even in low-contrast lunar mare.',
      bullets: [
        'Linear Transformer Attention processes feature maps at 1/8 coarse resolution before fine refinement.',
        'Softmax mutual nearest neighbor matching filters ambiguous crater texture repetitions.',
        'Physical Lunar-Lambertian shading compensation suppresses moving terminator artifacts.',
      ],
      citation: 'Sun et al., LoFTR: Detector-Free Local Feature Matching with Transformers, CVPR.',
    },
  },
  {
    id: 'verification',
    title: 'GEOMETRIC VERIFICATION',
    subtitle: 'Robust Projective Homography',
    shortDesc: 'Outlier rejection via MAGSAC++ and closed-form 3×3 planar homography estimation.',
    icon: '🔬',
    details: {
      overview: 'Neural matchers can produce false positives. ChandraVue uses Marginalized Sample Consensus (MAGSAC++) to solve the 8-DOF planar homography matrix and enforce strict geometric consistency.',
      bullets: [
        'Direct Linear Transform (DLT) solves the 3×3 projective transformation matrix H.',
        'Symmetric Transfer Distance computes reprojection root mean square error (RMSE).',
        'Inlier ratio and spatial thresholding together synthesize the final SAME LUNAR ZONE verdict.',
      ],
      citation: 'Barath et al., MAGSAC++: Marginalized Sample Consensus, IEEE TPAMI.',
    },
  },
]

export default function ScienceBriefing() {
  const [selectedTopic, setSelectedTopic] = useState(null)

  return (
    <div id="science-briefing" className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-6 font-mono text-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800/80 mb-6 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-neutral-100">
              Science Briefing
            </h3>
          </div>
          <p className="text-xs text-neutral-400">
            Core scientific foundations of multi-modal lunar image correspondence.
          </p>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
          4 FOUNDATIONAL TOPICS
        </span>
      </div>

      {/* 4 Concise Topic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOPICS.map((topic) => (
          <div
            key={topic.id}
            onClick={() => setSelectedTopic(topic)}
            className="group p-4 bg-neutral-950/70 border border-neutral-800 rounded-lg hover:border-amber-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{topic.icon}</span>
                <span className="text-[9px] text-neutral-500 tracking-wider group-hover:text-amber-400 transition-colors">
                  EXPLORE →
                </span>
              </div>
              <h4 className="text-xs font-bold text-neutral-100 mb-0.5 group-hover:text-amber-400 transition-colors">
                {topic.title}
              </h4>
              <p className="text-[10px] text-amber-500/80 mb-2 font-semibold">
                {topic.subtitle}
              </p>
              <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                {topic.shortDesc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal / Drawer (Zero Card Scrollbars) */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0e14] border border-neutral-700 rounded-lg max-w-lg w-full p-6 text-xs font-mono shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedTopic.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 uppercase">
                    {selectedTopic.title}
                  </h3>
                  <span className="text-[10px] text-amber-400">{selectedTopic.subtitle}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="w-7 h-7 rounded border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <p className="text-neutral-300 leading-relaxed mb-4">
              {selectedTopic.details.overview}
            </p>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-2 mb-4">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                KEY METHODOLOGY & IMPLEMENTATION:
              </span>
              <ul className="space-y-1.5 text-[10.5px] text-neutral-300 list-disc list-inside">
                {selectedTopic.details.bullets.map((b, idx) => (
                  <li key={idx} className="leading-relaxed">{b}</li>
                ))}
              </ul>
            </div>

            <div className="text-[9.5px] text-neutral-500 border-t border-neutral-800/80 pt-3 flex justify-between items-center">
              <span>REFERENCE: {selectedTopic.details.citation}</span>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="px-3 py-1 bg-amber-500 text-black font-bold rounded hover:bg-amber-400"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
