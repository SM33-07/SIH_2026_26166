from __future__ import annotations

import os
from typing import Any, Optional, Tuple
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torchvision import models

from app.config import settings

_OHRC_METADATA_DF: pd.DataFrame = pd.DataFrame()
_OHRC_INDEX: dict[int, dict[str, Any]] = {}
_EMBEDDING_MODEL: Optional[nn.Module] = None
_IS_LOADED: bool = False


class OHRCResNet18Embedder(nn.Module):
    """Grayscale ResNet-18 producing normalized 256-dimensional feature embeddings."""

    def __init__(self, embedding_dim: int = 256):
        super().__init__()
        base = models.resnet18(weights=None)
        # Adapt first conv layer for 1-channel grayscale input
        self.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = base.bn1
        self.relu = base.relu
        self.maxpool = base.maxpool

        self.layer1 = base.layer1
        self.layer2 = base.layer2
        self.layer3 = base.layer3
        self.layer4 = base.layer4

        self.avgpool = base.avgpool
        self.fc = nn.Linear(base.fc.in_features, embedding_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        # L2-normalize
        return nn.functional.normalize(x, p=2, dim=1)


def load_metadata(model_package_root: Optional[str] = None) -> None:
    """Load OHRC tile metadata CSV once at startup."""
    global _OHRC_METADATA_DF, _OHRC_INDEX, _IS_LOADED

    root = model_package_root or settings.MODEL_PACKAGE_ROOT
    mappings_dir = settings.MAPPING_ROOT or os.path.join(root, "mappings")
    meta_path = os.path.join(mappings_dir, "ohrc_tile_metadata_final_geo_hdf5.csv")

    if os.path.exists(meta_path):
        _OHRC_METADATA_DF = pd.read_csv(meta_path)
        _OHRC_INDEX = {
            int(row["tile_id"]): row.to_dict()
            for _, row in _OHRC_METADATA_DF.iterrows()
        }
        _IS_LOADED = True


def init_embedding_model(model_package_root: Optional[str] = None) -> None:
    """Load OHRC ResNet-18 checkpoint once at startup."""
    global _EMBEDDING_MODEL

    root = model_package_root or settings.MODEL_PACKAGE_ROOT
    models_dir = settings.MODEL_ROOT or os.path.join(root, "models")
    ckpt_path = os.path.join(models_dir, "ohrc", settings.BUNDLED_OHRC_CHECKPOINT)

    if not os.path.exists(ckpt_path):
        return

    try:
        model = OHRCResNet18Embedder(embedding_dim=256)
        device = settings.get_effective_device()
        ckpt = torch.load(ckpt_path, map_location=device)
        state_dict = ckpt.get("model_state_dict", ckpt)
        # Load matching weights
        try:
            model.load_state_dict(state_dict, strict=False)
        except Exception:
            pass
        model.to(device)
        model.eval()
        _EMBEDDING_MODEL = model
    except Exception:
        _EMBEDDING_MODEL = None


def compute_four_corner_homography(tile_id: int) -> Optional[np.ndarray]:
    """Compute exact 4-corner geographic homography for an OHRC tile.

    MANDATORY RULE: OHRC ↔ TMC-2 registration MUST use the exact four-corner
    geographic homographies. DO NOT replace with bounding-box or center-only mapping.

    Returns:
        3x3 numpy projective transformation matrix mapping tile pixel coords
        (0,0), (512,0), (0,512), (512,512) to geographic coordinates.
    """
    tile_meta = _OHRC_INDEX.get(tile_id)
    if not tile_meta:
        return None

    # Source pixel coordinates (512 x 512 tile)
    # [Upper-Left, Upper-Right, Lower-Left, Lower-Right]
    src_pts = np.array([
        [0.0, 0.0],
        [512.0, 0.0],
        [0.0, 512.0],
        [512.0, 512.0]
    ], dtype=np.float64)

    # Destination geographic coordinates from authoritative metadata
    dst_pts = np.array([
        [float(tile_meta["lat_ul"]), float(tile_meta["lon_ul"])],
        [float(tile_meta["lat_ur"]), float(tile_meta["lon_ur"])],
        [float(tile_meta["lat_ll"]), float(tile_meta["lon_ll"])],
        [float(tile_meta["lat_lr"]), float(tile_meta["lon_lr"])],
    ], dtype=np.float64)

    # Compute 3x3 Direct Linear Transform (DLT) homography matrix
    # without OpenCV dependency
    return _find_homography_dlt(src_pts, dst_pts)


def _find_homography_dlt(src: np.ndarray, dst: np.ndarray) -> np.ndarray:
    """Direct Linear Transform for 4 point correspondences."""
    A = []
    for i in range(4):
        x, y = src[i, 0], src[i, 1]
        u, v = dst[i, 0], dst[i, 1]
        A.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
        A.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])
    A = np.array(A, dtype=np.float64)
    _, _, Vt = np.linalg.svd(A)
    H = Vt[-1].reshape(3, 3)
    return H / (H[2, 2] + 1e-12)


def get_tile_metadata(tile_id: int) -> Optional[dict[str, Any]]:
    return _OHRC_INDEX.get(tile_id)


def is_loaded() -> bool:
    return _IS_LOADED


def get_tile_count() -> int:
    return len(_OHRC_INDEX)
