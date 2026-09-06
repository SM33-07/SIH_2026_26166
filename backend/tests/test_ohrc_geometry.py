import numpy as np
import pytest
from app.services import ohrc_service


def test_four_corner_homography_dlt():
    # Synthetic square mapping to a scaled and translated region
    src = np.array([
        [0.0, 0.0],
        [512.0, 0.0],
        [0.0, 512.0],
        [512.0, 512.0]
    ], dtype=np.float64)

    dst = np.array([
        [60.0, 355.0],
        [60.0, 355.05],
        [60.05, 355.0],
        [60.05, 355.05]
    ], dtype=np.float64)

    H = ohrc_service._find_homography_dlt(src, dst)
    assert H.shape == (3, 3)

    # Test projection of source points through H matches dst
    src_h = np.hstack([src, np.ones((4, 1))])
    proj = (H @ src_h.T).T
    proj_norm = proj[:, :2] / proj[:, 2:3]

    np.testing.assert_allclose(proj_norm, dst, atol=1e-5)
