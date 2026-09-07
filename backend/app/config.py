from __future__ import annotations

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_PACKAGE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "model_package")
)


class Settings(BaseSettings):
    # Roots
    MODEL_PACKAGE_ROOT: str = _DEFAULT_PACKAGE
    MODEL_ROOT: Optional[str] = None
    INDEX_ROOT: Optional[str] = None
    MAPPING_ROOT: Optional[str] = None
    JUDGE_LIBRARY_ROOT: Optional[str] = None
    JUDGE_VISUALS_ROOT: Optional[str] = None
    TRAINING_RECORDS_ROOT: Optional[str] = None

    # Optional raw external data mounts
    OHRC_H5: Optional[str] = None
    TMC2_DATASET_DIR: Optional[str] = None
    IIRS_IMAGE: Optional[str] = None
    IIRS_GEO: Optional[str] = None

    # Runtime parameters
    DEVICE: str = "auto"
    SAME_RADIUS_DEG: float = 0.02
    CORS_ORIGINS: list[str] = ["*"]

    # Authoritative Scientific Metadata
    TMC2_GSD_M_PER_PX: float = 5.41
    OHRC_GSD_M_PER_PX: float = 0.28
    IIRS_GSD_M_PER_PX: float = 86.5
    SCALE_RATIO_OHRC_TMC2: float = 19.32

    # TMC-2 Quality Filter Thresholds
    TMC2_MIN_MEAN: float = 40.0
    TMC2_MIN_STD: float = 2.0
    TMC2_MAX_PERCENT_DARK: float = 10.0
    TMC2_MAX_PERCENT_BRIGHT: float = 10.0

    # Model Architecture Specifications
    LOFTR_NUM_PARAMETERS: int = 11561456
    LOFTR_COARSE_RES: int = 8
    LOFTR_FINE_RES: int = 2
    LOFTR_COARSE_D_MODEL: int = 256
    LOFTR_COARSE_HEADS: int = 8
    LOFTR_FINE_D_MODEL: int = 128
    LOFTR_FINE_HEADS: int = 8

    # Checkpoint Filenames (Must not be renamed to Step5D)
    BUNDLED_TMC2_CHECKPOINT: str = "tmc2_loftr_available.pt"
    BUNDLED_OHRC_CHECKPOINT: str = "ohrc_resnet18_best.pth"
    BUNDLED_IIRS_COARSE: str = "loftr_coarse_best.pt"
    BUNDLED_IIRS_FINE: str = "loftr_fine_best.pt"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def resolve_paths(self) -> None:
        """Resolve any unset paths relative to MODEL_PACKAGE_ROOT or bundled local data."""
        # 1. Probe candidate roots for model_package
        candidates = [
            self.MODEL_PACKAGE_ROOT,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "model_package")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model_package")),
            os.path.abspath(os.path.join(os.getcwd(), "model_package")),
            os.path.abspath(os.path.join(os.getcwd(), "..", "model_package")),
            "/opt/render/project/src/model_package",
            "/model_package",
        ]
        for c in candidates:
            if c and os.path.exists(c) and (
                os.path.exists(os.path.join(c, "indexes")) or os.path.exists(os.path.join(c, "models"))
            ):
                self.MODEL_PACKAGE_ROOT = os.path.abspath(c)
                break

        # 2. Local bundled data fallback (inside backend/data)
        local_data = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

        # 3. Resolve INDEX_ROOT with local fallback
        if not self.INDEX_ROOT or not os.path.exists(self.INDEX_ROOT):
            pkg_indexes = os.path.join(self.MODEL_PACKAGE_ROOT, "indexes")
            local_indexes = os.path.join(local_data, "indexes")
            if os.path.exists(pkg_indexes) and os.path.exists(os.path.join(pkg_indexes, "master_three_sensor_common_points.csv")):
                self.INDEX_ROOT = pkg_indexes
            elif os.path.exists(local_indexes) and os.path.exists(os.path.join(local_indexes, "master_three_sensor_common_points.csv")):
                self.INDEX_ROOT = local_indexes
            else:
                self.INDEX_ROOT = pkg_indexes

        # 4. Resolve JUDGE_LIBRARY_ROOT with local fallback
        if not self.JUDGE_LIBRARY_ROOT or not os.path.exists(self.JUDGE_LIBRARY_ROOT):
            pkg_judge = os.path.join(self.MODEL_PACKAGE_ROOT, "judge_library")
            local_judge = os.path.join(local_data, "judge_library")
            if os.path.exists(pkg_judge) and os.path.exists(os.path.join(pkg_judge, "three_sensor_judge_image_library.csv")):
                self.JUDGE_LIBRARY_ROOT = pkg_judge
            elif os.path.exists(local_judge) and os.path.exists(os.path.join(local_judge, "three_sensor_judge_image_library.csv")):
                self.JUDGE_LIBRARY_ROOT = local_judge
            else:
                self.JUDGE_LIBRARY_ROOT = pkg_judge

        # 5. Resolve remaining roots
        if not self.MODEL_ROOT:
            self.MODEL_ROOT = os.path.join(self.MODEL_PACKAGE_ROOT, "models")
        if not self.MAPPING_ROOT:
            self.MAPPING_ROOT = os.path.join(self.MODEL_PACKAGE_ROOT, "mappings")
        if not self.JUDGE_VISUALS_ROOT:
            self.JUDGE_VISUALS_ROOT = os.path.join(self.MODEL_PACKAGE_ROOT, "judge_visuals")
        if not self.TRAINING_RECORDS_ROOT:
            self.TRAINING_RECORDS_ROOT = os.path.join(self.MODEL_PACKAGE_ROOT, "training_records")

    def get_effective_device(self) -> str:
        """Return resolved device: 'cuda' if requested/auto and available, else 'cpu'."""
        if self.DEVICE == "auto":
            try:
                import torch
                return "cuda" if torch.cuda.is_available() else "cpu"
            except Exception:
                return "cpu"
        elif self.DEVICE.startswith("cuda"):
            try:
                import torch
                return "cuda" if torch.cuda.is_available() else "cpu"
            except Exception:
                return "cpu"
        return "cpu"


settings = Settings()
settings.resolve_paths()

