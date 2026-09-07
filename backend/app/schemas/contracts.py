from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field, model_validator


class CoordinateRequest(BaseModel):
    latitude: float
    longitude: float

    @model_validator(mode="before")
    @classmethod
    def accept_lat_lon_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "latitude" not in data and "lat" in data:
                data["latitude"] = data["lat"]
            if "longitude" not in data and "lon" in data:
                data["longitude"] = data["lon"]
        return data


class SensorCoords(BaseModel):
    tile_id: Optional[int] = None
    patch_id: Optional[int] = None
    patch_row: Optional[int] = None
    patch_col: Optional[int] = None
    iirs_row: Optional[int] = None
    iirs_col: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class SensorsContainer(BaseModel):
    ohrc: Optional[dict[str, Any]] = None
    tmc2: Optional[dict[str, Any]] = None
    iirs: Optional[dict[str, Any]] = None


class PairwiseCheck(BaseModel):
    distance_deg: float
    status: str  # "PASS" or "FAIL"
    distance_m: Optional[float] = None


class CoordinateResponse(BaseModel):
    decision: str
    common_point_id: str
    query: dict[str, float]
    matched_location: dict[str, float]
    sensors: dict[str, Any]
    consistency_score: float
    geographic_consistency_pct: float
    images: dict[str, str]
    pairwise: dict[str, Any]
    feature_matches: Optional[dict[str, Any]] = None
    note: str


class DemoResponse(BaseModel):
    judge_point_id: str
    decision: str
    common_point_id: str
    query: dict[str, float]
    matched_location: dict[str, float]
    sensors: dict[str, Any]
    consistency_score: float
    geographic_consistency_pct: float
    images: dict[str, str]
    pairwise: dict[str, Any]
    feature_matches: Optional[dict[str, Any]] = None
    evidence: Optional[dict[str, Any]] = None
    reference_label: Optional[str] = None
    inference_mode: str = "live"
    cache_used: bool = False
    runtime_ms: Optional[float] = None
    note: str


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    indexes_loaded: bool
    device: str
    common_points: int
    judge_points: int
    tmc2_shards: int
    scientific_metadata: Optional[dict[str, Any]] = None


class CommonPointDetailResponse(BaseModel):
    common_point_id: str
    patch_id: Optional[int] = None
    dataset_index: Optional[int] = None
    ohrc_tile_id: Optional[int] = None
    iirs_row: Optional[int] = None
    iirs_col: Optional[int] = None
    common_latitude: float
    common_longitude: float
    latitude: float
    longitude_360: float
    ohrc_lat: Optional[float] = None
    ohrc_lon: Optional[float] = None
    iirs_lat: Optional[float] = None
    iirs_lon: Optional[float] = None
    ohrc_distance_deg: Optional[float] = None
    iirs_distance_deg: Optional[float] = None
    ohrc_iirs_distance_deg: Optional[float] = None
    max_sensor_separation_deg: Optional[float] = None
    consistency_score: float
    three_sensor_common: bool = True


class LunarPoint(BaseModel):
    point_id: str
    latitude: float
    longitude: float       # normalized to [-180, 180]
    longitude_360: float
    region: Optional[str] = None
    mapped: bool = False
    analysis_ready: bool = False
    is_sih_beacon: bool = False
    judge_id: Optional[str] = None
    preset_id: Optional[str] = None
    sensors_available: list[str] = Field(default_factory=list)
    consistency_score: Optional[float] = None
    max_sensor_separation_deg: Optional[float] = None


class ThreeImageMatchResponse(BaseModel):
    status: str
    decision: str
    consistency_score: float
    common_location: Optional[dict[str, float]] = None
    pairwise: dict[str, Any]
    evidence: dict[str, Any]
    feature_matches: Optional[dict[str, Any]] = None
    images: Optional[dict[str, str]] = None
    warnings: list[str] = Field(default_factory=list)
    provenance: dict[str, Any]
    source_type: Optional[str] = "manual_upload"
    upload_metadata: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    status: str = "error"
    code: str
    detail: str
