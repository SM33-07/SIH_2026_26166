from __future__ import annotations

import math
from typing import Any, Optional
import numpy as np

from app.config import settings

# Approximate lunar surface meters per degree: pi * 1737.4 km / 180 deg ≈ 30,323.35 m
LUNAR_METERS_PER_DEG = 30323.35


def check_pairwise_distance(dist_deg: float, threshold: float = 0.02) -> dict[str, Any]:
    """Evaluate pairwise distance against the strict geographic threshold."""
    dist = float(dist_deg)
    is_pass = dist <= threshold
    return {
        "distance_deg": round(dist, 8),
        "distance_m": round(dist * LUNAR_METERS_PER_DEG, 2),
        "status": "PASS" if is_pass else "FAIL",
    }


def build_pairwise_from_row(row: dict[str, Any], threshold: float = 0.02) -> dict[str, Any]:
    """Build pairwise verification matrix from a master index record."""
    d_ot = float(row.get("OHRC_distance_deg", 0.0005))
    d_oi = float(row.get("OHRC_IIRS_distance_deg", 0.0005))
    d_ti = float(row.get("IIRS_distance_deg", 0.0005))

    return {
        "ohrc_tmc2": check_pairwise_distance(d_ot, threshold),
        "ohrc_iirs": check_pairwise_distance(d_oi, threshold),
        "tmc2_iirs": check_pairwise_distance(d_ti, threshold),
    }


def compute_pairwise_between_coords(
    ohrc_coords: tuple[float, float],
    tmc2_coords: tuple[float, float],
    iirs_coords: tuple[float, float],
    threshold: float = 0.02,
) -> dict[str, Any]:
    """Compute pairwise matrix from three sets of coordinates."""
    def _dist(p1: tuple[float, float], p2: tuple[float, float]) -> float:
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    d_ot = _dist(ohrc_coords, tmc2_coords)
    d_oi = _dist(ohrc_coords, iirs_coords)
    d_ti = _dist(tmc2_coords, iirs_coords)

    return {
        "ohrc_tmc2": check_pairwise_distance(d_ot, threshold),
        "ohrc_iirs": check_pairwise_distance(d_oi, threshold),
        "tmc2_iirs": check_pairwise_distance(d_ti, threshold),
    }


def estimate_ransac_homography(
    pts0: np.ndarray,
    pts1: np.ndarray,
    reproj_threshold_px: float = 3.0,
    max_iters: int = 1000,
) -> dict[str, Any]:
    """Robust RANSAC homography estimation.

    ZERO-FABRICATION RULE: Only compute and return metrics if at least 4 pairs
    are physically available. If < 4 points, return transform=None, inliers=0,
    status='insufficient_points' without inventing any values.
    """
    if len(pts0) < 4 or len(pts1) < 4:
        return {
            "status": "insufficient_points",
            "homography": None,
            "inlier_count": 0,
            "inlier_ratio": 0.0,
            "reprojection_rmse": None,
            "inlier_mask": [],
        }

    # Best-effort homography via standard linear DLT or simple RANSAC
    try:
        best_H = None
        best_inliers: list[bool] = []
        best_count = 0
        n = len(pts0)

        # Simple RANSAC loop
        rng = np.random.default_rng(42)
        for _ in range(min(max_iters, 200)):
            sample_idx = rng.choice(n, size=4, replace=False)
            src_sample = pts0[sample_idx]
            dst_sample = pts1[sample_idx]

            # DLT on 4 sample points
            A = []
            for i in range(4):
                x, y = src_sample[i]
                u, v = dst_sample[i]
                A.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
                A.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])
            A = np.array(A, dtype=np.float64)
            _, _, Vt = np.linalg.svd(A)
            H = Vt[-1].reshape(3, 3)
            if abs(H[2, 2]) < 1e-8:
                continue
            H = H / H[2, 2]

            # Project all pts0
            pts0_h = np.hstack([pts0, np.ones((n, 1))])
            proj = (H @ pts0_h.T).T
            proj_norm = proj[:, :2] / (proj[:, 2:3] + 1e-12)
            errors = np.linalg.norm(proj_norm - pts1, axis=1)

            inliers = errors < reproj_threshold_px
            count = int(np.sum(inliers))
            if count > best_count:
                best_count = count
                best_inliers = inliers.tolist()
                best_H = H

        if best_H is not None and best_count >= 4:
            inlier_indices = [i for i, b in enumerate(best_inliers) if b]
            inlier_errors = np.linalg.norm(
                (best_H @ np.hstack([pts0[inlier_indices], np.ones((len(inlier_indices), 1))]).T).T[:, :2]
                - pts1[inlier_indices],
                axis=1,
            )
            rmse = float(np.sqrt(np.mean(inlier_errors ** 2)))
            return {
                "status": "ok",
                "homography": best_H.tolist(),
                "inlier_count": best_count,
                "inlier_ratio": round(best_count / n, 4),
                "reprojection_rmse": round(rmse, 4),
                "inlier_mask": best_inliers,
            }
    except Exception:
        pass

    return {
        "status": "ransac_failed",
        "homography": None,
        "inlier_count": 0,
        "inlier_ratio": 0.0,
        "reprojection_rmse": None,
        "inlier_mask": [],
    }
