import React from 'react'

/**
 * Subsystem Error Boundary with Aerospace Mission Control Aesthetic.
 * Catches rendering exceptions in isolated subsystems without crashing the entire workspace.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary] Exception in subsystem "${this.props.title || 'Component'}":`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      const subsystemName = this.props.title || 'MISSION WORKSPACE SUBSYSTEM'
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="border border-red-500/40 bg-[#060203] p-6 text-neutral-200 font-mono space-y-4 shadow-[0_0_25px_rgba(239,68,68,0.15)] my-4"
        >
          <div className="flex items-center gap-3 border-b border-red-900/40 pb-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-none transform rotate-45 border border-red-300 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                TELEMETRY ANOMALY · {subsystemName}
              </span>
              <span className="text-[10px] text-neutral-400 tracking-wider">
                Isolated subsystem failure caught. Other mission panels remain operational.
              </span>
            </div>
          </div>

          <div className="text-xs text-neutral-300 bg-black/60 p-3 border border-white/[0.06] overflow-x-auto">
            <code>{this.state.error?.message || 'Unknown runtime anomaly encountered during rendering.'}</code>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 border border-red-500/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <span>↺</span>
              <span>REINITIALIZE SUBSYSTEM</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white text-xs uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
            >
              RELOAD MISSION CONSOLE
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
