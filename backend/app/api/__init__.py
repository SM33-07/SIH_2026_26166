from __future__ import annotations

from fastapi import APIRouter

from app.api.routes_health import router as health_router
from app.api.routes_coordinate import router as coordinate_router
from app.api.routes_demo import router as demo_router
from app.api.routes_match import router as match_router
from app.api.routes_common_points import router as common_points_router
from app.api.routes_media import router as media_router
from app.api.routes_sensors import router as sensors_router
from app.api.routes_benchmarks import router as benchmarks_router
from app.api.routes_provenance import router as provenance_router


def get_api_router() -> APIRouter:
    """Combine all service routes into a unified router."""
    api_router = APIRouter()
    api_router.include_router(health_router)
    api_router.include_router(coordinate_router)
    api_router.include_router(demo_router)
    api_router.include_router(match_router)
    api_router.include_router(common_points_router)
    api_router.include_router(media_router)
    api_router.include_router(sensors_router)
    api_router.include_router(benchmarks_router)
    api_router.include_router(provenance_router)
    return api_router
