"""
ForgeProof Image Quality Gate Engine
Validates incoming document scans and camera captures for optical clarity,
specular reflection (glare), and resolution before biometric and forensic processing.
Conforms to PDD Section 5.2 (Step 2: Quality Gate).
"""

import cv2
import numpy as np
from typing import Dict, Any

from app.config import (
    MIN_SHARPNESS_LAPLACIAN_VAR,
    MAX_GLARE_PIXEL_RATIO,
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
)


def evaluate_image_quality(image_path: str) -> Dict[str, Any]:
    """
    Evaluates image optical clarity, sharpness, glare, and resolution.
    Returns structured results conforming to QualityGateResult schema.
    """
    img = cv2.imread(image_path)
    if img is None:
        return {
            "passed": False,
            "quality_score": 0.0,
            "blur_metric": 0.0,
            "blur_status": "Unreadable File",
            "glare_percentage": 0.0,
            "glare_status": "Unknown",
            "resolution": "0x0",
            "resolution_ok": False,
            "feedback": "Unable to decode image file. Please provide a valid JPEG or PNG.",
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Sharpness / Blur Metric via Laplacian Variance
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_sharp = lap_var >= MIN_SHARPNESS_LAPLACIAN_VAR
    blur_status = "Sharp" if is_sharp else "Blurred / Out of Focus"

    # 2. Glare / Specular Reflection via Brightness Mask
    # Pixels with high luminance (value > 248) and low saturation
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    glare_mask = (hsv[:, :, 2] > 248) & (hsv[:, :, 1] < 45)
    glare_ratio = float(np.sum(glare_mask) / (h * w))
    has_excessive_glare = glare_ratio > MAX_GLARE_PIXEL_RATIO
    glare_pct = round(glare_ratio * 100.0, 2)
    glare_status = "Excessive Glare" if has_excessive_glare else "Normal Lighting"

    # 3. Resolution Verification
    resolution_ok = (w >= MIN_IMAGE_WIDTH) and (h >= MIN_IMAGE_HEIGHT)
    resolution_str = f"{w}x{h}"

    # 4. Composite Quality Score (0 to 100)
    score = 100.0
    feedback_points = []

    if not is_sharp:
        score -= min(40.0, (MIN_SHARPNESS_LAPLACIAN_VAR - lap_var) * 0.4)
        feedback_points.append("Camera focus is soft or blurry")

    if has_excessive_glare:
        score -= min(35.0, glare_pct * 0.8)
        feedback_points.append("Excessive reflection/glare across document surface")

    if not resolution_ok:
        score -= 40.0
        feedback_points.append(f"Resolution {resolution_str} is below minimum requirement ({MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT})")

    quality_score = round(max(5.0, min(100.0, score)), 1)
    passed = is_sharp and not has_excessive_glare and resolution_ok

    if passed:
        feedback = "Optical quality verified. Clarity and lighting meet standards."
    else:
        feedback = "Quality warning: " + "; ".join(feedback_points) + ". Re-scan recommended if verification is inconclusive."

    return {
        "passed": passed,
        "quality_score": quality_score,
        "blur_metric": round(lap_var, 1),
        "blur_status": blur_status,
        "glare_percentage": glare_pct,
        "glare_status": glare_status,
        "resolution": resolution_str,
        "resolution_ok": resolution_ok,
        "feedback": feedback,
    }
