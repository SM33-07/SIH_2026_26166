import { create } from 'zustand'

/**
 * Central application state store.
 * UI configuration and presentation state lives here.
 * Scientific data (coordinates, metrics, GSD, etc.) comes exclusively from the backend
 * and flows through the result/catalog fields below.
 */
const useMatchStore = create((set, get) => ({
  // ─── Navigation ────────────────────────────────────────────────────────────
  activeMode: 'explore',           // 'explore' | 'coordinate' | 'match' | 'demo'
  setActiveMode: (mode) => set({ activeMode: mode, error: null }),

  // ─── System health (from GET /health) ──────────────────────────────────────
  health: null,                    // backend health response object
  healthError: false,
  setHealth: (h) => set({ health: h, healthError: false }),
  setHealthError: () => set({ healthError: true }),

  // ─── Catalog (from GET /common-points?sample=true) ─────────────────────────
  catalogPoints: [],               // array of { id, latitude, longitude_360, ... }
  catalogLoading: false,
  catalogError: null,
  setCatalogPoints: (pts) => set({ catalogPoints: pts, catalogLoading: false, catalogError: null }),
  setCatalogLoading: (v) => set({ catalogLoading: v }),
  setCatalogError: (e) => set({ catalogError: e, catalogLoading: false }),

  // ─── Selected region (Moon marker click or coordinate search result) ────────
  selectedPoint: null,             // { id, latitude, longitude_360, ohrc_available, ... }
  setSelectedPoint: (pt) => set({ selectedPoint: pt }),
  clearSelectedPoint: () => set({ selectedPoint: null, activeResult: null }),

  // ─── Active result (from coordinate search / demo / match) ─────────────────
  activeResult: null,              // full backend response object
  resultMode: null,                // 'coordinate' | 'demo' | 'match'
  setActiveResult: (result, mode) => set({ activeResult: result, resultMode: mode, error: null }),
  clearResult: () => set({ activeResult: null, resultMode: null }),

  // ─── Processing pipeline state ──────────────────────────────────────────────
  // stage: 0=idle, 1-8=stages, 9=done, -1=failed
  processingStage: 0,
  setProcessingStage: (s) => set({ processingStage: s }),
  resetProcessing: () => set({ processingStage: 0 }),

  // ─── Sensor specs (from GET /sensors/characteristics) ──────────────────────
  sensorSpecs: null,
  sensorSpecsLoading: false,
  setSensorSpecs: (s) => set({ sensorSpecs: s, sensorSpecsLoading: false }),
  setSensorSpecsLoading: (v) => set({ sensorSpecsLoading: v }),

  // ─── Benchmarks (from GET /benchmarks/*) ───────────────────────────────────
  benchmarks: null,                // { retrieval, historical, audit }
  benchmarksLoading: false,
  setBenchmarks: (b) => set({ benchmarks: b, benchmarksLoading: false }),
  setBenchmarksLoading: (v) => set({ benchmarksLoading: v }),

  // ─── Available demo cases (from GET /cases) ─────────────────────────────────
  availableCases: [],              // [{ id, type, latitude, longitude_360, ... }]
  casesLoading: false,
  setCases: (cases) => set({ availableCases: cases, casesLoading: false }),
  setCasesLoading: (v) => set({ casesLoading: v }),

  // ─── Provenance (from GET /provenance/models) ───────────────────────────────
  provenance: null,
  setProvenance: (p) => set({ provenance: p }),

  // ─── Global loading / error ─────────────────────────────────────────────────
  loading: false,
  error: null,
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e, loading: false }),
  clearError: () => set({ error: null }),

  // ─── Registration viewer UI state ───────────────────────────────────────────
  registrationMode: 'blend',       // 'blend' | 'flicker' | 'checkerboard' | 'difference' | 'edge'
  blendOpacity: 0.5,
  setRegistrationMode: (m) => set({ registrationMode: m }),
  setBlendOpacity: (v) => set({ blendOpacity: v }),

  // ─── Technical drawer visibility ────────────────────────────────────────────
  techDrawerOpen: false,
  setTechDrawerOpen: (v) => set({ techDrawerOpen: v }),

  // ─── Export modal ────────────────────────────────────────────────────────────
  exportModalOpen: false,
  setExportModalOpen: (v) => set({ exportModalOpen: v }),

  // ─── Cross-component sensor highlight ───────────────────────────────────────
  highlightedSensor: null,         // 'ohrc' | 'tmc2' | 'iirs' | null
  setHighlightedSensor: (s) => set({ highlightedSensor: s }),

  // ─── Network & Cancellation Management ────────────────────────────────────
  activeAbortController: null,
  getAbortSignal: () => {
    const current = get().activeAbortController
    if (current) {
      try {
        current.abort()
      } catch (_) {}
    }
    const nextController = new AbortController()
    set({ activeAbortController: nextController })
    return nextController.signal
  },
  cancelActiveRequest: () => {
    const current = get().activeAbortController
    if (current) {
      try {
        current.abort()
      } catch (_) {}
      set({ activeAbortController: null, loading: false })
    }
  },

  // ─── Managed Blob URLs for memory leak prevention ──────────────────────────
  managedBlobUrls: [],
  registerBlobUrl: (url) => {
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      set((state) => ({ managedBlobUrls: [...state.managedBlobUrls, url] }))
    }
  },
  cleanupBlobUrls: () => {
    const urls = get().managedBlobUrls
    urls.forEach((u) => {
      try {
        URL.revokeObjectURL(u)
      } catch (_) {}
    })
    set({ managedBlobUrls: [] })
  },
}))

export default useMatchStore

