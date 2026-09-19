"""
ForgeProof Image Preprocessor
Normalizes orientation, scale, and color profile of incoming captures.
Preserves forensic fidelity while ensuring consistent image processing pipeline inputs.
"""

import os
from pathlib import Path
from typing import Tuple, Optional
import cv2
import numpy as np
from PIL import Image, ImageOps

from app.config import MAX_IMAGE_DIMENSION, IMAGE_JPEG_QUALITY


def preprocess_image(input_path: str, output_path: Optional[str] = None) -> Tuple[str, int, int]:
    """
    Standardizes image orientation via EXIF tags and limits excessive resolution
    while retaining high-frequency details needed for ELA and biometric matching.
    
    Returns:
        (processed_path, width, height)
    """
    out_file = output_path or input_path
    
    try:
        # Step 1: Open with PIL to handle EXIF orientation tags automatically
        pil_img = Image.open(input_path)
        pil_img = ImageOps.exif_transpose(pil_img)
        
        # Convert to RGB (removes RGBA transparency or CMYK)
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
            
        w, h = pil_img.size
        
        # Step 2: Scale down only if image exceeds maximum configured dimension
        if max(w, h) > MAX_IMAGE_DIMENSION:
            scale = MAX_IMAGE_DIMENSION / max(w, h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            w, h = new_w, new_h
            
        # Step 3: Save to target path with standard JPEG quality
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        pil_img.save(out_file, "JPEG", quality=IMAGE_JPEG_QUALITY)
        return out_file, w, h
        
    except Exception as e:
        # Fallback to OpenCV if PIL encounters an issue
        try:
            cv_img = cv2.imread(input_path)
            if cv_img is not None:
                h, w = cv_img.shape[:2]
                if max(w, h) > MAX_IMAGE_DIMENSION:
                    scale = MAX_IMAGE_DIMENSION / max(w, h)
                    cv_img = cv2.resize(cv_img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
                    h, w = cv_img.shape[:2]
                cv2.imwrite(out_file, cv_img, [cv2.IMWRITE_JPEG_QUALITY, IMAGE_JPEG_QUALITY])
                return out_file, w, h
        except Exception:
            pass
        return input_path, 0, 0
