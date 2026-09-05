"""
Core Match Execution Service (SIH26166).

Coordinates data loading, preprocessing, feature extraction, geometry fitting,
confidence evaluation, and visual rendering for API endpoints.
"""

import os
import uuid
import time
import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional

from backend.app.schemas.contracts import MatchRequestSchema, MatchResultResponseSchema, MetricsResponseSchema
from backend.app.services.visualization_service import (
    render_correspondences, render_alignment_overlay, render_confidence_heatmap_b64
)
from ml.matching.classical import ClassicalMatcher
from ml.matching.learned_loftr import LearnedMatcher
from ml.preprocessing.illumination import preprocess_illumination
from ml.preprocessing.shadows import detect_shadow_mask
from ml.preprocessing.scale_pyramid import estimate_scale_ratio, resize_for_matching
from ml.preprocessing.iirs_proxy import build_iirs_proxy
from ml.evaluation.cycle_consistency import compute_cycle_consistency

def execute_matching_job(
    request: MatchRequestSchema,
    image_a_path: str,
    image_b_path: str,
    iirs_cube_a: Optional[np.ndarray] = None,
    iirs_cube_b: Optional[np.ndarray] = None
) -> MatchResultResponseSchema:
    start_time = time.time()
    job_id = str(uuid.uuid4())[:8]

    # Load images
    img_a = cv2.imread(image_a_path, cv2.IMREAD_GRAYSCALE) if iirs_cube_a is None else None
    img_b = cv2.imread(image_b_path, cv2.IMREAD_GRAYSCALE) if iirs_cube_b is None else None

    if img_a is None and iirs_cube_a is None:
        raise ValueError(f"Unable to read image A from {image_a_path}")
    if img_b is None and iirs_cube_b is None:
        raise ValueError(f"Unable to read image B from {image_b_path}")

    # Handle IIRS Hyperspectral Proxy
    modality_pair = f"{request.modality_a.upper()}-{request.modality_b.upper()}"
    if request.modality_a.upper() == "IIRS" or "IIRS" in request.image_a_id.upper():
        if iirs_cube_a is not None:
            img_a, _ = build_iirs_proxy(iirs_cube_a, band_indices=request.options.iirs_band_indices)
        elif img_a is None:
            img_a = cv2.imread(image_a_path, cv2.IMREAD_GRAYSCALE)
        modality_pair = f"IIRS-PROXY-{request.modality_b.upper()}"

    if request.modality_b.upper() == "IIRS" or "IIRS" in request.image_b_id.upper():
        if iirs_cube_b is not None:
            img_b, _ = build_iirs_proxy(iirs_cube_b, band_indices=request.options.iirs_band_indices)
        elif img_b is None:
            img_b = cv2.imread(image_b_path, cv2.IMREAD_GRAYSCALE)
        modality_pair = f"{request.modality_a.upper()}-IIRS-PROXY"

    # Preprocessing: Illumination Normalization
    proc_a = img_a.copy()
    proc_b = img_b.copy()

    if request.options.use_illumination_normalization:
        proc_a = preprocess_illumination(proc_a, sun_elevation_deg=request.sun_elevation_a)
        proc_b = preprocess_illumination(proc_b, sun_elevation_deg=request.sun_elevation_b)

    # Shadow Masking
    mask_a, mask_b = None, None
    shadow_mask_a = None
    if request.options.use_shadow_mask:
        shadow_mask_a, valid_a = detect_shadow_mask(proc_a)
        _, valid_b = detect_shadow_mask(proc_b)
        mask_a, mask_b = valid_a, valid_b

    # Scale Pyramid handling
    scale_ratio = estimate_scale_ratio(request.gsd_a, request.gsd_b, proc_a.shape[:2], proc_b.shape[:2])
    if request.options.use_scale_pyramid and scale_ratio > 1.5:
        proc_b, _ = resize_for_matching(proc_b, target_scale=1.0 / scale_ratio)

    # Execute Matcher (Proposed Learned vs Classical Baseline)
    match_options = {
        "modality_pair": modality_pair,
        "algorithm": request.options.classical_algorithm,
        "geometry_model": request.options.geometry_model
    }

    if request.options.pipeline.lower() == "classical":
        matcher = ClassicalMatcher(algorithm=request.options.classical_algorithm)
    else:
        matcher = LearnedMatcher()

    match_result = matcher.match(proc_a, proc_b, mask_a=mask_a, mask_b=mask_b, options=match_options)

    # Cycle consistency error
    cycle_error = None
    if match_result.homography is not None:
        cycle_metrics = compute_cycle_consistency(np.array(match_result.homography), image_size=proc_a.shape[:2])
        cycle_error = cycle_metrics.get("mean_error_px")

    # Render Visualizations & Confidence Map
    corr_b64 = render_correspondences(
        proc_a, proc_b,
        match_result.keypoints_a, match_result.keypoints_b,
        match_result.correspondences, match_result.inlier_mask
    )

    overlay_b64 = render_alignment_overlay(proc_a, proc_b, match_result.homography)

    heatmap_b64, conf_summary = render_confidence_heatmap_b64(
        image_shape=proc_a.shape[:2],
        keypoints_a=match_result.keypoints_a,
        inlier_mask=match_result.inlier_mask,
        confidence_scores=match_result.confidence_scores,
        shadow_mask=shadow_mask_a
    )

    elapsed_ms = (time.time() - start_time) * 1000.0

    sun_diff = abs(request.sun_elevation_a - request.sun_elevation_b) if request.sun_elevation_a is not None and request.sun_elevation_b is not None else None

    metrics_response = MetricsResponseSchema(
        num_keypoints_a=len(match_result.keypoints_a),
        num_keypoints_b=len(match_result.keypoints_b),
        num_matches=len(match_result.correspondences),
        num_inliers=match_result.metrics.get("num_inliers", 0),
        inlier_ratio=match_result.metrics.get("inlier_ratio", 0.0),
        rmse=match_result.metrics.get("rmse"),
        runtime_ms=round(elapsed_ms, 2),
        scale_ratio=round(scale_ratio, 2),
        sun_angle_difference_deg=round(sun_diff, 1) if sun_diff is not None else None,
        cycle_consistency_error=cycle_error,
        confidence_mean=conf_summary.get("mean_confidence", 0.0),
        quality_score=conf_summary.get("quality_score", 0),
        confidence_level=conf_summary.get("confidence_level", "Low"),
        modality_pair_type=modality_pair
    )

    return MatchResultResponseSchema(
        job_id=job_id,
        status="completed",
        modality_pair_type=modality_pair,
        keypoints_a=match_result.keypoints_a,
        keypoints_b=match_result.keypoints_b,
        correspondences=match_result.correspondences,
        inlier_mask=match_result.inlier_mask,
        homography=match_result.homography,
        metrics=metrics_response,
        warnings=match_result.warnings,
        visualizations={
            "correspondences": corr_b64,
            "warped_b": overlay_b64["warped_b"],
            "blended_overlay": overlay_b64["blended_overlay"],
            "flicker_composite": overlay_b64["flicker_composite"],
            "confidence_heatmap": heatmap_b64
        }
    )
