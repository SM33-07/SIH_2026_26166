import React from 'react'

/**
 * Standard DataState component for honest scientific UI (PRD v4 Section 44)
 * Explicitly communicates when scientific layers are available, unavailable, pending, or processing.
 */
export default function DataState({
  status = 'unavailable', // 'available' | 'pending' | 'processing' | 'unavailable' | 'not_applicable'
  title = null,
  message = null,
  compact = false,
}) {
  const normalized = String(status).toLowerCase()

  const config = {
    available: {
      label: 'DATA AVAILABLE',
      badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      icon: '✓',
      defaultMsg: 'Verified data returned by backend.',
    },
    pending: {
      label: 'PENDING ACQUISITION',
      badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse',
      icon: '○',
      defaultMsg: 'Awaiting pipeline dispatch.',
    },
    processing: {
      label: 'PROCESSING INFERENCE',
      badgeClass: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 animate-pulse',
      icon: '●',
      defaultMsg: 'Neural feature extraction in progress...',
    },
    unavailable: {
      label: 'NOT AVAILABLE',
      badgeClass: 'border-neutral-700/60 bg-neutral-900/50 text-neutral-400',
      icon: '—',
      defaultMsg: 'Backend did not return data for this feature in this analysis.',
    },
    not_applicable: {
      label: 'NOT APPLICABLE',
      badgeClass: 'border-neutral-800 bg-black/40 text-neutral-500',
      icon: '⊘',
      defaultMsg: 'Metric does not apply to the current sensor configuration.',
    },
  }[normalized] || {
    label: 'NOT AVAILABLE',
    badgeClass: 'border-neutral-700/60 bg-neutral-900/50 text-neutral-400',
    icon: '—',
    defaultMsg: 'Data not available.',
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border ${config.badgeClass}`}>
        <span className="opacity-70">{config.icon}</span>
        <span>{title || config.label}</span>
      </span>
    )
  }

  return (
    <div className={`p-4 rounded border text-center flex flex-col items-center justify-center gap-1.5 ${config.badgeClass}`}>
      <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider uppercase">
        <span>{config.icon}</span>
        <span>{title ? `${title} — ${config.label}` : config.label}</span>
      </div>
      <p className="text-[11px] font-mono text-neutral-400 max-w-sm leading-relaxed">
        {message || config.defaultMsg}
      </p>
    </div>
  )
}
