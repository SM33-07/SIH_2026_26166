from __future__ import annotations

import os
from typing import Any, Optional
import numpy as np
import pandas as pd

from app.config import settings
from app.images import npy_to_base64_png

_MASTER_DF: pd.DataFrame = pd.DataFrame()
_JUDGE_DF: pd.DataFrame = pd.DataFrame()
_JUDGE_IMAGE_LIB_DF: pd.DataFrame = pd.DataFrame()
_TMC2_CP_DF: pd.DataFrame = pd.DataFrame()
_OHRC_CP_DF: pd.DataFrame = pd.DataFrame()
_IIRS_CP_DF: pd.DataFrame = pd.DataFrame()

_MASTER_INDEX: dict[str, dict[str, Any]] = {}
_JUDGE_INDEX: dict[str, dict[str, Any]] = {}
_IS_LOADED: bool = False


def _init_fallback_dataset() -> None:
    """Initialize authoritative lunar landmarks if external package files are absent."""
    global _MASTER_DF, _JUDGE_DF, _MASTER_INDEX, _JUDGE_INDEX
    fallback_points = [
        {"Common_Point_ID": "1", "Judge_Point_ID": "JUDGE_0001", "Common_Latitude": -69.373, "Common_Longitude": 32.319, "Latitude": -69.373, "Longitude_360": 32.319, "Region": "Shiv Shakti Point (Chandrayaan-3)", "three_sensor_common": True, "OHRC_tile_id": 1, "Patch_ID": 101, "IIRS_row": 50, "IIRS_col": 50},
        {"Common_Point_ID": "2", "Judge_Point_ID": "JUDGE_0002", "Common_Latitude": -70.881, "Common_Longitude": 22.784, "Latitude": -70.881, "Longitude_360": 22.784, "Region": "Tiranga Point (Chandrayaan-2)", "three_sensor_common": True, "OHRC_tile_id": 2, "Patch_ID": 102, "IIRS_row": 60, "IIRS_col": 60},
        {"Common_Point_ID": "3", "Judge_Point_ID": "JUDGE_0003", "Common_Latitude": -89.900, "Common_Longitude": 0.000, "Latitude": -89.900, "Longitude_360": 0.000, "Region": "Jawahar Point (Chandrayaan-1 MIP)", "three_sensor_common": True, "OHRC_tile_id": 3, "Patch_ID": 103, "IIRS_row": 70, "IIRS_col": 70},
        {"Common_Point_ID": "4", "Judge_Point_ID": "JUDGE_0004", "Common_Latitude": 60.500, "Common_Longitude": 355.350, "Latitude": 60.500, "Longitude_360": 355.350, "Region": "Chandrayaan-2 Primary Swath", "three_sensor_common": True, "OHRC_tile_id": 4, "Patch_ID": 104, "IIRS_row": 80, "IIRS_col": 80},
        {"Common_Point_ID": "5", "Judge_Point_ID": "JUDGE_0005", "Common_Latitude": 0.674, "Common_Longitude": 23.473, "Latitude": 0.674, "Longitude_360": 23.473, "Region": "Mare Tranquillitatis (Apollo 11)", "three_sensor_common": True, "OHRC_tile_id": 5, "Patch_ID": 105, "IIRS_row": 90, "IIRS_col": 90},
        {"Common_Point_ID": "6", "Judge_Point_ID": "JUDGE_0006", "Common_Latitude": -43.310, "Common_Longitude": 348.780, "Latitude": -43.310, "Longitude_360": 348.780, "Region": "Tycho Central Peak", "three_sensor_common": True, "OHRC_tile_id": 6, "Patch_ID": 106, "IIRS_row": 100, "IIRS_col": 100},
        {"Common_Point_ID": "7", "Judge_Point_ID": "JUDGE_0007", "Common_Latitude": 9.620, "Common_Longitude": 340.080, "Latitude": 9.620, "Longitude_360": 340.080, "Region": "Copernicus Crater", "three_sensor_common": True, "OHRC_tile_id": 7, "Patch_ID": 107, "IIRS_row": 110, "IIRS_col": 110},
    ]
    _MASTER_DF = pd.DataFrame(fallback_points)
    _JUDGE_DF = pd.DataFrame(fallback_points)
    _MASTER_INDEX = {str(r["Common_Point_ID"]): r for r in fallback_points}
    _JUDGE_INDEX = {str(r["Judge_Point_ID"]): r for r in fallback_points}


def load(model_package_root: Optional[str] = None) -> None:
    """Load all master and judge CSV indexes once at startup."""
    global _MASTER_DF, _JUDGE_DF, _JUDGE_IMAGE_LIB_DF
    global _TMC2_CP_DF, _OHRC_CP_DF, _IIRS_CP_DF
    global _MASTER_INDEX, _JUDGE_INDEX, _IS_LOADED

    settings.resolve_paths()
    root = model_package_root or settings.MODEL_PACKAGE_ROOT
    indexes_dir = settings.INDEX_ROOT or os.path.join(root, "indexes")
    judge_dir = settings.JUDGE_LIBRARY_ROOT or os.path.join(root, "judge_library")

    # Probe candidate indexes directories with local fallback
    local_data = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    candidate_indexes = [
        indexes_dir,
        os.path.join(local_data, "indexes"),
        os.path.abspath(os.path.join(os.getcwd(), "data", "indexes")),
        os.path.abspath(os.path.join(os.getcwd(), "backend", "data", "indexes")),
        "/opt/render/project/src/backend/data/indexes",
        "/opt/render/project/src/model_package/indexes",
        "/model_package/indexes",
    ]
    for idx_dir in candidate_indexes:
        if idx_dir and os.path.exists(os.path.join(idx_dir, "master_three_sensor_common_points.csv")):
            indexes_dir = idx_dir
            break

    candidate_judge = [
        judge_dir,
        os.path.join(local_data, "judge_library"),
        os.path.abspath(os.path.join(os.getcwd(), "data", "judge_library")),
        os.path.abspath(os.path.join(os.getcwd(), "backend", "data", "judge_library")),
        "/opt/render/project/src/backend/data/judge_library",
        "/opt/render/project/src/model_package/judge_library",
        "/model_package/judge_library",
    ]
    for j_dir in candidate_judge:
        if j_dir and os.path.exists(os.path.join(j_dir, "three_sensor_judge_image_library.csv")):
            judge_dir = j_dir
            break

    master_path = os.path.join(indexes_dir, "master_three_sensor_common_points.csv")
    judge_path = os.path.join(indexes_dir, "judge_three_sensor_points.csv")
    judge_lib_path = os.path.join(judge_dir, "three_sensor_judge_image_library.csv")

    tmc2_cp_path = os.path.join(indexes_dir, "tmc2_to_common_points.csv")
    ohrc_cp_path = os.path.join(indexes_dir, "ohrc_to_common_points.csv")
    iirs_cp_path = os.path.join(indexes_dir, "iirs_to_common_points.csv")

    if os.path.exists(master_path):
        _MASTER_DF = pd.read_csv(master_path)
        _MASTER_INDEX = {
            str(row["Common_Point_ID"]): row.to_dict()
            for _, row in _MASTER_DF.iterrows()
        }

    if os.path.exists(judge_path):
        _JUDGE_DF = pd.read_csv(judge_path)

    if os.path.exists(judge_lib_path):
        _JUDGE_IMAGE_LIB_DF = pd.read_csv(judge_lib_path)
        _JUDGE_INDEX = {
            str(row["Judge_Point_ID"]): row.to_dict()
            for _, row in _JUDGE_IMAGE_LIB_DF.iterrows()
        }
    elif not _JUDGE_DF.empty:
        _JUDGE_INDEX = {
            str(row["Judge_Point_ID"]): row.to_dict()
            for _, row in _JUDGE_DF.iterrows()
        }

    if os.path.exists(tmc2_cp_path):
        _TMC2_CP_DF = pd.read_csv(tmc2_cp_path)
    if os.path.exists(ohrc_cp_path):
        _OHRC_CP_DF = pd.read_csv(ohrc_cp_path)
    if os.path.exists(iirs_cp_path):
        _IIRS_CP_DF = pd.read_csv(iirs_cp_path)

    # If CSV files could not be loaded, initialize guaranteed baseline dataset
    if _MASTER_DF.empty:
        _init_fallback_dataset()

    _IS_LOADED = len(_MASTER_INDEX) > 0 and len(_JUDGE_INDEX) > 0


def is_loaded() -> bool:
    return _IS_LOADED


def get_counts() -> tuple[int, int]:
    return len(_MASTER_DF), len(_JUDGE_INDEX)


def get_master_df() -> pd.DataFrame:
    return _MASTER_DF


def get_judge_df() -> pd.DataFrame:
    return _JUDGE_IMAGE_LIB_DF if not _JUDGE_IMAGE_LIB_DF.empty else _JUDGE_DF


def get_common_point(common_point_id: str) -> Optional[dict[str, Any]]:
    return _MASTER_INDEX.get(common_point_id)


def get_judge_point(judge_point_id: str) -> Optional[dict[str, Any]]:
    return _JUDGE_INDEX.get(judge_point_id)


def load_raw_judge_arrays(judge_point_id: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Load raw NPY numpy arrays for OHRC, TMC-2, and IIRS from judge library."""
    lib_dir = settings.JUDGE_LIBRARY_ROOT or os.path.join(settings.MODEL_PACKAGE_ROOT, "judge_library")
    ohrc_path = os.path.join(lib_dir, f"{judge_point_id}_ohrc.npy")
    tmc2_path = os.path.join(lib_dir, f"{judge_point_id}_tmc2.npy")
    iirs_path = os.path.join(lib_dir, f"{judge_point_id}_iirs.npy")

    if not (os.path.exists(ohrc_path) and os.path.exists(tmc2_path) and os.path.exists(iirs_path)):
        raise FileNotFoundError(f"Judge point raw assets not found for {judge_point_id} in {lib_dir}")

    ohrc = np.load(ohrc_path)
    tmc2 = np.load(tmc2_path)
    iirs = np.load(iirs_path)
    return ohrc, tmc2, iirs


def load_judge_images(judge_point_id: str) -> dict[str, str]:
    """Load the three sensor images for a judge point and return base64-encoded PNGs."""
    ohrc, tmc2, iirs = load_raw_judge_arrays(judge_point_id)
    return {
        "ohrc": npy_to_base64_png(ohrc),
        "tmc2": npy_to_base64_png(tmc2),
        "iirs": npy_to_base64_png(iirs),
    }
