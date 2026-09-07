import React from 'react'

export default function SensorScenePanel({
  selectedPoint = null,
  activeResult = null,
  sensorSpecs = null,
  isLoading = false,
  onRunCorrespondence,
}) {
  if (!selectedPoint && !activeResult) return null

  const specs = sensorSpecs?.sensors || {}
  const images = activeResult?.images || {}
  const pointName = selectedPoint?.name || selectedPoint?.region || selectedPoint?.id || activeResult?.region || 'Target Site'
  const isBeacon = Boolean(selectedPoint?.is_sih_beacon || selectedPoint?.judge_id?.startsWith('JUDGE_000'))

  const sensorsList = [
    {
      key: 'iirs',
      name: 'IIRS',
      fullName: 'Imaging Infrared Spectrometer',
      gsd: specs.iirs?.gsd_m_per_px ? `${specs.iirs.gsd_m_per_px} m/px` : '86.5 m/px',
      img: images.iirs ? `data:image/png;base64,${images.iirs}` : null,
      color: 'border-red-500/40 text-red-400',
    },
    {
      key: 'tmc2',
      name: 'TMC-2',
      fullName: 'Terrain Mapping Camera-2',
      gsd: specs.tmc2?.gsd_m_per_px ? `${specs.tmc2.gsd_m_per_px} m/px` : '5.0 m/px',
      img: images.tmc2 ? `data:image/png;base64,${images.tmc2}` : null,
      color: 'border-amber-500/40 text-amber-400',
    },
    {
      key: 'ohrc',
      name: 'OHRC',
      fullName: 'Orbital High Resolution Camera',
      gsd: specs.ohrc?.gsd_m_per_px ? `${specs.ohrc.gsd_m_per_px} m/px` : '0.28 m/px',
      img: images.ohrc ? `data:image/png;base64,${images.ohrc}` : null,
      color: 'border-cyan-500/40 text-cyan-400',
    },
  ]

  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800 rounded-lg p-5 font-mono text-xs text-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800/80 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isBeacon ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-400'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-100 font-bold uppercase tracking-wider text-xs">
                {pointName}
              </span>
              {isBeacon && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-bold">
                  SIH DEMO TARGET
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-500">
              LAT: {selectedPoint?.latitude?.toFixed(4) || '—'}° • LON: {selectedPoint?.longitude_360?.toFixed(4) || '—'}°
            </span>
          </div>
        </div>

        {!activeResult && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onRunCorrespondence}
            className="px-4 py-2 rounded font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>INFERENCE IN PROGRESS…</span>
              </>
            ) : (
              <>
                <span>⚡ RUN CORRESPONDENCE</span>
                <span>→</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 3-Sensor Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sensorsList.map((s) => (
          <div key={s.key} className="bg-neutral-950/70 p-3 rounded border border-neutral-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${s.color}`}>
                {s.name}
              </span>
              <span className="text-[10px] text-neutral-500">{s.gsd}</span>
            </div>

            <div className="w-full aspect-[4/3] rounded border border-neutral-800 bg-black flex items-center justify-center overflow-hidden mb-2">
              {s.img ? (
                <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-[10px] text-neutral-600 text-center p-2">
                  <span>Awaiting Model Inference Pass</span>
                </div>
              )}
            </div>

            <div className="text-[9.5px] text-neutral-400 truncate">
              {s.fullName}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
