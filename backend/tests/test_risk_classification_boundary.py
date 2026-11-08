"""
CLIMASCOPE Risk Classification Boundary Tests (Prompt 17B)
==========================================================

Verifies authoritative classification thresholds and boundary cases:
- > 75.0:          CRITICAL
- 60.0 <= score <= 75.0: ELEVATED
- 40.0 <= score < 60.0:  MODERATE
- < 40.0:          STABLE

Boundary Test Requirements:
- 39.9 -> STABLE
- 40.0 -> MODERATE
- 59.9 -> MODERATE
- 60.0 -> ELEVATED
- 75.0 -> ELEVATED
- 75.1 -> CRITICAL
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.risk_classification import get_climate_risk_tier, RISK_COLORS, get_risk_color
from app.services.climate_debt_engine import ClimateDebtEngine


class TestRiskClassificationBoundary(unittest.TestCase):

    def test_prompt_17b_required_boundaries(self):
        """Test the exact boundary cases specified in Prompt 17B."""
        test_cases = [
            (39.9, "STABLE", "#16A34A"),
            (40.0, "MODERATE", "#0EA5E9"),
            (59.9, "MODERATE", "#0EA5E9"),
            (60.0, "ELEVATED", "#F59E0B"),
            (75.0, "ELEVATED", "#F59E0B"),
            (75.1, "CRITICAL", "#DC3545"),
        ]
        for score, expected_tier, expected_color in test_cases:
            tier = get_climate_risk_tier(score)
            self.assertEqual(
                tier,
                expected_tier,
                f"Boundary score {score} expected {expected_tier}, got {tier}"
            )
            color = get_risk_color(score)
            self.assertEqual(
                color,
                expected_color,
                f"Boundary score {score} expected color {expected_color}, got {color}"
            )

    def test_climate_debt_engine_static_method(self):
        """Verify that ClimateDebtEngine.get_risk_level matches authoritative classification."""
        test_cases = [
            (39.9, "STABLE"),
            (40.0, "MODERATE"),
            (59.9, "MODERATE"),
            (60.0, "ELEVATED"),
            (75.0, "ELEVATED"),
            (75.1, "CRITICAL"),
        ]
        for score, expected_tier in test_cases:
            tier = ClimateDebtEngine.get_risk_level(score)
            self.assertEqual(
                tier,
                expected_tier,
                f"ClimateDebtEngine score {score} expected {expected_tier}, got {tier}"
            )

    def test_seven_study_area_scores(self):
        """Verify authoritative classifications for all seven PMR study areas."""
        study_areas = [
            ("WRD-01", "PMR-HAD-01", 84.2, "CRITICAL", "#DC3545"),
            ("WRD-02", "PMR-KSB-02", 80.5, "CRITICAL", "#DC3545"),
            ("WRD-03", "PMR-MLM-03", 74.8, "ELEVATED", "#F59E0B"),
            ("WRD-04", "PMR-HNJ-04", 46.5, "MODERATE", "#0EA5E9"),
            ("WRD-05", "PMR-KTH-05", 24.2, "STABLE", "#16A34A"),
            ("WRD-06", "PMR-ADH-06", 59.4, "MODERATE", "#0EA5E9"),  # Prompt 17B critical fix!
            ("WRD-07", "PMR-BHS-07", 73.6, "ELEVATED", "#F59E0B"),
        ]
        for code, said, score, expected_tier, expected_color in study_areas:
            tier = get_climate_risk_tier(score)
            self.assertEqual(
                tier,
                expected_tier,
                f"Study area {code} ({said}) with score {score} expected {expected_tier}, got {tier}"
            )
            color = get_risk_color(score)
            self.assertEqual(
                color,
                expected_color,
                f"Study area {code} ({said}) expected color {expected_color}, got {color}"
            )


if __name__ == "__main__":
    unittest.main()
