import { useEffect, useRef } from 'react'

/**
 * ProcessingTimeline
 * 8-stage animated pipeline display.
 * Stage numbers are presentation constants (not scientific data).
 */
const STAGES = [
  { n: '01', label: 'INPUT',         desc: 'Receiving sensor uploads' },
  { n: '02', label: 'VALIDATION',    desc: 'Format and size check' },
  { n: '03', label: 'PREPROCESSING', desc: 'Contrast normalization' },
  { n: '04', label: 'RETRIEVAL',     desc: 'Candidate generation' },
  { n: '05', label: 'CORRESPONDENCE', desc: 'LoFTR feature matching' },
  { n: '06', label: 'GEOMETRY',      desc: 'RANSAC homography estimation' },
  { n: '07', label: 'GEOGRAPHY',     desc: 'Pairwise distance verification' },
  { n: '08', label: 'DECISION',      desc: 'Tri-state verdict engine' },
]

// Simulate pipeline progression for the loading experience
export function useProcessingSimulator(isActive, durationMs = 8000) {
  const intervalRef = useRef(null)
  const stageRef = useRef(0)
  const callbackRef = useRef(null)

  function start(onStageChange) {
    callbackRef.current = onStageChange
    stageRef.current = 1
    onStageChange(1)
    const perStage = durationMs / STAGES.length
    intervalRef.current = setInterval(() => {
      stageRef.current++
      if (stageRef.current > STAGES.length) {
        clearInterval(intervalRef.current)
        return
      }
      callbackRef.current?.(stageRef.current)
    }, perStage)
  }

  function stop() {
    clearInterval(intervalRef.current)
    stageRef.current = 0
  }

  function complete() {
    stop()
    callbackRef.current?.(9) // 9 = done
  }

  function fail() {
    stop()
    callbackRef.current?.(-1) // -1 = failed
  }

  return { start, stop, complete, fail }
}

export default function ProcessingTimeline({ currentStage }) {
  if (currentStage === 0) return null

  const isDone   = currentStage === 9
  const isFailed = currentStage === -1
  const active   = isDone || isFailed ? STAGES.length : currentStage - 1

  return (
    <div className="border border-lunar-border bg-lunar-card p-4 fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <span className="tele-label">Pipeline Progress</span>
        {isDone && <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">COMPLETE</span>}
        {isFailed && <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">FAILED</span>}
        {!isDone && !isFailed && (
          <span className="text-[10px] font-mono text-lunar-accent uppercase tracking-widest stage-active">
            PROCESSING…
          </span>
        )}
      </div>

      <div className="space-y-1">
        {STAGES.map((stage, i) => {
          const stageNum = i + 1
          const isComplete  = isDone || (!isFailed && stageNum < currentStage)
          const isCurrent   = !isDone && !isFailed && stageNum === currentStage
          const isFail      = isFailed && stageNum === currentStage
          const isPending   = !isComplete && !isCurrent && !isFail

          return (
            <div
              key={stage.n}
              className={[
                'flex items-center gap-3 px-2 py-1.5 transition-all',
                isCurrent ? 'bg-lunar-accent/8 border border-lunar-accent/30' : '',
                isComplete ? 'opacity-100' : isPending ? 'opacity-30' : '',
              ].join(' ')}
            >
              <span className={[
                'w-5 h-5 flex items-center justify-center shrink-0 text-[9px] font-mono font-bold border',
                isComplete ? 'border-green-600 text-green-400 bg-green-950/50' :
                isCurrent  ? 'border-lunar-accent text-lunar-accent stage-active' :
                isFail     ? 'border-red-600 text-red-400' :
                             'border-lunar-border text-slate-700',
              ].join(' ')}>
                {isComplete ? '✓' : isFail ? '✗' : stage.n}
              </span>
              <span className={[
                'text-[10px] font-mono font-bold uppercase tracking-wider',
                isComplete ? 'text-slate-300' : isCurrent ? 'text-lunar-accent' : 'text-slate-700',
              ].join(' ')}>
                {stage.label}
              </span>
              <span className="text-[9px] font-mono text-slate-600 ml-auto">{stage.desc}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
