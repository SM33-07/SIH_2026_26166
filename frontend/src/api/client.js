/**
 * Centralised API client for the SIH26166 Lunar Correspondence backend.
 * All backend communication goes through this module.
 * Never hardcode coordinates, IDs, sensor specs, or metrics anywhere else.
 */

// The backend origin. Override via VITE_API_BASE_URL in .env.local.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || ''

const BASE = `${API_ORIGIN}/api/v1`

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function request(path, options = {}) {
  const { timeout = 15000, signal, ...fetchOpts } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // Link external abort signal if provided
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId)
      const err = new Error('Request aborted')
      err.name = 'AbortError'
      throw err
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const url = `${BASE}${path}`
  try {
    const res = await fetch(url, { ...fetchOpts, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try {
        const body = await res.json()
        detail = body.detail || JSON.stringify(body)
      } catch {
        detail = await res.text().catch(() => detail)
      }
      const err = new Error(detail)
      err.status = res.status
      err.isApiError = true
      throw err
    }
    return res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      const abortErr = new Error(`Request timed out or cancelled: ${path}`)
      abortErr.isTimeout = true
      throw abortErr
    }
    throw err
  }
}

function postJson(path, body, options = {}) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  })
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/** GET /api/v1/health */
export function checkHealth() {
  return request('/health')
}

// ---------------------------------------------------------------------------
// Common Points catalog
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/common-points
 * @param {object} opts
 * @param {number} [opts.limit=80]   Max points to return (1–500)
 * @param {boolean} [opts.sample]    Geographically spread sample
 * @param {number} [opts.min_score]  Minimum consistency score
 */
export function listCommonPoints({ limit = 80, sample = false, min_score } = {}) {
  const params = new URLSearchParams({ limit: String(limit), sample: sample ? 'true' : 'false' })
  if (min_score != null) params.set('min_score', String(min_score))
  return request(`/common-points?${params}`)
}

/**
 * GET /api/v1/common-points/{id}
 */
export function getCommonPoint(id) {
  return request(`/common-points/${encodeURIComponent(id)}`)
}

/**
 * GET /api/v1/lunar-points
 * Authoritative point dataset with backend mapped & analysis_ready flags
 */
export function listLunarPoints({ limit = 120 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  return request(`/lunar-points?${params}`)
}

// ---------------------------------------------------------------------------
// Coordinate search
// ---------------------------------------------------------------------------

/**
 * Normalizes longitude into [-180, +180] convention.
 */
export function normalizeLongitude180(lon) {
  let l = ((Number(lon) + 180) % 360)
  if (l < 0) l += 360
  return l - 180
}

/**
 * POST /api/v1/coordinate/search
 * @param {number} latitude
 * @param {number} longitude
 * @param {object} [options]
 */
export function searchCoordinate(latitude, longitude, options = {}) {
  const normLon = normalizeLongitude180(longitude)
  return postJson('/coordinate/search', { latitude: Number(latitude), longitude: normLon }, options)
}

// ---------------------------------------------------------------------------
// Demo cases catalog
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/cases
 * @param {object} opts
 * @param {number} [opts.limit=20]
 * @param {string} [opts.case_type]  'SAME' | 'DIFFERENT'
 */
export function listCases({ limit = 20, case_type, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (case_type) params.set('case_type', case_type)
  return request(`/cases?${params}`, { signal })
}

/**
 * GET /api/v1/demo/{judge_id}
 * @param {string} judgeId
 * @param {boolean} [forceLive=true]
 * @param {object} [options]
 */
export function loadDemo(judgeId, forceLive = true, options = {}) {
  const params = forceLive ? '?force_live=true' : ''
  return request(`/demo/${encodeURIComponent(judgeId.trim().toUpperCase())}${params}`, options)
}

// ---------------------------------------------------------------------------
// Three-image matching (multipart)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/match/three-images
 * @param {File} ohrcFile
 * @param {File} tmc2File
 * @param {File} iirsFile
 */
export function matchThreeImages(ohrcFile, tmc2File, iirsFile) {
  const form = new FormData()
  form.append('ohrc_image', ohrcFile)
  form.append('tmc2_image', tmc2File)
  form.append('iirs_image', iirsFile)
  return request('/match/three-images', { method: 'POST', body: form })
}

/**
 * POST /api/v1/upload/three-sensor
 * Dedicated multipart upload supporting telemetry metadata and raw arrays
 */
export function uploadThreeSensorImages(formData, options = {}) {
  return request('/upload/three-sensor', {
    method: 'POST',
    body: formData,
    ...options,
  })
}

// ---------------------------------------------------------------------------
// Media streaming URL (returns URL, not a fetch call)
// ---------------------------------------------------------------------------

/**
 * Returns the URL to stream a sensor image for a judge point.
 * Use as <img src={getMediaUrl(judgeId, 'ohrc')} />
 */
export function getMediaUrl(judgeId, sensor) {
  return `${BASE}/media/judge/${encodeURIComponent(judgeId)}/${encodeURIComponent(sensor)}`
}

// ---------------------------------------------------------------------------
// Sensor specifications
// ---------------------------------------------------------------------------

/** GET /api/v1/sensors */
export function getSensors() {
  return request('/sensors')
}

/** GET /api/v1/sensors/characteristics */
export function getSensorCharacteristics() {
  return request('/sensors/characteristics')
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

/** GET /api/v1/benchmarks */
export function getBenchmarks() {
  return request('/benchmarks')
}

/** GET /api/v1/benchmarks/retrieval */
export function getBenchmarkRetrieval() {
  return request('/benchmarks/retrieval')
}

/** GET /api/v1/benchmarks/historical-step5d */
export function getBenchmarkHistorical() {
  return request('/benchmarks/historical-step5d')
}

/** GET /api/v1/benchmarks/audit */
export function getBenchmarkAudit() {
  return request('/benchmarks/audit')
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/** GET /api/v1/provenance/models */
export function getProvenance() {
  return request('/provenance/models')
}

// ---------------------------------------------------------------------------
// Regional presets
// ---------------------------------------------------------------------------

/** GET /api/v1/regions */
export function getRegions() {
  return request('/regions')
}
