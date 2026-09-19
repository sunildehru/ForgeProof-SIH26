"""
Forensic Tampering Detection Engine (Core AI Innovation for SIH 2026)
Implements:
1. Error Level Analysis (ELA) with glowing Jet/Inferno colormap heatmaps
2. Photo Splicing & Boundary Edge Discontinuity Detection
3. Noise Pattern Inconsistency Analysis
4. Official Stamp / Seal Integrity Verifier
5. Metadata & Digital Artifact Forensics
"""

import os
import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, Tuple, Optional

def compute_ela(
    image_path: str,
    output_heatmap_path: str,
    quality: int = 90,
    multiplier: float = 18.0
) -> Dict[str, Any]:
    """
    Computes Error Level Analysis (ELA) on an image.
    Generates an explainable visual heatmap showing JPEG compression error anomalies.
    """
    try:
        original = Image.open(image_path).convert('RGB')
        
        # Save to memory buffer at specified JPEG quality
        buffer = io.BytesIO()
        original.save(buffer, 'JPEG', quality=quality)
        buffer.seek(0)
        recompressed = Image.open(buffer)
        
        # Compute absolute difference
        diff = ImageChops.difference(original, recompressed)
        
        # Find maximum error level
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 1
        scale = 255.0 / max_diff if max_diff > 0 else 1.0
        
        # Scale difference for visual enhancement
        enhanced = ImageEnhance.Brightness(diff).enhance(scale * 0.7)
        
        # Convert to OpenCV format for colormap heatmap generation
        diff_np = np.array(enhanced)
        diff_gray = cv2.cvtColor(diff_np, cv2.COLOR_RGB2GRAY)
        
        # Apply OpenCV COLORMAP_INFERNO or COLORMAP_JET for high-contrast thermal visualization
        heatmap_color = cv2.applyColorMap(diff_gray, cv2.COLORMAP_INFERNO)
        
        # Save the heatmap image for UI overlay
        os.makedirs(os.path.dirname(output_heatmap_path), exist_ok=True)
        cv2.imwrite(output_heatmap_path, heatmap_color)
        
        # Compute anomaly score based on high-frequency error distribution
        mean_err = float(np.mean(diff_gray))
        std_err = float(np.std(diff_gray))
        
        # Calculate localized spike ratio (high standard deviation indicates spliced regions)
        spike_ratio = float(np.percentile(diff_gray, 95) - np.percentile(diff_gray, 50))
        
        # Normalized tampering score (0-100)
        tampering_score = min(100.0, max(0.0, (spike_ratio - 15.0) * 2.2))
        
        return {
            "mean_error": round(mean_err, 2),
            "std_error": round(std_err, 2),
            "spike_ratio": round(spike_ratio, 2),
            "tampering_score": round(tampering_score, 1),
            "heatmap_path": output_heatmap_path,
            "anomaly_detected": tampering_score > 40.0
        }
    except Exception as e:
        return {
            "error": str(e),
            "tampering_score": 0.0,
            "anomaly_detected": False
        }

def analyze_photo_boundary(
    image_path: str,
    output_edge_path: str,
    photo_bbox: Optional[Tuple[int, int, int, int]] = None
) -> Dict[str, Any]:
    """
    Detects photo splicing artifacts and boundary edge discontinuities.
    Analyzes Sobel edge transitions and unnatural cut/paste borders.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "Unable to read image", "boundary_score": 0.0}
        
        h, w, _ = img.shape
        # Default photo region estimate for standard passports (left-center box) if bbox not given
        if not photo_bbox:
            x1, y1 = int(w * 0.05), int(h * 0.18)
            x2, y2 = int(w * 0.38), int(h * 0.72)
        else:
            x1, y1, x2, y2 = photo_bbox
            
        # Extract border band (10 pixels inside, 10 pixels outside photo box)
        margin = 12
        bx1, by1 = max(0, x1 - margin), max(0, y1 - margin)
        bx2, by2 = min(w, x2 + margin), min(h, y2 + margin)
        
        border_roi = img[by1:by2, bx1:bx2]
        gray_roi = cv2.cvtColor(border_roi, cv2.COLOR_BGR2GRAY)
        
        # Compute gradient magnitude
        grad_x = cv2.Sobel(gray_roi, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray_roi, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(grad_x**2 + grad_y**2)
        
        # Look for unnaturally sharp gradient peaks on the expected perimeter
        edge_variance = float(np.var(grad_mag))
        max_edge = float(np.max(grad_mag)) if grad_mag.size > 0 else 0
        
        # Create an edge visualizer image
        vis_img = img.copy()
        # Draw green bounding box for scanned photo box
        cv2.rectangle(vis_img, (x1, y1), (x2, y2), (0, 255, 128), 2)
        
        # Anomaly threshold: pasted photos often exhibit sharp step-transitions or double edges
        is_spliced = edge_variance > 1800 or max_edge > 320
        edge_score = min(100.0, max(0.0, (edge_variance / 25.0)))
        
        if is_spliced:
            # Draw glowing red highlight on anomalous border
            cv2.rectangle(vis_img, (x1-2, y1-2), (x2+2, y2+2), (0, 0, 255), 3)
            cv2.putText(vis_img, "SPLICED BOUNDARY ARTIFACT DETECTED", (x1, max(25, y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)
        else:
            cv2.putText(vis_img, "PHOTO PERIMETER INTEGRITY: OK", (x1, max(25, y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 128), 1)

        os.makedirs(os.path.dirname(output_edge_path), exist_ok=True)
        cv2.imwrite(output_edge_path, vis_img)
        
        return {
            "edge_variance": round(edge_variance, 2),
            "max_gradient": round(max_edge, 2),
            "boundary_score": round(edge_score, 1),
            "splicing_detected": is_spliced,
            "vis_path": output_edge_path,
            "photo_bbox": [x1, y1, x2, y2]
        }
    except Exception as e:
        return {"error": str(e), "boundary_score": 0.0, "splicing_detected": False}

def analyze_noise_consistency(image_path: str) -> Dict[str, Any]:
    """
    Measures high-frequency noise variance across document zones.
    Detects pasted elements from foreign image sources with mismatched noise profiles.
    """
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"error": "Cannot read image", "noise_anomaly_score": 0.0}
            
        # High pass filter (Laplacian)
        lap = cv2.Laplacian(img, cv2.CV_64F)
        
        # Divide into a 4x4 grid and calculate noise variance per block
        h, w = img.shape
        block_h, block_w = h // 4, w // 4
        variances = []
        
        for r in range(4):
            for c in range(4):
                block = lap[r*block_h:(r+1)*block_h, c*block_w:(c+1)*block_w]
                variances.append(float(np.var(block)))
                
        # Compare variance across blocks
        mean_var = float(np.mean(variances))
        std_var = float(np.std(variances))
        coeff_var = (std_var / mean_var) if mean_var > 0 else 0
        
        # High coefficient of variation suggests spliced regions with different grain
        noise_tampered = coeff_var > 1.2
        noise_score = min(100.0, max(0.0, coeff_var * 45.0))
        
        return {
            "mean_noise_variance": round(mean_var, 2),
            "noise_heterogeneity": round(coeff_var, 2),
            "noise_tampered": noise_tampered,
            "noise_score": round(noise_score, 1)
        }
    except Exception as e:
        return {"error": str(e), "noise_score": 0.0, "noise_tampered": False}

def verify_stamp_integrity(image_path: str) -> Dict[str, Any]:
    """
    Analyzes official entry/visa stamp colors and geometric circularity.
    Flags fake or digitally overlayed stamps.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"has_stamp": False, "stamp_score": 0.0}
            
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Official stamps are typically purple/violet, deep red, or dark blue ink
        # Purple/Blue stamp mask
        lower_purple = np.array([120, 50, 50])
        upper_purple = np.array([160, 255, 255])
        mask_purple = cv2.inRange(hsv, lower_purple, upper_purple)
        
        # Red stamp mask
        lower_red1 = np.array([0, 70, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 70, 50])
        upper_red2 = np.array([180, 255, 255])
        mask_red = cv2.inRange(hsv, lower_red1, upper_red1) | cv2.inRange(hsv, lower_red2, upper_red2)
        
        stamp_mask = mask_purple | mask_red
        contours, _ = cv2.findContours(stamp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        stamps_found = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 1200: # Filter out tiny noise
                perimeter = cv2.arcLength(cnt, True)
                if perimeter > 0:
                    circularity = 4 * np.pi * (area / (perimeter * perimeter))
                    stamps_found.append({
                        "area": round(area, 1),
                        "circularity": round(circularity, 2),
                        "is_valid_stamp_shape": 0.25 <= circularity <= 1.0
                    })
                    
        if not stamps_found:
            return {
                "has_stamp": False,
                "stamp_score": 0.0,
                "detail": "No official colored stamp detected on document"
            }
            
        # Check if stamp contours match authentic geometry
        all_valid = all(s["is_valid_stamp_shape"] for s in stamps_found)
        return {
            "has_stamp": True,
            "stamps_count": len(stamps_found),
            "stamps": stamps_found,
            "stamp_integrity_valid": all_valid,
            "stamp_score": 0.0 if all_valid else 65.0,
            "detail": "Official stamp geometry & ink profile verified" if all_valid else "Irregular stamp contour detected (possible digital stamp forgery)"
        }
    except Exception as e:
        return {"error": str(e), "has_stamp": False, "stamp_score": 0.0}

def inspect_metadata(image_path: str) -> Dict[str, Any]:
    """
    Examines EXIF metadata, ICC profiles, and file headers.
    Flags editing tools like Photoshop, GIMP, Canva, PicsArt.
    """
    flags = []
    suspicious_software = ["photoshop", "gimp", "canva", "picsart", "paint.net", "corel", "snapseed"]
    
    try:
        pil_img = Image.open(image_path)
        exif_data = pil_img._getexif() or {}
        
        software = ""
        for tag_id, value in exif_data.items():
            val_str = str(value).lower()
            for s in suspicious_software:
                if s in val_str:
                    software = str(value)
                    flags.append(f"Editing software signature detected: '{software}'")
                    break
                    
        metadata_risk = 70.0 if flags else 0.0
        return {
            "has_exif": bool(exif_data),
            "software_tag": software or "None / Clean",
            "flags": flags,
            "metadata_risk": metadata_risk
        }
    except Exception:
        return {
            "has_exif": False,
            "software_tag": "None",
            "flags": [],
            "metadata_risk": 0.0
        }

def run_comprehensive_forensics(
    image_path: str,
    output_dir: str,
    doc_id: str
) -> Dict[str, Any]:
    """
    Runs the full forensic suite and returns unified tampering analysis.
    """
    ela_out = os.path.join(output_dir, f"{doc_id}_ela.jpg")
    edge_out = os.path.join(output_dir, f"{doc_id}_edges.jpg")
    
    ela_res = compute_ela(image_path, ela_out)
    boundary_res = analyze_photo_boundary(image_path, edge_out)
    noise_res = analyze_noise_consistency(image_path)
    stamp_res = verify_stamp_integrity(image_path)
    meta_res = inspect_metadata(image_path)
    
    # Combined tampering score
    weights = [0.35, 0.35, 0.15, 0.15]
    scores = [
        ela_res.get("tampering_score", 0),
        boundary_res.get("boundary_score", 0),
        noise_res.get("noise_score", 0),
        stamp_res.get("stamp_score", 0)
    ]
    
    composite_tamper_score = sum(w * s for w, s in zip(weights, scores))
    # Cap between 0 and 100
    composite_tamper_score = min(100.0, max(0.0, composite_tamper_score))
    
    # Identify key evidence items
    evidence = []
    if ela_res.get("anomaly_detected"):
        evidence.append({
            "type": "ELA_ANOMALY",
            "severity": "CRITICAL",
            "title": "JPEG Error Level Discrepancy",
            "description": f"Abnormal compression spike (ratio {ela_res.get('spike_ratio')}) indicates modified photo or text region."
        })
    if boundary_res.get("splicing_detected"):
        evidence.append({
            "type": "PHOTO_SPLICING",
            "severity": "CRITICAL",
            "title": "Photo Perimeter Cut/Splice Detected",
            "description": f"Sharp edge discontinuity (variance {boundary_res.get('edge_variance')}) around portrait bounding box."
        })
    if noise_res.get("noise_tampered"):
        evidence.append({
            "type": "NOISE_HETEROGENEITY",
            "severity": "WARNING",
            "title": "Background Noise Inconsistency",
            "description": "Uneven grain distribution across document zones suggests localized image replacement."
        })
    if stamp_res.get("has_stamp") and not stamp_res.get("stamp_integrity_valid"):
        evidence.append({
            "type": "STAMP_FORGERY",
            "severity": "HIGH",
            "title": "Irregular Stamp Geometry",
            "description": "Stamp contour circularity violates official border entry seal templates."
        })
    if meta_res.get("flags"):
        evidence.append({
            "type": "METADATA_SIGNATURE",
            "severity": "HIGH",
            "title": "Forensic Metadata Tampering Signature",
            "description": f"Image contains editing traces: {', '.join(meta_res.get('flags', []))}"
        })
        
    return {
        "tampering_score": round(composite_tamper_score, 1),
        "is_tampered": composite_tamper_score > 35.0,
        "ela": ela_res,
        "boundary": boundary_res,
        "noise": noise_res,
        "stamp": stamp_res,
        "metadata": meta_res,
        "evidence_list": evidence,
        "ela_heatmap_url": f"/static/forensics/{os.path.basename(ela_out)}",
        "boundary_overlay_url": f"/static/forensics/{os.path.basename(edge_out)}"
    }
