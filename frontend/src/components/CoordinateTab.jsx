import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import useMatchStore from '../store/matchStore'
import { searchCoordinate } from '../api/client'
import ErrorAlert from './ErrorAlert'

/**
 * CoordinateTab
 * Inputs start EMPTY. No preloaded coordinates.
 * All backend coordinates, images, and metrics come from the server response.
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
      <div>
        <div className="tele-label mb-3">Lunar Coordinate Search</div>
        <p className="text-xs text-slate-500 font-mono mb-4">
          Search the registered observation catalog by surface coordinates. 
          Latitude in [−90°, +90°], Longitude in [0°, 360°] or [−180°, +180°].
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="coord-lat" className="tele-label">Lunar Latitude</label>
            <input
              id="coord-lat"
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Enter latitude (e.g., 60.8)"
              className="bg-lunar-bg border border-lunar-border text-slate-100 px-3 py-2.5 font-mono text-sm
                         focus:outline-none focus:border-lunar-accent transition-colors
                         placeholder:text-slate-700"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="coord-lon" className="tele-label">Lunar Longitude</label>
            <input
              id="coord-lon"
              type="number"
              step="any"
              required
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="Enter longitude (e.g., 355.3)"
              className="bg-lunar-bg border border-lunar-border text-slate-100 px-3 py-2.5 font-mono text-sm
                         focus:outline-none focus:border-lunar-accent transition-colors
                         placeholder:text-slate-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-coordinate-search"
            type="submit"
            disabled={loading || !lat.trim() || !lon.trim()}
            className="flex items-center gap-2 bg-lunar-accent text-white px-6 py-2.5 text-xs font-mono font-bold
                       uppercase tracking-widest border border-lunar-accent hover:bg-indigo-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            FIND LUNAR OBSERVATION
          </button>
          {(lat || lon) && (
            <button
              type="button"
              onClick={() => { setLat(''); setLon(''); clearError() }}
              className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
            >
              CLEAR
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
