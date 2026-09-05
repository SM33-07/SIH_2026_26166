import React from 'react'
import { Sun, Maximize2, Cpu, Eye, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function OverviewScreen() {
  const { setActiveTab } = useMatchStore()

  const challenges = [
    {
      icon: Sun,
      title: 'Sun-Angle & Illumination Invariance',
      description: 'Lunar crater terrain lacks atmosphere, producing extreme shadow variations across solar incidence angles (10°–50°+).'
    },
    {
      icon: Maximize2,
      title: '20x Scale Ratio Gap',
      description: 'Multi-resolution matching between OHRC (0.25 m/pixel fine detail) and TMC-2 (5 m/pixel stereo context).'
    },
    {
      icon: Eye,
      title: 'IIRS Hyperspectral Proxy',
      description: 'Cross-modal matching via a transparent 256-band composite proxy collapsing spectral bands into a panchromatic-like image.'
    },
    {
      icon: ShieldCheck,
      title: 'Explainable Spatial Confidence',
      description: 'Generates 2D spatial confidence heatmaps distinguishing reliable terrain inliers from invalid shadowed regions.'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border border-slate-800 p-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between shadow-2xl">
        <div className="max-w-2xl space-y-4 z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <span>SMART INDIA HACKATHON 2026</span>
            <span>•</span>
            <span>PROBLEM SIH26166</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Multi-Modal, Sun-Angle & Scale-Invariant Lunar Image Correspondence
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Autonomous registration platform finding accurate pixel correspondences across Chandrayaan-2 <strong className="text-sky-400">OHRC</strong>, <strong className="text-sky-400">TMC-2</strong>, and <strong className="text-sky-400">IIRS</strong> instruments despite extreme solar incidence variation, 20x resolution gaps, and hyperspectral cross-modality.
          </p>
          <div className="pt-2 flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('matching')}
              className="inline-flex items-center space-x-2 bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/30 transition-all cursor-pointer"
            >
              <span>Start Matching</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-xl font-medium text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <span>View Evaluation Matrix</span>
            </button>
          </div>
        </div>

        {/* Instrument Specifications */}
        <div className="w-full md:w-80 mt-8 md:mt-0 space-y-3 z-10">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-4 rounded-xl">
            <div className="flex justify-between items-center text-xs text-sky-400 font-bold">
              <span>OHRC</span>
              <span className="font-mono">0.25 m/px</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Panchromatic high-resolution hazard imagery</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-4 rounded-xl">
            <div className="flex justify-between items-center text-xs text-indigo-400 font-bold">
              <span>TMC-2</span>
              <span className="font-mono">5.00 m/px</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Panchromatic stereo terrain mapping triplets</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-4 rounded-xl">
            <div className="flex justify-between items-center text-xs text-emerald-400 font-bold">
              <span>IIRS</span>
              <span className="font-mono">80.0 m/px</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">256-band hyperspectral composite proxy (0.8–5.0 µm)</p>
          </div>
        </div>
      </div>

      {/* Core Challenges Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide">Key Technical Innovations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {challenges.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
                <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl w-fit border border-sky-500/20">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-white text-sm">{c.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide">End-to-End Processing Architecture</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center text-xs">
          {[
            'Data Ingestion',
            'Illumination Normalization',
            'Shadow Masking',
            'IIRS Proxy Composite',
            'Scale Pyramid',
            'LoFTR/SIFT Matching',
            'MAGSAC Geometry',
            'Confidence Map & Warp'
          ].map((step, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-sky-400 font-bold block">STEP {idx + 1}</span>
              <span className="text-slate-200 font-medium">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
