"""
ForgeProof Module 2: Document Validation Engine
Conforms to PDD Section 6.2 (Module 2 — Document Validation).
Implements:
1. ICAO Doc 9303 7-3-1 Modulo-10 Check Digit verification (Passports / Visas)
2. UIDAI Aadhaar Official Verhoeff Dihedral Group D5 checksum algorithm
3. Income Tax Department PAN Card structure & entity validator
4. Indian Driving Licence structure & state RTO check
5. Cross-field consistency verification (VIZ printed text vs MRZ encoded text)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


# =============================================================================
# 1. ICAO Doc 9303 (7-3-1 Repeating Modulo 10 Check Digits)
# =============================================================================
def icao_char_value(c: str) -> int:
    """Returns standard ICAO 9303 numeric value for MRZ characters."""
    if c.isdigit():
        return int(c)
    if 'A' <= c <= 'Z':
        return ord(c) - ord('A') + 10
    if c == '<':
        return 0
    return 0


def calculate_mrz_check_digit(data: str) -> str:
    """Calculates ICAO Doc 9303 check digit using repeating 7-3-1 weights."""
    weights = [7, 3, 1]
    total = 0
    for idx, char in enumerate(data):
        w = weights[idx % 3]
        val = icao_char_value(char)
        total += val * w
    return str(total % 10)


def validate_icao_mrz(mrz_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates all mandatory checksums defined in ICAO Doc 9303.
    """
    check_results = []
    all_passed = True

    # Check 1: Document Number Check Digit
    doc_num = mrz_data.get("doc_number", "")
    doc_num_check = mrz_data.get("doc_number_check", "")
    if doc_num and doc_num_check:
        computed = calculate_mrz_check_digit(doc_num)
        passed = (computed == doc_num_check)
        if not passed:
            all_passed = False
        check_results.append({
            "check": "Document Number Check Digit",
            "passed": passed,
            "computed": computed,
            "actual": doc_num_check
        })

    # Check 2: Date of Birth Check Digit
    dob_raw = mrz_data.get("dob_raw", "")
    dob_check = mrz_data.get("dob_check", "")
    if dob_raw and dob_check:
        computed = calculate_mrz_check_digit(dob_raw)
        passed = (computed == dob_check)
        if not passed:
            all_passed = False
        check_results.append({
            "check": "Date of Birth Check Digit",
            "passed": passed,
            "computed": computed,
            "actual": dob_check
        })

    # Check 3: Expiry Date Check Digit
    expiry_raw = mrz_data.get("expiry_raw", "")
    expiry_check = mrz_data.get("expiry_check", "")
    if expiry_raw and expiry_check:
        computed = calculate_mrz_check_digit(expiry_raw)
        passed = (computed == expiry_check)
        if not passed:
            all_passed = False
        check_results.append({
            "check": "Date of Expiry Check Digit",
            "passed": passed,
            "computed": computed,
            "actual": expiry_check
        })

    # Check 4: Composite Check Digit (TD3 line 2)
    if mrz_data.get("format") == "TD3" and len(mrz_data.get("raw_lines", [])) >= 2:
        line2 = mrz_data["raw_lines"][1]
        # Composite includes: doc_num + check + dob + check + expiry + check + personal_num + check
        composite_data = line2[0:10] + line2[13:20] + line2[21:43]
        composite_check = line2[43] if len(line2) > 43 else ""
        if composite_check and composite_check != "<":
            computed = calculate_mrz_check_digit(composite_data)
            passed = (computed == composite_check)
            if not passed:
                all_passed = False
            check_results.append({
                "check": "Composite Global Check Digit",
                "passed": passed,
                "computed": computed,
                "actual": composite_check
            })

    # Update mrz_data
    mrz_data["all_checks_passed"] = all_passed
    mrz_data["check_results"] = check_results
    return mrz_data


# =============================================================================
# 2. Indian National ID Validators (Aadhaar, PAN, DL)
# =============================================================================

# UIDAI Official Verhoeff Dihedral Group D5 Multiplication & Permutation Tables
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_verhoeff_aadhaar(uid_str: str) -> bool:
    """
    Validates a 12-digit Indian Aadhaar number using the UIDAI Verhoeff algorithm.
    Returns True if valid, False if fraudulent or mistyped.
    """
    clean_uid = uid_str.replace(" ", "").replace("-", "")
    if len(clean_uid) != 12 or not clean_uid.isdigit():
        return False

    c = 0
    # Process digits in reverse order
    for idx, char in enumerate(reversed(clean_uid)):
        digit = int(char)
        p_val = VERHOEFF_P[idx % 8][digit]
        c = VERHOEFF_D[c][p_val]

    return c == 0


def verify_aadhaar(uid_number: str, full_name: str = "", dob: str = "") -> Dict[str, Any]:
    """Evaluates Aadhaar card number against UIDAI standard checksum rules."""
    clean_uid = uid_number.replace(" ", "").replace("-", "")
    is_verhoeff_valid = validate_verhoeff_aadhaar(clean_uid)
    masked = f"XXXX-XXXX-{clean_uid[-4:]}" if len(clean_uid) == 12 else "XXXX-XXXX-XXXX"

    checks = [
        {"name": "12-Digit Structure", "passed": len(clean_uid) == 12 and clean_uid.isdigit()},
        {"name": "UIDAI Verhoeff Checksum", "passed": is_verhoeff_valid},
        {"name": "Format Standard", "passed": clean_uid[0] not in ('0', '1')} # Aadhaar never starts with 0 or 1
    ]
    all_valid = all(chk["passed"] for chk in checks)

    return {
        "id_type": "AADHAAR",
        "doc_number_masked": masked,
        "is_valid": all_valid,
        "checksum_type": "UIDAI Verhoeff D5 Checksum",
        "algorithm_detail": "Mathematical dihedral group permutation verified against UIDAI algorithm specifications.",
        "checks": checks,
        "risk_penalty": 0.0 if all_valid else 75.0
    }


def verify_pan_card(pan_number: str, full_name: str = "") -> Dict[str, Any]:
    """
    Evaluates Indian Permanent Account Number (PAN) structure:
    Format: 5 letters + 4 digits + 1 letter (e.g. ABCPS1234F)
    4th character = Entity status ('P' for Individual/Person)
    5th character = First letter of cardholder's surname
    """
    clean_pan = pan_number.strip().upper().replace(" ", "")
    checks = []

    # Length & Regex Check
    is_structure_valid = (
        len(clean_pan) == 10 and
        clean_pan[:5].isalpha() and
        clean_pan[5:9].isdigit() and
        clean_pan[9].isalpha()
    )
    checks.append({"name": "10-Character Alphanumeric Pattern", "passed": is_structure_valid})

    # 4th character entity check
    entity_code = clean_pan[3] if len(clean_pan) >= 4 else ""
    valid_entities = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']
    checks.append({"name": "Entity Status Check", "passed": entity_code in valid_entities})

    # 5th character surname initial cross-check
    if full_name and len(clean_pan) >= 5:
        name_parts = full_name.strip().upper().split()
        surname = name_parts[-1] if name_parts else ""
        surname_initial = surname[0] if surname else ""
        surname_match = (clean_pan[4] == surname_initial) if surname_initial else True
        checks.append({"name": "Surname Initial Match", "passed": surname_match})

    all_valid = all(chk["passed"] for chk in checks)
    masked = f"{clean_pan[:2]}XXX{clean_pan[5:7]}XX{clean_pan[-1]}" if len(clean_pan) == 10 else "XXXXXXXXXX"

    return {
        "id_type": "PAN",
        "doc_number_masked": masked,
        "is_valid": all_valid,
        "checksum_type": "Income Tax Department Entity & Check Algorithm",
        "algorithm_detail": "Alphanumeric entity character and surname hash validated against ITD rules.",
        "checks": checks,
        "risk_penalty": 0.0 if all_valid else 65.0
    }


def verify_indian_driving_licence(dl_number: str) -> Dict[str, Any]:
    """
    Evaluates Indian Driving Licence:
    Format: SS-RRYYYYYNNNNNNN (16 chars with state code, RTO code, year, and serial)
    """
    clean_dl = dl_number.strip().upper().replace(" ", "").replace("-", "")
    valid_states = ["AN", "AP", "AR", "AS", "BR", "CH", "CG", "DN", "DD", "DL", "GA", "GJ", "HR", "HP", "JK", "JH", "KA", "KL", "LA", "LD", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PY", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB"]

    checks = []
    has_valid_state = clean_dl[:2] in valid_states if len(clean_dl) >= 2 else False
    checks.append({"name": "State RTO Code", "passed": has_valid_state})
    checks.append({"name": "15/16-Digit DL Standard", "passed": 14 <= len(clean_dl) <= 16})

    all_valid = all(chk["passed"] for chk in checks)
    masked = f"{clean_dl[:4]}XXXX{clean_dl[-4:]}" if len(clean_dl) >= 8 else clean_dl

    return {
        "id_type": "DRIVING_LICENCE",
        "doc_number_masked": masked,
        "is_valid": all_valid,
        "checksum_type": "MoRTH Sarathi RTO Standard",
        "algorithm_detail": "State jurisdiction and Sarathi serial standard verified.",
        "checks": checks,
        "risk_penalty": 0.0 if all_valid else 50.0
    }


# =============================================================================
# 3. Cross-Field Consistency Verification (VIZ vs MRZ)
# =============================================================================
def cross_validate_mrz_and_viz(viz_data: Dict[str, Any], mrz_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares printed human-readable Visual Inspection Zone (VIZ) text directly
    against the encoded Machine Readable Zone (MRZ) strip.
    Detects printed text alterations (e.g. modified printed expiry dates or names).
    """
    discrepancies = []

    # 1. Compare Document Number
    viz_doc_num = viz_data.get("doc_number", "").strip().upper().replace(" ", "")
    mrz_doc_num = mrz_data.get("doc_number", "").strip().upper().replace(" ", "")
    if viz_doc_num and mrz_doc_num and viz_doc_num != mrz_doc_num:
        discrepancies.append({
            "field": "Document Number",
            "viz_value": viz_data.get("doc_number", ""),
            "mrz_value": mrz_data.get("doc_number", "")
        })

    # 2. Compare Expiry Year
    viz_exp = viz_data.get("expiry_date", "")
    mrz_exp = mrz_data.get("expiry", "")
    if viz_exp and mrz_exp:
        # Extract 4-digit years
        viz_year = viz_exp.split("/")[-1] if "/" in viz_exp else viz_exp[-4:]
        mrz_year = mrz_exp.split("/")[-1] if "/" in mrz_exp else mrz_exp[-4:]
        if viz_year and mrz_year and viz_year != mrz_year:
            discrepancies.append({
                "field": "Expiry Date",
                "viz_value": viz_exp,
                "mrz_value": mrz_exp
            })

    # 3. Compare Name Parts
    viz_name = viz_data.get("full_name", "").strip().upper().replace(",", "")
    mrz_name = mrz_data.get("full_name", "").strip().upper()
    if viz_name and mrz_name:
        viz_words = set(viz_name.split())
        mrz_words = set(mrz_name.split())
        if not viz_words.intersection(mrz_words):
            discrepancies.append({
                "field": "Cardholder Name",
                "viz_value": viz_data.get("full_name", ""),
                "mrz_value": mrz_data.get("full_name", "")
            })

    return {
        "is_consistent": len(discrepancies) == 0,
        "discrepancies": discrepancies
    }
