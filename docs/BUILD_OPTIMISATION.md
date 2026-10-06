# ForgeProof — Docker Build Optimisation Notes
# =============================================
# This file documents the multi-stage Dockerfile layer strategy
# adopted after profiling build times against the Azure ACR push pipeline.
#
# Key findings (profiled 2026-10-06):
#   - Layer 1 (base deps): ~45 s  ← pinned; rarely changes
#   - Layer 2 (pip install): ~80 s ← now cached via requirements hash
#   - Layer 3 (source copy): ~5 s  ← always runs; acceptable
#   - Total cold build:  ~130 s   (down from ~210 s before optimisation)
#   - Total warm build:  ~12 s    (cache hit on layers 1+2)
#
# Strategy applied:
#   1. Copy requirements.txt BEFORE copying src — maximises pip cache hits.
#   2. Pin base image digest (sha256) for reproducibility.
#   3. Drop dev-only packages (pytest, httpx, faker) from production image.
#   4. Use --no-cache-dir pip flag to avoid redundant layer bloat.
#   5. Strip __pycache__ and *.pyc via .dockerignore.

# ── Dependency Version Constraints ────────────────────────────────────────────
# These ranges were verified compatible with Python 3.11 on slim-bookworm.
# Upper bounds are intentionally loose to allow patch-level security updates
# via Dependabot without requiring manual bumps.

[build-system]
# Build backend not used (no pyproject.toml build); listed for reference only.
requires = ["setuptools>=68", "wheel"]

[production-dependencies]
# Core framework
fastapi = ">=0.111,<0.113"
uvicorn = { extras = ["standard"], version = ">=0.29,<0.31" }
pydantic = ">=2.7,<3.0"

# Persistence
tinydb = ">=4.8,<4.9"

# OCR & vision
pytesseract = ">=0.3.10"
Pillow = ">=10.3,<11.0"
numpy = ">=1.26,<2.0"
opencv-python-headless = ">=4.9,<5.0"

# Crypto / integrity
cryptography = ">=42.0,<43.0"

# Utilities
python-multipart = ">=0.0.9"
python-dotenv = ">=1.0"
aiofiles = ">=23.2"
httpx = ">=0.27,<0.28"

[dev-dependencies]
# Excluded from production Docker image (see Dockerfile stage separation)
pytest = ">=8.2"
pytest-asyncio = ">=0.23"
faker = ">=25.0"
coverage = ">=7.5"
ruff = ">=0.4"

# ── .dockerignore additions (append to root .dockerignore) ────────────────────
# __pycache__/
# *.pyc
# *.pyo
# .pytest_cache/
# tests/
# docs/
# scripts/
# frontend/node_modules/
# frontend/dist/        ← served by Vercel; not needed in backend image
# .env
# .env.*
# *.log

# ── Layer Cache Fingerprint Strategy ──────────────────────────────────────────
# In the GitHub Actions workflow (deploy-acr.yml), the pip layer is fingerprinted
# via the SHA-256 of requirements.txt before the COPY . . step:
#
#   - name: Build and push
#     run: |
#       docker build \
#         --build-arg REQUIREMENTS_HASH=$(sha256sum backend/requirements.txt | cut -c1-16) \
#         -t $IMAGE_TAG \
#         -f backend/Dockerfile \
#         backend/
#
# The ARG REQUIREMENTS_HASH is declared before the RUN pip install step in the
# Dockerfile, so Docker's layer cache key incorporates the hash and invalidates
# exactly when requirements change.

# ── Azure App Service Resource Sizing ─────────────────────────────────────────
# Tier        vCPU   RAM     Max instances   Est. cost/mo (Pay-as-you-go)
# B1          1      1.75 GB  3 (manual)      ~$13 USD
# B2          2      3.5 GB   3 (manual)      ~$26 USD
# P0v3        1      4 GB     3 (auto-scale)  ~$32 USD   ← recommended for prod
#
# Current deployment: B1 (adequate for SIH evaluation; ~4-10 concurrent users)
# Recommendation: Upgrade to P0v3 before public pilot rollout.

# ── Performance Tuning — Uvicorn Workers ──────────────────────────────────────
# Single-container App Service: use 1 worker (default).
# Formula for multi-core: workers = (2 × CPU cores) + 1
# B1 = 1 vCPU → CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
# P0v3 = 1 vCPU → same formula, still 1 worker recommended (async handles concurrency)
# Use --loop uvloop for 20-30% throughput gain on Linux images.
