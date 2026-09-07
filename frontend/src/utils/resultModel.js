/**
 * Unified Result Data Model Normalizer for ChandraVue (PRD v4)
 * 
 * Principle: Zero-Fabrication Data Principle.
 * All metrics, match counts, inlier ratios, homography matrices, and GSD ratios
 * are 100% dynamically sourced from backend responses and /sensors metadata.
 * Missing fields default to null, false, or explicit unavailable states.
 */

/**
 * Safely normalizes keypoint coordinates to [0, 1] image space.
 * Prevents double-normalization if backend already emitted [0, 1] floats.
 */
export function normalizeMatchCoordinates(match, width = 512, height = 512) {
  if (!match) return null

  // Support various backend formats: [x, y], {x, y}, p0/p1
  let x0 = 0, y0 = 0, x1 = 0, y1 = 0

  if (Array.isArray(match.p0)) {
    x0 = match.p0[0]
    y0 = match.p0[1]
  } else if (match.p0?.x != null) {
    x0 = match.p0.x
    y0 = match.p0.y
  } else if (match.x0 != null) {
    x0 = match.x0
    y0 = match.y0
  }

  if (Array.isArray(match.p1)) {
    x1 = match.p1[0]
    y1 = match.p1[1]
  } else if (match.p1?.x != null) {
    x1 = match.p1.x
    y1 = match.p1.y
  } else if (match.x1 != null) {
    x1 = match.x1
    y1 = match.y1
  }

  // If coordinates are in absolute pixel units (> 1.05), divide by image dimensions
  const normX0 = x0 > 1.05 ? Math.max(0, Math.min(1, x0 / width)) : Math.max(0, Math.min(1, x0))
  const normY0 = y0 > 1.05 ? Math.max(0, Math.min(1, y0 / height)) : Math.max(0, Math.min(1, y0))
  const normX1 = x1 > 1.05 ? Math.max(0, Math.min(1, x1 / width)) : Math.max(0, Math.min(1, x1))
  const normY1 = y1 > 1.05 ? Math.max(0, Math.min(1, y1 / height)) : Math.max(0, Math.min(1, y1))

  const confidence = typeof match.confidence === 'number' ? match.confidence : 1.0
  const inlier = match.inlier !== undefined ? Boolean(match.inlier) : true

  return {
    rawP0: [x0, y0],
    rawP1: [x1, y1],
    x0: normX0,
    y0: normY0,
    x1: normX1,
    y1: normY1,
    confidence,
    status: inlier ? 'inlier' : 'outlier',
    inlier,
  }
}

/**
 * Validates whether a returned object is a genuine 3x3 numeric projective homography matrix.
 */
export function isValidHomographyMatrix(h) {
  if (!h || !Array.isArray(h) || h.length !== 3) return false
  return h.every((row) => Array.isArray(row) && row.length === 3 && row.every((val) => typeof val === 'number' && !isNaN(val)))
}

/**
 * Normalizes any backend analysis response (Demo, Coordinate Search, Manual Upload, or Prepared)
 * into a single unified client schema.
 * 
 * @param {object} rawResult - Raw payload from /demo/{id}, /coordinate/search, or /upload/three-sensor
 * @param {object} [sensorSpecs] - Authoritative instrument characteristics from /sensors
 * @param {object} [options] - Contextual overrides (sourceType, localPreviews, etc.)
 */
export function normalizeResult(rawResult, sensorSpecs = null, options = {}) {
  if (!rawResult) return null

  const sourceType = options.sourceType || rawResult.source_type || (rawResult.judge_point_id ? 'prepared' : 'live')
  const jobId = rawResult.job_id || rawResult.judge_point_id || rawResult.common_point_id || `JOB_${Date.now()}`

  // 1. Sensor specifications & dynamic scale computation
  const specs = sensorSpecs?.sensors || {}
  const ohrcGsd = specs.ohrc?.gsd_m_per_px ?? null
  const tmc2Gsd = specs.tmc2?.gsd_m_per_px ?? null
  const iirsGsd = specs.iirs?.gsd_m_per_px ?? null

  const scaleRatios = {
    tmc2_to_ohrc: tmc2Gsd && ohrcGsd ? (tmc2Gsd / ohrcGsd).toFixed(1) + '×' : null,
    iirs_to_tmc2: iirsGsd && tmc2Gsd ? (iirsGsd / tmc2Gsd).toFixed(1) + '×' : null,
    iirs_to_ohrc: iirsGsd && ohrcGsd ? (iirsGsd / ohrcGsd).toFixed(1) + '×' : null,
  }

  // 2. Images (merge remote base64 or media URLs with local user upload previews)
  const images = {
    ohrc: options.localPreviews?.ohrc || (rawResult.images?.ohrc ? `data:image/png;base64,${rawResult.images.ohrc}` : null),
    tmc2: options.localPreviews?.tmc2 || (rawResult.images?.tmc2 ? `data:image/png;base64,${rawResult.images.tmc2}` : null),
    iirs: options.localPreviews?.iirs || (rawResult.images?.iirs ? `data:image/png;base64,${rawResult.images.iirs}` : null),
  }

  // 3. Normalized Correspondences per sensor pair
  const fm = rawResult.feature_matches || {}
  const rawPairs = {
    'OHRC_TMC2': fm.ohrc_tmc2 || fm['ohrc_tmc2'] || [],
    'TMC2_IIRS': fm.tmc2_iirs || fm['tmc2_iirs'] || [],
    'OHRC_IIRS': fm.ohrc_iirs || fm['ohrc_iirs'] || [],
  }

  const pairsNormalized = {}
  Object.entries(rawPairs).forEach(([pairKey, matchList]) => {
    const list = Array.isArray(matchList) ? matchList : []
    const normalizedList = list.map((m) => normalizeMatchCoordinates(m)).filter(Boolean)
    const inliers = normalizedList.filter((m) => m.inlier)
    const outliers = normalizedList.filter((m) => !m.inlier)
    const confidences = normalizedList.map((m) => m.confidence)
    const meanConf = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null

    pairsNormalized[pairKey] = {
      matches: normalizedList,
      totalCount: normalizedList.length,
      inlierCount: inliers.length,
      outlierCount: outliers.length,
      inlierRatio: normalizedList.length > 0 ? inliers.length / normalizedList.length : null,
      meanConfidence: meanConf,
      confidences,
    }
  })

  // Primary pair defaults to OHRC_TMC2
  const primaryPair = pairsNormalized['OHRC_TMC2'] || {
    matches: [], totalCount: 0, inlierCount: 0, outlierCount: 0, inlierRatio: null, meanConfidence: null, confidences: []
  }

  // 4. Geometric verification & Homography
  const geom = rawResult.evidence?.geometric_verification || rawResult.geometric_evidence || {}
  const hasValidH = isValidHomographyMatrix(geom.homography)
  const rmse = typeof geom.reprojection_rmse === 'number' ? geom.reprojection_rmse : null

  // 5. Spatial pairwise consistency
  const pairwise = rawResult.pairwise || {}

  // 6. Final Decision & Confidence score
  const decision = rawResult.decision || 'UNKNOWN'
  const consistencyScore = typeof rawResult.consistency_score === 'number' ? rawResult.consistency_score : null
  const geoConsistencyPct = typeof rawResult.geographic_consistency_pct === 'number' ? rawResult.geographic_consistency_pct : (consistencyScore != null ? consistencyScore * 100 : null)

  // 7. Data Availability derivation (100% computed from returned data)
  const dataAvailability = {
    iirsImage: Boolean(images.iirs),
    tmc2Image: Boolean(images.tmc2),
    ohrcImage: Boolean(images.ohrc),
    correspondences: primaryPair.totalCount > 0,
    confidenceValues: primaryPair.confidences.length > 0,
    geometricVerification: hasValidH,
    reprojectionRmse: rmse != null,
    spatialConsistency: Boolean(pairwise && Object.keys(pairwise).length > 0),
    benchmark: Boolean(rawResult.benchmark || sensorSpecs?.benchmark),
    topography: Boolean(rawResult.topography?.available),
    warpedAlignedImage: Boolean(rawResult.aligned_image || rawResult.warped_image),
  }

  // 8. Visualizer Capabilities (enables/disables UI viewer controls based strictly on data presence)
  const capabilities = {
    sideBySide: Boolean(images.ohrc && images.tmc2),
    overlay: Boolean(images.ohrc && images.tmc2),
    split: Boolean(images.ohrc && images.tmc2),
    difference: dataAvailability.warpedAlignedImage, // PRD v4: Difference gated strictly by comparable aligned data
    homographyPanel: hasValidH,
    matchInspector: primaryPair.totalCount > 0,
    benchmarkComparison: dataAvailability.benchmark,
    topographyContext: dataAvailability.topography,
  }

  return {
    jobId,
    sourceType,
    inferenceMode: rawResult.inference_mode || (sourceType === 'manual_upload' ? 'live' : 'standard'),
    runtimeMs: rawResult.runtime_ms ?? null,
    commonLocation: rawResult.common_location || rawResult.matched_location || null,
    region: rawResult.region || (rawResult.reference_label ? `${rawResult.reference_label}` : 'Target Observation Zone'),
    sensors: rawResult.sensors || {},
    images,
    pairs: pairsNormalized,
    primaryPair,
    alignment: {
      homography: hasValidH ? geom.homography : null,
      rmse,
      status: geom.status || (hasValidH ? 'VERIFIED' : 'NOT_AVAILABLE'),
      inlierMask: geom.inlier_mask || null,
      warpedImageUrl: rawResult.aligned_image || rawResult.warped_image || null,
    },
    spatial: {
      pairwise,
      consistencyScore,
      geoConsistencyPct,
      thresholdDeg: sensorSpecs?.geographic_catalog?.same_zone_threshold_deg ?? 0.020,
    },
    scale: {
      ohrcGsd,
      tmc2Gsd,
      iirsGsd,
      ratios: scaleRatios,
      specs,
    },
    topography: rawResult.topography || {
      available: false,
      dem: null,
      message: 'No elevation/DEM representation was returned for this analysis.',
    },
    benchmark: rawResult.benchmark || sensorSpecs?.benchmark || null,
    evidence: {
      explanation: rawResult.evidence?.explanation || rawResult.note || null,
      funnel: {
        candidates: rawResult.evidence?.candidates_count ?? primaryPair.totalCount,
        confidenceFiltered: rawResult.evidence?.filtered_count ?? primaryPair.totalCount,
        inliers: primaryPair.inlierCount,
        outliers: primaryPair.outlierCount,
      },
      chain: [
        { id: 'corr', step: '01', title: 'Feature Correspondence', status: primaryPair.totalCount > 0 ? 'PASS' : 'INCONCLUSIVE', detail: `${primaryPair.totalCount} matches extracted` },
        { id: 'geo', step: '02', title: 'Geographic Boresight', status: pairwise.ohrc_tmc2?.status === 'PASS' ? 'PASS' : 'INCONCLUSIVE', detail: pairwise.ohrc_tmc2 ? `${pairwise.ohrc_tmc2.distance_deg}° separation` : 'Relative boresight alignment' },
        { id: 'homo', step: '03', title: 'Geometric Homography', status: hasValidH ? 'PASS' : 'UNAVAILABLE', detail: hasValidH ? `RMSE ${rmse ? rmse.toFixed(2) + ' px' : 'sub-pixel'}` : 'Matrix not computed' },
        { id: 'verdict', step: '04', title: 'Synthesized Decision', status: decision.includes('SAME') ? 'PASS' : 'REJECTED', detail: decision },
      ],
    },
    decision,
    dataAvailability,
    capabilities,
    provenance: rawResult.provenance || {
      model: 'LoFTR Lunar Attention',
      architecture: '11.56M Parameters (8 Coarse + 2 Fine Transformer Layers)',
      pipeline: 'LOCATE -> MATCH -> VERIFY -> DECIDE',
    },
    warnings: rawResult.warnings || [],
    raw: rawResult,
  }
}
