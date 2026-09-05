"""
Manual Ground-Truth Control Point Valuation Engine (SIH26166).

Evaluates estimated transformation matrix against manually annotated control points.
"""

import numpy as np
import cv2
from typing import List, Tuple, Dict, Any, Optional

def evaluate_manual_control_points(
    points_a: List[Tuple[float, float]],
    points_b: List[Tuple[float, float]],
    transform_matrix: np.ndarray
) -> Dict[str, Any]:
    """
    Computes ground truth reprojection errors for user-annotated control points.
    
    Returns:
        rmse: Root Mean Square Error in pixels
        mean_error: Mean error in pixels
        median_error: Median error in pixels
        max_error: Maximum error in pixels
        per_point_residuals: List of residuals per control point
    """
    if len(points_a) == 0 or len(points_b) == 0 or len(points_a) != len(points_b):
        return {
            "rmse": None,
            "mean_error": None,
            "median_error": None,
            "max_error": None,
            "per_point_residuals": [],
            "error": "Control point list empty or mismatched"
        }

    src_pts = np.float32(points_a).reshape(-1, 1, 2)
    dst_pts = np.float32(points_b).reshape(-1, 1, 2)

    if transform_matrix.shape == (2, 3):
        H = np.eye(3, dtype=np.float32)
        H[:2, :] = transform_matrix
    else:
        H = transform_matrix

    pred_dst = cv2.perspectiveTransform(src_pts, H)
    residuals = np.sqrt(np.sum((pred_dst - dst_pts) ** 2, axis=2)).ravel()

    return {
        "rmse": round(float(np.sqrt(np.mean(residuals ** 2))), 3),
        "mean_error": round(float(np.mean(residuals)), 3),
        "median_error": round(float(np.median(residuals)), 3),
        "max_error": round(float(np.max(residuals)), 3),
        "per_point_residuals": [round(float(r), 3) for r in residuals],
        "num_control_points": len(points_a)
    }
