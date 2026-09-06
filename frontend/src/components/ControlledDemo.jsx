import { useEffect, useRef, useState } from 'react'
import useMatchStore from '../store/matchStore'
import {
  listCases,
  loadDemo,
} from '../api/client'
import ErrorAlert from './ErrorAlert'
import DecisionBadge from './DecisionBadge'
import ProcessingTimeline, { useProcessingSimulator } from './ProcessingTimeline'

/**
 * ControlledDemo
 * Loads available cases from GET /cases (no hardcoded judge IDs).
 * Demo trigger calls GET /demo/{judge_id} with backend-provided IDs.
 */
export default function ControlledDemo({ onResult }) {
  const [cases, setCases] = useState({ same: null, different: null })
  const [casesLoading, setCasesLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState(null)
  const simulator = useProcessingSimulator(running, 4000)

  useEffect(() => {
    let mounted = true
    const fetchCases = async () => {
      try {
        const [sameRes, diffRes] = await Promise.all([
          listCases({ limit: 1, case_type: 'SAME' }),
          listCases({ limit: 1, case_type: 'DIFFERENT' }),
        ])
        if (!mounted) return
        setCases({
          same:      sameRes.cases?.[0] || null,
          different: diffRes.cases?.[0] || null,
        })
      } catch {
        // Cases unavailable — demo not possible
      } finally {
        if (mounted) setCasesLoading(false)
      }
    }
    fetchCases()
    return () => { mounted = false }
  }, [])

  async function runDemo(judgeId, label) {
    if (running || !judgeId) return
    setRunning(true)
    setError(null)
    setStage(1)
    simulator.start(setStage)

    try {
      const result = await loadDemo(judgeId)
      simulator.complete()
      setStage(9)
      onResult?.({ ...result, _demoLabel: label }, 'demo')
    } catch (err) {
      simulator.fail()
      setStage(-1)
      setError(err.message || 'Demo failed. Backend may be unavailable.')
    } finally {
      setRunning(false)
    }
  }

  const noCases = !casesLoading && !cases.same && !cases.different

  return (
    <div className="border border-lunar-border bg-lunar-card overflow-hidden">
      <div className="px-4 py-3 border-b border-lunar-border bg-lunar-surface/60 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            DEMO MODE
          </div>
          <div className="text-[9px] font-mono text-slate-600 mt-0.5">
            Controlled demonstration from the judge image library
          </div>
        </div>
        <span className="text-[9px] font-mono border border-lunar-accent/40 text-lunar-accent px-2 py-0.5 uppercase">
          CONTROLLED
        </span>
      </div>

      <div className="p-4 space-y-4">
        {casesLoading && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
            <div className="w-3 h-3 border border-slate-600 rounded-full animate-spin border-t-transparent" />
            Loading available cases from backend…
          </div>
        )}

        {noCases && (
          <div className="text-[10px] font-mono text-slate-600">
            No demo cases available from the backend.
          </div>
        )}

        {!casesLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cases.same && (
              <DemoCaseButton
                label="SAME LUNAR ZONE"
                caseData={cases.same}
                type="same"
                disabled={running}
                onRun={() => runDemo(cases.same.id, 'SAME CASE')}
              />
            )}
            {cases.different && (
              <DemoCaseButton
                label="DIFFERENT LUNAR ZONES"
                caseData={cases.different}
                type="different"
                disabled={running}
                onRun={() => runDemo(cases.different.id, 'DIFFERENT CASE')}
              />
            )}
          </div>
        )}

        {stage > 0 && <ProcessingTimeline currentStage={stage} />}
        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
      </div>
    </div>
  )
}

function DemoCaseButton({ label, caseData, type, disabled, onRun }) {
  const isSame = type === 'same'
  return (
    <button
      id={`btn-demo-${type}`}
      onClick={onRun}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-2 p-4 border text-center transition-all',
        'font-mono text-sm font-bold uppercase tracking-wider',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSame
          ? 'border-green-700 text-green-400 bg-green-950/30 hover:bg-green-950/50'
          : 'border-red-700 text-red-400 bg-red-950/30 hover:bg-red-950/50',
      ].join(' ')}
    >
      <span className="text-2xl">{isSame ? '✓' : '✗'}</span>
      <span>{label}</span>
      {caseData.id && (
        <span className="text-[9px] opacity-60 font-normal normal-case">
          {caseData.id}
          {caseData.consistency_score != null && ` · score: ${caseData.consistency_score.toFixed(4)}`}
        </span>
      )}
    </button>
  )
}
