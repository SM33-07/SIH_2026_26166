import { create } from 'zustand'
import { JUDGE_POINTS } from '../data/demoData'

export const useMatchStore = create((set, get) => ({
  // ── Selected target pair ──────────────────────────────────────────
  selectedPairId: 'pair_2267',
  selectedCorrespondencePair: 'IIRS_TMC2', // 'IIRS_TMC2' | 'TMC2_OHRC' | 'IIRS_OHRC'

  // ── Match results (per correspondence pair, keyed by `${pairId}_${corrPair}`) ──
  matchResults: {},
  isLoadingMatch: false,
  matchError: null,

  // ── Backend health & metadata ─────────────────────────────────────
  backendOnline: false,
  health: null,
  healthError: false,
  catalogPoints: [],
  catalogLoading: false,
  catalogError: null,

  // ── Derived getters ───────────────────────────────────────────────
  getSelectedPoint: () => {
    const rawId = String(get().selectedPairId)
    return JUDGE_POINTS.find(p => p.id === rawId || p.caseId === rawId) || JUDGE_POINTS[0]
  },

  getActiveMatchResult: () => {
    const key = `${get().selectedPairId}_${get().selectedCorrespondencePair}`
    return get().matchResults[key] || null
  },

  // ── Actions ───────────────────────────────────────────────────────
  selectPair: (pairId) => {
    const rawId = String(pairId)
    const found = JUDGE_POINTS.find(p => p.id === rawId || p.caseId === rawId)
    set({ selectedPairId: found ? found.id : pairId })
  },
  setSelectedPairId: (pairId) => {
    const rawId = String(pairId)
    const found = JUDGE_POINTS.find(p => p.id === rawId || p.caseId === rawId)
    set({ selectedPairId: found ? found.id : pairId })
  },

  setCorrespondencePair: (pair) => {
    set({ selectedCorrespondencePair: pair })
  },
  setSelectedCorrespondencePair: (pair) => {
    set({ selectedCorrespondencePair: pair })
  },

  loadInitialData: () => {
    // Initial health or catalog check if needed
  },

  setBackendOnline: (online) => {
    set({ backendOnline: online })
  },

  setHealth: (h) => set({ health: h, healthError: false, backendOnline: h?.status === 'ok' }),
  setHealthError: () => set({ healthError: true, backendOnline: false }),

  // Cache a match result from the backend
  cacheMatchResult: (pairId, corrPair, result) => {
    const key = `${pairId}_${corrPair}`
    set(state => ({
      matchResults: { ...state.matchResults, [key]: result },
    }))
  },

  setLoadingMatch: (loading) => {
    set({ isLoadingMatch: loading, matchError: null })
  },

  setMatchError: (error) => {
    set({ matchError: error, isLoadingMatch: false })
  },
}))

export default useMatchStore
