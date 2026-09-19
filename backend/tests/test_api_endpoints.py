"""
Integration tests for FastAPI REST Endpoints conforming to PDD Section 9.1.
"""

import unittest
import os
import io
from fastapi.testclient import TestClient
from app.main import app
from app.config import SAMPLES_DIR


class TestAPIEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ONLINE")
        self.assertTrue(data["ledger_integrity"])

    def test_presets_list(self):
        res = self.client.get("/api/v1/presets")
        self.assertEqual(res.status_code, 200)
        presets = res.json()
        self.assertGreaterEqual(len(presets), 6)

    def test_run_preset_genuine_passport(self):
        res = self.client.post("/api/v1/cases/preset/scenario1_genuine_passport")
        self.assertEqual(res.status_code, 200)
        case = res.json()
        self.assertIn("case_id", case)
        self.assertEqual(case["risk_assessment"]["risk_level"], "LOW")
        self.assertIn("validation", case)
        self.assertIn("tampering", case)
        self.assertIn("face_match", case)

        case_id = case["case_id"]

        # Test individual PDD 9.1 endpoints
        res_ocr = self.client.get(f"/api/v1/cases/{case_id}/ocr")
        self.assertEqual(res_ocr.status_code, 200)
        self.assertIn("viz_fields", res_ocr.json())

        res_val = self.client.get(f"/api/v1/cases/{case_id}/validation")
        self.assertEqual(res_val.status_code, 200)

        res_tamper = self.client.get(f"/api/v1/cases/{case_id}/tampering")
        self.assertEqual(res_tamper.status_code, 200)

        res_face = self.client.get(f"/api/v1/cases/{case_id}/face-match")
        self.assertEqual(res_face.status_code, 200)

        res_risk = self.client.get(f"/api/v1/cases/{case_id}/risk-score")
        self.assertEqual(res_risk.status_code, 200)

        # Test officer decision recording
        res_decision = self.client.post(
            f"/api/v1/cases/{case_id}/decision",
            json={"verdict": "APPROVED", "officer_id": "OFFICER_IND_829", "notes": "Passenger cleared"}
        )
        self.assertEqual(res_decision.status_code, 200)
        dec_data = res_decision.json()
        self.assertTrue(dec_data["success"])
        self.assertEqual(dec_data["verdict"], "APPROVED")

    def test_audit_endpoint(self):
        res = self.client.get("/api/v1/audit")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["integrity"])
        self.assertGreaterEqual(data["total_entries"], 1)


if __name__ == "__main__":
    unittest.main()
