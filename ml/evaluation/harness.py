"""
Evaluation Harness & Ablation Benchmarking Engine (SIH26166).

Executes comparative benchmarks (Classical Baseline vs Proposed Learned Engine)
and ablation studies across preprocessing configurations.
"""

import time
import numpy as np
from typing import Dict, Any, List, Optional

from ml.matching.classical import ClassicalMatcher
from ml.matching.learned_loftr import LearnedMatcher
from ml.preprocessing.illumination import preprocess_illumination
from ml.preprocessing.shadows import detect_shadow_mask
from ml.preprocessing.scale_pyramid import resize_for_matching
from ml.preprocessing.iirs_proxy import build_iirs_proxy
from ml.evaluation.cycle_consistency import compute_cycle_consistency

def run_ablation_experiment(
    image_a: np.ndarray,
    image_b: np.ndarray,
    modality_pair: str = "OHRC-OHRC",
    sun_elevation_a: Optional[float] = 30.0,
    sun_elevation_b: Optional[float] = 60.0,
    gsd_a: Optional[float] = 0.25,
    gsd_b: Optional[float] = 0.25
) -> Dict[str, Any]:
    """
    Runs full ablation test matrix:
    - Baseline (SIFT/AKAZE)
    - Proposed Learned Pipeline
    - Ablation A: No Illumination Normalization
    - Ablation B: With Illumination Normalization
    - Ablation C: No Scale Pyramid
    - Ablation D: With Scale Pyramid
    - Ablation E: With IIRS Proxy
    """
    results = {}

    # Define test configurations
    configs = {
        "Classical_SIFT": {"pipeline": "classical", "algo": "SIFT", "illum": True, "shadow": True, "scale": True},
        "Classical_AKAZE": {"pipeline": "classical", "algo": "AKAZE", "illum": True, "shadow": True, "scale": True},
        "Proposed_Learned": {"pipeline": "learned", "illum": True, "shadow": True, "scale": True},
        "Ablation_No_Illum": {"pipeline": "learned", "illum": False, "shadow": True, "scale": True},
        "Ablation_No_ShadowMask": {"pipeline": "learned", "illum": True, "shadow": False, "scale": True},
        "Ablation_No_ScalePyramid": {"pipeline": "learned", "illum": True, "shadow": True, "scale": False}
    }

    # Handle IIRS proxy building if needed
    proc_a = image_a
    proc_b = image_b
    if "IIRS" in modality_pair.upper():
        if image_a.ndim == 3 and image_a.shape[2] > 3:
            proc_a, _ = build_iirs_proxy(image_a)
        if image_b.ndim == 3 and image_b.shape[2] > 3:
            proc_b, _ = build_iirs_proxy(image_b)

    for cfg_name, cfg in configs.items():
        t0 = time.time()
        
        # Preprocessing
        curr_a = proc_a.copy()
        curr_b = proc_b.copy()

        if cfg["illum"]:
            curr_a = preprocess_illumination(curr_a, sun_elevation_deg=sun_elevation_a)
            curr_b = preprocess_illumination(curr_b, sun_elevation_deg=sun_elevation_b)

        mask_a, mask_b = None, None
        if cfg["shadow"]:
            _, valid_a = detect_shadow_mask(curr_a)
            _, valid_b = detect_shadow_mask(curr_b)
            mask_a, mask_b = valid_a, valid_b

        if cfg["scale"] and (gsd_a and gsd_b and abs(gsd_a - gsd_b) > 0.5):
            target_ratio = gsd_b / gsd_a if gsd_a < gsd_b else gsd_a / gsd_b
            curr_b, _ = resize_for_matching(curr_b, target_scale=1.0/target_ratio if gsd_a < gsd_b else target_ratio)

        # Match execution
        options = {"modality_pair": modality_pair, "algorithm": cfg.get("algo", "SIFT")}
        if cfg["pipeline"] == "classical":
            matcher = ClassicalMatcher(algorithm=cfg.get("algo", "SIFT"))
            match_res = matcher.match(curr_a, curr_b, mask_a=mask_a, mask_b=mask_b, options=options)
        else:
            matcher = LearnedMatcher()
            match_res = matcher.match(curr_a, curr_b, mask_a=mask_a, mask_b=mask_b, options=options)

        # Cycle consistency
        cycle_err = None
        if match_res.homography is not None:
            cycle_info = compute_cycle_consistency(np.array(match_res.homography), image_size=curr_a.shape[:2])
            cycle_err = cycle_info.get("mean_error_px")

        elapsed = (time.time() - t0) * 1000.0

        results[cfg_name] = {
            "num_keypoints_a": match_res.metrics.get("num_keypoints_a", 0),
            "num_keypoints_b": match_res.metrics.get("num_keypoints_b", 0),
            "num_matches": match_res.metrics.get("num_matches", 0),
            "num_inliers": match_res.metrics.get("num_inliers", 0),
            "inlier_ratio": match_res.metrics.get("inlier_ratio", 0.0),
            "rmse": match_res.metrics.get("rmse"),
            "cycle_consistency_error": cycle_err,
            "runtime_ms": round(elapsed, 2)
        }

    return {
        "modality_pair": modality_pair,
        "sun_angle_difference_deg": abs((sun_elevation_a or 0) - (sun_elevation_b or 0)),
        "scale_ratio": round(gsd_b / gsd_a, 2) if gsd_a and gsd_b else 1.0,
        "benchmark_runs": results
    }
