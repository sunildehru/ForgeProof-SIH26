"""
ForgeProof Central Configuration Module
Provides environment-aware configuration, system thresholds, and directory paths.
Supports zero-configuration local runs as well as containerized cloud deployments.
"""

import os
from pathlib import Path
from typing import Dict

# Base project directories
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = Path(os.getenv("STATIC_DIR", BASE_DIR / "static"))

UPLOADS_DIR = STATIC_DIR / "uploads"
FORENSICS_DIR = STATIC_DIR / "forensics"
FACES_DIR = STATIC_DIR / "faces"
SAMPLES_DIR = STATIC_DIR / "samples"

# Ensure all asset directories exist
for directory in [UPLOADS_DIR, FORENSICS_DIR, FACES_DIR, SAMPLES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

# Database settings: SQLite default for local development, PostgreSQL for cloud/container deployment
DEFAULT_DB_PATH = (BASE_DIR / "forgeproof.db").as_posix()
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

# Image preprocessing thresholds
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "1024")) # Optimized for memory efficiency & high accuracy
IMAGE_JPEG_QUALITY = int(os.getenv("IMAGE_JPEG_QUALITY", "94"))

# Quality Gate thresholds
MIN_SHARPNESS_LAPLACIAN_VAR = 75.0
MAX_GLARE_PIXEL_RATIO = 0.35
MIN_IMAGE_WIDTH = 500
MIN_IMAGE_HEIGHT = 350

# Biometric & Tampering thresholds
FACE_SIMILARITY_MATCH_THRESHOLD = 0.38 # Euclidean distance (dlib 128-d ResNet)
LIVENESS_TEXTURE_VAR_THRESHOLD = 65.0
ELA_ANOMALY_SPIKE_THRESHOLD = 32.0
BOUNDARY_EDGE_VARIANCE_THRESHOLD = 18000.0

# PDD Section 10 Risk Weights
RISK_WEIGHTS: Dict[str, float] = {
    "validation": 0.30,
    "tampering": 0.35,
    "face": 0.25,
    "metadata": 0.10,
}

# Risk Tier Cutoffs
RISK_LOW_CEILING = 30.0
RISK_MEDIUM_CEILING = 65.0
