import SensorCard from './SensorCard'

/**
 * SensorComparison
 * Renders three equal-width sensor cards: IIRS | TMC-2 | OHRC
 * All values come from the backend result and sensor spec objects.
 */
export default function SensorComparison({ images = {}, sensors = {}, sensorSpecs = {} }) {
  const hasAny = images?.ohrc || images?.tmc2 || images?.iirs

  if (!hasAny) {
    return (
      <div className="border border-lunar-border bg-lunar-card p-6 text-center">
        <div className="text-slate-600 font-mono text-xs uppercase tracking-widest">
          Select a lunar observation point to view sensor imagery
        </div>
      </div>
    )
  }

  const specs = sensorSpecs?.sensors || {}

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="tele-label">Three-Sensor Observation</div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
          <span className="text-sensor-iirs">IIRS</span>
          <span>→</span>
          <span className="text-sensor-tmc2">TMC-2</span>
          <span>→</span>
          <span className="text-sensor-ohrc">OHRC</span>
          <span className="text-slate-700 ml-1">(resolution bridge)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SensorCard
          sensorKey="iirs"
          sensorName={specs.iirs?.name || 'IIRS'}
          imageBase64={images.iirs}
          metadata={sensors.iirs}
          specData={specs.iirs || {}}
          isApproximate
        />
        <SensorCard
          sensorKey="tmc2"
          sensorName={specs.tmc2?.name || 'TMC-2'}
          imageBase64={images.tmc2}
          metadata={sensors.tmc2}
          specData={specs.tmc2 || {}}
        />
        <SensorCard
          sensorKey="ohrc"
          sensorName={specs.ohrc?.name || 'OHRC'}
          imageBase64={images.ohrc}
          metadata={sensors.ohrc}
          specData={specs.ohrc || {}}
        />
      </div>
    </div>
  )
}
