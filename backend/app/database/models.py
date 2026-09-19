"""
ForgeProof SQLAlchemy ORM Database Models
Defines schema for screening cases, extracted metadata, forensic scores, and immutable audit logs.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime
from sqlalchemy.sql import func
from app.database.session import Base


class CaseModel(Base):
    """Stores full document screening cases, extracted fields, and forensic metrics."""
    __tablename__ = "cases"

    case_id = Column(String(64), primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    doc_type = Column(String(32), nullable=False, index=True)
    
    # Image URLs
    doc_image_url = Column(String(256), nullable=False)
    live_image_url = Column(String(256), nullable=True)

    # Screening & Quality metrics
    quality_gate_passed = Column(Boolean, default=True, nullable=False)
    quality_score = Column(Float, default=1.0, nullable=False)

    # Forensics & Tampering
    tampering_score = Column(Float, default=0.0, nullable=False)
    is_tampered = Column(Boolean, default=False, nullable=False)

    # Biometrics
    face_match_score = Column(Float, nullable=True)
    face_is_match = Column(Boolean, nullable=True)

    # Risk Assessment
    composite_risk_score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String(32), default="LOW", nullable=False)
    recommendation = Column(Text, nullable=True)

    # Privacy-Compliant Extracted Fields (DPDP & Aadhaar Act compliant: Masked only)
    masked_id_number = Column(String(64), nullable=True)
    holder_name = Column(String(128), nullable=True)
    dob = Column(String(32), nullable=True)
    checksum_valid = Column(Boolean, nullable=True)

    # Serialized JSON representations for full UI response fidelity
    raw_payload = Column(Text, nullable=False)
    officer_decision = Column(Text, nullable=True)

    def to_dict(self) -> dict:
        """Helper to return basic case summary."""
        return {
            "case_id": self.case_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "doc_type": self.doc_type,
            "doc_image_url": self.doc_image_url,
            "live_image_url": self.live_image_url,
            "quality_score": self.quality_score,
            "tampering_score": self.tampering_score,
            "is_tampered": self.is_tampered,
            "face_match_score": self.face_match_score,
            "face_is_match": self.face_is_match,
            "composite_risk_score": self.composite_risk_score,
            "risk_level": self.risk_level,
            "recommendation": self.recommendation,
            "masked_id_number": self.masked_id_number,
            "holder_name": self.holder_name,
            "checksum_valid": self.checksum_valid,
        }


class AuditLedgerModel(Base):
    """
    Immutable Cryptographic SHA-256 Hash Chained Audit Ledger.
    Every screening case and border officer decision is cryptographically chained.
    """
    __tablename__ = "audit_ledger"

    entry_id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(64), nullable=False, index=True)
    timestamp = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)
    officer_id = Column(String(64), nullable=False)
    verdict = Column(String(64), nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    prev_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False)

    def to_dict(self) -> dict:
        return {
            "entry_id": self.entry_id,
            "case_id": self.case_id,
            "timestamp": self.timestamp,
            "action": self.action,
            "officer_id": self.officer_id,
            "verdict": self.verdict,
            "risk_score": self.risk_score,
            "notes": self.notes or "",
            "prev_hash": self.prev_hash,
            "entry_hash": self.entry_hash,
        }
