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
    keypoints_a: List[Tuple[float, float]]
    keypoints_b: List[Tuple[float, float]]
    correspondences: List[Tuple[int, int]]
    inlier_mask: List[bool]
    homography: Optional[List[List[float]]] = None
    metrics: MetricsResponseSchema
    warnings: List[str] = Field(default_factory=list)
    visualizations: Dict[str, str] = Field(default_factory=dict)
