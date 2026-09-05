import React from 'react'
import { Layers, Activity, Cpu, HelpCircle, BarChart2 } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function Header() {
  const { activeTab, setActiveTab } = useMatchStore()

  const navItems = [
    { id: 'overview', label: 'Overview', icon: HelpCircle },
    { id: 'matching', label: 'Match Engine', icon: Layers },
    { id: 'results', label: 'Results & Visuals', icon: Activity },
    { id: 'benchmark', label: 'Evaluation & Benchmark', icon: BarChart2 }
  ]

  return (
    <header className="border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-sky-500/20">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-white tracking-wide">SIH26166 — LUNAR CORRESPONDENCE</h1>
            <span className="bg-sky-500/10 text-sky-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-500/20">
              ISRO CHANDRAYAAN-2
            </span>
          </div>
          <p className="text-xs text-slate-400">Multi-Modal, Sun-Angle & Scale-Invariant Engine</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Instrument status badges */}
      <div className="hidden lg:flex items-center space-x-2 text-xs">
        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono border border-slate-700">OHRC 0.25m</span>
        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono border border-slate-700">TMC-2 5m</span>
        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono border border-slate-700">IIRS 256b</span>
      </div>
    </header>
  )
}
