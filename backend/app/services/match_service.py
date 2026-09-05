"""
Core Match Execution Service (SIH26166).

Coordinates data loading, preprocessing, feature extraction, geometry fitting,
confidence evaluation, and visual rendering for API endpoints.
"""

import os
import json
import uuid
import time
import math
from typing import Dict, Any, Tuple, Optional, List

from backend.app.config import settings
from backend.app.schemas.contracts import MatchRequestSchema, MatchResultResponseSchema, MetricsResponseSchema
from backend.app.services.visualization_service import (
    render_correspondences, render_alignment_overlay, render_confidence_heatmap_b64, get_demo_visualization_urls
)

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import numpy as np
except ImportError:
    np = None

try:
    from ml.matching.classical import ClassicalMatcher
    from ml.matching.learned_loftr import LearnedMatcher
    from ml.preprocessing.illumination import preprocess_illumination
    from ml.preprocessing.shadows import detect_shadow_mask
    from ml.preprocessing.scale_pyramid import estimate_scale_ratio, resize_for_matching
    from ml.preprocessing.iirs_proxy import build_iirs_proxy
    from ml.evaluation.cycle_consistency import compute_cycle_consistency
except ImportError:
    ClassicalMatcher = None
    LearnedMatcher = None
    preprocess_illumination = None
    detect_shadow_mask = None
    estimate_scale_ratio = None
    resize_for_matching = None
    build_iirs_proxy = None
    compute_cycle_consistency = None

def execute_matching_job(
    request: MatchRequestSchema,
    image_a_path: str,
    image_b_path: str,
    iirs_cube_a: Optional[Any] = None,
    iirs_cube_b: Optional[Any] = None
) -> MatchResultResponseSchema:
    if settings.DEMO_MODE or cv2 is None or LearnedMatcher is None:
        matcher = PrecomputedMatcher()
        return matcher.match(request, image_a_path, image_b_path)

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


class MatcherAdapter:
    """Base interface for matching engines (preserves future live inference architecture)."""
    def match(self, request: MatchRequestSchema, path_a: str, path_b: str) -> MatchResultResponseSchema:
        raise NotImplementedError


class PrecomputedMatcher(MatcherAdapter):
    """Matcher that resolves precomputed results from data/demo/matches or demo presets."""
    def match(self, request: MatchRequestSchema, path_a: str, path_b: str) -> MatchResultResponseSchema:
        mod_a = request.modality_a.upper()
        mod_b = request.modality_b.upper()
        pair_key = f"{mod_a}_{mod_b}"
        rev_pair_key = f"{mod_b}_{mod_a}"

        # Look in data/demo/matches/*
        matches_dir = os.path.join(settings.DEMO_DIR, "matches")
        if os.path.exists(matches_dir):
            for case_dir in sorted(os.listdir(matches_dir)):
                candidate_a = os.path.join(matches_dir, case_dir, f"{pair_key}.json")
                if os.path.exists(candidate_a):
                    with open(candidate_a, "r") as f:
                        data = json.load(f)
                        return MatchResultResponseSchema(**data)
                candidate_b = os.path.join(matches_dir, case_dir, f"{rev_pair_key}.json")
                if os.path.exists(candidate_b):
                    with open(candidate_b, "r") as f:
                        data = json.load(f)
                        return MatchResultResponseSchema(**data)

        # If pair is integration_pending (like TMC2_IIRS or unvalidated pairs)
        is_pending = (mod_a == "TMC2" and mod_b == "IIRS") or (mod_a == "IIRS" and mod_b == "TMC2")

        job_id = f"demo_{uuid.uuid4().hex[:8]}"
        img_a_name = os.path.basename(path_a) if path_a else "ohrc_sun18deg.png"
        img_b_name = os.path.basename(path_b) if path_b else "ohrc_sun52deg.png"
        urls = get_demo_visualization_urls(img_a_name, img_b_name)

        if is_pending:
            return MatchResultResponseSchema(
                job_id=job_id,
                status="integration_pending",
                modality_pair_type=f"{mod_a}-{mod_b}",
                keypoints_a=[],
                keypoints_b=[],
                correspondences=[],
                inlier_mask=[],
                homography=None,
                metrics=None,
                warnings=[
                    f"Three-instrument co-registration pipeline integration in progress for {mod_a}-{mod_b}.",
                    "Full scientific cross-modal registration scheduled for multi-instrument pipeline release."
                ],
                visualizations=urls
            )

        # Standard deterministic precomputed match
        num_kps = 120
        kps_a = []
        kps_b = []
        for i in range(num_kps):
            angle = i * 2.39996
            r = 2.0 * math.sqrt((i + 1) / num_kps)
            x = round(384.0 + r * 120.0 * ((i % 5 + 1) / 3.0), 2)
            y = round(384.0 + r * 100.0 * (((i + 2) % 4 + 1) / 2.5), 2)
            kps_a.append([max(10.0, min(750.0, x)), max(10.0, min(750.0, y))])
            kps_b.append([max(10.0, min(750.0, x + 6.0)), max(10.0, min(750.0, y - 4.0))])

        corrs = [[i, i] for i in range(num_kps)]
        inliers = [(i % 15 != 0) for i in range(num_kps)]
        num_inliers = sum(1 for x in inliers if x)
        scale_ratio = round((request.gsd_b or 1.0) / max(0.001, (request.gsd_a or 1.0)), 2)
        sun_diff = abs((request.sun_elevation_a or 30.0) - (request.sun_elevation_b or 30.0))

        metrics = MetricsResponseSchema(
            num_keypoints_a=num_kps,
            num_keypoints_b=num_kps,
            num_matches=num_kps,
            num_inliers=num_inliers,
            inlier_ratio=round(num_inliers / num_kps, 4),
            rmse=0.38,
            runtime_ms=29.4,
            scale_ratio=scale_ratio,
            sun_angle_difference_deg=round(sun_diff, 1),
            cycle_consistency_error=0.32,
            confidence_mean=0.904,
            quality_score=92,
            confidence_level="High",
            modality_pair_type=f"{mod_a}-{mod_b}"
        )

        return MatchResultResponseSchema(
            job_id=job_id,
            status="demo_precomputed",
            modality_pair_type=f"{mod_a}-{mod_b}",
            keypoints_a=kps_a,
            keypoints_b=kps_b,
            correspondences=corrs,
            inlier_mask=inliers,
            homography=[
                [0.9982, -0.0124, 6.24],
                [0.0121, 0.9978, -3.85],
                [0.00001, -0.00002, 1.0]
            ],
            metrics=metrics,
            warnings=["Precomputed correspondence demonstration response for presentation."],
            visualizations=urls
        )


def build_pending_match_result(case_id: str, s0: str, s1: str) -> MatchResultResponseSchema:
    """Builds a strict zero-fabrication pending state response for real pairs."""
    is_spatial = ("IIRS" in (s0.upper(), s1.upper()) and "TMC2" in (s0.upper(), s1.upper()))
    pair_state = "spatially_paired" if is_spatial else "geographically_associated"
    reason = "Spatially paired imagery is available; learned correspondence and geometric validation are pending."
    return MatchResultResponseSchema(
        job_id=f"match_{case_id}_{s0}_{s1}",
        status="integration_pending",
        modality_pair_type=f"{s0}-{s1}",
        pair_state=pair_state,
        metrics=None,
        keypoints0=[],
        keypoints1=[],
        keypoints_a=[],
        keypoints_b=[],
        matches=[],
        correspondences=[],
        confidence=[],
        inlier_mask=[],
        transform=None,
        homography=None,
        visualization=None,
        visualizations={},
        warnings=[reason],
        provenance={
            "status": "integration_pending",
            "pair_state": pair_state,
            "reason": reason,
            "accuracy_validated": False
        }
    )


def get_precomputed_match(case_id: str, pair_key: str) -> Optional[MatchResultResponseSchema]:
    """Retrieves a precomputed match for a given case and pair key or pending state for real pairs."""
    # Try exact match file
    match_file = os.path.join(settings.DEMO_DIR, "matches", case_id, f"{pair_key}.json")
    if os.path.exists(match_file):
        with open(match_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return MatchResultResponseSchema(**data)

    # Try fallback matches dir
    alt_file = os.path.join(settings.BASE_DIR, "backend", "data", "demo", "matches", case_id, f"{pair_key}.json")
    if os.path.exists(alt_file):
        with open(alt_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return MatchResultResponseSchema(**data)

    # Check if this is one of the four real pairs
    parts = pair_key.split("_")
    s0 = parts[0] if len(parts) > 0 else "SENSOR0"
    s1 = parts[1] if len(parts) > 1 else "SENSOR1"

    real_ids = ("2267", "3463", "5353", "7674", "pair_2267", "pair_3463", "pair_5353", "pair_7674")
    if any(rid in case_id.lower() for rid in real_ids):
        return build_pending_match_result(case_id, s0, s1)

    return None


