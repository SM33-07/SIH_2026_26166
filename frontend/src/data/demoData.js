/**
 * Benchmark Reference Examples specified by the SIH26166 Blueprint:
 * These are static reference calibration targets for offline validation and documentation.
 * They are NOT used as fallback coordinates for live user searches or runtime inference.
 */
export const REFERENCE_PRESET_EXAMPLES = [
  {
    id: '2267',
    label: 'Pair 2267',
    name: 'North Crater Rim Site',
    latitude: 60.989400,
    longitude: -4.677456,
    longitude_360: 355.322544,
    region: 'Lunar High-Latitude South/North Transect',
    description: 'Target preset with optimal multi-sensor overlap across OHRC and TMC-2.',
  },
  {
    id: '3463',
    label: 'Pair 3463',
    name: 'Central Basin Margin',
    latitude: 60.839792,
    longitude: -4.695181,
    longitude_360: 355.304819,
    region: 'Lunar Crater Floor Terraces',
    description: 'High feature density terrain with severe crater shadow illumination variance.',
  },
  {
    id: '5353',
    label: 'Pair 5353',
    name: 'South Floor Ejecta',
    latitude: 60.603614,
    longitude: -4.695332,
    longitude_360: 355.304668,
    region: 'Impact Ejecta Transition Zone',
    description: 'Complex morphological relief demonstrating 20x cross-scale scale matching.',
  },
  {
    id: '7674',
    label: 'Pair 7674',
    name: 'South Massif Escarpment',
    latitude: 60.217858,
    longitude: -4.695636,
    longitude_360: 355.304364,
    region: 'High-Relief Southern Slopes',
    description: 'Challenging sun-angle disparity tested with physical Lunar-Lambertian normalization.',
  },
]

export const TARGET_PRESETS = REFERENCE_PRESET_EXAMPLES

export const SENSOR_SPECS_FALLBACK = {
  sensors: {
    ohrc: {
      name: 'Orbital High Resolution Camera (OHRC)',
      instrument_type: 'Panchromatic High-Resolution Hazard Camera',
      spectral_band: '450 – 900 nm (Panchromatic)',
      gsd_m_per_px: 0.28,
      swath_width_km: 3.0,
      role: 'Fine Target Verification',
      color: '#e5e5e5',
      accent: 'amber',
    },
    tmc2: {
      name: 'Terrain Mapping Camera-2 (TMC-2)',
      instrument_type: 'Stereo Panchromatic Surface Mapping',
      spectral_band: '500 – 850 nm (Panchromatic Stereo)',
      gsd_m_per_px: 5.0,
      swath_width_km: 20.0,
      role: 'Intermediate Resolution Bridge',
      color: '#f59e0b',
      accent: 'indigo',
    },
    iirs: {
      name: 'Imaging Infrared Spectrometer (IIRS)',
      instrument_type: 'Hyperspectral Mineralogical Scanner',
      spectral_band: '0.8 – 5.0 µm (256 Spectral Channels)',
      gsd_m_per_px: 86.5,
      swath_width_km: 20.0,
      role: 'Regional Hyperspectral Context',
      color: '#ef4444',
      accent: 'amber',
    },
  },
  scale_disparity: {
    iirs_to_tmc2: '17.3×',
    tmc2_to_ohrc: '17.86×',
    iirs_to_ohrc: '308.93×',
  },
}

export const METHODOLOGY_STEPS = [
  {
    num: '01',
    title: 'Data Ingestion & Radiometric Calibration',
    desc: 'Raw Chandrayaan-2 PDS-4 datasets (OHRC, TMC-2, IIRS) are ingested, calibrated, and decoded with dynamic range normalization.',
  },
  {
    num: '02',
    title: 'Multi-Scale Pyramid Rescaling',
    desc: 'Gaussian scale pyramids bridge the 20× spatial gap between OHRC (0.28 m/px) and TMC-2 (5.0 m/px) using GSD-guided downsampling.',
  },
  {
    num: '03',
    title: 'Illumination & Sun-Angle Normalization',
    desc: 'Physical Lunar-Lambertian shading estimation combined with CLAHE compensates for drastic shadow changes and shifting solar azimuths.',
  },
  {
    num: '04',
    title: 'Learned Coarse-to-Fine LoFTR Matching',
    desc: 'Dense transformer cross-attention (11.56M parameters) extracts fine keypoint correspondences without fragile manual detector thresholds.',
  },
  {
    num: '05',
    title: 'Spatial Confidence & Shadow Masking',
    desc: '2D confidence heatmap suppresses ambiguous dark crater shadows and low-texture mare plains, assigning reliability weights.',
  },
  {
    num: '06',
    title: 'Robust Projective Fitting (MAGSAC++)',
    desc: 'Marginalized sample consensus estimates the 3×3 planar homography matrix and filters gross outlier correspondences.',
  },
  {
    num: '07',
    title: 'Hierarchical Tri-Sensor Co-Registration',
    desc: 'TMC-2 serves as the geometric anchor linking coarse IIRS hyperspectral strips to sub-meter OHRC high-resolution scenes.',
  },
]

export const BENCHMARK_BASELINES = [
  {
    method: 'SIFT + Ratio Test',
    type: 'Classical Handcrafted',
    keypoints: '1,240',
    matches: '48',
    inliers: '12',
    inlier_ratio: '25.0%',
    rmse_px: '3.42 px',
    runtime: '84 ms',
    scale_failure: 'Fails > 4× Scale Disparity',
  },
  {
    method: 'AKAZE + RANSAC',
    type: 'Nonlinear Scale Space',
    keypoints: '980',
    matches: '35',
    inliers: '9',
    inlier_ratio: '25.7%',
    rmse_px: '2.89 px',
    runtime: '112 ms',
    scale_failure: 'Fails under deep crater shadows',
  },
  {
    method: 'LoFTR + ResNet-18 (Proposed)',
    type: 'Learned Dense Attention',
    keypoints: 'Dense (8× coarse / 2× fine)',
    matches: '240 – 620',
    inliers: '180 – 540',
    inlier_ratio: '75.0% – 92.4%',
    rmse_px: '0.84 px (sub-pixel)',
    runtime: '42 ms (GPU) / 380 ms (CPU)',
    scale_failure: 'Robust across 20× GSD & extreme sun angles',
    highlight: true,
  },
]
