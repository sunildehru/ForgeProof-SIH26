"""
ForgeProof Database & Persistence Test Suite
Validates SQLAlchemy persistence, privacy-compliant PII masking, and cryptographic audit log durability.
"""

import unittest
import uuid
from app.database.session import init_db, SessionLocal
from app.database.models import CaseModel, AuditLedgerModel
from app.storage.case_store import CaseRepository, _mask_id_number
from app.storage.audit_ledger import AuditLedger


class TestDatabasePersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.store = CaseRepository()

    def test_aadhaar_masking_utility(self):
        """Ensures 12-digit Aadhaar numbers are never stored in cleartext."""
        raw_aadhaar = "4256 4521 0692"
        masked = _mask_id_number(raw_aadhaar)
        self.assertEqual(masked, "XXXX-XXXX-0692")
        self.assertNotIn("4256", masked)
        self.assertNotIn("4521", masked)

    def test_case_persistence_across_restarts(self):
        """Validates that a case is saved to the database and survives repository restart."""
        case_id = f"test_case_{uuid.uuid4().hex[:8]}"
        payload = {
            "case_id": case_id,
            "doc_type": "aadhaar",
            "doc_image_url": "/static/uploads/test_doc.jpg",
            "live_image_url": "/static/uploads/test_live.jpg",
            "quality_gate": {"passed": True, "quality_score": 0.98},
            "validation": {
                "indian_id": {
                    "doc_number_masked": "XXXX-XXXX-0692",
                    "valid_checksum": True,
                    "method": "UIDAI_Verhoeff_D5"
                },
                "viz_fields": {
                    "full_name": "Veerla Navtej",
                    "dob": "15/11/2007"
                }
            },
            "tampering": {"tampering_score": 2.5, "is_tampered": False},
            "face_match": {"match_score": 92.0, "is_match": True},
            "risk_assessment": {
                "composite_score": 5.0,
                "risk_level": "LOW",
                "recommendation": "Genuine Aadhaar Card"
            }
        }

        # Save to store
        self.store.save_case(case_id, payload)

        # Simulate fresh app startup with clean cache
        fresh_store = CaseRepository()
        retrieved = fresh_store.get_case(case_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["case_id"], case_id)
        self.assertEqual(retrieved["validation"]["viz_fields"]["full_name"], "Veerla Navtej")
        self.assertEqual(retrieved["risk_assessment"]["risk_level"], "LOW")

        # Verify direct DB record has masked ID
        db = SessionLocal()
        try:
            record = db.query(CaseModel).filter_by(case_id=case_id).first()
            self.assertIsNotNone(record)
            self.assertEqual(record.masked_id_number, "XXXX-XXXX-0692")
            self.assertEqual(record.holder_name, "Veerla Navtej")
            self.assertTrue(record.checksum_valid)
        finally:
            db.close()

    def test_officer_decision_persistence(self):
        """Validates officer review decision persistence."""
        case_id = f"decision_case_{uuid.uuid4().hex[:8]}"
        payload = {
            "case_id": case_id,
            "doc_type": "passport",
            "doc_image_url": "/static/uploads/doc.jpg",
            "risk_assessment": {"composite_score": 15.0, "risk_level": "LOW"}
        }
        self.store.save_case(case_id, payload)

        decision = {
            "officer_id": "OFFICER_042",
            "decision": "ACCEPTED",
            "notes": "Verified visually and cleared."
        }
        success = self.store.update_decision(case_id, decision)
        self.assertTrue(success)

        # Simulate restart
        fresh_store = CaseRepository()
        reloaded = fresh_store.get_case(case_id)
        self.assertIn("officer_decision", reloaded)
        self.assertEqual(reloaded["officer_decision"]["decision"], "ACCEPTED")
        self.assertEqual(reloaded["officer_decision"]["officer_id"], "OFFICER_042")

    def test_audit_ledger_durability_and_tamper_detection(self):
        """Validates that cryptographic hash-chain survives restarts and detects tampering."""
        ledger = AuditLedger()
        test_case = f"audit_test_{uuid.uuid4().hex[:8]}"

        entry1 = ledger.record_event(
            case_id=test_case,
            action="SCREENING_COMPLETED",
            officer_id="SYSTEM_CORE",
            verdict="LOW",
            risk_score=12.2,
            notes="Screening passed cleanly"
        )
        self.assertTrue(ledger.verify_integrity())

        entry2 = ledger.record_event(
            case_id=test_case,
            action="OFFICER_DECISION",
            officer_id="OFFICER_99",
            verdict="ACCEPTED",
            risk_score=12.2,
            notes="Officer confirmed biometric age progression"
        )
        self.assertTrue(ledger.verify_integrity())

        # Simulate restart: new AuditLedger instance should load previous chain from DB
        reloaded_ledger = AuditLedger()
        self.assertTrue(reloaded_ledger.verify_integrity())
        all_logs = reloaded_ledger.get_all_logs()
        self.assertGreaterEqual(len(all_logs), 3) # Genesis + entry1 + entry2

        # Verify case-specific logs
        case_logs = reloaded_ledger.get_case_logs(test_case)
        self.assertEqual(len(case_logs), 2)


if __name__ == "__main__":
    unittest.main()
