# =============================================================================
# ForgeProof AI Backend — Production Dockerfile
# Multi-stage optimized build for Python 3.11 with CPU-only wheels & prebuilt binaries
# =============================================================================

FROM python:3.11-slim as builder

# Concurrency limits and cache settings to prevent memory exhaustion
ENV CMAKE_BUILD_PARALLEL_LEVEL=1 \
    MAKEFLAGS="-j1" \
    PIP_NO_CACHE_DIR=1

# Install minimal build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /install

# Step 1: Pre-install CPU-only PyTorch and torchvision (saves ~2.3 GB download & build RAM)
RUN pip install --no-cache-dir --prefix=/install/pkg torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Step 2: Pre-install precompiled dlib binary (avoids massive C++ source compilation)
RUN pip install --no-cache-dir --prefix=/install/pkg dlib-bin

# Step 3: Install application requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/pkg -r requirements.txt

# =============================================================================
# Runtime Image
# =============================================================================
FROM python:3.11-slim

# Install runtime shared libraries for OpenCV & OpenBLAS
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-installed Python packages from builder
COPY --from=builder /install/pkg /usr/local

WORKDIR /app

# Copy application source code
COPY . /app

# Create static directories, database directory, and set permissions
RUN useradd -m -u 1000 user && \
    mkdir -p /app/static/uploads /app/static/forensics /app/static/faces /app/static/samples /app/data && \
    chown -R user:user /app && \
    chmod -R 777 /app

USER user

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    HOME=/home/user

EXPOSE 8000
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request, os; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\", 8000)}/api/v1/health')" || exit 1

# Launch production server with dynamic port support (works with Render, Hugging Face, or local Docker)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
