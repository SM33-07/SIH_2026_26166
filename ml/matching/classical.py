"""
Classical Feature Matching Baseline (SIFT, AKAZE, ORB) for Lunar Imagery (SIH26166).
"""

import time
import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any

from ml.matching.base import BaseMatcher, MatchResult
from ml.geometry.robust_transform import estimate_robust_geometry

class ClassicalMatcher(BaseMatcher):
    def __init__(self, algorithm: str = "SIFT", ratio_threshold: float = 0.75):
        self.algorithm = algorithm.upper()
        self.ratio_threshold = ratio_threshold

    def match(
        self,
        image_a: np.ndarray,
        image_b: np.ndarray,
        mask_a: Optional[np.ndarray] = None,
        mask_b: Optional[np.ndarray] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> MatchResult:
        start_time = time.time()
        options = options or {}
        ratio = options.get("ratio_threshold", self.ratio_threshold)
        algo = options.get("algorithm", self.algorithm).upper()

        # Convert to grayscale uint8 if needed
        gray_a = cv2.cvtColor(image_a, cv2.COLOR_BGR2GRAY) if len(image_a.shape) == 3 else image_a
        gray_b = cv2.cvtColor(image_b, cv2.COLOR_BGR2GRAY) if len(image_b.shape) == 3 else image_b

        if gray_a.dtype != np.uint8:
            gray_a = ((gray_a - gray_a.min()) / max(1e-5, (gray_a.max() - gray_a.min())) * 255).astype(np.uint8)
        if gray_b.dtype != np.uint8:
            gray_b = ((gray_b - gray_b.min()) / max(1e-5, (gray_b.max() - gray_b.min())) * 255).astype(np.uint8)

        # Initialize detector
        if algo == "AKAZE":
            detector = cv2.AKAZE_create()
            norm_type = cv2.NORM_HAMMING
        elif algo == "ORB":
            detector = cv2.ORB_create(nfeatures=2000)
            norm_type = cv2.NORM_HAMMING
        else: # Default SIFT
            detector = cv2.SIFT_create(nfeatures=2000)
            norm_type = cv2.NORM_L2

        kp_a, des_a = detector.detectAndCompute(gray_a, mask=mask_a)
        kp_b, des_b = detector.detectAndCompute(gray_b, mask=mask_b)

        keypoints_a = [(float(kp.pt[0]), float(kp.pt[1])) for kp in kp_a] if kp_a else []
        keypoints_b = [(float(kp.pt[0]), float(kp.pt[1])) for kp in kp_b] if kp_b else []

        correspondences = []
        confidences = []

        if des_a is not None and des_b is not None and len(kp_a) >= 4 and len(kp_b) >= 4:
            matcher = cv2.BFMatcher(norm_type)
            raw_matches = matcher.knnMatch(des_a, des_b, k=2)

            for match_pair in raw_matches:
                if len(match_pair) == 2:
                    m, n = match_pair
                    if m.distance < ratio * n.distance:
                        correspondences.append((m.queryIdx, m.trainIdx))
                        # Higher score for lower distance ratio
                        conf = max(0.1, 1.0 - (m.distance / (n.distance + 1e-5)))
                        confidences.append(float(conf))

        pts_a = [keypoints_a[i] for i, _ in correspondences]
        pts_b = [keypoints_b[j] for _, j in correspondences]

        # Geometry estimation
        matrix, inlier_mask, geom_metrics = estimate_robust_geometry(pts_a, pts_b, model_type=options.get("geometry_model", "auto"))

        elapsed_ms = (time.time() - start_time) * 1000.0

        metrics = {
            "num_keypoints_a": len(keypoints_a),
            "num_keypoints_b": len(keypoints_b),
            "num_matches": len(correspondences),
            "num_inliers": geom_metrics.get("inlier_count", 0),
            "inlier_ratio": geom_metrics.get("inlier_ratio", 0.0),
            "rmse": geom_metrics.get("rmse"),
            "runtime_ms": round(elapsed_ms, 2),
            "algorithm": algo
        }

        return MatchResult(
            keypoints_a=keypoints_a,
            keypoints_b=keypoints_b,
            correspondences=correspondences,
            confidence_scores=confidences,
            inlier_mask=inlier_mask,
            homography=geom_metrics.get("matrix"),
            warped_image_b_shape=image_a.shape[:2],
            metrics=metrics,
            modality_pair_type=options.get("modality_pair", "OHRC-OHRC"),
            processing_steps=["classical_keypoint_extraction", "bf_ratio_test", "magsac_geometry_estimation"]
        )
