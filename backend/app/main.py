from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Ensure backend directory is in sys.path when imported from root or custom entrypoints
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import get_api_router
from app.config import settings
from app.services import (
    common_point_service,
    coordinate_service,
    iirs_service,
    loftr_service,
    ohrc_service,
    tmc2_service,
)

logger = logging.getLogger("uvicorn.error")


# ---------------------------------------------------------------------------
# Lifespan: Load all data, mappings, spatial indexes, and models once at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Initializing Lunar Multi-Sensor Correspondence Engine...")

    # 1. Resolve configuration paths
    settings.resolve_paths()

    # 2. Load common points and judge library indexes
    common_point_service.load(settings.MODEL_PACKAGE_ROOT)

    # 3. Build fast cKDTree spatial index
    coordinate_service.build_spatial_index()

    # 4. Load TMC-2 usable patch mappings and shard cumulative offsets
    tmc2_service.load_mapping(settings.MODEL_PACKAGE_ROOT)

    # 5. Load OHRC metadata and initialize ResNet-18 embedding model
    ohrc_service.load_metadata(settings.MODEL_PACKAGE_ROOT)
    ohrc_service.init_embedding_model(settings.MODEL_PACKAGE_ROOT)

    # 6. Load IIRS proxy data and geometry service
    iirs_service.load_proxy_data()

    # 7. Initialize LoFTR deep attention feature matcher
    loftr_service.init_matcher(settings.MODEL_PACKAGE_ROOT)

    cp_count, judge_count = common_point_service.get_counts()
    device = settings.get_effective_device()
    logger.info(
        f"Initialization complete: {cp_count} common points, {judge_count} judge points, "
        f"device='{device}', LoFTR ready={loftr_service.is_loaded()}."
    )

    yield

    logger.info("Shutting down Lunar Multi-Sensor Correspondence Engine.")


app = FastAPI(
    title="Lunar Multi-Sensor Correspondence Engine",
    version="1.0.0",
    description=(
        "SIH-2026 backend: verifies geographic correspondence between "
        "OHRC, TMC-2, and IIRS lunar sensor data."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount unified API router under BOTH /api/v1 AND /api for 100% compatibility
# ---------------------------------------------------------------------------
api_router = get_api_router()
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "service": "Lunar Multi-Sensor Correspondence Engine",
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

