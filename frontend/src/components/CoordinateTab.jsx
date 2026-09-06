import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import useMatchStore from '../store/matchStore'
import { searchCoordinate } from '../api/client'
import ErrorAlert from './ErrorAlert'

/**
 * CoordinateTab
 * Inputs start EMPTY. No preloaded coordinates.
 * Technical hardware styling matching Mission Control UI.
 */
export default function CoordinateTab({ onResult }) {
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const { loading, error, setLoading, setError, clearError, clearResult } = useMatchStore()

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading || !lat.trim() || !lon.trim()) return

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    if (isNaN(latNum) || isNaN(lonNum)) {
      setError('INVALID_COORDINATES: Please enter valid numeric values for latitude and longitude.')
      return
    }

    clearResult()
    setLoading(true)
    clearError()
    try {
      const result = await searchCoordinate(latNum, lonNum)
      onResult?.(result, 'coordinate')
    } catch (err) {
      setError(err.message || 'Search failed. Backend may be unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
            Lunar Coordinate Query
          </div>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            Search registered Chandrayaan-2 observation catalog. Latitude [−90°, +90°], Longitude [0°, 360°].
          </p>
        </div>
        <span className="text-[8px] font-mono border border-white/[0.1] text-neutral-400 px-2 py-0.5 uppercase tracking-widest hidden sm:block">
          KD-TREE LOOKUP
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="coord-lat" className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Lunar Latitude (°N)
            </label>
            <input
              id="coord-lat"
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g., 60.8"
              className="bg-black/60 border border-white/[0.12] text-neutral-100 px-3 py-2 font-mono text-xs
                         focus:outline-none focus:border-amber-500/80 transition-colors
                         placeholder:text-neutral-700"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="coord-lon" className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Lunar Longitude (°E)
            </label>
            <input
              id="coord-lon"
              type="number"
              step="any"
              required
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="e.g., 355.3"
              className="bg-black/60 border border-white/[0.12] text-neutral-100 px-3 py-2 font-mono text-xs
                         focus:outline-none focus:border-amber-500/80 transition-colors
                         placeholder:text-neutral-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            id="btn-coordinate-search"
            type="submit"
            disabled={loading || !lat.trim() || !lon.trim()}
            className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-5 py-2 text-xs font-mono font-semibold
                       uppercase tracking-wider border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            QUERY OBSERVATION
          </button>
          {(lat || lon) && (
            <button
              type="button"
              onClick={() => { setLat(''); setLon(''); clearError() }}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider"
            >
              CLEAR INPUTS
            </button>
          )}
        </div>
      </form>

      {error && (
        <ErrorAlert error={error} onDismiss={clearError} />
      )}
    </div>
  )
}
