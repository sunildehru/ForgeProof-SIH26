"""
Unit tests for Image Quality Gate Engine.
"""

import unittest
import numpy as np
import cv2
import tempfile
import os

from app.core.quality_gate import evaluate_image_quality


class TestQualityGate(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        for f in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, f))
        os.rmdir(self.temp_dir)

    def test_sharp_image_passes(self):
        # Create a sharp image with high-frequency checkerboard pattern
        img = np.zeros((600, 800, 3), dtype=np.uint8)
        img[::20, :] = 255
        img[:, ::20] = 255
        path = os.path.join(self.temp_dir, "sharp.jpg")
        cv2.imwrite(path, img)

        res = evaluate_image_quality(path)
        self.assertTrue(res["passed"])
        self.assertEqual(res["blur_status"], "Sharp")
        self.assertGreater(res["quality_score"], 80.0)

    def test_blurred_image_flagged(self):
        # Create a blurred image with Gaussian blur
        img = np.random.randint(50, 200, (600, 800, 3), dtype=np.uint8)
        blurred = cv2.GaussianBlur(img, (31, 31), 10)
        path = os.path.join(self.temp_dir, "blurred.jpg")
        cv2.imwrite(path, blurred)

        res = evaluate_image_quality(path)
        self.assertEqual(res["blur_status"], "Blurred / Out of Focus")

    def test_low_resolution_flagged(self):
        # Create small 200x200 image
        img = np.zeros((200, 200, 3), dtype=np.uint8)
        path = os.path.join(self.temp_dir, "small.jpg")
        cv2.imwrite(path, img)

        res = evaluate_image_quality(path)
        self.assertFalse(res["resolution_ok"])
        self.assertFalse(res["passed"])


if __name__ == "__main__":
    unittest.main()
