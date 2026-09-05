import { create } from 'zustand'

export const useMatchStore = create((set, get) => ({
  // Active Tab
  activeTab: 'overview', // 'overview', 'matching', 'results', 'benchmark', 'annotation'
  resultsSubTab: 'correspondences', // 'correspondences', 'alignment', 'confidence', 'matrix'

  // Presets & Options
  demoPairs: [],
  selectedPairId: 'pair1_ohrc_illumination',
  
  // Custom Images / Parameters
  imageAId: 'ohrc_sun18deg.png',
  imageBId: 'ohrc_sun52deg.png',
  modalityA: 'OHRC',
  modalityB: 'OHRC',
  sunElevationA: 18.0,
  sunElevationB: 52.0,
  gsdA: 0.25,
  gsdB: 0.25,

  options: {
    use_illumination_normalization: true,
    use_shadow_mask: true,
    use_scale_pyramid: true,
    use_iirs_proxy: true,
    pipeline: 'proposed', // 'proposed' or 'classical'
    classical_algorithm: 'SIFT', // 'SIFT', 'AKAZE', 'ORB'
    geometry_model: 'auto',
    confidence_threshold: 0.5,
    iirs_band_indices: [10, 50, 100, 200]
  },

  // Execution state
  isLoading: false,
  progressStage: '',
  matchResult: null,
  error: null,

  // Evaluation / Benchmark state
  benchmarkResults: null,
  isBenchmarking: false,

  // Annotations state for Manual Control Point Tool
  controlPointsA: [],
  controlPointsB: [],

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setResultsSubTab: (subTab) => set({ resultsSubTab: subTab }),
  setOptions: (newOptions) => set((state) => ({ options: { ...state.options, ...newOptions } })),

  setDemoPairs: (pairs) => set({ demoPairs: pairs }),
  selectDemoPair: (pairId) => {
    const pair = get().demoPairs.find((p) => p.id === pairId)
    if (pair) {
      set({
        selectedPairId: pairId,
        imageAId: pair.image_a,
        imageBId: pair.image_b,
        modalityA: pair.instrument_a,
        modalityB: pair.instrument_b,
        sunElevationA: pair.sun_elevation_a,
        sunElevationB: pair.sun_elevation_b,
        gsdA: pair.gsd_a,
        gsdB: pair.gsd_b,
        matchResult: null
      })
    }
  },

  runMatch: async () => {
    set({ isLoading: true, error: null, progressStage: 'Initializing Lunar Processing Pipeline...' })
    try {
      const payload = {
        image_a_id: get().imageAId,
        image_b_id: get().imageBId,
        modality_a: get().modalityA,
        modality_b: get().modalityB,
        sun_elevation_a: get().sunElevationA,
        sun_elevation_b: get().sunElevationB,
        gsd_a: get().gsdA,
        gsd_b: get().gsdB,
        options: get().options
      }

      set({ progressStage: 'Preprocessing & Illumination Normalization...' })

      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Match execution failed')
      }

      set({ progressStage: 'Extracting Correspondences & Computing Geometry...' })

      const data = await response.json()
      set({
        matchResult: data,
        isLoading: false,
        activeTab: 'results',
        resultsSubTab: 'correspondences'
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  runBenchmark: async () => {
    set({ isBenchmarking: true })
    try {
      const response = await fetch('/api/evaluation/run', { method: 'POST' })
      const data = await response.json()
      set({ benchmarkResults: data.data, isBenchmarking: false })
    } catch (err) {
      console.error('Benchmark failed', err)
      set({ isBenchmarking: false })
    }
  },

  addControlPointA: (pt) => set((state) => ({ controlPointsA: [...state.controlPointsA, pt] })),
  addControlPointB: (pt) => set((state) => ({ controlPointsB: [...state.controlPointsB, pt] })),
  clearControlPoints: () => set({ controlPointsA: [], controlPointsB: [] })
}))
