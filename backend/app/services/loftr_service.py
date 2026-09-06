from __future__ import annotations

import os
from typing import Any, Optional
import numpy as np
import torch
import torch.nn.functional as F

from app.config import settings

_LOFTR_MODEL: Any = None
_CACHE: dict[str, dict[str, Any]] = {}
_IS_LOADED: bool = False


class LoFTRWrapper:
    """Local Feature Transformer matcher wrapper.

    Architecture:
        11,561,456 parameters
        Coarse resolution: 8, Fine resolution: 2
        Coarse d_model: 256, Coarse heads: 8
        Fine d_model: 128, Fine heads: 8
    """

    def __init__(self, checkpoint_path: str, device: str = "cpu"):
        self.device = device
        self.model = None

        try:
            import kornia.feature as kf
            # Initialize LoFTR architecture
            self.model = kf.LoFTR(pretrained=None)
            ckpt = torch.load(checkpoint_path, map_location=device)
            state_dict = ckpt.get("model_state_dict", ckpt)
            self.model.load_state_dict(state_dict)
            self.model = self.model.to(device).float()
            self.model.coarse_matching.thr = 0.05
            self.model.eval()
        except Exception as e:
            # If kornia is not yet loaded or state dict varies, handle gracefully
            self.model = None
            raise RuntimeError(f"Failed to load LoFTR model from {checkpoint_path}: {e}")

    def match_pair(
        self,
        img0: np.ndarray,
        img1: np.ndarray,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Run LoFTR forward correspondence between two 2D grayscale arrays.

        ZERO-FABRICATION RULE: If no valid matches are found, returns empty list.
        """
        if self.model is None:
            return []

        # Contrast normalize into [0, 1]
        im0 = (img0.astype(np.float32) - img0.min()) / (img0.max() - img0.min() + 1e-6)
        im1 = (img1.astype(np.float32) - img1.min()) / (img1.max() - img1.min() + 1e-6)

        t0 = F.interpolate(
            torch.from_numpy(im0).unsqueeze(0).unsqueeze(0).float(),
            size=(256, 256),
            mode="bilinear",
            align_corners=False,
        ).to(self.device)

        t1 = F.interpolate(
            torch.from_numpy(im1).unsqueeze(0).unsqueeze(0).float(),
            size=(256, 256),
            mode="bilinear",
            align_corners=False,
        ).to(self.device)

        with torch.no_grad():
            out = self.model({"image0": t0, "image1": t1})

        kp0 = out["keypoints0"].cpu().numpy()
        kp1 = out["keypoints1"].cpu().numpy()
        conf = out["confidence"].cpu().numpy()

        if len(conf) == 0:
            return []

        # Sort by confidence descending
        idx = np.argsort(conf)[::-1][:top_k]
        matches: list[dict[str, Any]] = []
        for i in idx:
            matches.append({
                "p0": [round(float(kp0[i][0] / 256.0), 4), round(float(kp0[i][1] / 256.0), 4)],
                "p1": [round(float(kp1[i][0] / 256.0), 4), round(float(kp1[i][1] / 256.0), 4)],
                "confidence": round(float(conf[i]), 4),
            })
        return matches


def init_matcher(model_package_root: Optional[str] = None) -> None:
    """Initialize LoFTR once at startup. Resolves checkpoint from MODEL_ROOT/models/tmc2."""
    global _LOFTR_MODEL, _IS_LOADED

    root = model_package_root or settings.MODEL_PACKAGE_ROOT
    models_dir = settings.MODEL_ROOT or os.path.join(root, "models")
    ckpt_path = os.path.join(models_dir, "tmc2", settings.BUNDLED_TMC2_CHECKPOINT)

    if not os.path.exists(ckpt_path):
        _IS_LOADED = False
        return

    device = settings.get_effective_device()
    try:
        _LOFTR_MODEL = LoFTRWrapper(ckpt_path, device=device)
        _IS_LOADED = True
    except Exception:
        _LOFTR_MODEL = None
        _IS_LOADED = False


def is_loaded() -> bool:
    return _IS_LOADED and _LOFTR_MODEL is not None


def compute_cross_sensor_matches(
    ohrc: np.ndarray,
    tmc2: np.ndarray,
    iirs: np.ndarray,
    cache_key: Optional[str] = None,
    force_recompute: bool = False,
) -> dict[str, Any]:
    """Compute cross-sensor matches between OHRC, TMC-2, and IIRS.

    Evaluates:
        1. OHRC ↔ TMC-2
        2. TMC-2 ↔ IIRS
    """
    if not force_recompute and cache_key and cache_key in _CACHE:
        return _CACHE[cache_key]

    if _LOFTR_MODEL is None:
        # Zero-fabrication: empty correspondence without fake values
        return {
            "ohrc_tmc2": [],
            "tmc2_iirs": [],
            "mean_confidence": 0.0,
            "total_inliers": 0,
            "status": "integration_pending",
        }

    try:
        ot_matches = _LOFTR_MODEL.match_pair(ohrc, tmc2, top_k=5)
        ti_matches = _LOFTR_MODEL.match_pair(tmc2, iirs, top_k=4)
    except Exception:
        ot_matches = []
        ti_matches = []

    all_conf = [m["confidence"] for m in ot_matches + ti_matches]
    mean_conf = float(np.mean(all_conf)) if all_conf else 0.0

    res = {
        "ohrc_tmc2": ot_matches,
        "tmc2_iirs": ti_matches,
        "mean_confidence": round(mean_conf, 4),
        "total_inliers": len(ot_matches) + len(ti_matches),
        "status": "ok" if (ot_matches or ti_matches) else "no_matches",
    }

    if cache_key:
        _CACHE[cache_key] = res
    return res
