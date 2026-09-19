"""
ForgeProof Risk Scoring & Explainability Engine
Conforms to PDD Section 10 (Risk Scoring Model).
Aggregates sub-scores from Validation, Tampering Detection, Face Verification,
and Metadata Forensics into an explainable, evidence-backed composite risk score.
"""

from typing import Dict, Any, List, Optional
from app.config import RISK_WEIGHTS, RISK_LOW_CEILING, RISK_MEDIUM_CEILING


def compute_composite_risk(
    validation_res: Dict[str, Any],
    tampering_res: Dict[str, Any],
    face_res: Optional[Dict[str, Any]],
    metadata_res: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes calibrated composite risk score (0 - 100) and compiles
    traceable plain-English evidence items for inspecting border officers.
    """
    metadata_res = metadata_res or {}
    val_evidence: List[Dict[str, str]] = []
    val_risk = 0.0

    # -------------------------------------------------------------------------
    # 1. Validation Risk (ICAO checksums, UIDAI Verhoeff, ITD PAN, Cross-checks)
    # -------------------------------------------------------------------------
    mrz_data = validation_res.get("mrz")
    if mrz_data:
        if not mrz_data.get("all_checks_passed", True):
            val_risk += 65.0
            val_evidence.append({
                "severity": "CRITICAL",
                "title": "Security Checksum Failed",
                "detail": "The document's encoded security lines do not match official international passport standards. This indicates forged or altered text."
            })
        if mrz_data.get("is_expired"):
            val_risk += 50.0
            val_evidence.append({
                "severity": "HIGH",
                "title": "Document Has Expired",
                "detail": f"This document expired on {mrz_data.get('expiry')}. It is no longer valid for international travel."
            })

    # Cross-consistency checks (printed VIZ text vs MRZ strip)
    cross_val = validation_res.get("cross_validation")
    if cross_val and not cross_val.get("is_consistent", True):
        val_risk += 55.0
        for disc in cross_val.get("discrepancies", []):
            if isinstance(disc, dict):
                field_name = disc.get("field", "Field")
                detail_text = disc.get("message") or f"The printed {field_name.lower()} does not match the encoded data strip. The document text was altered."
            else:
                field_name = "Field"
                detail_text = str(disc)
            val_evidence.append({
                "severity": "CRITICAL",
                "title": f"Mismatched {field_name}",
                "detail": detail_text
            })

    # Indian National ID Checks (Aadhaar, PAN, DL)
    indian_val = validation_res.get("indian_id")
    if indian_val and not indian_val.get("is_valid", True):
        val_risk += indian_val.get("risk_penalty", 60.0)
        for chk in indian_val.get("checks", []):
            if not chk.get("passed"):
                val_evidence.append({
                    "severity": "CRITICAL",
                    "title": f"Invalid {indian_val.get('id_type', 'ID')} Number",
                    "detail": f"The card number failed official {indian_val.get('checksum_type', 'verification')} rules and is not a genuine government-issued identity."
                })

    # 2D Barcode & QR Code Discrepancy Check
    qr_data = validation_res.get("qr_code")
    if qr_data and qr_data.get("detected"):
        if qr_data.get("tampering_detected"):
            val_risk += 80.0
            val_evidence.append({
                "severity": "CRITICAL",
                "title": "QR Code vs. Printed Data Discrepancy",
                "detail": f"The embedded QR code payload contradicts the printed cardholder information: {qr_data.get('detail')}. This indicates cosmetic text alteration."
            })
        else:
            val_evidence.append({
                "severity": "INFO",
                "title": "Digital Barcode Verified",
                "detail": f"2D Barcode detected on {qr_data.get('qr_location')} of document. Encoded data matches physical cardholder fields."
            })

    val_risk = min(100.0, val_risk)

    # -------------------------------------------------------------------------
    # 2. Tampering & Physical Forensics Risk
    # -------------------------------------------------------------------------
    tamp_risk = float(tampering_res.get("tampering_score", 0.0))
    tamp_evidence: List[Dict[str, str]] = []
    for ev in tampering_res.get("evidence_list", []):
        tamp_evidence.append({
            "severity": ev.get("severity", "WARNING"),
            "title": ev.get("title", "Tampering Detected"),
            "detail": ev.get("description", "")
        })

    # -------------------------------------------------------------------------
    # 3. Facial Biometric & Identity Risk
    # -------------------------------------------------------------------------
    face_evidence: List[Dict[str, str]] = []
    if face_res:
        face_risk = float(face_res.get("face_risk", 10.0))
        if face_res.get("success"):
            if not face_res.get("is_match"):
                dist = face_res.get("euclidean_distance", 0.0)
                if 0.40 <= dist <= 0.58:
                    face_risk = 45.0
                    face_evidence.append({
                        "severity": "WARNING",
                        "title": "Outdated Child Biometric / Age Progression",
                        "detail": f"Presenter displays adult facial structure compared to childhood photo on card (Distance: {dist:.2f}). Secondary review or UIDAI biometric update advised."
                    })
                else:
                    face_evidence.append({
                        "severity": "CRITICAL",
                        "title": "Face Does Not Match Document",
                        "detail": "The traveler presenting the document does not match the photograph on the document (Possible Impersonation)."
                    })

            liveness = face_res.get("liveness", {})
            if not liveness.get("is_live", True):
                face_evidence.append({
                    "severity": "CRITICAL",
                    "title": "Photo Replay / Spoofing Suspected",
                    "detail": "The presenter's camera image appears to be a digital screen or printed photo rather than a live person."
                })
        else:
            if face_res.get("error"):
                face_evidence.append({
                    "severity": "HIGH",
                    "title": "Biometric Check Incomplete",
                    "detail": face_res.get("error", "Could not isolate a clear face for identity comparison.")
                })
    else:
        face_risk = 10.0 # Neutral default if live photo omitted

    # -------------------------------------------------------------------------
    # 4. Digital File Metadata Risk
    # -------------------------------------------------------------------------
    meta_risk = float(metadata_res.get("metadata_risk", 0.0))
    meta_evidence: List[Dict[str, str]] = []
    for flag in metadata_res.get("flags", []):
        meta_evidence.append({
            "severity": "HIGH",
            "title": "Image Editing Software Detected",
            "detail": "This document image file contains evidence of being saved or modified using digital photo-editing software."
        })

    # -------------------------------------------------------------------------
    # 5. Composite Weighted Score & Anomaly Floor
    # -------------------------------------------------------------------------
    w = RISK_WEIGHTS
    composite_score = (
        w["validation"] * val_risk +
        w["tampering"] * tamp_risk +
        w["face"] * face_risk +
        w["metadata"] * meta_risk
    )

    # Critical Anomaly Floor: If any core pillar exhibits critical failure, elevate score
    max_pillar = max(val_risk, tamp_risk, face_risk)
    if max_pillar >= 75.0 and composite_score < 72.0:
        composite_score = max(composite_score, 75.0)

    composite_score = round(min(100.0, max(0.0, composite_score)), 1)

    all_evidence = val_evidence + tamp_evidence + face_evidence + meta_evidence

    # -------------------------------------------------------------------------
    # 6. Law Enforcement Watchlist & Interpol Hit Override
    # -------------------------------------------------------------------------
    watchlist_data = validation_res.get("watchlist")
    if watchlist_data and watchlist_data.get("is_hit"):
        composite_score = 100.0
        risk_level = "HIGH"
        risk_color = "red"
        recommendation = f"🚨 {watchlist_data.get('notice_type')} HIT: {watchlist_data.get('offense')}. Directive: {watchlist_data.get('action_required')}."
        all_evidence.insert(0, {
            "severity": "CRITICAL",
            "title": f"{watchlist_data.get('notice_type')} HIT ({watchlist_data.get('notice_id')})",
            "detail": f"Matched: {', '.join(watchlist_data.get('matched_on', []))}. Issuing Agency: {watchlist_data.get('issuing_state')}. Directive: {watchlist_data.get('action_required')}."
        })
    else:
        # Standard Risk Tier Classification & Recommendation
        if composite_score <= RISK_LOW_CEILING:
            risk_level = "LOW"
            risk_color = "green"
            recommendation = "Genuine Document — All security features, check digits, and facial match verified. Clear for entry."
        elif composite_score <= RISK_MEDIUM_CEILING:
            risk_level = "MEDIUM"
            risk_color = "amber"
            recommendation = "Secondary Review Advised — Moderate optical or layout anomalies detected. Officer physical inspection required."
        else:
            risk_level = "HIGH"
            risk_color = "red"
            recommendation = "High Risk / Fraud Suspected — Detain document and refer traveler to supervisor for secondary interrogation."

    if not all_evidence:
        all_evidence.append({
            "severity": "INFO",
            "title": "All Checks Passed",
            "detail": "Document format, security lines, photo integrity, and facial match all conform to genuine standards."
        })

    return {
        "composite_score": composite_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "recommendation": recommendation,
        "sub_scores": {
            "validation_risk": round(val_risk, 1),
            "tampering_risk": round(tamp_risk, 1),
            "face_risk": round(face_risk, 1),
            "metadata_risk": round(meta_risk, 1)
        },
        "evidence_items": all_evidence
    }

