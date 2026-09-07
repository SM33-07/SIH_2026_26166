import React, { useEffect, useState } from 'react'

const PIPELINE_STAGES = [
  { id: '01', name: 'SELECT', desc: 'Coordinate & Scene Ingestion' },
  { id: '02', name: 'ACQUIRE', desc: 'Raw PDS-4 Frame Retrieval' },
  { id: '03', name: 'NORMALIZE', desc: 'Lunar-Lambertian & CLAHE' },
  { id: '04', name: 'REPRESENT', desc: 'Multi-scale Gaussian Pyramid' },
  { id: '05', name: 'MATCH', desc: 'LoFTR Attention Transformer' },
  { id: '06', name: 'VERIFY', desc: 'MAGSAC++ Planar Homography' },
  { id: '07', name: 'ALIGN', desc: 'Projective Co-Registration' },
  { id: '08', name: 'REPORT', desc: 'Tri-State Decision Synthesis' },
]

export default function ProcessingPipeline({
  isProcessing = false,
  activeStageIndex = 0,
  onComplete,
}) {
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStage(PIPELINE_STAGES.length)
      return
    }

    setCurrentStage(0)
    // Progress through the 8 stages over ~2.4s if backend hasn't finished
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < PIPELINE_STAGES.length - 1) {
          return prev + 1
        }
        clearInterval(interval)
        return prev
      })
    }, 300)

    return () => clearInterval(interval)
  }, [isProcessing])

  if (!isProcessing) return null

  return (
    <div className="w-full bg-[#080a0e] border border-amber-500/40 rounded-lg p-4 font-mono text-xs text-neutral-200 shadow-[0_0_16px_rgba(245,158,11,0.12)] animate-pulse">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold uppercase tracking-wider text-amber-400">
            PROCESSING CORRESPONDENCE PIPELINE
          </span>
        </div>
        <span className="text-[10px] text-neutral-400">
          STAGE {currentStage + 1} OF 8: {PIPELINE_STAGES[currentStage]?.name}
        </span>
      </div>

      {/* 8-Stage Progress Sequence */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
        {PIPELINE_STAGES.map((s, idx) => {
          const isDone = idx < currentStage
          const isActive = idx === currentStage
          return (
            <div
              key={s.id}
              className={`p-2 rounded border transition-all ${
                isActive
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-600'
              }`}
            >
              <div className="text-[9px] mb-0.5">
                {isDone ? '✓' : isActive ? '●' : '○'} {s.id}
              </div>
              <div className="font-semibold truncate">{s.name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
