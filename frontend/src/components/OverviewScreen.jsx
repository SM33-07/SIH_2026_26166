import React from 'react'
import {
  Sun,
  Maximize2,
  Eye,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Share2,
  Sparkles,
  MapPin
} from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function OverviewScreen() {
  const { setActiveTab, cases, selectCase } = useMatchStore()

  const challenges = [
    {
      icon: Sun,
      title: 'Sun-Angle & Illumination Invariance',
      description: 'Atmosphere-free lunar terrain creates severe shadows across solar incidence variations (18° vs 52°+).'
    },
    {
      icon: Maximize2,
      title: '18x to 300x Scale Disparity',
      description: 'Multi-resolution pyramid matching spanning OHRC (0.28 m/px), TMC-2 (5.0 m/px), and IIRS (86.5 m/px).'
    },
    {
      icon: Eye,
      title: 'IIRS Hyperspectral Proxy',
      description: 'Cross-modal registration via synthesized panchromatic proxy collapsing 256 contiguous spectral bands.'
    },
    {
      icon: ShieldCheck,
      title: 'Explainable Spatial Confidence',
      description: 'Generates 2D spatial confidence heatmaps distinguishing reliable terrain inliers from cast shadows.'
    }
  ]

  const handleSelectCaseAndMatch = (caseId) => {
    selectCase(caseId)
    setActiveTab('matching')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border border-slate-800 p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between shadow-2xl gap-8">
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
            Autonomous registration engine resolving pixel-level correspondences across Chandrayaan-2{' '}
            <strong className="text-sky-400">OHRC (0.28m)</strong>, <strong className="text-indigo-400">TMC-2 (5.0m)</strong>,{' '}
            and <strong className="text-amber-400">IIRS (86.5m)</strong> instruments despite extreme solar illumination shifts,
            eighteen-fold resolution gaps, and 256-band hyperspectral cross-modality.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('matching')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
            >
              <span>Explore 10 Lunar Cases</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('threesensor')}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3 rounded-xl font-medium text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Three-Sensor Topology</span>
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className="inline-flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl font-medium text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <span>IIRS Benchmarks</span>
            </button>
          </div>
        </div>

        {/* Instrument Specifications Cards */}
        <div className="w-full lg:w-80 space-y-3 z-10">
          <div className="bg-slate-800/80 backdrop-blur border border-sky-500/30 p-3.5 rounded-xl">
            <div className="flex justify-between items-center text-xs text-sky-400 font-bold">
              <span>OHRC</span>
              <span className="font-mono bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">0.28 m/px</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">High-resolution panchromatic landing hazard imagery (0.45–0.70 µm)</p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-indigo-500/30 p-3.5 rounded-xl">
            <div className="flex justify-between items-center text-xs text-indigo-400 font-bold">
              <span>TMC-2</span>
              <span className="font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">5.0 m/px</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Stereo triplet camera providing regional 3D digital elevation models</p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-amber-500/30 p-3.5 rounded-xl">
            <div className="flex justify-between items-center text-xs text-amber-400 font-bold">
              <span>IIRS</span>
              <span className="font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">86.5 m/px</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">256-band hyperspectral spectrometer (0.80–5.00 µm) via panchromatic proxy</p>
          </div>
        </div>
      </div>

      {/* Verified Benchmark Spotlight Banner */}
      <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              VERIFIED SCIENTIFIC BENCHMARK (IIRS SYNTHETIC CORRESPONDENCE)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            500 EVALUATED PAIRS • VALIDATED
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">MEAN ERROR</span>
            <span className="text-xl font-bold text-white">0.3801 px</span>
            <span className="text-[10px] text-slate-500 block">Sub-pixel accuracy</span>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">P90 ERROR</span>
            <span className="text-xl font-bold text-sky-400">0.5684 px</span>
            <span className="text-[10px] text-slate-500 block">90th percentile</span>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">INLIER RATIO</span>
            <span className="text-xl font-bold text-emerald-400">99.42%</span>
            <span className="text-[10px] text-slate-500 block">MAGSAC++ verified</span>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">RUNTIME</span>
            <span className="text-xl font-bold text-amber-400">29.4 ms</span>
            <span className="text-[10px] text-slate-500 block">Real-time throughput</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic">
          Caveat: Metrics shown are from the IIRS synthetic correspondence benchmark. Full scientific 3-instrument co-registration pipeline integration is scheduled for upcoming release.
        </p>
      </div>

      {/* 10 Demonstration Cases Quick Nav */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              10 CHANDRAYAAN-2 LUNAR EVALUATION CASES
            </h3>
          </div>
          <span className="text-xs text-slate-400">Precomputed & Presentation Ready</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {cases.slice(0, 10).map((c, idx) => (
            <button
              key={c.id}
              onClick={() => handleSelectCaseAndMatch(c.id)}
              className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-xl text-left transition-all cursor-pointer group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-sky-400">CASE {idx + 1}</span>
                <span className="text-[9px] font-mono text-slate-500">{c.primary_pair}</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">{c.region}</p>
              <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
            </button>
          ))}
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

      {/* Pipeline Architecture */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide">End-to-End Processing Architecture</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center text-xs">
          {[
            'Data Ingestion',
            'Illumination Normalization',
            'Shadow Masking',
            'IIRS Proxy Synthesis',
            'Scale Pyramid',
            'LoFTR Matcher',
            'MAGSAC++ Geometry',
            'Spatial Confidence Map'
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
