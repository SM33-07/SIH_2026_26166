"""
Robust Geometric Transformation & Inlier Estimation Engine (SIH26166).

Uses RANSAC / MAGSAC++ to estimate Homography or Affine transformations between image pairs
and computes reprojection RMSE and geometric residuals.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any

def estimate_robust_geometry(
    pts_a: List[Tuple[float, float]],
    pts_b: List[Tuple[float, float]],
    model_type: str = "auto",
    ransac_threshold: float = 3.0,
    confidence: float = 0.99,
    max_iters: int = 5000
) -> Tuple[Optional[np.ndarray], List[bool], Dict[str, Any]]:
    """
    Estimates geometric matrix (Homography or Affine) using OpenCV RANSAC / MAGSAC++.
    
    Returns:
        matrix: 3x3 Homography matrix or 2x3 Affine matrix
        inlier_mask: List of booleans indicating inliers
        metrics: Dict with inlier_count, inlier_ratio, rmse, model_used
    """
    if len(pts_a) < 4 or len(pts_b) < 4:
        return None, [False] * len(pts_a), {
            "inlier_count": 0,
            "inlier_ratio": 0.0,
            "rmse": None,
            "model_used": "none",
            "warning": "Insufficient point correspondences (<4)"
        }

    src_pts = np.float32(pts_a).reshape(-1, 1, 2)
    dst_pts = np.float32(pts_b).reshape(-1, 1, 2)

    chosen_model = model_type
    if chosen_model == "auto":
        chosen_model = "homography"

    matrix = None
    inliers = np.zeros((len(pts_a), 1), dtype=np.uint8)

    # Try MAGSAC++ if available, fallback to RANSAC
    try:
        flag = cv2.USAC_MAGSAC
    except AttributeError:
        flag = cv2.RANSAC

    if chosen_model == "homography":
        matrix, mask = cv2.findHomography(src_pts, dst_pts, flag, ransac_threshold, maxIters=max_iters, confidence=confidence)
        if mask is not None:
            inliers = mask
    elif chosen_model == "affine":
        matrix, mask = cv2.estimateAffinePartial2D(src_pts, dst_pts, method=flag, ransacThreshold=ransac_threshold, maxIters=max_iters, confidence=confidence)
        if mask is not None:
            inliers = mask
            # Convert 2x3 to 3x3 for uniform handling
            matrix_3x3 = np.eye(3, dtype=np.float32)
            matrix_3x3[:2, :] = matrix
            matrix = matrix_3x3

    inlier_mask_list = [bool(x[0] == 1) for x in inliers] if inliers is not None else [False] * len(pts_a)
    num_inliers = sum(inlier_mask_list)
    inlier_ratio = float(num_inliers) / float(len(pts_a)) if len(pts_a) > 0 else 0.0

    # Compute reprojection RMSE on inliers
    rmse = None
    if num_inliers >= 4 and matrix is not None:
        inlier_src = src_pts[inliers.ravel() == 1]
        inlier_dst = dst_pts[inliers.ravel() == 1]

        # Perspective transform inlier_src to predicted dst
        pred_dst = cv2.perspectiveTransform(inlier_src, matrix)
        residuals = np.sqrt(np.sum((pred_dst - inlier_dst) ** 2, axis=2))
        rmse = float(np.sqrt(np.mean(residuals ** 2)))

    metrics = {
        "inlier_count": num_inliers,
        "inlier_ratio": round(inlier_ratio, 4),
        "rmse": round(rmse, 3) if rmse is not None else None,
        "model_used": chosen_model,
        "matrix": matrix.tolist() if matrix is not None else None
    }

    return matrix, inlier_mask_list, metrics

def warp_image(
    image: np.ndarray,
    matrix: np.ndarray,
    target_size: Tuple[int, int]
) -> np.ndarray:
    """Warps image using 3x3 transformation matrix into target coordinate system."""
    h, w = target_size
    if matrix.shape == (2, 3):
        warped = cv2.warpAffine(image, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    else:
        warped = cv2.warpPerspective(image, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return warped
