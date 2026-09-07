from __future__ import annotations

from typing import Any
from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["Provenance"])


@router.get("/provenance")
@router.get("/provenance/models")
def get_model_provenance() -> dict[str, Any]:
    """Return model provenance, parameter counts, and checkpoint metadata."""
    return {
        "models": {
            "tmc2": {
                "checkpoint": settings.BUNDLED_TMC2_CHECKPOINT,
                "architecture": "LoFTR (Dense Attention Transformer)",
                "parameters": settings.LOFTR_NUM_PARAMETERS,
                "coarse_layers": settings.LOFTR_COARSE_RES,
                "fine_layers": settings.LOFTR_FINE_RES,
                "training_epoch": 3,
                "training_global_step": 5625,
                "historical_step5d_included": False,
            },
            "ohrc": {
                "checkpoint": settings.BUNDLED_OHRC_CHECKPOINT,
                "architecture": "ResNet-18 Grayscale Feature Embedder",
                "output_dimensions": 256,
                "normalization": "L2 unit sphere",
            },
            "iirs": {
                "coarse_checkpoint": settings.BUNDLED_IIRS_COARSE,
                "fine_checkpoint": settings.BUNDLED_IIRS_FINE,
                "runtime_service": "Approximate product-level geometry interpolation",
            },
        },
        "geographic_catalog": {
            "common_points": 1514,
            "judge_demonstration_points": 500,
            "same_zone_threshold_deg": settings.SAME_RADIUS_DEG,
        },
    }
