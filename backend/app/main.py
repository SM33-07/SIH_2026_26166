"""
FastAPI Server Entry Point for Lunar Image Correspondence Engine (SIH26166).
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.api import routes_health, routes_upload, routes_match, routes_evaluation, routes_export

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-Modal, Sun-Angle and Scale-Invariant Lunar Image Correspondence Platform (OHRC, TMC-2, IIRS)",
    version="2.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static demo & raw data files
demo_dir = os.path.join(settings.DATA_DIR, "demo")
os.makedirs(demo_dir, exist_ok=True)
app.mount("/static/demo", StaticFiles(directory=demo_dir), name="static_demo")

raw_dir = os.path.join(settings.DATA_DIR, "raw")
os.makedirs(raw_dir, exist_ok=True)
app.mount("/static/raw", StaticFiles(directory=raw_dir), name="static_raw")

# Register API routes
app.include_router(routes_health.router)
app.include_router(routes_upload.router)
app.include_router(routes_match.router)
app.include_router(routes_evaluation.router)
app.include_router(routes_export.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
