import { useState } from 'react'
import useMatchStore from '../store/matchStore'

/**
 * TechnicalDrawer
 * Collapsible panel with raw backend technical details.
 * Never generates placeholder text for missing values.
 */
export default function TechnicalDrawer({ result, provenance }) {
  const [open, setOpen] = useState(false)

  if (!result && !provenance) return null

  const evidence = result?.evidence || {}
  const prov = result?.provenance || provenance

  return (
    <div className="border border-lunar-border bg-lunar-card overflow-hidden">
      <button
        id="btn-technical-drawer"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-lunar-surface/40 transition-colors text-left"
      >
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          TECHNICAL DETAILS ▾
        </span>
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">
          {open ? 'HIDE' : 'SHOW'}
        </span>
      </button>

      {open && (
        <div className="border-t border-lunar-border p-4 space-y-4">
          {/* Provenance */}
          {prov && (
            <Section title="Model Provenance">
              {Object.entries(prov).map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, ' ')} value={v} />
              ))}
            </Section>
          )}

          {/* Evidence */}
          {Object.keys(evidence).length > 0 && (
            <Section title="Evidence Details">
              {evidence.explanation && <Row label="explanation" value={evidence.explanation} />}
              {evidence.geometric_verification && (
                <>
                  {Object.entries(evidence.geometric_verification).map(([k, v]) => (
                    typeof v !== 'object' && <Row key={k} label={`geom.${k}`} value={String(v)} />
                  ))}
                </>
              )}
            </Section>
          )}

          {/* Common point */}
          {result?.common_point_id && (
            <Section title="Catalog Reference">
              <Row label="common point ID" value={result.common_point_id} />
              {result.matched_location && <>
                <Row label="latitude"  value={result.matched_location.latitude?.toFixed(8)} />
                <Row label="longitude" value={result.matched_location.longitude_360?.toFixed(8)} />
              </>}
            </Section>
          )}

          {/* Feature match counts */}
          {result?.feature_matches && (
            <Section title="Feature Match Summary">
              {Object.entries(result.feature_matches).map(([k, v]) => {
                if (Array.isArray(v)) return <Row key={k} label={k} value={`${v.length} matches`} />
                if (typeof v !== 'object') return <Row key={k} label={k} value={String(v)} />
                return null
              })}
            </Section>
          )}

          {/* Warnings */}
          {result?.warnings?.length > 0 && (
            <Section title="Backend Warnings">
              {result.warnings.map((w, i) => (
                <div key={i} className="text-[10px] font-mono text-amber-400">{w}</div>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="tele-label mb-2 border-b border-lunar-border/40 pb-1">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  if (value == null) return null
  return (
    <div className="flex items-start gap-3 text-[10px] font-mono py-0.5">
      <span className="text-slate-600 min-w-[140px] shrink-0">{label}</span>
      <span className="text-slate-300 break-all">{value}</span>
    </div>
  )
}
