"""
Sensor Registry API Endpoints (SIH26166).
Provides specifications for Chandrayaan-2 instruments: OHRC, TMC-2, and IIRS.
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.schemas.contracts import SensorListResponseSchema, SensorSpecSchema

router = APIRouter()

def _load_sensors_data():
    sensors_file = os.path.join(settings.DEMO_DIR, "sensors.json")
    if not os.path.exists(sensors_file):
        # Fallback to backend/data/demo/sensors.json
        sensors_file = os.path.join(settings.BASE_DIR, "backend", "data", "demo", "sensors.json")
    if not os.path.exists(sensors_file):
        raise HTTPException(status_code=404, detail="Sensors configuration not found.")
    with open(sensors_file, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/api/sensors", response_model=SensorListResponseSchema)
def get_sensors():
    return _load_sensors_data()

@router.get("/api/sensors/{sensor_id}", response_model=SensorSpecSchema)
def get_sensor(sensor_id: str):
    data = _load_sensors_data()
    s_id_clean = sensor_id.upper().replace("-", "").replace("_", "")
    for s in data.get("sensors", []):
        cand_id = s.get("id", "").upper().replace("-", "").replace("_", "")
        cand_inst = s.get("instrument", "").upper().replace("-", "").replace("_", "")
        if s_id_clean in (cand_id, cand_inst):
            return s
    raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found.")
