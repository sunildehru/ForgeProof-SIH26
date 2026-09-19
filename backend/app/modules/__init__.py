from app.modules.ocr_engine import parse_mrz_td3, parse_mrz_td1, extract_document_fields
from app.modules.validation_engine import (
    validate_icao_mrz,
    verify_aadhaar,
    verify_pan_card,
    verify_indian_driving_licence,
    cross_validate_mrz_and_viz,
    validate_verhoeff_aadhaar,
    calculate_mrz_check_digit
)
from app.modules.tampering_engine import run_comprehensive_forensics
from app.modules.face_engine import verify_faces
from app.modules.risk_engine import compute_composite_risk
