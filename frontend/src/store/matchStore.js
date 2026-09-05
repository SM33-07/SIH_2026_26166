import { create } from 'zustand'
import { api } from '../services/api'

export const useMatchStore = create((set, get) => ({
  // Active Navigation
  activeTab: 'overview', // 'overview', 'matching', 'threesensor', 'results', 'benchmark'
  resultsSubTab: 'correspondences', // 'correspondences', 'alignment', 'confidence', 'matrix'

  // Sensors & Topologies
  sensors: [],
  sensorGraph: null,
  selectedGraphPair: 'OHRC_TMC2',

  // Curated Cases (10 Cases)
  cases: [],
  selectedCaseId: 'case_01',
  caseMatches: {}, // Cache of loaded match results by pair_key
  isLoadingCase: false,

  // Demo Presets & Image Parameters (Legacy & Preset support)
  demoPairs: [],
  selectedPairId: 'pair1_ohrc_illumination',
  imageAId: 'ohrc_sun18deg.png',
  imageBId: 'ohrc_sun52deg.png',
  modalityA: 'OHRC',
  modalityB: 'OHRC',
  sunElevationA: 18.0,
  sunElevationB: 52.0,
  gsdA: 0.28,
  gsdB: 0.28,

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
  benchmarks: [],
  benchmarkResults: null,
  isBenchmarking: false,

  // System Health
  health: null,

  // Annotations state for Manual Control Point Tool
  controlPointsA: [],
  controlPointsB: [],

  // Tab & SubTab setters
  setActiveTab: (tab) => set({ activeTab: tab }),
  setResultsSubTab: (subTab) => set({ resultsSubTab: subTab }),
  setOptions: (newOptions) => set((state) => ({ options: { ...state.options, ...newOptions } })),
  setSelectedGraphPair: (pairKey) => set({ selectedGraphPair: pairKey }),

  // Data initialization
  initAppData: async () => {
    try {
      const [healthData, sensorsData, casesData, benchmarksData, graphData] = await Promise.allSettled([
        api.checkHealth(),
        api.getSensors(),
        api.getCases(),
        api.getBenchmarks(),
        api.getSensorGraph()
      ])

      if (healthData.status === 'fulfilled') set({ health: healthData.value })
      if (sensorsData.status === 'fulfilled') set({ sensors: sensorsData.value.sensors || [] })
      if (benchmarksData.status === 'fulfilled') set({ benchmarks: benchmarksData.value.benchmarks || [] })
      if (graphData.status === 'fulfilled') set({ sensorGraph: graphData.value })

      if (casesData.status === 'fulfilled' && casesData.value.cases?.length > 0) {
        const loadedCases = casesData.value.cases
        set({ cases: loadedCases })
        // Select first case and load its primary match
        const firstCase = loadedCases[0]
        get().selectCase(firstCase.id)
      }
    } catch (err) {
      console.error('Failed to initialize app data:', err)
    }
  },

  // Case selection & loading
  selectCase: async (caseId) => {
    const targetCase = get().cases.find((c) => c.id === caseId)
    if (!targetCase) return

    set({ selectedCaseId: caseId, isLoadingCase: true })

    const primaryPairKey = targetCase.primary_pair || (targetCase.pairs[0] && targetCase.pairs[0].pair_key) || 'OHRC_TMC2'
    set({ selectedGraphPair: primaryPairKey })

    // Load primary pair match
    await get().loadCasePairMatch(caseId, primaryPairKey)
    set({ isLoadingCase: false })
  },

  loadCasePairMatch: async (caseId, pairKey) => {
    const cacheKey = `${caseId}_${pairKey}`
    if (get().caseMatches[cacheKey]) {
      const cached = get().caseMatches[cacheKey]
      set({
        matchResult: cached,
        selectedGraphPair: pairKey
      })
      get()._syncImageModalityFromMatch(cached)
      return cached
    }

    try {
      const matchData = await api.getCaseMatch(caseId, pairKey)
      set((state) => ({
        caseMatches: { ...state.caseMatches, [cacheKey]: matchData },
        matchResult: matchData,
        selectedGraphPair: pairKey
      }))
      get()._syncImageModalityFromMatch(matchData)
      return matchData
    } catch (err) {
      console.error(`Failed to load case match ${caseId} ${pairKey}:`, err)
      return null
    }
  },

  _syncImageModalityFromMatch: (matchData) => {
    if (!matchData) return
    const pairType = matchData.modality_pair_type || ''
    const parts = pairType.split('-')
    const modA = parts[0] ? parts[0].replace('PROXY', '').trim() || 'OHRC' : 'OHRC'
    const modB = parts[1] || parts[parts.length - 1] || 'TMC2'

    // Update image references if available in visualizations
    let imgA = 'ohrc_sun18deg.png'
    let imgB = 'ohrc_sun52deg.png'

    if (matchData.visualizations?.correspondences) {
      const url = matchData.visualizations.correspondences
      const filename = url.split('/').pop()
      if (filename) imgA = filename
    }
    if (matchData.visualizations?.warped_b) {
      const url = matchData.visualizations.warped_b
      const filename = url.split('/').pop()
      if (filename) imgB = filename
    }

    set({
      modalityA: modA,
      modalityB: modB,
      imageAId: imgA,
      imageBId: imgB
    })
  },

  // Legacy preset support
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

  // Match execution
  runMatch: async () => {
    set({ isLoading: true, error: null, progressStage: 'Initializing Lunar Correspondence Pipeline...' })
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
      await new Promise((r) => setTimeout(r, 150))

      set({ progressStage: 'Extracting Correspondences & Computing Geometry...' })
      const data = await api.runMatch(payload)

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

  // Benchmarking
  runBenchmark: async () => {
    set({ isBenchmarking: true })
    try {
      const data = await api.runEvaluation()
      set({ benchmarkResults: data.data, isBenchmarking: false })
    } catch (err) {
      console.error('Benchmark execution failed:', err)
      set({ isBenchmarking: false })
    }
  },

  fetchBenchmarks: async () => {
    try {
      const data = await api.getBenchmarks()
      set({ benchmarks: data.benchmarks || [] })
    } catch (err) {
      console.error('Failed to fetch benchmarks:', err)
    }
  },

  // Manual Control Points
  addControlPointA: (pt) => set((state) => ({ controlPointsA: [...state.controlPointsA, pt] })),
  addControlPointB: (pt) => set((state) => ({ controlPointsB: [...state.controlPointsB, pt] })),
  clearControlPoints: () => set({ controlPointsA: [], controlPointsB: [] })
}))
