import { useRef, useState } from 'react'
import useMatchStore from '../store/matchStore'
import MatchingPanel from './MatchingPanel'
import ProcessingTimeline, { useProcessingSimulator } from './ProcessingTimeline'
import CurrentAnalysisResult from './CurrentAnalysisResult'

/**
 * ImageTab
 * Dedicated 3-Image Analysis & Upload Mode.
 * Contains only the image upload and analysis pipeline.
 * Controlled demonstration is separate.
 */
export default function ImageTab({ sensorSpecs, sameZoneThreshold }) {
  const { activeResult, setActiveResult, sensorSpecs: storeSensorSpecs } = useMatchStore()
  const [stage, setStage] = useState(0)
  const simulator = useProcessingSimulator(false, 8000)
  const resultRef = useRef(null)

  const specs = sensorSpecs || storeSensorSpecs

  function handleResult(result, mode) {
    setActiveResult(result, mode)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    setStage(9) // done
  }

  function handleMatchStart() {
    setStage(1)
    simulator.start(setStage)
  }

  const r = activeResult

  return (
    <div className="space-y-6">
      {/* Upload Interface */}
      <div>
        <div className="tele-label mb-3">Upload Three-Sensor Imagery (IIRS, TMC-2, OHRC)</div>
        <MatchingPanel
          onResult={(result, mode) => {
            simulator.stop()
            handleResult(result, mode)
          }}
          onProcessingStart={handleMatchStart}
        />
      </div>

      {stage > 0 && stage < 9 && <ProcessingTimeline currentStage={stage} />}

      {/* Current Analysis Result */}
      {r && (
        <div ref={resultRef}>
          <CurrentAnalysisResult
            result={r}
            sensorSpecs={specs}
            sameZoneThreshold={sameZoneThreshold}
            isDemo={false}
          />
        </div>
      )}
    </div>
  )
}
