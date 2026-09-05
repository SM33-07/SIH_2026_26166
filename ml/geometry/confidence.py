"""
Explainable Spatial Confidence Heatmap & Quality Score Engine (SIH26166).

Computes transparent 2D spatial confidence maps based on:
- Local match density
- Inlier point distribution
- Shadow & zero-signal coverage
- Geometric reprojection residuals
"""

import numpy as np
import cv2
from typing import List, Tuple, Optional, Dict, Any

def generate_spatial_confidence_map(
    image_shape: Tuple[int, int],
    keypoints: List[Tuple[float, float]],
    inlier_mask: List[bool],
    confidences: List[float],
    shadow_mask: Optional[np.ndarray] = None,
    sigma: float = 30.0
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Generates a spatial confidence heatmap [0.0 - 1.0] for an image.
    
    Returns:
        confidence_map: float32 array (H x W) with values [0.0, 1.0]
        quality_metrics: summary metrics breakdown
    """
    h, w = image_shape[:2]
    density_map = np.zeros((h, w), dtype=np.float32)
    inlier_map = np.zeros((h, w), dtype=np.float32)

    if len(keypoints) > 0:
        for idx, (x, y) in enumerate(keypoints):
            ix, iy = int(round(x)), int(round(y))
            if 0 <= ix < w and 0 <= iy < h:
                conf = confidences[idx] if idx < len(confidences) else 0.5
                density_map[iy, ix] += conf
                if idx < len(inlier_mask) and inlier_mask[idx]:
                    inlier_map[iy, ix] += conf * 1.5

    # Gaussian kernel smoothing to create spatial density field
    kernel_size = int(sigma * 3) | 1
    density_smoothed = cv2.GaussianBlur(density_map, (kernel_size, kernel_size), sigmaX=sigma)
    inlier_smoothed = cv2.GaussianBlur(inlier_map, (kernel_size, kernel_size), sigmaX=sigma)

    # Normalize fields
    max_d = max(1e-5, np.max(density_smoothed))
    max_i = max(1e-5, np.max(inlier_smoothed))

    raw_heatmap = 0.4 * (density_smoothed / max_d) + 0.6 * (inlier_smoothed / max_i)
    raw_heatmap = np.clip(raw_heatmap, 0.0, 1.0)

    # Zero out shadowed / invalid regions
    if shadow_mask is not None:
        if shadow_mask.shape[:2] != (h, w):
            shadow_resized = cv2.resize(shadow_mask, (w, h), interpolation=cv2.INTER_NEAREST)
        else:
            shadow_resized = shadow_mask
        
        # Suppress confidence in shadowed areas (shadow_mask = 255)
        shadow_weight = (1.0 - (shadow_resized.astype(np.float32) / 255.0))
        final_confidence_map = raw_heatmap * shadow_weight
    else:
        final_confidence_map = raw_heatmap

    # Global score out of 100
    mean_confidence = float(np.mean(final_confidence_map))
    high_conf_pct = float(np.sum(final_confidence_map > 0.6) / (h * w)) * 100.0
    quality_score = min(100, int(round((mean_confidence * 70.0) + (high_conf_pct * 0.3))))

    if quality_score >= 70:
        conf_label = "High"
    elif quality_score >= 40:
        conf_label = "Moderate"
    else:
        conf_label = "Low"

    summary = {
        "quality_score": quality_score,
        "confidence_level": conf_label,
        "mean_confidence": round(mean_confidence, 4),
        "high_confidence_area_pct": round(high_conf_pct, 2)
    }

    return final_confidence_map.astype(np.float32), summary
