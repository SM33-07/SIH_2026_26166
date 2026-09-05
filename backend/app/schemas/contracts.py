"""
Pydantic API contracts for SIH26166 Backend endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Tuple

class MatchOptionsSchema(BaseModel):
    use_illumination_normalization: bool = True
    use_shadow_mask: bool = True
    use_scale_pyramid: bool = True
    use_iirs_proxy: bool = True
    pipeline: str = "proposed"  # "proposed" or "classical"
    classical_algorithm: str = "SIFT"  # "SIFT", "AKAZE", "ORB"
    geometry_model: str = "auto"  # "auto", "homography", "affine"
    confidence_threshold: float = 0.5
    iirs_band_indices: Optional[List[int]] = None

class MatchRequestSchema(BaseModel):
    image_a_id: str
    image_b_id: str
    modality_a: str = "OHRC"  # "OHRC", "TMC2", "IIRS"
    modality_b: str = "TMC2"
    sun_elevation_a: Optional[float] = None
    sun_elevation_b: Optional[float] = None
    gsd_a: Optional[float] = None
    gsd_b: Optional[float] = None
    options: MatchOptionsSchema = Field(default_factory=MatchOptionsSchema)

class MetricsResponseSchema(BaseModel):
    num_keypoints_a: int
    num_keypoints_b: int
    num_matches: int
    num_inliers: int
    inlier_ratio: float
    rmse: Optional[float] = None
    runtime_ms: float
    scale_ratio: Optional[float] = None
    sun_angle_difference_deg: Optional[float] = None
    cycle_consistency_error: Optional[float] = None
    confidence_mean: float
    quality_score: int
    confidence_level: str
    modality_pair_type: str

class MatchResultResponseSchema(BaseModel):
    job_id: str
    status: str
    modality_pair_type: str
    pair_state: Optional[str] = None
    keypoints_a: List[Tuple[float, float]] = Field(default_factory=list)
    keypoints_b: List[Tuple[float, float]] = Field(default_factory=list)
    keypoints0: Optional[List[Tuple[float, float]]] = None
    keypoints1: Optional[List[Tuple[float, float]]] = None
    correspondences: List[Tuple[int, int]] = Field(default_factory=list)
    matches: Optional[List[Tuple[int, int]]] = None
    inlier_mask: List[bool] = Field(default_factory=list)
    confidence: Optional[List[float]] = None
    homography: Optional[List[List[float]]] = None
    transform: Optional[List[List[float]]] = None
    metrics: Optional[MetricsResponseSchema] = None
    warnings: List[str] = Field(default_factory=list)
    visualizations: Dict[str, str] = Field(default_factory=dict)
    visualization: Optional[Any] = None
    provenance: Optional[Dict[str, Any]] = None


# --- SIH26166 Multi-Modal Demo & Graph Schemas ---

class SensorSpecSchema(BaseModel):
    id: str
    name: str
    instrument: Optional[str] = None
    gsd_m_per_pixel: float
    gsd_m_per_px: Optional[float] = None
    gsd: Optional[float] = None
    modality: str
    modality_label: Optional[str] = None
    bands: Optional[int] = 1
    swath_km: float
    spectral_range_um: Optional[str] = None
    stereo_capability: bool = False
    status: str = "operational"
    description: str
    theme_accent: Optional[str] = None

class SensorListResponseSchema(BaseModel):
    sensors: List[SensorSpecSchema]
    scale_ratios: Optional[Dict[str, float]] = None
    hierarchical_bridge: Optional[Dict[str, Any]] = None

class BenchmarkMetricSchema(BaseModel):
    benchmark_id: str
    name: str
    modality_pair: str
    condition: str
    status: str
    mean_error_px: float
    p90_error_px: float
    accuracy_1px_pct: float
    accuracy_2px_pct: Optional[float] = None
    accuracy_3px_pct: float
    inlier_ratio_pct: float
    mean_confidence_pct: float
    runtime_ms: float
    total_pairs_evaluated: int
    caveat: str
    notes: Optional[str] = None

class BenchmarkListResponseSchema(BaseModel):
    benchmarks: List[BenchmarkMetricSchema]

class BenchmarkConditionSchema(BaseModel):
    name: Optional[str] = None
    sun_angle_range: str
    evaluated_pairs: int
    mean_error_px: float
    p90_error_px: float
    accuracy_1px_pct: float
    accuracy_2px_pct: Optional[float] = None
    accuracy_3px_pct: float
    inlier_ratio_pct: float
    mean_confidence_pct: float
    runtime_ms: float
    status: str = "validated_benchmark"

class IIRSBenchmarkResponseSchema(BaseModel):
    benchmark_type: str
    real_scene_accuracy: bool = False
    three_sensor_accuracy: bool = False
    warning: str
    standard: BenchmarkConditionSchema
    stress: BenchmarkConditionSchema
    ablations: Optional[List[Dict[str, Any]]] = None

class CasePairSchema(BaseModel):
    pair_key: str
    instrument_a: str
    instrument_b: str
    status: str
    file: str

class CaseSchema(BaseModel):
    id: str
    case_id: Optional[str] = None
    name: str
    region: Optional[str] = None
    latitude: float
    longitude: float
    lat: Optional[float] = None
    lon: Optional[float] = None
    location: Optional[Dict[str, float]] = None
    description: Optional[str] = None
    primary_pair: Optional[str] = None
    sensors: Optional[Dict[str, Any]] = None
    sensor_availability: Optional[Dict[str, bool]] = None
    statuses: Optional[Dict[str, str]] = None
    preview_urls: Optional[Dict[str, str]] = None
    scale_ratios: Optional[Dict[str, float]] = None
    pair_status: Optional[Dict[str, str]] = None
    three_way_integration: Optional[Dict[str, Any]] = None
    provenance: Optional[Dict[str, Any]] = None
    pairs: Optional[List[CasePairSchema]] = Field(default_factory=list)

class CaseListResponseSchema(BaseModel):
    cases: List[CaseSchema]

class GraphNodeSchema(BaseModel):
    id: str
    label: str
    gsd: float
    modality: str
    color: str

class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    status: str
    label: str
    inlier_ratio: Optional[float] = None
    rmse: Optional[float] = None

class SensorGraphResponseSchema(BaseModel):
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]
    timestamp: str
    status_summary: Dict[str, int]

class MethodologyStageSchema(BaseModel):
    stage: int
    name: str
    description: str
    inputs: List[str]
    status: str

class MethodologyResponseSchema(BaseModel):
    title: str
    description: str
    pipeline_stages: List[MethodologyStageSchema]

class ProvenanceResponseSchema(BaseModel):
    scientific_states: Dict[str, str]
    limitations: List[Dict[str, str]]
