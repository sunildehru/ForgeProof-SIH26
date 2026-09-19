"""
Unit tests for Cryptographic Audit Ledger Engine.
"""

import unittest
from app.storage.audit_ledger import AuditLedger


class TestAuditLedger(unittest.TestCase):

    def setUp(self):
        self.ledger = AuditLedger()
        self.ledger.clear()

    def test_genesis_block(self):
        logs = self.ledger.get_all_logs()
        self.assertGreaterEqual(len(logs), 1)
        genesis = logs[0]
        self.assertEqual(genesis["entry_id"], 0)
        self.assertEqual(genesis["prev_hash"], "0" * 64)
        self.assertTrue(self.ledger.verify_integrity())

    def test_hash_chaining(self):
        entry1 = self.ledger.record_event(
            case_id="CASE_TEST1",
            action="SCREENING_COMPLETED",
            officer_id="OFFICER_01",
            verdict="LOW",
            risk_score=12.5,
            notes="Passed"
        )
        self.assertEqual(entry1["entry_id"], 1)

        entry2 = self.ledger.record_event(
            case_id="CASE_TEST1",
            action="OFFICER_DECISION",
            officer_id="OFFICER_01",
            verdict="APPROVED",
            risk_score=12.5,
            notes="Officer cleared passenger"
        )
        self.assertEqual(entry2["prev_hash"], entry1["entry_hash"])
        self.assertTrue(self.ledger.verify_integrity())

    def test_tampering_detection(self):
        # Record events
        self.ledger.record_event("CASE_TEST1", "ACTION_1", "OFF_1", "LOW", 10.0)
        self.ledger.record_event("CASE_TEST2", "ACTION_2", "OFF_2", "HIGH", 85.0)
        self.assertTrue(self.ledger.verify_integrity())

        # Illegally tamper with an entry in the ledger
        self.ledger._chain[1]["verdict"] = "TAMPERED_VERDICT"

        # Integrity verification must detect the alteration and fail
        self.assertFalse(self.ledger.verify_integrity())


if __name__ == "__main__":
    unittest.main()
