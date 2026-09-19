"""
High-Fidelity Sample Document & Identity Generator (SIH 2026 Showcase)
Generates realistic Indian Passports, Aadhaar Cards, Visas, and Face Photos using photorealistic portraits.
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from typing import Dict, Any

from app.modules.mrz_engine import compute_check_digit
from app.modules.indian_id_engine import compute_verhoeff_check_digit

def draw_guilloche(draw: ImageDraw.ImageDraw, width: int, height: int, color=(215, 228, 242)):
    for y in range(40, height - 40, 25):
        points = []
        for x in range(20, width - 20, 15):
            wave_y = y + int(7 * np.sin(x * 0.04) + 3 * np.cos(x * 0.02))
            points.append((x, wave_y))
        draw.line(points, fill=color, width=1)

def draw_ashoka_emblem(draw: ImageDraw.ImageDraw, x: int, y: int, size: int = 40):
    draw.ellipse([x - size//2, y - size//2, x + size//2, y + size//2], outline=(150, 130, 80), width=2)
    for angle in range(0, 360, 30):
        rad = np.radians(angle)
        ex = x + int((size//2 - 4) * np.cos(rad))
        ey = y + int((size//2 - 4) * np.sin(rad))
        draw.line([(x, y), (ex, ey)], fill=(180, 160, 100), width=1)
    draw.rectangle([x - size//3, y + size//4, x + size//3, y + size//2 + 5], fill=(160, 140, 90))

def draw_official_stamp(draw: ImageDraw.ImageDraw, x: int, y: int, is_forged: bool = False):
    color = (90, 40, 140) if not is_forged else (130, 30, 170)
    if not is_forged:
        draw.ellipse([x-70, y-45, x+70, y+45], outline=color, width=3)
        draw.ellipse([x-64, y-39, x+64, y+39], outline=color, width=1)
        draw.text((x-55, y-25), "IMMIGRATION", fill=color)
        draw.text((x-45, y-10), "DELHI AIRPORT", fill=color)
        draw.text((x-38, y+5), "12 JAN 2026", fill=color)
        draw.text((x-48, y+20), "ENTRY - PERMITTED", fill=color)
    else:
        # Forged stamp has irregular wobble and jagged cut lines
        wobble_box = [x-72, y-48, x+68, y+42]
        draw.ellipse(wobble_box, outline=color, width=4)
        draw.text((x-55, y-20), "IMMIGRATION", fill=color)
        draw.text((x-40, y-2), "DELHI AIRPORT", fill=color)
        draw.text((x-35, y+14), "05 MAY 2026", fill=color)

def generate_all_samples(output_dir: str) -> Dict[str, str]:
    os.makedirs(output_dir, exist_ok=True)
    generated_paths = {}

    # Load photorealistic base portraits
    portraits_dir = os.path.join(output_dir, "portraits")
    rohit_base_path = os.path.join(portraits_dir, "rohit_base.jpg")
    impersonator_base_path = os.path.join(portraits_dir, "impersonator_base.jpg")
    
    face_rohit = Image.open(rohit_base_path).convert("RGB")
    face_impersonator = Image.open(impersonator_base_path).convert("RGB")

    # Presenter live photos (with slight webcam simulation)
    rohit_live = face_rohit.resize((480, 480))
    impersonator_live = face_impersonator.resize((480, 480))

    rohit_live_path = os.path.join(output_dir, "presenter_rohit_matching.jpg")
    impersonator_live_path = os.path.join(output_dir, "presenter_impersonator_mismatch.jpg")
    rohit_live.save(rohit_live_path, "JPEG", quality=95)
    impersonator_live.save(impersonator_live_path, "JPEG", quality=95)
    generated_paths["presenter_matching"] = rohit_live_path
    generated_paths["presenter_impersonator"] = impersonator_live_path

    # Crop to 3:4 passport aspect ratio
    rohit_passport_crop = face_rohit.resize((160, 200))
    impersonator_passport_crop = face_impersonator.resize((160, 200))

    # =========================================================================
    # 1. SCENARIO 1: GENUINE INDIAN PASSPORT
    # =========================================================================
    doc_w, doc_h = 750, 520
    p1 = Image.new("RGB", (doc_w, doc_h), (248, 250, 252))
    d1 = ImageDraw.Draw(p1)
    
    d1.rectangle([10, 10, doc_w - 10, doc_h - 10], outline=(30, 55, 90), width=3)
    d1.rectangle([16, 16, doc_w - 16, doc_h - 16], outline=(190, 165, 100), width=1)
    draw_guilloche(d1, doc_w, doc_h)
    
    d1.text((320, 25), "भारत गणराज्य / REPUBLIC OF INDIA", fill=(20, 45, 80))
    d1.text((370, 45), "पासपोर्ट / PASSPORT", fill=(170, 130, 40))
    draw_ashoka_emblem(d1, 280, 45, size=35)
    
    d1.text((220, 80), "Type / प्ररूप: P", fill=(30, 30, 30))
    d1.text((360, 80), "Country Code: IND", fill=(30, 30, 30))
    d1.text((510, 80), "Passport No: Z4829103", fill=(180, 20, 20))
    
    # Paste Genuine Portrait
    p1.paste(rohit_passport_crop, (40, 100))
    d1.rectangle([39, 99, 40 + 160, 100 + 200], outline=(100, 120, 150), width=2)
    
    fields_y = 115
    d1.text((220, fields_y), "Surname / उपनाम:", fill=(100, 100, 100))
    d1.text((220, fields_y + 16), "SHARMA", fill=(10, 20, 40))
    
    d1.text((220, fields_y + 40), "Given Name(s) / दिया गया नाम:", fill=(100, 100, 100))
    d1.text((220, fields_y + 56), "ROHIT", fill=(10, 20, 40))
    
    d1.text((220, fields_y + 80), "Nationality / राष्ट्रीयता:", fill=(100, 100, 100))
    d1.text((220, fields_y + 96), "INDIAN", fill=(10, 20, 40))
    
    d1.text((380, fields_y + 80), "Sex / लिंग:", fill=(100, 100, 100))
    d1.text((380, fields_y + 96), "M", fill=(10, 20, 40))
    
    d1.text((460, fields_y + 80), "Date of Birth / जन्म तिथि:", fill=(100, 100, 100))
    d1.text((460, fields_y + 96), "15/08/1994", fill=(10, 20, 40))
    
    d1.text((220, fields_y + 120), "Place of Issue / जारी करने का स्थान:", fill=(100, 100, 100))
    d1.text((220, fields_y + 136), "NEW DELHI", fill=(10, 20, 40))
    
    d1.text((220, fields_y + 160), "Date of Issue / जारी करने की तिथि:", fill=(100, 100, 100))
    d1.text((220, fields_y + 176), "10/01/2021", fill=(10, 20, 40))
    
    d1.text((460, fields_y + 160), "Date of Expiry / समाप्ति की तिथि:", fill=(100, 100, 100))
    d1.text((460, fields_y + 176), "09/01/2031", fill=(10, 20, 40))
    
    draw_official_stamp(d1, 620, 220, is_forged=False)
    
    # MRZ TD3 with exact 7-3-1 ICAO 9303 check digits:
    # doc (Z4829103) -> 6
    # dob (940815) -> 9
    # exp (310109) -> 0
    # comp -> 4
    mrz_l1 = "P<INDSHARMA<<ROHIT<<<<<<<<<<<<<<<<<<<<<<<<<"
    mrz_l2 = "Z4829103<6IND9408159M3101090<<<<<<<<<<<<<<<4"
    
    d1.rectangle([20, 420, doc_w - 20, doc_h - 25], fill=(235, 238, 242), outline=(180, 190, 205))
    d1.text((35, 435), mrz_l1, fill=(20, 20, 20))
    d1.text((35, 465), mrz_l2, fill=(20, 20, 20))
    
    p1_path = os.path.join(output_dir, "scenario1_genuine_indian_passport.jpg")
    p1.save(p1_path, "JPEG", quality=95)
    generated_paths["genuine_passport"] = p1_path

    # =========================================================================
    # 2. SCENARIO 2: TAMPERED INDIAN PASSPORT (PHOTO SPLICING ATTACK)
    # =========================================================================
    p2 = p1.copy()
    d2 = ImageDraw.Draw(p2)
    # Paste impersonator portrait over photo box with a visible cut seam
    p2.paste(impersonator_passport_crop, (40, 100))
    d2.rectangle([38, 98, 40 + 162, 100 + 202], outline=(180, 50, 50), width=2)
    d2.rectangle([41, 101, 40 + 159, 100 + 199], outline=(250, 200, 200), width=1)
    
    p2_path = os.path.join(output_dir, "scenario2_tampered_photo_splice.jpg")
    p2.save(p2_path, "JPEG", quality=82)
    generated_paths["photo_splice"] = p2_path

    # =========================================================================
    # 3. SCENARIO 3: TAMPERED DATE & BROKEN MRZ CHECKSUM
    # =========================================================================
    p3 = p1.copy()
    d3 = ImageDraw.Draw(p3)
    d3.rectangle([455, fields_y + 174, 560, fields_y + 192], fill=(245, 248, 252))
    d3.text((460, fields_y + 176), "09/01/2036", fill=(180, 20, 20))
    
    corrupted_mrz_l2 = f"Z4829103<9IND9408154M3601095<<<<<<<<<<<<<<<4"
    d3.rectangle([25, 460, doc_w - 25, 490], fill=(235, 238, 242))
    d3.text((35, 465), corrupted_mrz_l2, fill=(20, 20, 20))
    
    p3_path = os.path.join(output_dir, "scenario3_tampered_date_mrz_mismatch.jpg")
    p3.save(p3_path, "JPEG", quality=90)
    generated_paths["date_fraud"] = p3_path

    # =========================================================================
    # 4. SCENARIO 4: GENUINE INDIAN AADHAAR CARD
    # =========================================================================
    aw, ah = 650, 420
    a1 = Image.new("RGB", (aw, ah), (255, 255, 255))
    da1 = ImageDraw.Draw(a1)
    
    da1.rectangle([0, 0, aw, 8], fill=(210, 40, 40))
    da1.rectangle([0, 8, aw, 16], fill=(40, 60, 140))
    
    da1.text((160, 25), "भारत सरकार / GOVERNMENT OF INDIA", fill=(20, 30, 60))
    da1.text((140, 45), "भारतीय विशिष्ट पहचान प्राधिकरण / UIDAI", fill=(100, 100, 100))
    draw_ashoka_emblem(da1, 80, 45, size=30)
    
    aadhaar_photo = face_rohit.resize((120, 150))
    a1.paste(aadhaar_photo, (40, 95))
    da1.rectangle([39, 94, 161, 246], outline=(180, 180, 180), width=1)
    
    da1.text((180, 105), "रोहित शर्मा / Rohit Sharma", fill=(20, 20, 20))
    da1.text((180, 135), "जन्म तिथि / DOB: 15/08/1994", fill=(50, 50, 50))
    da1.text((180, 165), "पुरुष / Male", fill=(50, 50, 50))
    
    da1.rectangle([480, 95, 610, 225], outline=(40, 40, 40), width=2)
    np.random.seed(123)
    qr_grid = np.random.choice([0, 255], size=(12, 12), p=[0.45, 0.55])
    for r in range(12):
        for c in range(12):
            if qr_grid[r, c] == 0:
                da1.rectangle([490 + c*9, 105 + r*9, 490 + c*9 + 8, 105 + r*9 + 8], fill=(10, 10, 10))
                
    base_aadhaar = "49217840392"
    v_digit = compute_verhoeff_check_digit(base_aadhaar)
    valid_aadhaar_str = f"{base_aadhaar[:4]} {base_aadhaar[4:8]} {base_aadhaar[8:]}{v_digit}"
    
    da1.rectangle([30, 290, aw - 30, 350], fill=(245, 247, 250), outline=(210, 220, 230))
    da1.text((180, 310), f"आधार / Aadhaar: {valid_aadhaar_str}", fill=(180, 20, 20))
    
    da1.rectangle([0, ah - 25, aw, ah], fill=(210, 40, 40))
    da1.text((190, ah - 20), "मेरा आधार, मेरी पहचान", fill=(255, 255, 255))
    
    a1_path = os.path.join(output_dir, "scenario4_genuine_indian_aadhaar.jpg")
    a1.save(a1_path, "JPEG", quality=95)
    generated_paths["genuine_aadhaar"] = a1_path

    # =========================================================================
    # 5. SCENARIO 5: TAMPERED AADHAAR CARD
    # =========================================================================
    a2 = a1.copy()
    da2 = ImageDraw.Draw(a2)
    impersonator_aadhaar_photo = face_impersonator.resize((120, 150))
    a2.paste(impersonator_aadhaar_photo, (40, 95))
    da2.rectangle([37, 92, 163, 248], outline=(220, 30, 30), width=2)
    
    corrupted_aadhaar_str = f"{base_aadhaar[:4]} {base_aadhaar[4:8]} {base_aadhaar[8:]}9"
    da2.rectangle([30, 290, aw - 30, 350], fill=(245, 247, 250), outline=(220, 50, 50))
    da2.text((180, 310), f"आधार / Aadhaar: {corrupted_aadhaar_str}", fill=(180, 20, 20))
    
    a2_path = os.path.join(output_dir, "scenario5_tampered_aadhaar_invalid_verhoeff.jpg")
    a2.save(a2_path, "JPEG", quality=85)
    generated_paths["tampered_aadhaar"] = a2_path

    # =========================================================================
    # 6. SCENARIO 6: FORGED VISA
    # =========================================================================
    v1 = Image.new("RGB", (doc_w, doc_h), (250, 250, 245))
    dv1 = ImageDraw.Draw(v1)
    draw_guilloche(dv1, doc_w, doc_h, color=(230, 220, 235))
    
    dv1.text((280, 30), "REPUBLIC OF INDIA — VISA / वीज़ा", fill=(50, 30, 70))
    dv1.text((80, 90), "Visa No: V8391024", fill=(150, 20, 20))
    dv1.text((320, 90), "Type: TOURIST (T)", fill=(30, 30, 30))
    dv1.text((80, 130), "Name: SHARMA, ROHIT", fill=(30, 30, 30))
    dv1.text((80, 170), "Passport No: Z4829103", fill=(30, 30, 30))
    dv1.text((80, 210), "Valid From: 01/01/2026", fill=(30, 30, 30))
    dv1.text((320, 210), "Valid Until: 01/07/2026", fill=(30, 30, 30))
    
    draw_official_stamp(dv1, 550, 240, is_forged=True)
    
    v1_path = os.path.join(output_dir, "scenario6_forged_visa_stamp.jpg")
    v1.save(v1_path, "JPEG", quality=90)
    generated_paths["forged_visa"] = v1_path

    return generated_paths
