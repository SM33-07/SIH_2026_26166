import { useEffect, useRef, useState } from 'react'
import { listCases, loadDemo } from '../api/client'
import ErrorAlert from './ErrorAlert'
import ProcessingTimeline, { useProcessingSimulator } from './ProcessingTimeline'
import CurrentAnalysisResult from './CurrentAnalysisResult'

/**
 * ControlledDemo
 * Standalone explicit demonstration action.
 * Loads demo cases dynamically from backend GET /api/v1/cases (no hardcoded IDs or coordinates).
 * Demo executions produce a result clearly labeled CONTROLLED DEMONSTRATION with distinct styling.
 */
export default function ControlledDemo({ sensorSpecs, sameZoneThreshold }) {
  const [cases, setCases] = useState({ same: null, different: null, allSame: [], allDiff: [] })
  const [casesLoading, setCasesLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState(null)
  const [demoResult, setDemoResult] = useState(null)
  const resultRef = useRef(null)
  const simulator = useProcessingSimulator(running, 3500)

  useEffect(() => {
    let mounted = true
    const fetchCases = async () => {
      try {
        const [sameRes, diffRes] = await Promise.all([
          listCases({ limit: 5, case_type: 'SAME' }),
          listCases({ limit: 5, case_type: 'DIFFERENT' }),
        ])
        if (!mounted) return
        setCases({
          same: sameRes.cases?.[0] || null,
          different: diffRes.cases?.[0] || null,
          allSame: sameRes.cases || [],
          allDiff: diffRes.cases || [],
        })
      } catch (err) {
        // Backend cases unavailable
      } finally {
        if (mounted) setCasesLoading(false)
      }
    }
    fetchCases()
    return () => { mounted = false }
  }, [])

  async function runDemo(judgeId, caseType) {
    if (running || !judgeId) return
    setRunning(true)
    setError(null)
    setStage(1)
    simulator.start(setStage)

    try {
      const result = await loadDemo(judgeId)
      simulator.complete()
      setStage(9)
      setDemoResult({ ...result, _caseType: caseType })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    } catch (err) {
      simulator.fail()
      setStage(-1)
      setError(err.message || 'Controlled demonstration failed. Backend may be unreachable.')
    } finally {
      setRunning(false)
    }
  }

  const noCases = !casesLoading && !cases.same && !cases.different

  return (
    <div className="space-y-6">
      {/* Control Card for Demonstration */}
      <div className="border-2 border-amber-600/70 bg-lunar-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-lunar-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base">⚡</span>
              <h2 className="text-sm font-mono font-bold text-amber-300 uppercase tracking-wider">
                CONTROLLED DEMONSTRATION MODE
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Trigger ground-truth demonstration runs using pre-calibrated cases from the backend judge image library.
            </p>
          </div>
          <span className="text-[9px] font-mono border border-amber-500/70 text-amber-300 px-2.5 py-1 uppercase tracking-widest bg-amber-500/10">
            PRE-STAGED SAMPLES
          </span>
        </div>

        {casesLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 py-3">
            <div className="w-3 h-3 border border-amber-400 rounded-full animate-spin border-t-transparent" />
            Loading benchmark demonstration cases from backend…
          </div>
        )}

        {noCases && (
          <div className="text-xs font-mono text-amber-400/80 py-2">
            No demonstration cases returned by the backend service.
          </div>
        )}

        {!casesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.same && (
              <DemoTriggerCard
                title="SAME LUNAR ZONE CASE"
                description="Observation where all three sensors observe the same 0.020° lunar region."
                caseData={cases.same}
                type="same"
                disabled={running}
                onTrigger={() => runDemo(cases.same.id, 'SAME')}
              />
            )}

            {cases.different && (
              <DemoTriggerCard
                title="DIFFERENT LUNAR ZONES CASE"
                description="Observation where sensor footprints are physically separated across disparate regions."
                caseData={cases.different}
                type="different"
                disabled={running}
                onTrigger={() => runDemo(cases.different.id, 'DIFFERENT')}
              />
            )}
          </div>
        )}

        {stage > 0 && stage < 9 && <ProcessingTimeline currentStage={stage} />}
        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
      </div>

      {/* Demonstration Result Section */}
      {demoResult && (
        <div ref={resultRef} className="space-y-4">
          <CurrentAnalysisResult
            result={demoResult}
            sensorSpecs={sensorSpecs}
            sameZoneThreshold={sameZoneThreshold}
            isDemo={true}
          />
        </div>
      )}
    </div>
  )
}

function DemoTriggerCard({ title, description, caseData, type, disabled, onTrigger }) {
  const isSame = type === 'same'

  return (
    <div
      className={`border p-4 flex flex-col justify-between space-y-3 transition-all ${
        isSame
          ? 'border-green-800/80 bg-green-950/15 hover:border-green-600'
          : 'border-red-800/80 bg-red-950/15 hover:border-red-600'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono font-bold tracking-wider ${isSame ? 'text-green-400' : 'text-red-400'}`}>
            {title}
          </span>
          <span className="text-sm">{isSame ? '✓' : '✗'}</span>
        </div>
        <p className="text-[11px] font-mono text-slate-400 mt-1">{description}</p>
        <div className="mt-2 text-[10px] font-mono text-slate-500 space-y-0.5">
          <div>Point ID: <span className="text-slate-300 font-bold">{caseData.id}</span></div>
          {caseData.max_sensor_separation_deg != null && (
            <div>Max Separation: <span className="text-slate-300">{caseData.max_sensor_separation_deg}°</span></div>
          )}
        </div>
      </div>

      <button
        id={`btn-run-demo-${type}`}
        onClick={onTrigger}
        disabled={disabled}
        className={`w-full py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${
          isSame
            ? 'border-green-600 bg-green-900/40 text-green-300 hover:bg-green-800/60'
            : 'border-red-600 bg-red-900/40 text-red-300 hover:bg-red-800/60'
        }`}
      >
        EXECUTE DEMONSTRATION RUN
      </button>
    </div>
  )
}
