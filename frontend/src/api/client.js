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
  const url = `${BASE}${path}`
  const res = await fetch(url, { ...options })
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
}

function postJson(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

// ---------------------------------------------------------------------------
// Coordinate search
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/coordinate/search
 * @param {number} latitude
 * @param {number} longitude
 */
export function searchCoordinate(latitude, longitude) {
  return postJson('/coordinate/search', { latitude, longitude })
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
export function listCases({ limit = 20, case_type } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (case_type) params.set('case_type', case_type)
  return request(`/cases?${params}`)
}

/**
 * GET /api/v1/demo/{judge_id}
 */
export function loadDemo(judgeId) {
  return request(`/demo/${encodeURIComponent(judgeId.trim().toUpperCase())}`)
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
