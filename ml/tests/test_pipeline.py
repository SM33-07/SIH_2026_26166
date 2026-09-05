"""
Unit Tests for Preprocessing, Matching, and Geometry Pipelines (SIH26166).
"""

import os
import sys
import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ml.preprocessing.illumination import preprocess_illumination, normalize_intensity
from ml.preprocessing.shadows import detect_shadow_mask
from ml.preprocessing.scale_pyramid import ScalePyramid, estimate_scale_ratio
from ml.preprocessing.iirs_proxy import build_iirs_proxy
from ml.matching.classical import ClassicalMatcher
from ml.matching.learned_loftr import LearnedMatcher
from ml.geometry.robust_transform import estimate_robust_geometry, warp_image
from ml.geometry.confidence import generate_spatial_confidence_map
from ml.evaluation.cycle_consistency import compute_cycle_consistency

def test_illumination_normalization():
    img = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
    norm = preprocess_illumination(img, use_clahe=True, use_lambertian=True)
    assert norm.shape == (100, 100)
    assert norm.dtype == np.uint8

def test_shadow_detection():
    img = np.full((100, 100), 200, dtype=np.uint8)
    img[20:50, 20:50] = 5 # Shadow patch
    s_mask, v_mask = detect_shadow_mask(img, intensity_threshold=30)
    assert s_mask.shape == (100, 100)
    assert np.sum(s_mask[20:50, 20:50]) > 0

def test_iirs_proxy():
    cube = np.random.uniform(0, 100, (64, 64, 256)).astype(np.float32)
    proxy, meta = build_iirs_proxy(cube, band_indices=[10, 50, 100, 200])
    assert proxy.shape == (64, 64)
    assert proxy.dtype == np.uint8
    assert len(meta.source_bands) == 4

def test_scale_ratio():
    ratio = estimate_scale_ratio(0.25, 5.0)
    assert abs(ratio - 20.0) < 1e-3

def test_classical_matcher():
    img = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    matcher = ClassicalMatcher(algorithm="SIFT")
    result = matcher.match(img, img)
    assert result.metrics["num_keypoints_a"] >= 0
    assert result.metrics["inlier_ratio"] >= 0.0

def test_learned_matcher():
    img = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    matcher = LearnedMatcher()
    result = matcher.match(img, img)
    assert result.metrics["runtime_ms"] > 0

def test_geometry_and_cycle_consistency():
    pts_a = [(10, 10), (100, 10), (100, 100), (10, 100)]
    pts_b = [(12, 11), (102, 11), (102, 101), (12, 101)]
    matrix, inliers, metrics = estimate_robust_geometry(pts_a, pts_b, model_type="homography")
    assert matrix is not None
    cycle = compute_cycle_consistency(np.array(matrix), image_size=(128, 128))
    assert cycle["mean_error_px"] < 10.0
