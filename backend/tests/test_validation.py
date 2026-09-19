"""
Unit tests for Document Validation Engine (ICAO Doc 9303, UIDAI Verhoeff, PAN, DL).
"""

import unittest
from app.modules.validation_engine import (
    calculate_mrz_check_digit,
    validate_verhoeff_aadhaar,
    verify_aadhaar,
    verify_pan_card,
    verify_indian_driving_licence,
    cross_validate_mrz_and_viz,
    validate_icao_mrz,
)


class TestDocumentValidation(unittest.TestCase):

    def test_icao_mrz_check_digit(self):
        # ICAO Doc 9303 7-3-1 calculation test
        # e.g. Document number "Z4829103" -> check digit is "6"
        # Calculation:
        # Z(35)*7 + 4*3 + 8*1 + 2*7 + 9*3 + 1*1 + 0*7 + 3*3 = 245 + 12 + 8 + 14 + 27 + 1 + 0 + 9 = 316 % 10 = 6
        check = calculate_mrz_check_digit("Z4829103")
        self.assertEqual(check, "6")

        # Test date of birth "940815" -> check digit is "9"
        # 9*7 + 4*3 + 0*1 + 8*7 + 1*3 + 5*1 = 63 + 12 + 0 + 56 + 3 + 5 = 139 % 10 = 9
        dob_check = calculate_mrz_check_digit("940815")
        self.assertEqual(dob_check, "9")

    def test_verhoeff_aadhaar_algorithm(self):
        # Genuine Aadhaar: "4921 7840 3927" -> Valid
        self.assertTrue(validate_verhoeff_aadhaar("4921 7840 3927"))
        
        # Tampered / Fabricated Aadhaar: "4921 7840 3929" -> Invalid (fails dihedral group check)
        self.assertFalse(validate_verhoeff_aadhaar("4921 7840 3929"))
        
        # Another genuine Aadhaar number
        self.assertTrue(validate_verhoeff_aadhaar("9999 4105 7058"))
        # Tampered last digit
        self.assertFalse(validate_verhoeff_aadhaar("9999 4105 7059"))

    def test_aadhaar_verification_structure(self):
        valid_res = verify_aadhaar("4921 7840 3927", full_name="Rohit Sharma")
        self.assertTrue(valid_res["is_valid"])
        self.assertEqual(valid_res["risk_penalty"], 0.0)

        fake_res = verify_aadhaar("4921 7840 3929", full_name="Rohit Sharma")
        self.assertFalse(fake_res["is_valid"])
        self.assertGreater(fake_res["risk_penalty"], 50.0)

    def test_pan_card_validation(self):
        # Valid individual PAN: ABCPS1234F (4th char 'P' = person, 5th char 'S' = Sharma)
        res_valid = verify_pan_card("ABCPS1234F", full_name="Rohit Sharma")
        self.assertTrue(res_valid["is_valid"])

        # Invalid PAN structure
        res_invalid = verify_pan_card("12345ABCDE", full_name="Rohit Sharma")
        self.assertFalse(res_invalid["is_valid"])

    def test_driving_licence_validation(self):
        res = verify_indian_driving_licence("DL-0420110012345")
        self.assertTrue(res["is_valid"])

    def test_cross_validation_viz_and_mrz(self):
        viz_data = {
            "doc_number": "Z4829103",
            "full_name": "ROHIT SHARMA",
            "expiry_date": "09/01/2031"
        }
        mrz_data = {
            "doc_number": "Z4829103",
            "full_name": "ROHIT SHARMA",
            "expiry": "09/01/2031"
        }
        # Consistent
        res = cross_validate_mrz_and_viz(viz_data, mrz_data)
        self.assertTrue(res["is_consistent"])

        # Tampered printed expiry year (e.g. 2036 vs 2031)
        tampered_viz = {
            "doc_number": "Z4829103",
            "full_name": "ROHIT SHARMA",
            "expiry_date": "09/01/2036"
        }
        tampered_res = cross_validate_mrz_and_viz(tampered_viz, mrz_data)
        self.assertFalse(tampered_res["is_consistent"])
        self.assertEqual(len(tampered_res["discrepancies"]), 1)
        self.assertEqual(tampered_res["discrepancies"][0]["field"], "Expiry Date")


if __name__ == "__main__":
    unittest.main()
