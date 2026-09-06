from __future__ import annotations

import glob
import os
from typing import Any, Optional, Tuple
import numpy as np
import pandas as pd

from app.config import settings

_TMC2_MAPPING_DF: pd.DataFrame = pd.DataFrame()
_TMC2_GEOMETRY_DF: pd.DataFrame = pd.DataFrame()
_SHARD_OFFSETS: list[Tuple[str, int, int]] = []  # (shard_path, cumulative_start, count)
_TOTAL_RECORDS: int = 0
_IS_LOADED: bool = False


def check_patch_quality(
    mean: float,
    std: float,
    percent_dark: float,
    percent_bright: float,
) -> Tuple[bool, Optional[str]]:
    """Strict TMC-2 quality filter.

    Reject patch if:
        Mean < 40
        OR Std < 2
        OR at least 10% pixels <= 20
        OR at least 10% pixels >= 400
    """
    if mean < settings.TMC2_MIN_MEAN:
        return False, f"Mean intensity {mean:.2f} < {settings.TMC2_MIN_MEAN}"
    if std < settings.TMC2_MIN_STD:
        return False, f"Standard deviation {std:.2f} < {settings.TMC2_MIN_STD}"
    if percent_dark >= settings.TMC2_MAX_PERCENT_DARK:
        return False, f"Dark pixels percentage {percent_dark:.1f}% >= {settings.TMC2_MAX_PERCENT_DARK}%"
    if percent_bright >= settings.TMC2_MAX_PERCENT_BRIGHT:
        return False, f"Saturated bright pixels {percent_bright:.1f}% >= {settings.TMC2_MAX_PERCENT_BRIGHT}%"
    return True, None


def load_mapping(model_package_root: Optional[str] = None) -> None:
    """Load the TMC-2 usable patch mapping and inspect shards if mounted."""
    global _TMC2_MAPPING_DF, _TMC2_GEOMETRY_DF, _SHARD_OFFSETS, _TOTAL_RECORDS, _IS_LOADED

    root = model_package_root or settings.MODEL_PACKAGE_ROOT
    mappings_dir = settings.MAPPING_ROOT or os.path.join(root, "mappings")

    mapping_path = os.path.join(mappings_dir, "tmc2_final_usable_patch_mapping.csv")
    geometry_path = os.path.join(mappings_dir, "tmc2_clean_geometry.csv")

    if os.path.exists(mapping_path):
        # Load mapping (using selective columns for memory efficiency if large)
        _TMC2_MAPPING_DF = pd.read_csv(
            mapping_path,
            usecols=[
                "Dataset_Index", "Patch_ID", "Patch_Row", "Patch_Col",
                "Latitude", "Longitude", "Mean", "Std",
                "Percent_Dark_LessEqual20", "Percent_Bright_GreaterEqual400",
                "Quality_Flag", "Usable"
            ]
        )

    if os.path.exists(geometry_path):
        _TMC2_GEOMETRY_DF = pd.read_csv(geometry_path)

    # Initialize shard cumulative offsets if TMC2_DATASET_DIR is configured
    if settings.TMC2_DATASET_DIR and os.path.isdir(settings.TMC2_DATASET_DIR):
        init_shard_offsets(settings.TMC2_DATASET_DIR)

    _IS_LOADED = len(_TMC2_MAPPING_DF) > 0 or len(_SHARD_OFFSETS) > 0


def init_shard_offsets(tmc2_dir: str) -> list[Tuple[str, int, int]]:
    """Inspect actual dataset length of each shard and compute cumulative offsets.

    CRITICAL RULE: DO NOT assume all HDF5 shards contain equal numbers of records.
    """
    global _SHARD_OFFSETS, _TOTAL_RECORDS

    try:
        import h5py
    except ImportError:
        return []

    shard_files = sorted(glob.glob(os.path.join(tmc2_dir, "*.h5")))
    offsets: list[Tuple[str, int, int]] = []
    current_offset = 0

    for shard_path in shard_files:
        try:
            with h5py.File(shard_path, "r") as f:
                # Inspect dataset length dynamically
                dataset_name = list(f.keys())[0]
                length = len(f[dataset_name])
                offsets.append((shard_path, current_offset, length))
                current_offset += length
        except Exception:
            continue

    _SHARD_OFFSETS = offsets
    _TOTAL_RECORDS = current_offset
    return offsets


def resolve_shard_location(dataset_index: int) -> Tuple[str, int]:
    """Determine the correct shard and local index from a global Dataset_Index.

    Parameters:
        dataset_index: The global 0-indexed dataset index.

    Returns:
        (shard_filepath, local_index)
    """
    if not _SHARD_OFFSETS:
        raise RuntimeError("No TMC-2 shards loaded or configured.")

    for shard_path, start_offset, count in _SHARD_OFFSETS:
        if start_offset <= dataset_index < start_offset + count:
            local_idx = dataset_index - start_offset
            return shard_path, local_idx

    raise IndexError(f"Dataset_Index {dataset_index} exceeds total available records ({_TOTAL_RECORDS}).")


def load_patch(dataset_index: int) -> Optional[np.ndarray]:
    """Load patch from HDF5 shard if mounted."""
    if not _SHARD_OFFSETS:
        return None

    try:
        import h5py
        shard_path, local_idx = resolve_shard_location(dataset_index)
        with h5py.File(shard_path, "r") as f:
            dataset_name = list(f.keys())[0]
            return np.array(f[dataset_name][local_idx])
    except Exception:
        return None


def get_metadata(patch_id: int) -> Optional[dict[str, Any]]:
    if _TMC2_MAPPING_DF.empty:
        return None
    matches = _TMC2_MAPPING_DF[_TMC2_MAPPING_DF["Patch_ID"] == patch_id]
    if not matches.empty:
        return matches.iloc[0].to_dict()
    return None


def is_loaded() -> bool:
    return _IS_LOADED


def get_patch_count() -> int:
    return len(_TMC2_MAPPING_DF)
