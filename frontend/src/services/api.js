/**
 * SIH26166 Centralized Frontend API Service.
 * Interfaces with FastAPI endpoints for sensors, cases, benchmarks, graph topology, and matching.
 */

const API_BASE = ''

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'API request failed'
    try {
      const err = await response.json()
      errorDetail = err.detail || errorDetail
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

export const api = {
  // Sensors
  async getSensors() {
    const res = await fetch(`${API_BASE}/api/sensors`)
    return handleResponse(res)
  },

  async getSensor(sensorId) {
    const res = await fetch(`${API_BASE}/api/sensors/${sensorId}`)
    return handleResponse(res)
  },

  // Cases
  async getCases() {
    const res = await fetch(`${API_BASE}/api/cases`)
    return handleResponse(res)
  },

  async getCase(caseId) {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}`)
    return handleResponse(res)
  },

  async getCaseMatch(caseId, pairKey) {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/match/${pairKey}`)
    return handleResponse(res)
  },

  // Benchmarks
  async getBenchmarks() {
    const res = await fetch(`${API_BASE}/api/benchmarks`)
    return handleResponse(res)
  },

  async getBenchmark(benchmarkId) {
    const res = await fetch(`${API_BASE}/api/benchmarks/${benchmarkId}`)
    return handleResponse(res)
  },

  // Sensor Graph Topology
  async getSensorGraph() {
    const res = await fetch(`${API_BASE}/api/graph`)
    return handleResponse(res)
  },

  // Match Execution
  async runMatch(payload) {
    const res = await fetch(`${API_BASE}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse(res)
  },

  // Evaluation & Ablation
  async getLatestEvaluation() {
    const res = await fetch(`${API_BASE}/api/evaluation/latest`)
    return handleResponse(res)
  },

  async runEvaluation() {
    const res = await fetch(`${API_BASE}/api/evaluation/run`, { method: 'POST' })
    return handleResponse(res)
  },

  // Health
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`)
    return handleResponse(res)
  }
}

export default api
