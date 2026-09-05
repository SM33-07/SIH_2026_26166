"""
Base contracts and abstract classes for Lunar Image Correspondence Engine (SIH26166).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

@dataclass
class ImageRecord:
    id: str
    file_path: str
    instrument: str  # "OHRC", "TMC2", "IIRS"
    modality: str    # "panchromatic", "stereo", "hyperspectral"
    width: int
    height: int
    gsd_m_per_pixel: Optional[float] = None
    acquisition_time: Optional[str] = None
    sun_elevation_deg: Optional[float] = None
    sun_azimuth_deg: Optional[float] = None
    look_angle_deg: Optional[float] = None
    spectral_bands: Optional[List[int]] = None
    crs: Optional[str] = None
    bounds: Optional[Dict[str, float]] = None
    dtype: str = "uint8"
    processing_history: List[str] = field(default_factory=list)

@dataclass
class MatchResult:
    keypoints_a: List[Tuple[float, float]]
    keypoints_b: List[Tuple[float, float]]
    correspondences: List[Tuple[int, int]]
    confidence_scores: List[float]
    inlier_mask: List[bool]
    homography: Optional[List[List[float]]] = None
    affine_matrix: Optional[List[List[float]]] = None
    warped_image_b_shape: Optional[Tuple[int, int]] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    modality_pair_type: str = "OHRC-OHRC"
    warnings: List[str] = field(default_factory=list)
    processing_steps: List[str] = field(default_factory=list)

class BaseMatcher(ABC):
    """Abstract interface for all correspondence matchers (classical and learned)."""

    @abstractmethod
    def match(
        self,
        image_a: np.ndarray,
        image_b: np.ndarray,
        mask_a: Optional[np.ndarray] = None,
        mask_b: Optional[np.ndarray] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> MatchResult:
        pass
