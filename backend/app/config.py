"""
Configuration settings for SIH26166 Backend API.
"""

import os

class Settings:
    PROJECT_NAME: str = "SIH26166 Lunar Image Correspondence Engine"
    API_V1_STR: str = "/api"
    DEVICE: str = os.getenv("DEVICE", "auto")
    MAX_IMAGE_DIMENSION: int = int(os.getenv("MAX_IMAGE_SIZE", "1024"))
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data"))
    CACHE_DIR: str = os.getenv("CACHE_DIR", os.path.join(BASE_DIR, "cache"))

settings = Settings()
