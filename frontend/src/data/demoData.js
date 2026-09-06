/**
 * SIH26166 — Offline demo data for controlled demonstration.
 * Sourced from data/demo/*.json. This is the frontend fallback when
 * the backend is unreachable.
 *
 * SCIENTIFIC CAVEAT: All benchmark metrics are from the IIRS synthetic
 * correspondence benchmark and do NOT represent real-scene three-sensor accuracy.
 */

// ── Four real Chandrayaan-2 target pairs ────────────────────────────
export const JUDGE_POINTS = [
  {
    id: 'pair_2267',
    caseId: '2267',
    name: 'Target Region Pair 2267',
    region: 'Sinus Roris / Northern Oceanus Procellarum',
    lat: 60.989400,
    lon: -4.677456,
    description: 'Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.',
    primaryPair: 'IIRS_TMC2',
    sensors: {
      IIRS: {
        image: '/static/demo/pairs/2267/iirs.png',
        instrument: 'IIRS',
        modality: 'Hyperspectral (256 bands)',
        bands: 256,
        gsd: 86.5,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      TMC2: {
        image: '/static/demo/pairs/2267/tmc2.png',
        instrument: 'TMC-2',
        modality: 'Panchromatic Stereo Triplet',
        bands: 1,
        gsd: 5.0,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      OHRC: {
        image: '/static/demo/pairs/2267/ohrc.png',
        instrument: 'OHRC',
        modality: 'Panchromatic High-Resolution',
        bands: 1,
        gsd: 0.28,
        status: 'geographically_associated',
        dataType: 'nearest_tile',
        distanceM: 23.2,
        note: 'Closest OHRC tile (offset 23.2 m)',
      },
    },
    pairStatus: {
      IIRS_TMC2: 'spatially_paired',
      TMC2_OHRC: 'geographically_associated',
      IIRS_OHRC: 'geographically_associated',
      threeWay: 'integration_pending',
    },
  },
  {
    id: 'pair_3463',
    caseId: '3463',
    name: 'Target Region Pair 3463',
    region: 'Mare Tranquillitatis / Equatorial Sector',
    lat: 12.839792,
    lon: -45.695181,
    description: 'Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.',
    primaryPair: 'IIRS_TMC2',
    sensors: {
      IIRS: {
        image: '/static/demo/pairs/3463/iirs.png',
        instrument: 'IIRS',
        modality: 'Hyperspectral (256 bands)',
        bands: 256,
        gsd: 86.5,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      TMC2: {
        image: '/static/demo/pairs/3463/tmc2.png',
        instrument: 'TMC-2',
        modality: 'Panchromatic Stereo Triplet',
        bands: 1,
        gsd: 5.0,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      OHRC: {
        image: '/static/demo/pairs/3463/ohrc.png',
        instrument: 'OHRC',
        modality: 'Panchromatic High-Resolution',
        bands: 1,
        gsd: 0.28,
        status: 'geographically_associated',
        dataType: 'nearest_tile',
        distanceM: 52.1,
        note: 'Closest OHRC tile (offset 52.1 m)',
      },
    },
    pairStatus: {
      IIRS_TMC2: 'spatially_paired',
      TMC2_OHRC: 'geographically_associated',
      IIRS_OHRC: 'geographically_associated',
      threeWay: 'integration_pending',
    },
  },
  {
    id: 'pair_5353',
    caseId: '5353',
    name: 'Target Region Pair 5353',
    region: 'South Pole-Aitken Basin / Highlands',
    lat: -40.603614,
    lon: -20.695332,
    description: 'Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.',
    primaryPair: 'IIRS_TMC2',
    sensors: {
      IIRS: {
        image: '/static/demo/pairs/5353/iirs.png',
        instrument: 'IIRS',
        modality: 'Hyperspectral (256 bands)',
        bands: 256,
        gsd: 86.5,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      TMC2: {
        image: '/static/demo/pairs/5353/tmc2.png',
        instrument: 'TMC-2',
        modality: 'Panchromatic Stereo Triplet',
        bands: 1,
        gsd: 5.0,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      OHRC: {
        image: '/static/demo/pairs/5353/ohrc.png',
        instrument: 'OHRC',
        modality: 'Panchromatic High-Resolution',
        bands: 1,
        gsd: 0.28,
        status: 'geographically_associated',
        dataType: 'nearest_tile',
        distanceM: 46.1,
        note: 'Closest OHRC tile (offset 46.1 m)',
      },
    },
    pairStatus: {
      IIRS_TMC2: 'spatially_paired',
      TMC2_OHRC: 'geographically_associated',
      IIRS_OHRC: 'geographically_associated',
      threeWay: 'integration_pending',
    },
  },

  {
    id: 'pair_7674',
    caseId: '7674',
    name: 'Target Region Pair 7674',
    region: 'Far Side / Mare Moscoviense (Back Side)',
    lat: 20.217858,
    lon: 172.695636,
    description: 'Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.',
    primaryPair: 'IIRS_TMC2',
    sensors: {
      IIRS: {
        image: '/static/demo/pairs/7674/iirs.png',
        instrument: 'IIRS',
        modality: 'Hyperspectral (256 bands)',
        bands: 256,
        gsd: 86.5,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      TMC2: {
        image: '/static/demo/pairs/7674/tmc2.png',
        instrument: 'TMC-2',
        modality: 'Panchromatic Stereo Triplet',
        bands: 1,
        gsd: 5.0,
        status: 'available',
        dataType: 'real_spatial_scene',
      },
      OHRC: {
        image: '/static/demo/pairs/7674/ohrc.png',
        instrument: 'OHRC',
        modality: 'Panchromatic High-Resolution',
        bands: 1,
        gsd: 0.28,
        status: 'geographically_associated',
        dataType: 'nearest_tile',
        distanceM: 21.9,
        note: 'Closest OHRC tile (offset 21.9 m)',
      },
    },
    pairStatus: {
      IIRS_TMC2: 'spatially_paired',
      TMC2_OHRC: 'geographically_associated',
      IIRS_OHRC: 'geographically_associated',
      threeWay: 'integration_pending',
    },
  },
]


// ── Sensor specifications ───────────────────────────────────────────
export const SENSORS = {
  OHRC: {
    id: 'OHRC',
    name: 'Orbiter High Resolution Camera',
    instrument: 'OHRC',
    gsd: 0.28,
    modality: 'Panchromatic High-Resolution',
    bands: 1,
    swathKm: 3.0,
    spectralRange: '0.45 – 0.70 µm',
    role: 'Landing Hazard Reference',
    accent: 'cyan',
  },
  TMC2: {
    id: 'TMC2',
    name: 'Terrain Mapping Camera-2',
    instrument: 'TMC-2',
    gsd: 5.0,
    modality: 'Panchromatic Stereo Triplet',
    bands: 1,
    swathKm: 20.0,
    spectralRange: '0.50 – 0.85 µm',
    role: 'Regional 3D DEM Context',
    accent: 'violet',
  },
  IIRS: {
    id: 'IIRS',
    name: 'Imaging Infra-Red Spectrometer',
    instrument: 'IIRS',
    gsd: 86.5,
    modality: 'Hyperspectral (256 bands)',
    bands: 256,
    swathKm: 20.0,
    spectralRange: '0.80 – 5.00 µm',
    role: 'Mineral & OH/H₂O Mapping',
    accent: 'amber',
  },
}

export const SCALE_RATIOS = {
  IIRS_TMC2: 17.3,
  TMC2_OHRC: 17.86,
  IIRS_OHRC: 308.93,
}

// ── Benchmark data (IIRS synthetic — NOT real-scene accuracy) ───────
export const BENCHMARKS = {
  warning: 'These measurements reflect the fine-adapted LoFTR benchmark on synthetic IIRS correspondence pairs and are NOT real-scene three-sensor accuracy.',
  standard: {
    name: 'Standard Illumination Conditions',
    sunAngleRange: '15°–45°',
    evaluatedPairs: 500,
    meanErrorPx: 0.3801,
    p90ErrorPx: 0.5684,
    accuracy1px: 96.95,
    accuracy2px: 99.11,
    accuracy3px: 99.55,
    inlierRatio: 99.42,
    meanConfidence: 90.36,
    runtimeMs: 29.4,
    status: 'validated_benchmark',
  },
  stress: {
    name: 'Stress / Extreme Grazing Solar Incidence',
    sunAngleRange: '5°–15°',
    evaluatedPairs: 500,
    meanErrorPx: 0.5458,
    p90ErrorPx: 0.6644,
    accuracy1px: 95.38,
    accuracy2px: 98.12,
    accuracy3px: 99.24,
    inlierRatio: 99.06,
    meanConfidence: 89.70,
    runtimeMs: 30.2,
    status: 'validated_benchmark',
  },
  ablations: [
    {
      method: 'Classical SIFT + RANSAC',
      keypoints: 450,
      matches: 62,
      inliers: 14,
      inlierRatio: 22.58,
      rmse: 2.65,
      runtimeMs: 48.2,
      status: 'baseline',
    },
    {
      method: 'Classical AKAZE + RANSAC',
      keypoints: 512,
      matches: 78,
      inliers: 24,
      inlierRatio: 30.77,
      rmse: 2.14,
      runtimeMs: 55.6,
      status: 'baseline',
    },
    {
      method: 'Proposed Fine-Adapted LoFTR (Ours)',
      keypoints: 1200,
      matches: 1193,
      inliers: 1186,
      inlierRatio: 99.42,
      rmse: 0.3801,
      runtimeMs: 29.4,
      status: 'validated_benchmark',
    },
  ],
}

// ── Methodology pipeline ────────────────────────────────────────────
export const METHODOLOGY_STEPS = [
  {
    stage: 1,
    name: 'Data Ingestion & Calibration',
    description: 'Standardized ingestion of raw PDS4/HDF5 data, geo-referencing coordinates, and calibrated reflectance conversion.',
    inputs: ['Raw IIRS QUBE', 'TMC-2 Triplet', 'OHRC Strip'],
    status: 'operational',
  },
  {
    stage: 2,
    name: 'Multi-Scale Pyramid Rescaling',
    description: 'Gaussian scale-space pyramid alignment handling the 17.3× to 308.93× spatial resolution gap between sensors.',
    inputs: ['Calibrated Panchromatic & Proxy Images'],
    status: 'operational',
  },
  {
    stage: 3,
    name: 'Illumination Normalization',
    description: 'Photometric reflectance modeling and adaptive Wallis filter normalization across varying solar incidence angles (5° to 85°).',
    inputs: ['Multi-Sun Angle Image Pairs'],
    status: 'operational',
  },
  {
    stage: 4,
    name: 'Learned Coarse-to-Fine LoFTR Matching',
    description: 'Detector-free transformer correspondence establishing dense feature matches across modality boundaries.',
    inputs: ['Normalized Image Pairs'],
    status: 'validated_on_synthetic_iirs',
  },
  {
    stage: 5,
    name: 'Spatial Confidence Heatmap',
    description: 'Per-pixel match probability field computation isolating high-certainty lunar landmarks from low-texture maria.',
    inputs: ['Transformer Correlation Maps'],
    status: 'operational',
  },
  {
    stage: 6,
    name: 'Robust Projective Fitting / MAGSAC++',
    description: 'Marginalizing sample consensus with threshold-free geometric estimation for accurate homography & affine model recovery.',
    inputs: ['Dense Correspondences & Weights'],
    status: 'operational',
  },
  {
    stage: 7,
    name: 'Hierarchical Tri-Sensor Co-Registration',
    description: 'Chained composite transformation (IIRS ↔ TMC-2 ↔ OHRC) bridging 86.5 m to 0.28 m via intermediate TMC-2 5.0 m geometry.',
    inputs: ['IIRS↔TMC2 Transform', 'TMC2↔OHRC Transform'],
    status: 'integration_pending',
  },
]

// ── Scientific limitations & provenance ─────────────────────────────
export const SCIENTIFIC_STATES = {
  'SPATIALLY PAIRED': 'Real lunar scenes that share genuine spatial/geographic overlap between Chandrayaan-2 instruments.',
  'GEOGRAPHICALLY ASSOCIATED': 'Nearest-neighbor counterpart tile selected from regional survey imagery based on lunar coordinate proximity.',
  'MODEL VALIDATION PENDING': 'Real imagery is confirmed and spatially co-located, but dense learned feature correspondence inference and geometric validation have not yet been completed.',
  'INTEGRATION PENDING': 'Multi-sensor registration bridge pipeline scheduled for deployment in the three-instrument release.',
  'APPROXIMATE GEOMETRY': 'Pixel-to-lunar coordinate mapping derived from planning/visualization ephemeris rather than rigorous bundle-adjusted SPICE kernels.',
  'SYNTHETIC BENCHMARK': 'High-fidelity synthetic rendering benchmark used to rigorously validate fine-adapted LoFTR performance under controlled sun-angle variations.',
  'VALIDATED BENCHMARK': 'Empirically measured, peer-verifiable error metrics from 500+ controlled synthetic correspondence pairs.',
}

export const LIMITATIONS = [
  {
    id: 'lim_01',
    title: 'Raw Product Calibration',
    detail: 'IIRS source products are currently ingested in Raw/Level-1 format; photometric shading and stray-light corrections are preliminary.',
  },
  {
    id: 'lim_02',
    title: 'Approximate Lunar Geolocation',
    detail: 'The current pixel-to-lunar geometry is for planning and visual correspondence demonstration; it is not yet tied to high-order SPICE SPK/CK kernels.',
  },
  {
    id: 'lim_03',
    title: 'Synthetic Benchmark Scope',
    detail: 'Verified sub-pixel benchmark metrics (0.3801 px normal, 0.5458 px stress) represent the fine-adapted LoFTR model evaluated on synthetic IIRS pairs, not real-scene three-sensor accuracy.',
  },
  {
    id: 'lim_04',
    title: 'TMC-2 / OHRC Model Integration',
    detail: 'TMC-2 to OHRC learned correspondence model fine-tuning is actively ongoing; real pair correspondence endpoints return explicit pending states to prevent data fabrication.',
  },
  {
    id: 'lim_05',
    title: 'Three-Way Geometric Validation',
    detail: 'Full three-sensor closed-loop geometric validation (cycle consistency error < 1 px across IIRS–TMC-2–OHRC) remains under development.',
  },
  {
    id: 'lim_06',
    title: 'Geographic Pairing vs. Learned Validation',
    detail: 'Deterministic geographic pairing of scenes/tiles confirms geographic proximity, which is distinct from solved and validated feature correspondence.',
  },
]

export const METHODOLOGY = {
  pipeline_steps: METHODOLOGY_STEPS.map((s) => ({
    step: s.stage,
    title: s.name,
    description: s.description,
    detail: s.inputs ? s.inputs.join(' • ') : '',
    status: s.status === 'operational' ? 'completed' : 'active'
  }))
}

export const PROVENANCE = {
  limitations: LIMITATIONS
}

