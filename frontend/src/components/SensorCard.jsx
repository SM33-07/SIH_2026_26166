import React from 'react'
import { Camera } from 'lucide-react'

export default function SensorCard({ sensor, imageSrc, pairingStatus }) {
  return (
    <div className="bg-[#0D0D0D]/85 backdrop-blur-sm border border-[#252525] p-4 flex flex-col justify-between font-mono text-xs space-y-4">

      {/* Sensor Header */}
      <div className="border-b border-[#252525] pb-3 flex items-start justify-between">
        <div>
          <span className="text-[10px] text-[#5F5F5F] block uppercase tracking-wider">INSTRUMENT READOUT</span>
          <h4 className="text-sm font-bold text-[#F2F2F2]">{sensor.name || sensor.id}</h4>
          <span className="text-[11px] text-[#A0A0A0] block mt-0.5">{sensor.instrument_type || sensor.type}</span>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 bg-[#151515] border border-[#303030] text-amber-500 font-bold text-xs inline-block">
            {sensor.gsd}
          </span>
          <span className="text-[10px] text-[#5F5F5F] block mt-1">{sensor.spectral_bands}</span>
        </div>
      </div>

      {/* Sensor Image Stream */}
      <div className="relative bg-[#050505] border border-[#252525] aspect-video flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${sensor.name} imagery`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80'
            }}
          />
        ) : (
          <div className="text-center p-4">
            <Camera className="w-6 h-6 text-[#5F5F5F] mx-auto mb-1" />
            <span className="text-[10px] text-[#5F5F5F]">NO OPTICAL STREAM</span>
          </div>
        )}

        {/* Scale GSD Overlay Tag */}
        <div className="absolute bottom-1.5 left-1.5 bg-[#080808]/90 border border-[#252525] px-2 py-0.5 text-[10px] text-[#F2F2F2]">
          GSD: {sensor.resolution_m ? `${sensor.resolution_m} m/px` : sensor.gsd}
        </div>
      </div>

      {/* Orbit & Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-[#080808] p-2 border border-[#252525]">
          <span className="text-[9px] text-[#5F5F5F] block uppercase">SUN INCIDENCE</span>
          <span className="text-[#F2F2F2] font-bold">{sensor.sun_incidence_deg ? `${sensor.sun_incidence_deg}°` : '38.4°'}</span>
        </div>
        <div className="bg-[#080808] p-2 border border-[#252525]">
          <span className="text-[9px] text-[#5F5F5F] block uppercase">ORBIT ALTITUDE</span>
          <span className="text-[#F2F2F2] font-bold">{sensor.orbit_altitude_km ? `${sensor.orbit_altitude_km} km` : '100 km'}</span>
        </div>
      </div>

      {/* Pairing State Badge */}
      <div className="pt-2 border-t border-[#252525] flex items-center justify-between text-[10px]">
        <span className="text-[#5F5F5F]">PAIRING STATE:</span>
        <span className={`px-2 py-0.5 border ${
          pairingStatus === 'complete'
            ? 'bg-[#151515] text-[#F2F2F2] border-[#303030]'
            : 'bg-[#151515] text-amber-500 border-amber-500/40'
        }`}>
          {pairingStatus === 'complete' ? 'SPATIAL OVERLAP READY' : 'MODEL FINE-TUNING PENDING'}
        </span>
      </div>
    </div>
  )
}
