import React, { useState } from 'react'

import DataAvailabilityBar from './DataAvailabilityBar'
import ResultSummaryStrip from './ResultSummaryStrip'
import CorrespondenceToolbar from './CorrespondenceToolbar'
import CorrespondenceViewer from './CorrespondenceViewer'
import MatchInspector from './MatchInspector'
import InteractiveSensorGraph from './InteractiveSensorGraph'
import ScaleDisparityVisualizer from './ScaleDisparityVisualizer'
import AnalysisFlashcardDeck from './AnalysisFlashcardDeck'
import ErrorBoundary from '../ErrorBoundary'

export default function CorrespondenceWorkspace({ result = null, onReplay = null }) {
  if (!result) return null

  // Active Sensor Pair state: 'OHRC_TMC2' | 'TMC2_IIRS' | 'OHRC_IIRS'
  const [activePair, setActivePair] = useState('OHRC_TMC2')

  // Selected Match index
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0)

  // Viewer modes & toggles
  const [viewMode, setViewMode] = useState('sideBySide')
  const [showMatches, setShowMatches] = useState(true)
  const [showInliers, setShowInliers] = useState(true)
  const [showOutliers, setShowOutliers] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Active step in evidence chain
  const [activeEvidenceStep, setActiveEvidenceStep] = useState('corr')

  // Derive active pair images & matches
  const currentPairData = result.pairs?.[activePair] || { matches: [], confidences: [] }
  const currentMatches = currentPairData.matches || []
  const currentConfidences = currentPairData.confidences || []

  let imgSrc0 = result.images?.ohrc
  let imgSrc1 = result.images?.tmc2
  let label0 = 'SOURCE (OHRC 0.28m)'
  let label1 = 'REFERENCE (TMC-2 5.0m)'

  if (activePair === 'TMC2_IIRS') {
    imgSrc0 = result.images?.tmc2
    imgSrc1 = result.images?.iirs
    label0 = 'SOURCE (TMC-2 5.0m)'
    label1 = 'REFERENCE (IIRS 86.5m)'
  } else if (activePair === 'OHRC_IIRS') {
    imgSrc0 = result.images?.ohrc
    imgSrc1 = result.images?.iirs
    label0 = 'SOURCE (OHRC 0.28m)'
    label1 = 'REFERENCE (IIRS 86.5m)'
  }

  const selectedMatch = currentMatches[selectedMatchIndex] || currentMatches[0] || null

  return (
    <div id="results-workspace" className="w-full space-y-6 text-neutral-200">
      {/* 1. Data Availability Bar */}
      <ErrorBoundary>
        <DataAvailabilityBar availability={result.dataAvailability} />
      </ErrorBoundary>

      {/* 2. Top-line Result Summary Takeaways */}
      <ErrorBoundary>
        <ResultSummaryStrip result={result} activePair={activePair} />
      </ErrorBoundary>

      {/* 3. Centerpiece Dominant Correspondence Viewer */}
      <ErrorBoundary>
        <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg overflow-hidden shadow-2xl">
          {/* Pair Selector Tabs */}
          <div className="bg-[#0b0e14] border-b border-neutral-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                ACTIVE SENSOR PAIR:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'OHRC_TMC2', label: 'OHRC ↔ TMC-2', badge: 'HIGH RES BRIDGE' },
                  { id: 'TMC2_IIRS', label: 'TMC-2 ↔ IIRS', badge: 'HYPERSPECTRAL' },
                  { id: 'OHRC_IIRS', label: 'OHRC ↔ IIRS', badge: 'CROSS SCALE' },
                ].map((pair) => (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => {
                      setActivePair(pair.id)
                      setSelectedMatchIndex(0)
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                      activePair === pair.id
                        ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>{pair.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {onReplay && (
              <button
                type="button"
                onClick={onReplay}
                className="px-2.5 py-1 text-[11px] font-mono border border-neutral-700 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
              >
                ↻ REPLAY ANALYSIS
              </button>
            )}
          </div>

          {/* Interactive Toolbar */}
          <CorrespondenceToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showMatches={showMatches}
            onToggleMatches={() => setShowMatches(!showMatches)}
            showInliers={showInliers}
            onToggleInliers={() => setShowInliers(!showInliers)}
            showOutliers={showOutliers}
            onToggleOutliers={() => setShowOutliers(!showOutliers)}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(4, z + 0.2))}
            onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            onZoomReset={() => setZoom(1)}
            onZoomFit={() => setZoom(1)}
            differenceSupported={result.capabilities.difference}
          />

          {/* HTML5 Correspondence Canvas */}
          <CorrespondenceViewer
            imgSrc0={imgSrc0}
            imgSrc1={imgSrc1}
            label0={label0}
            label1={label1}
            matches={currentMatches}
            selectedMatchIndex={selectedMatchIndex}
            onSelectMatch={setSelectedMatchIndex}
            viewMode={viewMode}
            showMatches={showMatches}
            showInliers={showInliers}
            showOutliers={showOutliers}
            showGrid={showGrid}
            zoom={zoom}
            onZoomChange={setZoom}
            alignedImageUrl={result.alignment?.warpedImageUrl}
          />

          {/* Local 40x40 Match Inspector */}
          <div className="p-4 border-t border-neutral-800/80 bg-[#06080c]">
            <MatchInspector
              match={selectedMatch}
              matchIndex={selectedMatchIndex}
              imgSrc0={imgSrc0}
              imgSrc1={imgSrc1}
              label0={label0.split(' ')[0]}
              label1={label1.split(' ')[0]}
            />
          </div>
        </div>
      </ErrorBoundary>

      {/* 4. Spatial Geometry & Scale Disparity Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <InteractiveSensorGraph
            activePair={activePair}
            onSelectPair={(pairId) => {
              setActivePair(pairId)
              setSelectedMatchIndex(0)
            }}
            pairwise={result.spatial?.pairwise}
            thresholdDeg={result.spatial?.thresholdDeg}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <ScaleDisparityVisualizer scale={result.scale} />
        </ErrorBoundary>
      </div>

      {/* 5. Scientific Telemetry & Analysis Flashcards (Decision, Benchmarks, Metrics, Scale & Provenance) */}
      <ErrorBoundary>
        <AnalysisFlashcardDeck result={result} activePair={activePair} />
      </ErrorBoundary>
    </div>
  )
}
