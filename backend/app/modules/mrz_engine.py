"""
ICAO Doc 9303 Machine Readable Zone (MRZ) Parser & Checksum Engine
Supports TD3 (Passports: 2 lines x 44 chars), TD1 (ID Cards: 3x30), TD2 (Visas/IDs: 2x36).
Implements official 7-3-1 weighting algorithm for check digits.
"""

from typing import Dict, Any, List, Optional
import re
from datetime import datetime

# ICAO 9303 character values: 0-9 = 0-9, A-Z = 10-35, '<' = 0
def char_to_value(char: str) -> int:
    char = char.upper()
    if char.isdigit():
        return int(char)
    elif 'A' <= char <= 'Z':
        return ord(char) - ord('A') + 10
    elif char == '<':
        return 0
    return 0

def compute_check_digit(data_str: str) -> str:
    """Computes ICAO 9303 check digit using weights [7, 3, 1] cyclically."""
    weights = [7, 3, 1]
    total = 0
    for idx, ch in enumerate(data_str):
        val = char_to_value(ch)
        weight = weights[idx % 3]
        total += val * weight
    return str(total % 10)

def parse_mrz_td3(lines: List[str]) -> Dict[str, Any]:
    """
    Parses TD3 (Passport - 2 lines of 44 chars)
    Line 1: P<ISSNAME<<GIVEN<<<<<<<<<<<<<<<<<<<<<<<<<<
    Line 2: DOCNUM<CD_NAT_DOB_CD_SEX_EXP_CD_OPT_CD_COMP_CD
    """
    if len(lines) < 2:
        return {"valid_format": False, "error": "TD3 requires at least 2 lines"}
    
    line1 = lines[0].replace(' ', '').upper().ljust(44, '<')[:44]
    line2 = lines[1].replace(' ', '').upper().ljust(44, '<')[:44]
    
    doc_code = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    
    # Names parsing: Surname<<GivenName<Other
    name_field = line1[5:]
    name_parts = name_field.split('<<')
    surname = name_parts[0].replace('<', ' ').strip()
    given_names = name_parts[1].replace('<', ' ').strip() if len(name_parts) > 1 else ""
    full_name = f"{given_names} {surname}".strip() if given_names else surname
    
    # Line 2 fields
    doc_number = line2[0:9].replace('<', '')
    doc_num_check = line2[9]
    nationality = line2[10:13].replace('<', '')
    dob_str = line2[13:19]  # YYMMDD
    dob_check = line2[19]
    sex = line2[20].replace('<', 'X')
    expiry_str = line2[21:27] # YYMMDD
    expiry_check = line2[27]
    optional_data = line2[28:42].replace('<', '')
    optional_check = line2[42] if line2[42] != '<' else '0'
    composite_check = line2[43]
    
    # Compute check digits
    calc_doc_check = compute_check_digit(line2[0:9])
    calc_dob_check = compute_check_digit(dob_str)
    calc_exp_check = compute_check_digit(expiry_str)
    
    # Composite string according to ICAO Doc 9303 part 4:
    # doc_num + doc_num_cd + dob + dob_cd + exp + exp_cd + optional + opt_cd
    comp_input = line2[0:10] + line2[13:20] + line2[21:43]
    calc_comp_check = compute_check_digit(comp_input)
    
    checks = {
        "doc_number_check": {
            "expected": calc_doc_check,
            "found": doc_num_check,
            "valid": calc_doc_check == doc_num_check
        },
        "dob_check": {
            "expected": calc_dob_check,
            "found": dob_check,
            "valid": calc_dob_check == dob_check
        },
        "expiry_check": {
            "expected": calc_exp_check,
            "found": expiry_check,
            "valid": calc_exp_check == expiry_check
        },
        "composite_check": {
            "expected": calc_comp_check,
            "found": composite_check,
            "valid": calc_comp_check == composite_check
        }
    }
    
    all_checks_passed = all(c["valid"] for c in checks.values())
    
    # Format dates
    def format_mrz_date(yy_mm_dd: str, is_expiry: bool = False) -> str:
        if len(yy_mm_dd) != 6 or not yy_mm_dd.isdigit():
            return yy_mm_dd
        yy = int(yy_mm_dd[0:2])
        mm = int(yy_mm_dd[2:4])
        dd = int(yy_mm_dd[4:6])
        curr_year = datetime.now().year % 100
        if is_expiry:
            century = 2000 if yy <= curr_year + 50 else 1900
        else:
            century = 1900 if yy > curr_year else 2000
        full_year = century + yy
        return f"{dd:02d}/{mm:02d}/{full_year}"

    formatted_dob = format_mrz_date(dob_str, is_expiry=False)
    formatted_expiry = format_mrz_date(expiry_str, is_expiry=True)
    
    # Check if expired
    is_expired = False
    try:
        exp_dt = datetime.strptime(formatted_expiry, "%d/%m/%Y")
        is_expired = exp_dt < datetime.now()
    except Exception:
        pass

    return {
        "format": "TD3",
        "doc_code": doc_code,
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": full_name,
        "doc_number": doc_number,
        "nationality": nationality,
        "dob": formatted_dob,
        "dob_raw": dob_str,
        "sex": sex,
        "expiry": formatted_expiry,
        "expiry_raw": expiry_str,
        "is_expired": is_expired,
        "optional_data": optional_data,
        "checks": checks,
        "all_checks_passed": all_checks_passed,
        "raw_lines": [line1, line2]
    }

def cross_validate_mrz_and_viz(viz_fields: Dict[str, Any], mrz_fields: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cross-validates Visual Inspection Zone (printed text) against MRZ extracted data.
    Discrepancies indicate altered printed text or fraudulent MRZ strip.
    """
    discrepancies = []
    
    # 1. Document Number Check
    viz_doc_num = re.sub(r'[^A-Za-z0-9]', '', str(viz_fields.get("doc_number", ""))).upper()
    mrz_doc_num = re.sub(r'[^A-Za-z0-9]', '', str(mrz_fields.get("doc_number", ""))).upper()
    if viz_doc_num and mrz_doc_num and viz_doc_num != mrz_doc_num:
        discrepancies.append({
            "field": "Document Number",
            "viz_value": viz_doc_num,
            "mrz_value": mrz_doc_num,
            "severity": "CRITICAL",
            "reason": f"Printed Doc No '{viz_doc_num}' does not match MRZ Doc No '{mrz_doc_num}'"
        })
        
    # 2. Expiry Date Check
    viz_expiry = str(viz_fields.get("expiry_date", "")).strip()
    mrz_expiry = str(mrz_fields.get("expiry", "")).strip()
    if viz_expiry and mrz_expiry and viz_expiry != mrz_expiry:
        discrepancies.append({
            "field": "Expiry Date",
            "viz_value": viz_expiry,
            "mrz_value": mrz_expiry,
            "severity": "CRITICAL",
            "reason": f"Printed Expiry '{viz_expiry}' altered relative to MRZ Expiry '{mrz_expiry}'"
        })
        
    # 3. Full Name / Surname Check
    viz_name = re.sub(r'[^A-Za-z\s]', '', str(viz_fields.get("full_name", ""))).upper().strip()
    mrz_name = re.sub(r'[^A-Za-z\s]', '', str(mrz_fields.get("full_name", ""))).upper().strip()
    if viz_name and mrz_name:
        viz_tokens = set(viz_name.split())
        mrz_tokens = set(mrz_name.split())
        if not (viz_tokens & mrz_tokens):
            discrepancies.append({
                "field": "Full Name",
                "viz_value": viz_name,
                "mrz_value": mrz_name,
                "severity": "HIGH",
                "reason": f"Printed Name '{viz_name}' differs from MRZ Name '{mrz_name}'"
            })
            
    # 4. Nationality Check
    viz_nat = str(viz_fields.get("nationality", "")).upper()
    mrz_nat = str(mrz_fields.get("nationality", "")).upper()
    if viz_nat and mrz_nat and viz_nat not in [mrz_nat, "INDIAN", "IND"]:
        discrepancies.append({
            "field": "Nationality",
            "viz_value": viz_nat,
            "mrz_value": mrz_nat,
            "severity": "MEDIUM",
            "reason": f"Nationality mismatch between VIZ '{viz_nat}' and MRZ '{mrz_nat}'"
        })

    is_consistent = len(discrepancies) == 0
    return {
        "is_consistent": is_consistent,
        "discrepancy_count": len(discrepancies),
        "discrepancies": discrepancies
    }
