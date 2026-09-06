import React from 'react'
import { useMatchStore } from '../store/matchStore'
import { JUDGE_POINTS, SENSORS } from '../data/demoData'
import SensorCard from './SensorCard'

export default function SelectedRegion() {
  const { selectedPairId, setSelectedPairId, getSelectedPoint } = useMatchStore()
  const point = getSelectedPoint ? getSelectedPoint() : (JUDGE_POINTS.find((p) => p.id === selectedPairId || p.caseId === String(selectedPairId)) || JUDGE_POINTS[0])

  return (
    <section id="region" className="py-12 px-6 max-w-7xl mx-auto border-b border-[#252525] font-mono bg-transparent">
      {/* Instrument Readout Header Block */}
      <div className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] text-[#5F5F5F] tracking-widest uppercase block mb-1">
            SELECTED REGION READOUT
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2F2F2] uppercase tracking-tight">
            PAIR {point.caseId || point.id} — {point.region || point.name}
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#A0A0A0]">
            <div>
              <span className="text-[#5F5F5F]">LATITUDE: </span>
              <span className="text-[#F2F2F2] font-bold">{point.lat.toFixed(6)}° N</span>
            </div>
            <span className="text-[#5F5F5F]">•</span>
            <div>
              <span className="text-[#5F5F5F]">LONGITUDE: </span>
              <span className="text-[#F2F2F2] font-bold">{point.lon.toFixed(6)}° E</span>
            </div>
            <span className="text-[#5F5F5F]">•</span>
            <div className="px-2 py-0.5 border border-[#303030] bg-[#151515]/90 text-amber-500 font-bold text-[11px]">
              SPATIAL OVERLAP VERIFIED
            </div>
          </div>
        </div>

        {/* Quick Pair Selector Buttons */}
        <div className="flex items-center space-x-2 bg-[#050505]/70 p-1.5 border border-[#252525] self-start lg:self-center">
          {JUDGE_POINTS.map((pt) => {
            const isSelected = point.id === pt.id || point.caseId === pt.caseId
            return (
              <button
                key={pt.id}
                onClick={() => setSelectedPairId(pt.id)}
                className={`px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#151515] text-[#F2F2F2] border border-amber-500 font-bold'
                    : 'text-[#A0A0A0] hover:text-[#F2F2F2]'
                }`}
              >
                PAIR {pt.caseId || pt.id}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scale Disparity Telemetry Strip */}
      <div className="mb-8 p-4 bg-[#080808]/80 backdrop-blur-sm border border-[#252525] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <span className="text-[10px] text-[#5F5F5F] block uppercase tracking-wider">SCALE DISPARITY RATIO MATRIX</span>
          <span className="text-sm font-bold text-[#F2F2F2]">308.9× TOTAL SCALE GAP (OHRC 0.28m ↔ IIRS 86.5m)</span>
        </div>

        <div className="flex items-center space-x-6 text-[#A0A0A0]">
          <div>
            <span className="text-[10px] text-[#5F5F5F] block">IIRS ↔ TMC-2</span>
            <span className="text-amber-500 font-bold">17.3× GAP</span>
          </div>
          <span className="text-[#252525]">|</span>
          <div>
            <span className="text-[10px] text-[#5F5F5F] block">TMC-2 ↔ OHRC</span>
            <span className="text-amber-500 font-bold">17.86× GAP</span>
          </div>
          <span className="text-[#252525]">|</span>
          <div>
            <span className="text-[10px] text-[#5F5F5F] block">IIRS ↔ OHRC</span>
            <span className="text-amber-500 font-bold">308.9× GAP</span>
          </div>
        </div>
      </div>

      {/* 3 Sensor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SensorCard
          sensor={{
            name: 'IIRS SPECTROMETER',
            gsd: '86.5 m/px',
            instrument_type: SENSORS.IIRS.type,
            spectral_bands: SENSORS.IIRS.spectral_range,
            sun_incidence_deg: 42.1,
            orbit_altitude_km: 100
          }}
          imageSrc={point.sensors?.IIRS?.image}
          pairingStatus="complete"
        />

        <SensorCard
          sensor={{
            name: 'TMC-2 STEREO CAMERA',
            gsd: '5.0 m/px',
            instrument_type: SENSORS.TMC2.type,
            spectral_bands: SENSORS.TMC2.spectral_range,
            sun_incidence_deg: 38.4,
            orbit_altitude_km: 100
          }}
          imageSrc={point.sensors?.TMC2?.image}
          pairingStatus="complete"
        />

        <SensorCard
          sensor={{
            name: 'OHRC HIGH RESOLUTION',
            gsd: '0.28 m/px',
            instrument_type: SENSORS.OHRC.type,
            spectral_bands: SENSORS.OHRC.spectral_range,
            sun_incidence_deg: 35.8,
            orbit_altitude_km: 100
          }}
          imageSrc={point.sensors?.OHRC?.image}
          pairingStatus={point.pairStatus?.TMC2_OHRC === 'geographically_associated' ? 'pending' : 'complete'}
        />
      </div>
    </section>
  )
}
