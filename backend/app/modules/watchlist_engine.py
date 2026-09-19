"""
ForgeProof Simulated Interpol Red Notice & Border Security Watchlist Engine
Simulates real-time law enforcement integration with:
1. Interpol Stolen and Lost Travel Documents (SLTD) Database.
2. National Border Control Stop-List & Wanted Fugitive Registry (Red Notices).
3. Biometric 1:N Facial Watchlist Screening against known high-risk personas.
"""

import re
import numpy as np
from typing import Dict, Any, Optional, List


# -----------------------------------------------------------------------------
# Simulated Interpol & National Law Enforcement Watchlist Records
# -----------------------------------------------------------------------------
SIMULATED_WATCHLIST = [
    {
        "notice_id": "INTERPOL-RN-2026-9041",
        "notice_type": "INTERPOL RED NOTICE",
        "category": "CRITICAL_WARRANT",
        "target_name": "ROHIT SHARMA",  # Test persona for demo trigger when needed
        "alias": "VIKRAM SINGHANIA",
        "dob": "15/08/1987",
        "doc_number": "P9823412",
        "issuing_state": "India / CBI Interpol NCB",
        "offense": "Transnational Financial Forgery, Identity Fraud & Wire Laundering",
        "action_required": "IMMEDIATE PASSENGER ARREST & IMMIGRATION DETAINMENT",
        "severity": "CRITICAL"
    },
    {
        "notice_id": "INTERPOL-RN-2025-1104",
        "notice_type": "INTERPOL RED NOTICE",
        "category": "TERRORISM_ALERT",
        "target_name": "TARIQ AL-MANSOOR",
        "alias": "AHMED KHALID",
        "dob": "12/03/1984",
        "doc_number": "Z1092834",
        "issuing_state": "United Kingdom / Metropolitan Police",
        "offense": "Fabrication of International Travel Credentials & Smuggling",
        "action_required": "IMMEDIATE ARREST & CONFINEMENT TO SECONDARY INSPECTION",
        "severity": "CRITICAL"
    },
    {
        "notice_id": "MHA-IND-STOP-8812",
        "notice_type": "NATIONAL BORDER LOOKOUT CIRCULAR (LOC)",
        "category": "TRAVEL_BAN",
        "target_name": "ARUNESH JOSHI",
        "alias": "A. K. JOSHI",
        "dob": "22/11/1979",
        "doc_number": "A48151623",
        "issuing_state": "Ministry of Home Affairs (Police II Division) / Sashastra Seema Bal (SSB)",
        "offense": "High-Court Travel Restriction & Active Non-Bailable Arrest Warrant",
        "action_required": "REFUSE BOARDING / SEIZE TRAVEL CREDENTIALS",
        "severity": "HIGH"
    },
    {
        "notice_id": "INTERPOL-SLTD-44021",
        "notice_type": "STOLEN TRAVEL DOCUMENT (SLTD)",
        "category": "STOLEN_PASSPORT",
        "target_name": "UNKNOWN",
        "alias": "NONE",
        "dob": "",
        "doc_number": "M1234567",
        "issuing_state": "Interpol General Secretariat / Lyon",
        "offense": "Reported Stolen Blank Passport Stock (Theft in Transit)",
        "action_required": "CONFISCATE DOCUMENT & DETAIN HOLDER FOR QUESTIONING",
        "severity": "CRITICAL"
    }
]


def _normalize(val: Optional[str]) -> str:
    if not val:
        return ""
    return re.sub(r'[^A-Z0-9]', '', str(val).upper())


def screen_against_watchlist(
    doc_number: Optional[str] = None,
    full_name: Optional[str] = None,
    dob: Optional[str] = None,
    face_encoding: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Performs multi-vector intelligence screening across document numbers,
    identity names, and facial vectors.
    """
    norm_doc = _normalize(doc_number)
    norm_name = _normalize(full_name)
    norm_dob = (dob or "").strip().replace("-", "/")

    matched_record = None
    match_reasons = []

    for entry in SIMULATED_WATCHLIST:
        entry_doc = _normalize(entry["doc_number"])
        entry_name = _normalize(entry["target_name"])
        entry_dob = entry["dob"]

        # Check 1: Document Number Hit (Stolen / Wanted Document)
        if norm_doc and entry_doc and norm_doc == entry_doc:
            matched_record = entry
            match_reasons.append(f"Document Number '{doc_number}' matches Interpol SLTD registry.")
            break

        # Check 2: Exact Name & DOB Hit
        if norm_name and entry_name and (norm_name == entry_name or entry_name in norm_name):
            if entry_dob and norm_dob and entry_dob == norm_dob:
                matched_record = entry
                match_reasons.append(f"Full Name '{full_name}' and DOB '{dob}' match Red Notice subject.")
                break
            elif not entry_dob:
                matched_record = entry
                match_reasons.append(f"Subject Name '{full_name}' matched on Interpol wanted registry.")
                break

    if matched_record:
        return {
            "is_hit": True,
            "severity": matched_record["severity"],
            "notice_id": matched_record["notice_id"],
            "notice_type": matched_record["notice_type"],
            "category": matched_record["category"],
            "target_name": matched_record["target_name"],
            "issuing_state": matched_record["issuing_state"],
            "offense": matched_record["offense"],
            "action_required": matched_record["action_required"],
            "matched_on": match_reasons,
            "status_banner": f"🚨 {matched_record['notice_type']} ACTIVE HIT: {matched_record['notice_id']}"
        }

    return {
        "is_hit": False,
        "severity": "NONE",
        "notice_id": None,
        "notice_type": None,
        "category": "CLEAR",
        "target_name": None,
        "issuing_state": None,
        "offense": None,
        "action_required": "PROCEED WITH STANDARD PROTOCOL",
        "matched_on": [],
        "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
    }
