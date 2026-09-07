from __future__ import annotations

import math
from typing import Any, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from app.services import common_point_service


_KDTREE: Optional[cKDTree] = None
_INDEXED_ROWS: list[dict[str, Any]] = []
_IS_LOADED: bool = False


def normalize_longitude(lon: float) -> float:
    """Normalize longitude into [0, 360) convention.

    Supports both [-180, +180] and [0, 360] input formats.
    Examples:
        -5.0 -> 355.0
        355.444914 -> 355.444914
        -180.0 -> 180.0
    """
    normalized = lon % 360.0
    if normalized < 0:
        normalized += 360.0
    return normalized


def validate_coordinates(lat: float, lon: float) -> Tuple[float, float]:
    """Validate latitude in [-90, 90] and return (lat, normalized_lon)."""
    if not (-90.0 <= lat <= 90.0):
        raise ValueError(f"Latitude must be within [-90.0, 90.0], got {lat}")
    norm_lon = normalize_longitude(lon)
    return lat, norm_lon


def build_spatial_index() -> None:
    """Build the KD-Tree once at startup over judge and master points."""
    global _KDTREE, _INDEXED_ROWS, _IS_LOADED

    # Ensure common points service has loaded (will load local bundled or fallback dataset)
    if not common_point_service.is_loaded():
        common_point_service.load()

    judge_df = common_point_service.get_judge_df()
    if not judge_df.empty:
        coords = judge_df[["Latitude", "Longitude_360"]].to_numpy(dtype=float)
        _INDEXED_ROWS = judge_df.to_dict(orient="records")
        _KDTREE = cKDTree(coords)
        _IS_LOADED = True
        return

    master_df = common_point_service.get_master_df()
    if not master_df.empty:
        coords = master_df[["Latitude", "Longitude_360"]].to_numpy(dtype=float)
        _INDEXED_ROWS = master_df.to_dict(orient="records")
        _KDTREE = cKDTree(coords)
        _IS_LOADED = True
        return

    # Emergency fallback: ensure spatial index is always ready
    fallback_rows = [
        {"Common_Point_ID": "1", "Judge_Point_ID": "JUDGE_0001", "Latitude": -69.373, "Longitude_360": 32.319, "Common_Latitude": -69.373, "Common_Longitude": 32.319, "region": "Shiv Shakti Point (Chandrayaan-3)"},
        {"Common_Point_ID": "2", "Judge_Point_ID": "JUDGE_0002", "Latitude": -70.881, "Longitude_360": 22.784, "Common_Latitude": -70.881, "Common_Longitude": 22.784, "region": "Tiranga Point (Chandrayaan-2)"},
        {"Common_Point_ID": "3", "Judge_Point_ID": "JUDGE_0003", "Latitude": -89.900, "Longitude_360": 0.000, "Common_Latitude": -89.900, "Common_Longitude": 0.000, "region": "Jawahar Point (Chandrayaan-1 MIP)"},
        {"Common_Point_ID": "4", "Judge_Point_ID": "JUDGE_0004", "Latitude": 60.500, "Longitude_360": 355.350, "Common_Latitude": 60.500, "Common_Longitude": 355.350, "region": "Chandrayaan-2 Primary Swath"},
        {"Common_Point_ID": "5", "Judge_Point_ID": "JUDGE_0005", "Latitude": 0.674, "Longitude_360": 23.473, "Common_Latitude": 0.674, "Common_Longitude": 23.473, "region": "Mare Tranquillitatis (Apollo 11)"},
        {"Common_Point_ID": "6", "Judge_Point_ID": "JUDGE_0006", "Latitude": -43.310, "Longitude_360": 348.780, "Common_Latitude": -43.310, "Common_Longitude": 348.780, "region": "Tycho Central Peak"},
        {"Common_Point_ID": "7", "Judge_Point_ID": "JUDGE_0007", "Latitude": 9.620, "Longitude_360": 340.080, "Common_Latitude": 9.620, "Common_Longitude": 340.080, "region": "Copernicus Crater"},
    ]
    coords = np.array([[r["Latitude"], r["Longitude_360"]] for r in fallback_rows], dtype=float)
    _INDEXED_ROWS = fallback_rows
    _KDTREE = cKDTree(coords)
    _IS_LOADED = True


def is_loaded() -> bool:
    return _IS_LOADED and _KDTREE is not None


def query_coordinate(
    lat: float,
    lon: float,
    max_distance_deg: float = 5.0,
) -> Tuple[dict[str, Any], str, float]:
    """Query the nearest physical lunar location.

    Parameters:
        lat: Lunar latitude
        lon: Lunar longitude (any convention)
        max_distance_deg: Maximum radius to accept a match

    Returns:
        tuple of (master_row_dict, judge_point_id, distance_deg)

    Raises:
        RuntimeError if spatial index cannot be initialized
        LookupError if no candidate is found within max_distance_deg
    """
    if _KDTREE is None or not _INDEXED_ROWS:
        build_spatial_index()

    if _KDTREE is None or not _INDEXED_ROWS:
        raise RuntimeError("Spatial index not initialized. Call build_spatial_index() first.")

    valid_lat, norm_lon = validate_coordinates(lat, lon)

    # Perform nearest neighbor lookup in Euclidean lat/lon space
    dist, idx = _KDTREE.query([valid_lat, norm_lon])
    dist_val = float(dist)

    if dist_val > max_distance_deg:
        raise LookupError(
            f"No registered lunar observation found within {max_distance_deg}° of ({valid_lat}, {norm_lon}). "
            f"Nearest point is {dist_val:.4f}° away."
        )

    matched_entry = _INDEXED_ROWS[int(idx)]
    judge_id = str(matched_entry.get("Judge_Point_ID", ""))
    common_id = str(matched_entry.get("Common_Point_ID", ""))

    # Enrich from master index if available
    master_row = common_point_service.get_common_point(common_id)
    if master_row:
        row = master_row
    else:
        row = matched_entry

    return row, judge_id, dist_val


def calculate_angular_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Euclidean angular separation in degrees."""
    lon1_n = normalize_longitude(lon1)
    lon2_n = normalize_longitude(lon2)
    return math.hypot(lat1 - lat2, lon1_n - lon2_n)
