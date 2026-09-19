"""
ForgeProof Module 1: OCR Extraction & Document Layout Parser
Conforms to PDD Section 6.1 (Module 1 — OCR Extraction).
Extracts structured fields from Passports, Indian Aadhaar Cards, PAN Cards,
Driving Licences, and International Visas.
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime


def parse_mrz_td3(lines: List[str]) -> Dict[str, Any]:
    """
    Parses ICAO Doc 9303 TD3 standard MRZ lines (Passports: 2 lines x 44 characters).
    """
    if len(lines) < 2:
        return {"all_checks_passed": False, "error": "Insufficient MRZ lines for TD3"}

    line1 = lines[0].strip().upper().replace(" ", "")
    line2 = lines[1].strip().upper().replace(" ", "")

    line1 = (line1 + "<" * 44)[:44]
    line2 = (line2 + "<" * 44)[:44]

    doc_code = line1[0:2].replace("<", "")
    issuing_country = line1[2:5].replace("<", "")
    name_section = line1[5:44]

    if "<<" in name_section:
        parts = name_section.split("<<", 1)
        last_name = parts[0].replace("<", " ").strip()
        first_name = parts[1].replace("<", " ").strip()
    else:
        last_name = name_section.replace("<", " ").strip()
        first_name = ""

    doc_number = line2[0:9].replace("<", "")
    doc_number_check = line2[9]
    nationality = line2[10:13].replace("<", "")
    dob = line2[13:19]
    dob_check = line2[19]
    gender = line2[20].replace("<", "U")
    expiry = line2[21:27]
    expiry_check = line2[27]
    personal_number = line2[28:42].replace("<", "")
    composite_check = line2[43]

    # Convert YYMMDD to readable formatted date
    def format_mrz_date(d_str: str) -> str:
        if len(d_str) != 6 or not d_str.isdigit():
            return d_str
        yy, mm, dd = int(d_str[:2]), int(d_str[2:4]), int(d_str[4:6])
        current_year_2digit = datetime.now().year % 100
        century = 1900 if yy > current_year_2digit + 10 else 2000
        return f"{dd:02d}/{mm:02d}/{century + yy}"

    formatted_dob = format_mrz_date(dob)
    formatted_expiry = format_mrz_date(expiry)

    # Check expiration against current date
    is_expired = False
    try:
        if len(expiry) == 6 and expiry.isdigit():
            exp_yy, exp_mm, exp_dd = int(expiry[:2]), int(expiry[2:4]), int(expiry[4:6])
            exp_full_year = 2000 + exp_yy
            exp_date = datetime(exp_full_year, exp_mm, exp_dd)
            is_expired = exp_date < datetime.now()
    except Exception:
        pass

    return {
        "format": "TD3",
        "raw_lines": [line1, line2],
        "doc_code": doc_code,
        "issuing_country": issuing_country,
        "last_name": last_name,
        "first_name": first_name,
        "full_name": f"{first_name} {last_name}".strip(),
        "doc_number": doc_number,
        "doc_number_check": doc_number_check,
        "nationality": nationality,
        "dob": formatted_dob,
        "dob_raw": dob,
        "dob_check": dob_check,
        "gender": gender,
        "expiry": formatted_expiry,
        "expiry_raw": expiry,
        "expiry_check": expiry_check,
        "personal_number": personal_number,
        "composite_check": composite_check,
        "is_expired": is_expired,
    }


def parse_mrz_td1(lines: List[str]) -> Dict[str, Any]:
    """
    Parses ICAO Doc 9303 TD1 standard MRZ lines (ID Cards: 3 lines x 30 characters).
    """
    if len(lines) < 3:
        return {"all_checks_passed": False, "error": "Insufficient MRZ lines for TD1"}

    line1 = (lines[0].strip().upper().replace(" ", "") + "<" * 30)[:30]
    line2 = (lines[1].strip().upper().replace(" ", "") + "<" * 30)[:30]
    line3 = (lines[2].strip().upper().replace(" ", "") + "<" * 30)[:30]

    doc_code = line1[0:2].replace("<", "")
    issuing_country = line1[2:5].replace("<", "")
    doc_number = line1[5:14].replace("<", "")
    doc_number_check = line1[14]

    dob = line2[0:6]
    dob_check = line2[6]
    gender = line2[7].replace("<", "U")
    expiry = line2[8:14]
    expiry_check = line2[14]
    nationality = line2[15:18].replace("<", "")

    name_section = line3[0:30]
    if "<<" in name_section:
        parts = name_section.split("<<", 1)
        last_name = parts[0].replace("<", " ").strip()
        first_name = parts[1].replace("<", " ").strip()
    else:
        last_name = name_section.replace("<", " ").strip()
        first_name = ""

    return {
        "format": "TD1",
        "raw_lines": [line1, line2, line3],
        "doc_code": doc_code,
        "issuing_country": issuing_country,
        "doc_number": doc_number,
        "doc_number_check": doc_number_check,
        "nationality": nationality,
        "dob_raw": dob,
        "dob_check": dob_check,
        "gender": gender,
        "expiry_raw": expiry,
        "expiry_check": expiry_check,
        "last_name": last_name,
        "first_name": first_name,
        "full_name": f"{first_name} {last_name}".strip(),
    }


def extract_document_fields(doc_type: str, custom_viz: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Extracts structured field data based on document archetype.
    Supports Passports, Aadhaar, PAN Cards, Driving Licences, and Visas.
    """
    doc_type_upper = (doc_type or "PASSPORT").upper()

    if "AADHAAR" in doc_type_upper:
        default_viz = {
            "doc_number": "4921 7840 3927",
            "full_name": "ROHIT SHARMA",
            "dob": "15/08/1994",
            "gender": "Male",
            "issuing_authority": "Unique Identification Authority of India (UIDAI)",
            "nationality": "INDIAN",
        }
    elif "PAN" in doc_type_upper:
        default_viz = {
            "doc_number": "ABCPS1234F",
            "full_name": "ROHIT SHARMA",
            "dob": "15/08/1994",
            "gender": "Male",
            "issuing_authority": "Income Tax Department (Govt of India)",
            "nationality": "INDIAN",
        }
    elif "VISA" in doc_type_upper:
        default_viz = {
            "doc_number": "V8391024",
            "full_name": "SHARMA, ROHIT",
            "nationality": "INDIAN",
            "dob": "15/08/1994",
            "expiry_date": "01/07/2026",
            "issuing_authority": "Ministry of External Affairs",
            "visa_type": "TOURIST (T)",
        }
    elif "LICENCE" in doc_type_upper or "DL" in doc_type_upper:
        default_viz = {
            "doc_number": "DL-0420110012345",
            "full_name": "ROHIT SHARMA",
            "dob": "15/08/1994",
            "gender": "Male",
            "issuing_authority": "Transport Department, Government of Delhi",
            "nationality": "INDIAN",
        }
    else: # Default: Indian Passport
        default_viz = {
            "doc_number": "Z4829103",
            "full_name": "ROHIT SHARMA",
            "first_name": "ROHIT",
            "last_name": "SHARMA",
            "nationality": "INDIAN",
            "dob": "15/08/1994",
            "expiry_date": "09/01/2031",
            "gender": "M",
            "issuing_authority": "GOVERNMENT OF INDIA",
            "place_of_issue": "NEW DELHI",
        }

    if custom_viz:
        default_viz.update(custom_viz)

    return default_viz

_GLOBAL_EASYOCR_READER = None

def get_easyocr_reader():
    """Singleton getter for EasyOCR reader instance to avoid model re-initialization lag."""
    global _GLOBAL_EASYOCR_READER
    if _GLOBAL_EASYOCR_READER is None:
        try:
            import easyocr
            _GLOBAL_EASYOCR_READER = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            print(f"EasyOCR initialization warning: {e}")
    return _GLOBAL_EASYOCR_READER


def extract_document_fields_real(doc_path: str, doc_type: str) -> Dict[str, Any]:
    """
    Production-grade structured field extraction from document image using EasyOCR.
    Handles Passports (MRZ), Aadhaar, PAN Cards, and Driving Licences dynamically without hardcoding.
    """
    doc_type_upper = (doc_type or "PASSPORT").upper()
    reader = get_easyocr_reader()

    if reader is None:
        return {
            "doc_number": "Unreadable",
            "full_name": "Optical Engine Offline",
            "error": "EasyOCR engine not available"
        }

    try:
        import gc
        try:
            import torch
            with torch.no_grad():
                result = reader.readtext(doc_path, detail=0, paragraph=False)
        except Exception:
            result = reader.readtext(doc_path, detail=0, paragraph=False)
        gc.collect()

        full_text = " ".join(result)
        raw_lines = [r.strip() for r in result if r.strip()]

        # ---------------------------------------------------------------------
        # AADHAAR CARD
        # ---------------------------------------------------------------------
        if "AADHAAR" in doc_type_upper:
            # Match 12 digits: XXXX XXXX XXXX or XXXXXXXXXXXX
            aadhaar_match = re.search(r'\b\d{4}\s*\d{4}\s*\d{4}\b', full_text)
            if not aadhaar_match:
                # Try finding any 12 digit sequence
                clean_digits = re.sub(r'[^\d]', '', full_text)
                aadhaar_match = re.search(r'\b\d{12}\b', clean_digits)

            doc_num = aadhaar_match.group(0).strip() if aadhaar_match else "Unreadable"

            # DOB DD/MM/YYYY
            dob_match = re.search(r'\b\d{2}/\d{2}/\d{4}\b', full_text)
            dob = dob_match.group(0) if dob_match else "Unreadable"

            # Gender
            gender_match = re.search(r'\b(Male|Female|Transgender)\b', full_text, re.IGNORECASE)
            gender = gender_match.group(0).capitalize() if gender_match else "Unreadable"

            # Name extraction: anchor on DOB line and search candidate lines strictly above it
            dob_idx = -1
            for idx, line in enumerate(raw_lines):
                if (
                    re.search(r'\b\d{2}/\d{2}/\d{4}\b', line) or
                    any(k in line.upper() for k in ["DOB", "DATE OF BIRTH", "YEAR OF BIRTH", "YOB", "/ OB", "BIRTH"])
                ):
                    dob_idx = idx
                    break

            search_lines = raw_lines[:dob_idx] if dob_idx != -1 else raw_lines
            EXCLUDE_KEYWORDS = {
                "GOVERNMENT", "INDIA", "UIDAI", "ENROLMENT", "HELP", "BHARAT",
                "AADHAAR", "AUTHORITY", "UNIQUE", "IDENTIFICATION", "MERA", "PEHCHAN",
                "STATE", "REPUBLIC", "ISSUE", "DATE"
            }

            scored_candidates = []
            for line in search_lines:
                cand = line.strip()
                if not cand or any(c.isdigit() for c in cand):
                    continue

                clean_cand = re.sub(r'[^a-zA-Z\s]', '', cand).strip()
                if len(clean_cand) < 3:
                    continue

                upper_cand = clean_cand.upper()
                if any(ex in upper_cand for ex in EXCLUDE_KEYWORDS):
                    continue

                words = [w for w in clean_cand.split() if len(w) >= 2]
                if not words:
                    continue

                score = 0
                if len(words) >= 2:
                    score += 15
                elif len(words) == 1 and len(words[0]) >= 4:
                    score += 5

                if cand.istitle() or cand.isupper():
                    score += 5

                if any(v in clean_cand.lower() for v in "aeiou"):
                    score += 3

                scored_candidates.append((score, clean_cand))

            name = "Unreadable"
            if scored_candidates:
                scored_candidates.sort(key=lambda x: x[0], reverse=True)
                name = scored_candidates[0][1]

            return {
                "doc_number": doc_num,
                "full_name": name,
                "dob": dob,
                "gender": gender,
                "issuing_authority": "Unique Identification Authority of India (UIDAI)",
                "raw_text_summary": full_text[:250]
            }

        # ---------------------------------------------------------------------
        # PAN CARD
        # ---------------------------------------------------------------------
        elif "PAN" in doc_type_upper:
            # 10 character pattern: 5 letters + 4 numbers + 1 letter
            pan_match = re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', full_text.upper())
            pan_num = pan_match.group(0) if pan_match else "Unreadable"

            dob_match = re.search(r'\b\d{2}/\d{2}/\d{4}\b', full_text)
            dob = dob_match.group(0) if dob_match else "Unreadable"

            name = "Unreadable"
            for line in raw_lines:
                clean_line = line.strip().upper()
                if (
                    len(clean_line) > 4 and 
                    clean_line.replace(" ", "").isalpha() and 
                    not any(w in clean_line for w in ["INCOME", "TAX", "DEPARTMENT", "GOVT", "INDIA", "PERMANENT", "ACCOUNT", "CARD"])
                ):
                    name = line.strip()
                    break

            return {
                "doc_number": pan_num,
                "full_name": name,
                "dob": dob,
                "issuing_authority": "Income Tax Department (Govt of India)",
                "raw_text_summary": full_text[:250]
            }

        # ---------------------------------------------------------------------
        # DRIVING LICENCE
        # ---------------------------------------------------------------------
        elif "LICENCE" in doc_type_upper or "DL" in doc_type_upper:
            # MoRTH format: 2-letter state code + numbers
            dl_match = re.search(r'\b[A-Z]{2}[-0-9\s]{11,17}\b', full_text.upper())
            dl_num = dl_match.group(0).strip() if dl_match else "Unreadable"

            dob_match = re.search(r'\b\d{2}/\d{2}/\d{4}\b', full_text)
            dob = dob_match.group(0) if dob_match else "Unreadable"

            name = "Unreadable"
            for line in raw_lines:
                clean_line = line.strip().upper()
                if (
                    len(clean_line) > 4 and 
                    clean_line.replace(" ", "").isalpha() and 
                    not any(w in clean_line for w in ["DRIVING", "LICENCE", "UNION", "INDIA", "TRANSPORT", "AUTHORITY"])
                ):
                    name = line.strip()
                    break

            return {
                "doc_number": dl_num,
                "full_name": name,
                "dob": dob,
                "issuing_authority": "Ministry of Road Transport & Highways (MoRTH)",
                "raw_text_summary": full_text[:250]
            }

        # ---------------------------------------------------------------------
        # PASSPORT (ICAO Doc 9303 MRZ + VIZ)
        # ---------------------------------------------------------------------
        else:
            # Look for 44-character MRZ lines
            mrz_candidates = [
                line.replace(" ", "").upper() for line in raw_lines 
                if ("<" in line and len(line.replace(" ", "")) >= 28)
            ]

            parsed_mrz = None
            if len(mrz_candidates) >= 2:
                # Find line starting with P
                p_lines = [l for l in mrz_candidates if l.startswith("P")]
                other_lines = [l for l in mrz_candidates if not l.startswith("P")]
                if p_lines and other_lines:
                    parsed_mrz = parse_mrz_td3([p_lines[0], other_lines[0]])

            # Document number regex (1 letter + 7 digits)
            doc_num_match = re.search(r'\b[A-Z][0-9]{7}\b', full_text.upper())
            doc_num = (parsed_mrz or {}).get("doc_number") or (doc_num_match.group(0) if doc_num_match else "Unreadable")
            full_name = (parsed_mrz or {}).get("full_name") or "Unreadable"

            return {
                "doc_number": doc_num,
                "full_name": full_name,
                "mrz": parsed_mrz,
                "raw_mrz_lines": mrz_candidates,
                "issuing_authority": "GOVERNMENT OF INDIA",
                "raw_text_summary": full_text[:250]
            }

    except Exception as e:
        print(f"Dynamic OCR Extraction Error: {e}")
        return {
            "doc_number": "Unreadable",
            "full_name": "Unreadable (Low Optical Quality)",
            "error": str(e)
        }
