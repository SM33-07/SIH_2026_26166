from __future__ import annotations

from typing import Any
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from app.images import npy_to_base64_png
from app.services import (
    common_point_service,
    coordinate_service,
    verification_service,
)

MASTER_DF: pd.DataFrame = pd.DataFrame()
JUDGE_DF: pd.DataFrame = pd.DataFrame()
KDTREE: cKDTree | None = None
JUDGE_INDEX: dict[str, dict[str, Any]] = {}

_PASS_THRESHOLD: float = 0.02


def load_all(model_package_root: str) -> None:
    """Load all CSV indexes and build the KDTree. Called once at startup."""
    global MASTER_DF, JUDGE_DF, KDTREE, JUDGE_INDEX

    common_point_service.load(model_package_root)
    coordinate_service.build_spatial_index()

    MASTER_DF = common_point_service.get_master_df()
    JUDGE_DF = common_point_service.get_judge_df()
    KDTREE = coordinate_service._KDTREE
    JUDGE_INDEX = common_point_service._JUDGE_INDEX


def query_coordinate(lat: float, lon: float) -> tuple[dict[str, Any], str]:
    """Return the nearest master row and matching Judge_Point_ID for the given (lat, lon)."""
    row, judge_id, _ = coordinate_service.query_coordinate(lat, lon)
    return row, judge_id


def load_raw_judge_arrays(judge_point_id: str, model_package_root: str | None = None) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Load raw NPY numpy arrays for OHRC, TMC2, and IIRS."""
    return common_point_service.load_raw_judge_arrays(judge_point_id)


def load_judge_images(judge_point_id: str, model_package_root: str | None = None) -> dict[str, str]:
    """Load the three NPY sensor images for a judge point and return base64 PNGs."""
    return common_point_service.load_judge_images(judge_point_id)


def build_pairwise(row: dict[str, Any], threshold: float = _PASS_THRESHOLD) -> dict[str, Any]:
    """Build the pairwise distance evidence dict from a master-row dict."""
    return verification_service.build_pairwise_from_row(row, threshold=threshold)

