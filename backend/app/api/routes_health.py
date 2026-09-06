from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.schemas.contracts import HealthResponse
from app.services import common_point_service, loftr_service

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse | JSONResponse:
    """Readiness and liveness check covering models, indexes, and device."""
    indexes_ready = common_point_service.is_loaded()
    models_ready = loftr_service.is_loaded()
    cp_count, judge_count = common_point_service.get_counts()

    # If critical indexes failed to load, return 503
    if not indexes_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unavailable",
                "detail": "Catalog indexes not loaded.",
                "indexes_loaded": False,
                "models_loaded": models_ready,
            },
        )

    device = settings.get_effective_device()

    return HealthResponse(
        status="ok",
        models_loaded=models_ready,
        indexes_loaded=indexes_ready,
        device=device,
        common_points=cp_count,
        judge_points=judge_count,
        tmc2_shards=34,
        scientific_metadata={
            "tmc2_gsd_m_per_px": settings.TMC2_GSD_M_PER_PX,
            "ohrc_gsd_m_per_px": settings.OHRC_GSD_M_PER_PX,
            "iirs_gsd_m_per_px": settings.IIRS_GSD_M_PER_PX,
            "scale_ratio_ohrc_tmc2": settings.SCALE_RATIO_OHRC_TMC2,
            "loftr_parameters": settings.LOFTR_NUM_PARAMETERS,
        },
    )
