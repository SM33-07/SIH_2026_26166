"""
Image Upload and Demo Preset Dataset Routes (SIH26166).
"""

import os
import json
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.config import settings

try:
    import cv2
except ImportError:
    cv2 = None


router = APIRouter()

@router.post("/api/images/upload")
async def upload_image(
    file: UploadFile = File(...),
    instrument: str = Form("OHRC"),
    gsd: float = Form(0.25),
    sun_elevation: float = Form(30.0),
    sun_azimuth: float = Form(45.0)
):
    upload_dir = os.path.join(settings.DATA_DIR, "raw", instrument.lower())
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".png", ".jpg", ".jpeg", ".tif", ".tiff"]:
        file_ext = ".png"

    img_id = f"up_{uuid.uuid4().hex[:8]}"
    save_filename = f"{img_id}{file_ext}"
    save_path = os.path.join(upload_dir, save_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if cv2 is not None:
        img = cv2.imread(save_path)
        h, w = img.shape[:2] if img is not None else (512, 512)
    else:
        h, w = (512, 512)

    return {
        "id": img_id,
        "filename": file.filename,
        "path": save_path,
        "instrument": instrument,
        "gsd_m_per_pixel": gsd,
        "sun_elevation_deg": sun_elevation,
        "sun_azimuth_deg": sun_azimuth,
        "width": w,
        "height": h
    }

@router.get("/api/demo/pairs")
def get_demo_pairs():
    demo_manifest = os.path.join(settings.DATA_DIR, "demo", "manifest.json")
    if not os.path.exists(demo_manifest):
        # Auto-trigger prepare_demo if missing
        from scripts.prepare_demo import prepare_demo_dataset
        prepare_demo_dataset()

    with open(demo_manifest, "r") as f:
        data = json.load(f)
    return data
