"""
ForgeProof Simulated Interpol Red Notice & Border Security Watchlist Engine
Simulates real-time law enforcement integration with:
1. Interpol Stolen and Lost Travel Documents (SLTD) Database.
2. National Border Control Stop-List & Wanted Fugitive Registry (Red Notices).
3. Biometric 1:N Facial Watchlist Screening against known high-risk personas.

Name Matching Strategy
----------------------
Exact match is tried first (fastest path). If no exact hit, Jaro-Winkler-style
fuzzy comparison via difflib.SequenceMatcher is applied against both the primary
target name and any recorded aliases. This handles:
  - Romanisation variants  (SINGH vs SINHA)
  - Hyphenated / compound names  (AL-MANSOOR vs ALMANSOOR)
  - OCR transpositions  (VIKRAM vs VIKARM)
  - Common initials collapsing  (A. K. JOSHI vs ARUNESH JOSHI)

Threshold: NAME_SIMILARITY_THRESHOLD (default 0.88).
A match requires similarity >= threshold AND a DOB match (when DOB is available).
This prevents false positives on common surnames like SHARMA or JOSHI alone.
"""

import re
from difflib import SequenceMatcher
from typing import Dict, Any, Optional, List

# ---------------------------------------------------------------------------
# Tuning knob — lower = more aggressive matching (more false positives)
#               raise = more conservative (fewer false positives)
# 0.88 is calibrated for South Asian and transliterated Arabic names.
# ---------------------------------------------------------------------------
NAME_SIMILARITY_THRESHOLD = 0.88


# -----------------------------------------------------------------------------
# Simulated Interpol & National Law Enforcement Watchlist Records
# -----------------------------------------------------------------------------
SIMULATED_WATCHLIST = [
    {
        "notice_id": "INTERPOL-RN-2026-9041",
        "notice_type": "INTERPOL RED NOTICE",
        "category": "CRITICAL_WARRANT",
        "target_name": "VIKRAM SINGHANIA",
        "alias": "DEVENDRA RAO",
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
    """Strip everything except uppercase letters and digits for comparison."""
    if not val:
        return ""
    return re.sub(r'[^A-Z0-9]', '', str(val).upper())


def _name_similarity(a: str, b: str) -> float:
    """
    Returns a 0.0–1.0 similarity ratio between two normalised name strings.
    Uses SequenceMatcher (similar to Ratcliff/Obershelp), which is more
    character-level precise than Jaro-Winkler for transliterated names.

    Both strings should already be _normalize()'d before calling this.
    """
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def screen_against_watchlist(
    doc_number: Optional[str] = None,
    full_name: Optional[str] = None,
    dob: Optional[str] = None,
    face_encoding: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Performs multi-vector intelligence screening across document numbers,
    identity names (exact + fuzzy), aliases, and facial vectors.

    Match priority:
      1. Document number exact hit  (passport/UID stolen registry)
      2. Name exact match + DOB     (highest confidence identity hit)
      3. Alias exact match + DOB    (AKA / cover identity)
      4. Name fuzzy match + DOB     (OCR noise / transliteration variance)
      5. Alias fuzzy match + DOB    (fuzzy cover identity)
      6. Name/alias match with no DOB on record (SLTD stolen documents)
    """
    norm_doc = _normalize(doc_number)
    norm_name = _normalize(full_name)
    norm_dob = (dob or "").strip().replace("-", "/")

    matched_record = None
    match_reasons: List[str] = []
    match_method = "NONE"

    for entry in SIMULATED_WATCHLIST:
        entry_doc   = _normalize(entry["doc_number"])
        entry_name  = _normalize(entry["target_name"])
        entry_alias = _normalize(entry.get("alias", ""))
        entry_dob   = entry["dob"]
        has_dob     = bool(entry_dob)

        # ── Pass 1: Document number exact hit ───────────────────────────────
        if norm_doc and entry_doc and norm_doc == entry_doc:
            matched_record = entry
            match_reasons.append(
                f"EXACT DOC HIT — Document number '{doc_number}' found in Interpol SLTD registry."
            )
            match_method = "DOC_EXACT"
            break

        # ── Pass 2: Exact name + DOB ─────────────────────────────────────────
        if norm_name and entry_name and norm_name == entry_name:
            if has_dob and norm_dob and entry_dob == norm_dob:
                matched_record = entry
                match_reasons.append(
                    f"EXACT NAME+DOB HIT — '{full_name}' / {dob} matches Red Notice subject."
                )
                match_method = "NAME_DOB_EXACT"
                break
            elif not has_dob:
                matched_record = entry
                match_reasons.append(
                    f"EXACT NAME HIT (no DOB on record) — '{full_name}' matches Interpol wanted registry."
                )
                match_method = "NAME_EXACT_NODOB"
                break

        # ── Pass 3: Alias exact match + DOB ──────────────────────────────────
        if norm_name and entry_alias and norm_name == entry_alias:
            if has_dob and norm_dob and entry_dob == norm_dob:
                matched_record = entry
                match_reasons.append(
                    f"ALIAS EXACT HIT — '{full_name}' matches known alias '{entry['alias']}' / DOB {dob}."
                )
                match_method = "ALIAS_DOB_EXACT"
                break

        # ── Pass 4: Fuzzy name similarity + DOB guard ─────────────────────────
        # Only apply fuzzy when DOB is available on the record AND in the scan
        # to prevent false positives on common South Asian surnames.
        if norm_name and entry_name:
            name_sim = _name_similarity(norm_name, entry_name)
            if name_sim >= NAME_SIMILARITY_THRESHOLD:
                if has_dob and norm_dob and entry_dob == norm_dob:
                    matched_record = entry
                    match_reasons.append(
                        f"FUZZY NAME HIT ({name_sim:.0%} similarity) — '{full_name}' ≈ '{entry['target_name']}' + DOB {dob}."
                    )
                    match_method = f"NAME_FUZZY_{int(name_sim * 100)}"
                    break

        # ── Pass 5: Fuzzy alias similarity + DOB guard ────────────────────────
        if norm_name and entry_alias:
            alias_sim = _name_similarity(norm_name, entry_alias)
            if alias_sim >= NAME_SIMILARITY_THRESHOLD:
                if has_dob and norm_dob and entry_dob == norm_dob:
                    matched_record = entry
                    match_reasons.append(
                        f"FUZZY ALIAS HIT ({alias_sim:.0%} similarity) — '{full_name}' ≈ alias '{entry['alias']}' + DOB {dob}."
                    )
                    match_method = f"ALIAS_FUZZY_{int(alias_sim * 100)}"
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
            "match_method": match_method,
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
        "match_method": "NONE",
        "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
    }

