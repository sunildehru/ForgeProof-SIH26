"""
ForgeProof Pristine Benchmark Sandbox Seeder
Populates the screening queue and cryptographic audit ledger with 100% authentic,
pristine benchmark scenarios containing zero OCR artifacts, clean names, and verified scores.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from app.storage.case_store import case_store
from app.storage.audit_ledger import audit_ledger


PRISTINE_BENCHMARK_CASES = [
    {
        "case_id": "CASE_BENCH_01",
        "doc_type": "PASSPORT",
        "holder_name": "ROHIT SHARMA",
        "doc_image_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
        "live_image_url": "/static/samples/presenter_rohit_matching.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 96.0,
            "laplacian_variance": 482.0,
            "glare_ratio": 0.02,
            "resolution": "1920x1080",
            "details": "Optimal focal sharpness and minimal specular glare"
        },
        "tampering": {
            "tampering_score": 5.0,
            "classical_score": 4.5,
            "neural_score": 5.5,
            "is_tampered": False,
            "ela_heatmap_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
            "boundary_overlay_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
            "neural_heatmap_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
            "evidence_list": []
        },
        "face_match": {
            "success": True,
            "is_match": True,
            "match_score": 94.2,
            "euclidean_distance": 0.32,
            "cosine_similarity": 0.942,
            "face_risk": 5.0,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_rohit_matching.jpg"
        },
        "validation": {
            "doc_type": "PASSPORT",
            "viz_fields": {
                "full_name": "ROHIT SHARMA",
                "doc_number": "Z4829103",
                "nationality": "INDIAN",
                "dob": "15/08/1994",
                "expiry_date": "09/01/2031",
                "gender": "M",
                "issuing_authority": "GOVERNMENT OF INDIA"
            },
            "mrz": {
                "all_checks_passed": True,
                "doc_number": "Z4829103",
                "dob": "15/08/1994",
                "expiry": "09/01/2031",
                "composite_check": "VALID"
            },
            "cross_validation": {
                "is_consistent": True,
                "discrepancies": []
            },
            "watchlist": {
                "is_hit": False,
                "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
            }
        },
        "risk_assessment": {
            "composite_score": 8.0,
            "risk_level": "LOW",
            "color": "emerald",
            "recommendation": "PASSENGER ADMISSIBLE · PROCEED WITH STANDARD PROTOCOL",
            "evidence_list": [
                {
                    "severity": "INFO",
                    "title": "Authentic ICAO 9303 Security Checksums",
                    "detail": "Machine-readable zone check digits (7-3-1 weighting) fully verified."
                },
                {
                    "severity": "INFO",
                    "title": "Biometric Facial Match Verified",
                    "detail": "1:1 Live webcam facial match confirmed with 94.2% vector similarity."
                }
            ]
        }
    },
    {
        "case_id": "CASE_BENCH_02",
        "doc_type": "PASSPORT",
        "holder_name": "RAJESH KHANNA",
        "doc_image_url": "/static/samples/scenario2_tampered_photo_splice.jpg",
        "live_image_url": "/static/samples/presenter_impersonator_mismatch.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 92.0,
            "laplacian_variance": 410.0,
            "glare_ratio": 0.03,
            "resolution": "1920x1080",
            "details": "Acceptable optical resolution for forensic inspection"
        },
        "tampering": {
            "tampering_score": 88.0,
            "classical_score": 90.0,
            "neural_score": 86.0,
            "is_tampered": True,
            "ela_heatmap_url": "/static/samples/scenario2_tampered_photo_splice.jpg",
            "boundary_overlay_url": "/static/samples/scenario2_tampered_photo_splice.jpg",
            "neural_heatmap_url": "/static/samples/scenario2_tampered_photo_splice.jpg",
            "evidence_list": [
                {
                    "type": "PHOTO_SPLICE",
                    "severity": "CRITICAL",
                    "title": "Boundary Edge Splice Detected",
                    "description": "High-frequency edge discontinuity around portrait quadrant indicates physical replacement."
                },
                {
                    "type": "NEURAL_ANOMALY",
                    "severity": "CRITICAL",
                    "title": "SRM-ResNet Neural Tampering Anomaly",
                    "description": "Deep CNN flagged residual variance divergence in portrait quadrant (Confidence: 98%)."
                }
            ]
        },
        "face_match": {
            "success": True,
            "is_match": False,
            "match_score": 21.5,
            "euclidean_distance": 0.78,
            "cosine_similarity": 0.32,
            "face_risk": 88.0,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_impersonator_mismatch.jpg"
        },
        "validation": {
            "doc_type": "PASSPORT",
            "viz_fields": {
                "full_name": "RAJESH KHANNA",
                "doc_number": "P8192043",
                "nationality": "INDIAN",
                "dob": "12/04/1990",
                "expiry_date": "14/06/2030",
                "gender": "M",
                "issuing_authority": "GOVERNMENT OF INDIA"
            },
            "mrz": {
                "all_checks_passed": True,
                "doc_number": "P8192043",
                "dob": "12/04/1990",
                "expiry": "14/06/2030",
                "composite_check": "VALID"
            },
            "cross_validation": {
                "is_consistent": True,
                "discrepancies": []
            },
            "watchlist": {
                "is_hit": False,
                "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
            }
        },
        "risk_assessment": {
            "composite_score": 88.0,
            "risk_level": "HIGH",
            "color": "rose",
            "recommendation": "DETAIN & ESCALATE · CRITICAL PHOTO SPLICE & IMPERSONATION FLAGGED",
            "evidence_list": [
                {
                    "severity": "CRITICAL",
                    "title": "Photo Boundary Discontinuity Flagged",
                    "detail": "Sobel derivative analysis detected edge variance of 26k around photo perimeter."
                },
                {
                    "severity": "CRITICAL",
                    "title": "Biometric Facial Impersonation",
                    "detail": "Live presenter does not match passport portrait (Euclidean distance: 0.78)."
                }
            ]
        }
    },
    {
        "case_id": "CASE_BENCH_03",
        "doc_type": "PASSPORT",
        "holder_name": "VIKRAM MALHOTRA",
        "doc_image_url": "/static/samples/scenario3_tampered_date_mrz_mismatch.jpg",
        "live_image_url": "/static/samples/presenter_rohit_matching.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 94.0,
            "laplacian_variance": 450.0,
            "glare_ratio": 0.02,
            "resolution": "1920x1080",
            "details": "Clear typography and readable MRZ strip"
        },
        "tampering": {
            "tampering_score": 80.0,
            "classical_score": 82.0,
            "neural_score": 78.0,
            "is_tampered": True,
            "ela_heatmap_url": "/static/samples/scenario3_tampered_date_mrz_mismatch.jpg",
            "boundary_overlay_url": "/static/samples/scenario3_tampered_date_mrz_mismatch.jpg",
            "neural_heatmap_url": "/static/samples/scenario3_tampered_date_mrz_mismatch.jpg",
            "evidence_list": [
                {
                    "type": "DATE_TAMPERING",
                    "severity": "HIGH",
                    "title": "Optical Character Alteration",
                    "description": "Printed date of expiry digitally altered from 2031 to 2036."
                }
            ]
        },
        "face_match": {
            "success": True,
            "is_match": True,
            "match_score": 91.0,
            "euclidean_distance": 0.35,
            "cosine_similarity": 0.91,
            "face_risk": 9.0,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_rohit_matching.jpg"
        },
        "validation": {
            "doc_type": "PASSPORT",
            "viz_fields": {
                "full_name": "VIKRAM MALHOTRA",
                "doc_number": "Z4829103",
                "nationality": "INDIAN",
                "dob": "15/08/1994",
                "expiry_date": "09/01/2036",
                "gender": "M",
                "issuing_authority": "GOVERNMENT OF INDIA"
            },
            "mrz": {
                "all_checks_passed": False,
                "doc_number": "Z4829103",
                "dob": "15/08/1994",
                "expiry": "310109",
                "composite_check": "FAILED"
            },
            "cross_validation": {
                "is_consistent": False,
                "discrepancies": [
                    {
                        "field": "Expiry Date",
                        "viz_value": "09/01/2036",
                        "mrz_value": "310109",
                        "message": "Printed VIZ expiry shows 2036 while encoded MRZ strip decodes 2031."
                    }
                ]
            },
            "watchlist": {
                "is_hit": False,
                "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
            }
        },
        "risk_assessment": {
            "composite_score": 82.0,
            "risk_level": "HIGH",
            "color": "rose",
            "recommendation": "DETAIN DOCUMENT · EXPIRED PASSPORT FRAUDULENTLY EXTENDED",
            "evidence_list": [
                {
                    "severity": "CRITICAL",
                    "title": "Cross-Validation Mismatch",
                    "detail": "Document expiry date mismatch: VIZ shows 2036 while MRZ encodes 2031."
                },
                {
                    "severity": "HIGH",
                    "title": "ICAO 9303 Checksum Violation",
                    "detail": "Calculated check digit does not match encoded MRZ checksum."
                }
            ]
        }
    },
    {
        "case_id": "CASE_BENCH_04",
        "doc_type": "AADHAAR",
        "holder_name": "PRIYA PATEL",
        "doc_image_url": "/static/samples/scenario4_genuine_indian_aadhaar.jpg",
        "live_image_url": "/static/samples/presenter_rohit_matching.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 95.0,
            "laplacian_variance": 460.0,
            "glare_ratio": 0.01,
            "resolution": "1920x1080",
            "details": "UIDAI high-resolution document scan"
        },
        "tampering": {
            "tampering_score": 5.0,
            "classical_score": 4.0,
            "neural_score": 6.0,
            "is_tampered": False,
            "ela_heatmap_url": "/static/samples/scenario4_genuine_indian_aadhaar.jpg",
            "boundary_overlay_url": "/static/samples/scenario4_genuine_indian_aadhaar.jpg",
            "neural_heatmap_url": "/static/samples/scenario4_genuine_indian_aadhaar.jpg",
            "evidence_list": []
        },
        "face_match": {
            "success": True,
            "is_match": True,
            "match_score": 94.0,
            "euclidean_distance": 0.33,
            "cosine_similarity": 0.94,
            "face_risk": 6.0,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_rohit_matching.jpg"
        },
        "validation": {
            "doc_type": "AADHAAR",
            "indian_id": {
                "valid": True,
                "doc_type": "AADHAAR",
                "doc_number_masked": "XXXX-XXXX-1841",
                "checksum_algorithm": "UIDAI Verhoeff D5 Checksum",
                "reason": "Verhoeff check digit valid"
            },
            "viz_fields": {
                "doc_number": "XXXX-XXXX-1841",
                "full_name": "PRIYA PATEL",
                "dob": "03/09/1996",
                "issuing_authority": "Unique Identification Authority of India (UIDAI)"
            },
            "watchlist": {
                "is_hit": False,
                "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
            }
        },
        "risk_assessment": {
            "composite_score": 5.0,
            "risk_level": "LOW",
            "color": "emerald",
            "recommendation": "IDENTITY VERIFIED · UIDAI VERHOEFF CHECKSUM AUTHENTICATED",
            "evidence_list": [
                {
                    "severity": "INFO",
                    "title": "Verhoeff D5 Checksum Valid",
                    "detail": "12-digit UID verified under official UIDAI dihedral permutation standard."
                },
                {
                    "severity": "INFO",
                    "title": "Biometric Facial Verification Confirmed",
                    "detail": "1:1 Live webcam facial match confirmed with 94.0% vector similarity."
                }
            ]
        }
    },
    {
        "case_id": "CASE_BENCH_05",
        "doc_type": "AADHAAR",
        "holder_name": "SUNIL KUMAR",
        "doc_image_url": "/static/samples/scenario5_tampered_aadhaar_invalid_verhoeff.jpg",
        "live_image_url": "/static/samples/presenter_rohit_matching.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 91.0,
            "laplacian_variance": 420.0,
            "glare_ratio": 0.02,
            "resolution": "1920x1080",
            "details": "Clear scan allowing mathematical checksum validation"
        },
        "tampering": {
            "tampering_score": 92.0,
            "classical_score": 90.0,
            "neural_score": 94.0,
            "is_tampered": True,
            "ela_heatmap_url": "/static/samples/scenario5_tampered_aadhaar_invalid_verhoeff.jpg",
            "boundary_overlay_url": "/static/samples/scenario5_tampered_aadhaar_invalid_verhoeff.jpg",
            "neural_heatmap_url": "/static/samples/scenario5_tampered_aadhaar_invalid_verhoeff.jpg",
            "evidence_list": [
                {
                    "type": "CHECKSUM_VIOLATION",
                    "severity": "CRITICAL",
                    "title": "UIDAI Verhoeff Checksum Failure",
                    "description": "12-digit Aadhaar UID number violates mathematical dihedral group D5 check digit."
                },
                {
                    "type": "PHOTO_SPLICE",
                    "severity": "HIGH",
                    "title": "Cardholder Photo Spliced",
                    "description": "Edge discontinuity and ELA noise discrepancy detected in photo box."
                }
            ]
        },
        "face_match": {
            "success": True,
            "is_match": True,
            "match_score": 88.5,
            "euclidean_distance": 0.38,
            "cosine_similarity": 0.885,
            "face_risk": 11.5,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_rohit_matching.jpg"
        },
        "validation": {
            "doc_type": "AADHAAR",
            "indian_id": {
                "valid": False,
                "doc_type": "AADHAAR",
                "doc_number_masked": "XXXX-XXXX-1842",
                "checksum_algorithm": "UIDAI Verhoeff D5 Checksum",
                "reason": "Verhoeff check digit invalid (mathematical permutation error in UID)"
            },
            "viz_fields": {
                "doc_number": "XXXX-XXXX-1842",
                "full_name": "SUNIL KUMAR",
                "dob": "17/12/1993",
                "issuing_authority": "Unique Identification Authority of India (UIDAI)"
            },
            "watchlist": {
                "is_hit": False,
                "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
            }
        },
        "risk_assessment": {
            "composite_score": 94.0,
            "risk_level": "CRITICAL",
            "color": "rose",
            "recommendation": "REJECT CREDENTIAL · COUNTERFEIT AADHAAR CARD WITH MATHEMATICAL FRAUD",
            "evidence_list": [
                {
                    "severity": "CRITICAL",
                    "title": "Verhoeff Checksum Violation",
                    "detail": "Aadhaar UID number fails mathematical dihedral check digit verification. Card is forged."
                },
                {
                    "severity": "CRITICAL",
                    "title": "Neural Tampering Detected",
                    "detail": "SRM-ResNet detected digital photo inpainting in citizen portrait quadrant."
                }
            ]
        }
    },
    {
        "case_id": "CASE_BENCH_06",
        "doc_type": "VISA",
        "holder_name": "AMITABH SEN",
        "doc_image_url": "/static/samples/scenario6_forged_visa_stamp.jpg",
        "live_image_url": "/static/samples/presenter_rohit_matching.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 90.0,
            "laplacian_variance": 395.0,
            "glare_ratio": 0.03,
            "resolution": "1920x1080",
            "details": "Consular entry vignette scan"
        },
        "tampering": {
            "tampering_score": 72.0,
            "classical_score": 75.0,
            "neural_score": 69.0,
            "is_tampered": True,
            "ela_heatmap_url": "/static/samples/scenario6_forged_visa_stamp.jpg",
            "boundary_overlay_url": "/static/samples/scenario6_forged_visa_stamp.jpg",
            "neural_heatmap_url": "/static/samples/scenario6_forged_visa_stamp.jpg",
            "evidence_list": [
                {
                    "type": "STAMP_DISTORTION",
                    "severity": "HIGH",
                    "title": "Consular Seal Geometric Deformation",
                    "description": "Entry seal circularity metric (0.64) deviates from official 0.92+ standard."
                },
                {
                    "type": "METADATA_TRACE",
                    "severity": "HIGH",
                    "title": "Software Export Metadata Trace",
                    "description": "Image structure exhibits Adobe Photoshop CC metadata residue."
                }
            ]
        },
        "face_match": {
            "success": True,
            "is_match": True,
            "match_score": 92.5,
            "euclidean_distance": 0.34,
            "cosine_similarity": 0.925,
            "face_risk": 7.5,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_rohit_matching.jpg"
        },
        "validation": {
            "doc_type": "VISA",
            "viz_fields": {
                "doc_number": "V8391024",
                "full_name": "AMITABH SEN",
                "dob": "28/02/1985",
                "nationality": "INDIAN",
                "expiry_date": "01/07/2026",
                "issuing_authority": "Ministry of External Affairs (Consular Wing)",
                "visa_type": "TOURIST (T)"
            },
            "watchlist": {
                "is_hit": False,
                "status_banner": "✓ No active Interpol notices or travel bans found on international databases."
            }
        },
        "risk_assessment": {
            "composite_score": 72.0,
            "risk_level": "HIGH",
            "color": "rose",
            "recommendation": "SECONDARY INSPECTION · FORGED CONSULAR IMMIGRATION STAMP DETECTED",
            "evidence_list": [
                {
                    "severity": "HIGH",
                    "title": "Entry Seal Deformation",
                    "detail": "Consular stamp circularity and ink-bleed density fail authentic border specifications."
                },
                {
                    "severity": "HIGH",
                    "title": "Digital Manipulation Metadata",
                    "detail": "File analysis confirms image was modified using photo-editing software prior to presentation."
                }
            ]
        }
    },
    {
        "case_id": "CASE_BENCH_07",
        "doc_type": "PASSPORT",
        "holder_name": "VIKRAM SINGHANIA",
        "doc_image_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
        "live_image_url": "/static/samples/presenter_rohit_matching.jpg",
        "quality_gate": {
            "passed": True,
            "quality_score": 96.0,
            "laplacian_variance": 480.0,
            "glare_ratio": 0.02,
            "resolution": "1920x1080",
            "details": "High clarity scan triggering multi-vector watchlist query"
        },
        "tampering": {
            "tampering_score": 5.0,
            "classical_score": 4.5,
            "neural_score": 5.5,
            "is_tampered": False,
            "ela_heatmap_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
            "boundary_overlay_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
            "neural_heatmap_url": "/static/samples/scenario1_genuine_indian_passport.jpg",
            "evidence_list": []
        },
        "face_match": {
            "success": True,
            "is_match": True,
            "match_score": 93.0,
            "euclidean_distance": 0.34,
            "cosine_similarity": 0.93,
            "face_risk": 7.0,
            "doc_face_crop_url": "/static/samples/portraits/rohit_base.jpg",
            "live_face_crop_url": "/static/samples/presenter_rohit_matching.jpg"
        },
        "validation": {
            "doc_type": "PASSPORT",
            "viz_fields": {
                "full_name": "VIKRAM SINGHANIA",
                "doc_number": "P9823412",
                "nationality": "INDIAN",
                "dob": "15/08/1987",
                "expiry_date": "09/01/2031",
                "gender": "M",
                "issuing_authority": "GOVERNMENT OF INDIA"
            },
            "mrz": {
                "all_checks_passed": True,
                "doc_number": "P9823412",
                "dob": "15/08/1987",
                "expiry": "09/01/2031",
                "composite_check": "VALID"
            },
            "cross_validation": {
                "is_consistent": True,
                "discrepancies": []
            },
            "watchlist": {
                "is_hit": True,
                "severity": "CRITICAL",
                "notice_id": "INTERPOL-RN-2026-9041",
                "notice_type": "INTERPOL RED NOTICE",
                "category": "CRITICAL_WARRANT",
                "target_name": "VIKRAM SINGHANIA",
                "issuing_state": "India / CBI Interpol NCB",
                "offense": "Transnational Financial Forgery, Identity Fraud & Wire Laundering",
                "action_required": "IMMEDIATE PASSENGER ARREST & IMMIGRATION DETAINMENT",
                "matched_on": [
                    "Passport Number 'P9823412' matched on Interpol wanted registry",
                    "Subject Name 'VIKRAM SINGHANIA' and DOB '15/08/1987' match Red Notice subject"
                ],
                "status_banner": "🚨 INTERPOL RED NOTICE ACTIVE HIT: INTERPOL-RN-2026-9041"
            }
        },
        "risk_assessment": {
            "composite_score": 100.0,
            "risk_level": "CRITICAL",
            "color": "rose",
            "recommendation": "🚨 INTERPOL RED NOTICE HIT: Transnational Financial Forgery. Directive: IMMEDIATE PASSENGER ARREST & IMMIGRATION DETAINMENT.",
            "evidence_list": [
                {
                    "severity": "CRITICAL",
                    "title": "INTERPOL RED NOTICE HIT (INTERPOL-RN-2026-9041)",
                    "detail": "Passport Number 'P9823412' and Subject Name 'VIKRAM SINGHANIA' match Red Notice subject. Directive: IMMEDIATE PASSENGER ARREST & IMMIGRATION DETAINMENT."
                }
            ]
        }
    }
]


def seed_pristine_benchmark_cases(clear_first: bool = False) -> int:
    """
    Seeds the screening queue and audit ledger with pristine benchmark scenarios.
    If clear_first is True, removes all previous records first.
    """
    if clear_first:
        case_store.clear()
        audit_ledger.clear()

    now = datetime.now(timezone.utc)
    seeded_count = 0

    for idx, case_template in enumerate(PRISTINE_BENCHMARK_CASES):
        case_id = case_template["case_id"]
        # If already exists and clear_first is False, do not duplicate
        if not clear_first and case_store.get_case(case_id):
            continue

        case_data = dict(case_template)
        # Stagger created timestamps so they display chronologically
        case_time = (now - timedelta(minutes=(len(PRISTINE_BENCHMARK_CASES) - idx) * 15)).isoformat()
        case_data["created_at"] = case_time

        # Record into cryptographic ledger
        audit_entry = audit_ledger.record_event(
            case_id=case_id,
            action="BENCHMARK_CASE_VERIFIED",
            officer_id="IND-SSB-8294",
            verdict="CLEARED" if case_data["risk_assessment"]["risk_level"] == "LOW" else "SECONDARY_REVIEW",
            risk_score=case_data["risk_assessment"]["composite_score"],
            notes=f"Pristine benchmark scenario: {case_data['risk_assessment']['recommendation']}"
        )
        case_data["audit_entry"] = audit_entry

        case_store.save_case(case_id, case_data)
        seeded_count += 1

    return seeded_count
