"""
Unit tests for Risk Scoring Engine (PDD Section 10).
"""

import unittest
from app.modules.risk_engine import compute_composite_risk


class TestRiskScoring(unittest.TestCase):

    def test_low_risk_genuine_case(self):
        val_res = {
            "mrz": {"all_checks_passed": True, "is_expired": False},
            "cross_validation": {"is_consistent": True}
        }
        tamp_res = {"tampering_score": 5.0, "evidence_list": []}
        face_res = {"success": True, "is_match": True, "face_risk": 5.0, "liveness": {"is_live": True}}

        res = compute_composite_risk(val_res, tamp_res, face_res)
        self.assertEqual(res["risk_level"], "LOW")
        self.assertEqual(res["risk_color"], "green")
        self.assertLessEqual(res["composite_score"], 30.0)

    def test_high_risk_photo_tampered(self):
        val_res = {
            "mrz": {"all_checks_passed": True, "is_expired": False},
            "cross_validation": {"is_consistent": True}
        }
        tamp_res = {
            "tampering_score": 88.0,
            "evidence_list": [
                {"severity": "CRITICAL", "title": "Photo Splice Detected", "description": "Sharp cut border"}
            ]
        }
        face_res = {"success": True, "is_match": False, "face_risk": 85.0}

        res = compute_composite_risk(val_res, tamp_res, face_res)
        self.assertEqual(res["risk_level"], "HIGH")
        self.assertEqual(res["risk_color"], "red")
        self.assertGreaterEqual(res["composite_score"], 70.0)
        self.assertTrue(any(ev["severity"] == "CRITICAL" for ev in res["evidence_items"]))

    def test_critical_anomaly_floor(self):
        # Even if validation is 0 and metadata is 0, a critical 90% tampering score
        # must elevate the composite score to HIGH tier (>= 72.0)
        val_res = {"mrz": {"all_checks_passed": True, "is_expired": False}}
        tamp_res = {"tampering_score": 90.0, "evidence_list": []}
        face_res = {"success": True, "is_match": True, "face_risk": 5.0}

        res = compute_composite_risk(val_res, tamp_res, face_res)
        self.assertEqual(res["risk_level"], "HIGH")
        self.assertGreaterEqual(res["composite_score"], 72.0)


if __name__ == "__main__":
    unittest.main()
