from __future__ import annotations

import io
from fastapi import APIRouter, HTTPException, Response
from PIL import Image
import numpy as np

from app.services import common_point_service

router = APIRouter(tags=["Media"])


@router.get("/media/judge/{judge_id}/{sensor}")
def get_judge_media(judge_id: str, sensor: str) -> Response:
    """Safely stream a contrast-normalized PNG for a judge library observation."""
    clean_id = judge_id.strip().upper()
    sensor_lower = sensor.strip().lower()

    if sensor_lower not in {"ohrc", "tmc2", "iirs"}:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sensor '{sensor}'. Valid options: ohrc, tmc2, iirs.",
        )

    try:
        ohrc, tmc2, iirs = common_point_service.load_raw_judge_arrays(clean_id)
        arr = {"ohrc": ohrc, "tmc2": tmc2, "iirs": iirs}[sensor_lower]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Judge point '{clean_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Dynamic contrast normalization
    arr_f = arr.astype(np.float32)
    arr_min = float(arr_f.min())
    arr_max = float(arr_f.max())

    if arr_max > arr_min:
        arr_norm = ((arr_f - arr_min) / (arr_max - arr_min) * 255.0).clip(0, 255).astype(np.uint8)
    else:
        arr_norm = np.zeros(arr.shape[:2], dtype=np.uint8)

    if arr_norm.ndim == 2:
        img = Image.fromarray(arr_norm, mode="L")
    elif arr_norm.ndim == 3 and arr_norm.shape[2] == 1:
        img = Image.fromarray(arr_norm[:, :, 0], mode="L")
    else:
        img = Image.fromarray(arr_norm)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="image/png")
