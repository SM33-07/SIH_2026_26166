"""
Visualization Service for Rendering Keypoints, Correspondences, Alignment Overlay, and Heatmaps (SIH26166).
"""

import base64
from typing import List, Tuple, Optional, Dict, Any

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import numpy as np
except ImportError:
    np = None

try:
    from ml.geometry.robust_transform import warp_image
    from ml.geometry.confidence import generate_spatial_confidence_map
except ImportError:
    warp_image = None
    generate_spatial_confidence_map = None

def get_demo_visualization_urls(image_a_filename: str = "ohrc_sun18deg.png", image_b_filename: str = "ohrc_sun52deg.png") -> Dict[str, str]:
    """Provides fallback visualization URLs using static demo files."""
    return {
        "correspondences": f"/static/demo/{image_a_filename}",
        "warped_b": f"/static/demo/{image_b_filename}",
        "blended_overlay": f"/static/demo/{image_a_filename}",
        "flicker_composite": f"/static/demo/{image_b_filename}",
        "confidence_heatmap": f"/static/demo/{image_a_filename}"
    }

def image_to_base64(img: np.ndarray, format_ext: str = ".png") -> str:
    """Encodes numpy uint8 BGR/Gray image to Base64 data URL string."""
    _, buffer = cv2.imencode(format_ext, img)
    encoded = base64.b64encode(buffer).decode('utf-8')
    mime_type = "image/png" if format_ext == ".png" else "image/jpeg"
    return f"data:{mime_type};base64,{encoded}"

def render_correspondences(
    image_a: np.ndarray,
    image_b: np.ndarray,
    keypoints_a: List[Tuple[float, float]],
    keypoints_b: List[Tuple[float, float]],
    correspondences: List[Tuple[int, int]],
    inlier_mask: List[bool],
    max_lines: int = 150
) -> str:
    """Renders side-by-side keypoint correspondences with green inliers and red outliers."""
    h1, w1 = image_a.shape[:2]
    h2, w2 = image_b.shape[:2]

    # Convert to BGR if gray
    img_a_bgr = cv2.cvtColor(image_a, cv2.COLOR_GRAY2BGR) if len(image_a.shape) == 2 else image_a.copy()
    img_b_bgr = cv2.cvtColor(image_b, cv2.COLOR_GRAY2BGR) if len(image_b.shape) == 2 else image_b.copy()

    canvas_h = max(h1, h2)
    canvas_w = w1 + w2
    canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)

    canvas[:h1, :w1] = img_a_bgr
    canvas[:h2, w1:w1+w2] = img_b_bgr

    # Draw correspondence lines
    num_to_draw = min(max_lines, len(correspondences))
    for idx in range(num_to_draw):
        idx_a, idx_b = correspondences[idx]
        pt_a = (int(round(keypoints_a[idx_a][0])), int(round(keypoints_a[idx_a][1])))
        pt_b = (int(round(keypoints_b[idx_b][0])) + w1, int(round(keypoints_b[idx_b][1])))

        is_inlier = inlier_mask[idx] if idx < len(inlier_mask) else False
        color = (0, 230, 115) if is_inlier else (0, 75, 255) # Green for inlier, Red for outlier
        thickness = 2 if is_inlier else 1

        cv2.circle(canvas, pt_a, 4, color, -1)
        cv2.circle(canvas, pt_b, 4, color, -1)
        cv2.line(canvas, pt_a, pt_b, color, thickness, cv2.LINE_AA)

    return image_to_base64(canvas)

def render_alignment_overlay(
    image_a: np.ndarray,
    image_b: np.ndarray,
    homography: Optional[List[List[float]]] = None
) -> Dict[str, str]:
    """Warp Image B into Image A coordinate frame and generates blended false-color overlay."""
    h, w = image_a.shape[:2]
    img_a_bgr = cv2.cvtColor(image_a, cv2.COLOR_GRAY2BGR) if len(image_a.shape) == 2 else image_a
    img_b_bgr = cv2.cvtColor(image_b, cv2.COLOR_GRAY2BGR) if len(image_b.shape) == 2 else image_b

    if homography is not None:
        H = np.array(homography, dtype=np.float32)
        warped_b = warp_image(img_b_bgr, H, (h, w))
    else:
        warped_b = cv2.resize(img_b_bgr, (w, h))

    # Blended Overlay (Image A in Cyan, Warped B in Red/Yellow)
    blend = cv2.addWeighted(img_a_bgr, 0.5, warped_b, 0.5, 0.0)

    # False-color registration check (Cyan-Red channel composite)
    gray_a = cv2.cvtColor(img_a_bgr, cv2.COLOR_BGR2GRAY)
    gray_wb = cv2.cvtColor(warped_b, cv2.COLOR_BGR2GRAY)
    false_color = np.zeros((h, w, 3), dtype=np.uint8)
    false_color[:, :, 0] = gray_a    # Blue
    false_color[:, :, 1] = gray_a    # Green
    false_color[:, :, 2] = gray_wb   # Red

    return {
        "warped_b": image_to_base64(warped_b),
        "blended_overlay": image_to_base64(blend),
        "flicker_composite": image_to_base64(false_color)
    }

def render_confidence_heatmap_b64(
    image_shape: Tuple[int, int],
    keypoints_a: List[Tuple[float, float]],
    inlier_mask: List[bool],
    confidence_scores: List[float],
    shadow_mask: Optional[np.ndarray] = None
) -> Tuple[str, Dict[str, Any]]:
    """Generates colored JET heatmap overlay of spatial confidence map."""
    conf_map, summary = generate_spatial_confidence_map(
        image_shape=image_shape,
        keypoints=keypoints_a,
        inlier_mask=inlier_mask,
        confidences=confidence_scores,
        shadow_mask=shadow_mask
    )

    heatmap_uint8 = (conf_map * 255.0).astype(np.uint8)
    colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    return image_to_base64(colored_heatmap), summary
