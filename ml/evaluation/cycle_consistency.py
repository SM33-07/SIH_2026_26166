"""
Cycle Consistency Evaluation Engine for Label-Free Correspondence Validation (SIH26166).

Measures round-trip error (A -> B -> A) of estimated forward and backward geometric transformations.
"""

import numpy as np
import cv2
from typing import List, Tuple, Dict, Any, Optional

def compute_cycle_consistency(
    matrix_a_to_b: np.ndarray,
    matrix_b_to_a: Optional[np.ndarray] = None,
    image_size: Tuple[int, int] = (512, 512),
    grid_spacing: int = 32
) -> Dict[str, Any]:
    """
    Computes cycle consistency error across a regular grid of sample points.
    
    Returns:
        mean_error_px: Mean round-trip pixel displacement
        median_error_px: Median round-trip pixel displacement
        max_error_px: Max round-trip pixel displacement
        p90_error_px: 90th percentile round-trip displacement
    """
    h, w = image_size
    grid_y, grid_x = np.mgrid[16:h:grid_spacing, 16:w:grid_spacing]
    sample_pts = np.float32(np.column_stack((grid_x.ravel(), grid_y.ravel()))).reshape(-1, 1, 2)

    # Forward transform A -> B
    if matrix_a_to_b.shape == (2, 3):
        H_fwd = np.eye(3, dtype=np.float32)
        H_fwd[:2, :] = matrix_a_to_b
    else:
        H_fwd = matrix_a_to_b

    pts_b = cv2.perspectiveTransform(sample_pts, H_fwd)

    # Backward transform B -> A (invert H_fwd if matrix_b_to_a is not explicitly provided)
    if matrix_b_to_a is None:
        try:
            H_bwd = np.linalg.inv(H_fwd)
        except np.linalg.LinAlgError:
            return {
                "mean_error_px": 999.0,
                "median_error_px": 999.0,
                "max_error_px": 999.0,
                "p90_error_px": 999.0,
                "status": "degenerate_matrix"
            }
    else:
        if matrix_b_to_a.shape == (2, 3):
            H_bwd = np.eye(3, dtype=np.float32)
            H_bwd[:2, :] = matrix_b_to_a
        else:
            H_bwd = matrix_b_to_a

    pts_a_reconstructed = cv2.perspectiveTransform(pts_b, H_bwd)

    # Compute Euclidean displacement between original points and round-trip points
    displacements = np.sqrt(np.sum((sample_pts - pts_a_reconstructed) ** 2, axis=2)).ravel()

    return {
        "mean_error_px": round(float(np.mean(displacements)), 3),
        "median_error_px": round(float(np.median(displacements)), 3),
        "max_error_px": round(float(np.max(displacements)), 3),
        "p90_error_px": round(float(np.percentile(displacements, 90)), 3),
        "status": "success"
    }
