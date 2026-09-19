"""
Cryptographic Audit Ledger Engine
Implements an immutable, SHA-256 hash-chained event ledger for all screening cases
and human-in-the-loop border officer decisions.
Persisted to SQLAlchemy (SQLite/PostgreSQL) so the cryptographic chain survives restarts.
Conforms to PDD Section 11 Non-Functional Requirements (Auditability & Integrity).
"""

import hashlib
import threading
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.database.models import AuditLedgerModel


class AuditLedger:
    """Thread-safe cryptographic SHA-256 hash-chained ledger backed by database persistence."""

    def __init__(self):
        self._lock = threading.Lock()
        self._chain: List[Dict[str, Any]] = []
        self._load_or_init_chain()

    def _load_or_init_chain(self):
        """Loads existing chain from database, or initializes the genesis block if empty."""
        db: Session = SessionLocal()
        try:
            records = db.query(AuditLedgerModel).order_by(AuditLedgerModel.entry_id.asc()).all()
            if records:
                self._chain = [r.to_dict() for r in records]
            else:
                self._init_genesis_block(db)
        except Exception:
            # Fallback for environment before table init
            self._init_genesis_block(None)
        finally:
            db.close()

    def _init_genesis_block(self, db: Optional[Session]):
        genesis_entry = {
            "entry_id": 0,
            "case_id": "SYSTEM_GENESIS",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "LEDGER_INITIALIZED",
            "officer_id": "SYSTEM_CORE",
            "verdict": "GENESIS",
            "risk_score": 0.0,
            "notes": "ForgeProof Immutable Cryptographic Ledger Genesis Block initialized.",
            "prev_hash": "0" * 64,
        }
        genesis_entry["entry_hash"] = self._compute_hash(genesis_entry)
        self._chain = [genesis_entry]

        if db is not None:
            try:
                db_entry = AuditLedgerModel(
                    entry_id=0,
                    case_id=genesis_entry["case_id"],
                    timestamp=genesis_entry["timestamp"],
                    action=genesis_entry["action"],
                    officer_id=genesis_entry["officer_id"],
                    verdict=genesis_entry["verdict"],
                    risk_score=genesis_entry["risk_score"],
                    notes=genesis_entry["notes"],
                    prev_hash=genesis_entry["prev_hash"],
                    entry_hash=genesis_entry["entry_hash"],
                )
                db.add(db_entry)
                db.commit()
            except Exception:
                db.rollback()

    def _compute_hash(self, entry: Dict[str, Any]) -> str:
        canonical_str = (
            f"{entry['entry_id']}|{entry['case_id']}|{entry['timestamp']}|"
            f"{entry['action']}|{entry['officer_id']}|{entry['verdict']}|"
            f"{entry['risk_score']:.1f}|{entry['notes']}|{entry['prev_hash']}"
        )
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def record_event(
        self,
        case_id: str,
        action: str,
        officer_id: str,
        verdict: str,
        risk_score: float,
        notes: Optional[str] = "",
    ) -> Dict[str, Any]:
        """Records a new event onto the cryptographic chain and persists to database."""
        with self._lock:
            prev_entry = self._chain[-1]
            entry_id = len(self._chain)
            timestamp = datetime.now(timezone.utc).isoformat()

            new_entry = {
                "entry_id": entry_id,
                "case_id": case_id,
                "timestamp": timestamp,
                "action": action,
                "officer_id": officer_id,
                "verdict": verdict,
                "risk_score": round(risk_score, 1),
                "notes": notes or "",
                "prev_hash": prev_entry["entry_hash"],
            }
            new_entry["entry_hash"] = self._compute_hash(new_entry)
            self._chain.append(new_entry)

            # Persist to DB
            db: Session = SessionLocal()
            try:
                db_record = AuditLedgerModel(
                    entry_id=entry_id,
                    case_id=case_id,
                    timestamp=timestamp,
                    action=action,
                    officer_id=officer_id,
                    verdict=verdict,
                    risk_score=new_entry["risk_score"],
                    notes=new_entry["notes"],
                    prev_hash=new_entry["prev_hash"],
                    entry_hash=new_entry["entry_hash"],
                )
                db.add(db_record)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

            return dict(new_entry)

    def verify_integrity(self) -> bool:
        """
        Verifies the cryptographic integrity of the entire audit chain.
        Returns False if any event has been tampered with, deleted, or reordered.
        """
        with self._lock:
            if not self._chain:
                return False

            for i in range(len(self._chain)):
                curr = self._chain[i]

                # Check hash self-consistency
                expected_hash = self._compute_hash(curr)
                if curr["entry_hash"] != expected_hash:
                    return False

                # Check chain link
                if i > 0:
                    prev = self._chain[i - 1]
                    if curr["prev_hash"] != prev["entry_hash"]:
                        return False

            return True

    def get_all_logs(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [dict(e) for e in self._chain]

    def get_case_logs(self, case_id: str) -> List[Dict[str, Any]]:
        with self._lock:
            return [dict(e) for e in self._chain if e["case_id"] == case_id]

    def clear(self) -> None:
        """Clears chain and re-initializes genesis block (used in tests)."""
        with self._lock:
            db: Session = SessionLocal()
            try:
                db.query(AuditLedgerModel).delete()
                db.commit()
                self._init_genesis_block(db)
            finally:
                db.close()


# Singleton instance shared across the application
audit_ledger = AuditLedger()
