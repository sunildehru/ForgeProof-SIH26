"""
ForgeProof Pydantic Schemas
Strictly typed data schemas conforming to PDD Section 9.1 REST APIs.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# 1. Quality Gate
# -----------------------------------------------------------------------------
class QualityGateResult(BaseModel):
    passed: bool = Field(..., description="True if image meets minimum quality standards")
    quality_score: float = Field(..., ge=0.0, le=100.0)
    blur_metric: float
    blur_status: str
    glare_percentage: float
    glare_status: str
    resolution: str
    resolution_ok: bool
    feedback: str


# -----------------------------------------------------------------------------
# 2. Module 1: OCR Extraction & Module 2: Document Validation
# -----------------------------------------------------------------------------
class VIZFields(BaseModel):
    doc_number: Optional[str] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    nationality: Optional[str] = None
    dob: Optional[str] = None
    expiry_date: Optional[str] = None
    gender: Optional[str] = None
    issuing_authority: Optional[str] = None
    place_of_issue: Optional[str] = None


class MRZCheckItem(BaseModel):
    check: str
    passed: bool
    computed: Optional[str] = None
    actual: Optional[str] = None


class MRZData(BaseModel):
    format: str = "TD3"
    raw_lines: List[str] = Field(default_factory=list)
    doc_code: Optional[str] = None
    issuing_country: Optional[str] = None
    doc_number: Optional[str] = None
    nationality: Optional[str] = None
    dob: Optional[str] = None
    expiry: Optional[str] = None
    gender: Optional[str] = None
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    all_checks_passed: bool = True
    check_results: List[MRZCheckItem] = Field(default_factory=list)
    is_expired: bool = False


class CrossValidationDiscrepancy(BaseModel):
    field: str
    viz_value: str
    mrz_value: str


class CrossValidationResult(BaseModel):
    is_consistent: bool = True
    discrepancies: List[CrossValidationDiscrepancy] = Field(default_factory=list)


class IndianIDCheck(BaseModel):
    id_type: str # "AADHAAR", "PAN", "DRIVING_LICENCE"
    doc_number_masked: str
    is_valid: bool
    checksum_type: str # e.g. "Verhoeff D5", "ITD Format Check"
    algorithm_detail: str
    checks: List[Dict[str, Any]] = Field(default_factory=list)
    risk_penalty: float = 0.0


class DocumentValidationResult(BaseModel):
    viz_fields: VIZFields
    mrz: Optional[MRZData] = None
    cross_validation: Optional[CrossValidationResult] = None
    indian_id: Optional[IndianIDCheck] = None


# -----------------------------------------------------------------------------
# 3. Module 3: Tampering Detection
# -----------------------------------------------------------------------------
class ELAResult(BaseModel):
    mean_error: float
    std_error: float
    spike_ratio: float
    tampering_score: float
    heatmap_path: Optional[str] = None
    anomaly_detected: bool


class BoundaryResult(BaseModel):
    edge_variance: float
    mean_edge: float
    boundary_score: float
    splicing_detected: bool
    overlay_path: Optional[str] = None


class NoiseResult(BaseModel):
    noise_variance: float
    noise_score: float
    noise_tampered: bool


class StampResult(BaseModel):
    has_stamp: bool
    stamp_circularity: float
    stamp_integrity_valid: bool
    stamp_score: float
    detail: str


class MetadataResult(BaseModel):
    has_exif: bool
    software_tag: str
    flags: List[str] = Field(default_factory=list)
    metadata_risk: float = 0.0


class ForensicEvidenceItem(BaseModel):
    type: str
    severity: str # "CRITICAL", "HIGH", "WARNING", "INFO"
    title: str
    description: str


class TamperingAnalysisResult(BaseModel):
    tampering_score: float = Field(..., ge=0.0, le=100.0)
    is_tampered: bool
    ela: Optional[ELAResult] = None
    boundary: Optional[BoundaryResult] = None
    noise: Optional[NoiseResult] = None
    stamp: Optional[StampResult] = None
    metadata: Optional[MetadataResult] = None
    evidence_list: List[ForensicEvidenceItem] = Field(default_factory=list)
    ela_heatmap_url: Optional[str] = None
    boundary_overlay_url: Optional[str] = None


# -----------------------------------------------------------------------------
# 4. Module 4: Face Verification
# -----------------------------------------------------------------------------
class LivenessResult(BaseModel):
    is_live: bool = True
    liveness_score: float = 95.0
    texture_variance: float = 80.0
    peak_frequency: float = 120.0
    attack_type: str = "None (Genuine Presenter)"


class FaceVerificationResult(BaseModel):
    success: bool
    match_score: float = Field(..., ge=0.0, le=100.0)
    euclidean_distance: Optional[float] = None
    is_match: bool
    face_risk: float = Field(..., ge=0.0, le=100.0)
    threshold: float = 0.38
    liveness: Optional[LivenessResult] = None
    doc_face_crop_url: Optional[str] = None
    live_face_crop_url: Optional[str] = None
    error: Optional[str] = None


# -----------------------------------------------------------------------------
# 5. Risk Assessment (PDD Section 10)
# -----------------------------------------------------------------------------
class EvidenceItem(BaseModel):
    severity: str # "CRITICAL", "HIGH", "WARNING", "INFO"
    title: str
    detail: str


class SubScores(BaseModel):
    validation_risk: float
    tampering_risk: float
    face_risk: float
    metadata_risk: float


class RiskAssessmentResult(BaseModel):
    composite_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str # "LOW", "MEDIUM", "HIGH"
    risk_color: str # "green", "amber", "red"
    recommendation: str
    sub_scores: SubScores
    evidence_items: List[EvidenceItem] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# 6. Audit & Decisions
# -----------------------------------------------------------------------------
class AuditEntry(BaseModel):
    entry_id: int
    case_id: str
    timestamp: str
    action: str
    officer_id: str
    verdict: str
    risk_score: float
    notes: str
    prev_hash: str
    entry_hash: str


class OfficerDecision(BaseModel):
    verdict: str # "APPROVED", "SECONDARY_REVIEW", "DENIED_DETAIN"
    officer_id: str
    notes: Optional[str] = None
    recorded_at: str


class LoginRequest(BaseModel):
    officer_id: Optional[str] = None
    username: Optional[str] = None
    password: str


class OfficerProfile(BaseModel):
    officer_id: str
    full_name: str
    badge_number: str
    rank: str
    duty_station: str
    clearance_level: str


class LoginResponse(BaseModel):
    success: bool
    token: str
    officer: OfficerProfile


class DecisionRequest(BaseModel):
    verdict: str = Field(..., description="Officer verdict: APPROVED, SECONDARY_REVIEW, or DENIED_DETAIN")
    officer_id: Optional[str] = "OFFICER_IND_829"
    notes: Optional[str] = "Inspection completed"


class DecisionResponse(BaseModel):
    success: bool
    case_id: str
    verdict: str
    officer_decision: OfficerDecision
    audit_entry: AuditEntry


class AuditLedgerResponse(BaseModel):
    integrity: bool
    total_entries: int
    ledger: List[AuditEntry]


# -----------------------------------------------------------------------------
# 7. Complete Case Screening Response (PDD Section 9.1)
# -----------------------------------------------------------------------------
class CaseScreeningResponse(BaseModel):
    case_id: str
    doc_type: str
    doc_image_url: str
    live_image_url: Optional[str] = None
    quality_gate: QualityGateResult
    validation: DocumentValidationResult
    tampering: TamperingAnalysisResult
    face_match: Optional[FaceVerificationResult] = None
    risk_assessment: RiskAssessmentResult
    audit_entry: AuditEntry
    officer_decision: Optional[OfficerDecision] = None
