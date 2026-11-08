"""
Unit tests for the CLIMASCOPE Climate Debt Engine.
Verifies normalization, configurable weights, missing data handling,
collinearity dampening, historical trend velocity, and schema conformity.
"""

import unittest
from datetime import datetime, timedelta
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.climate_debt_engine import (
    ClimateDebtEngine,
    ClimateDebtInputs,
    ClimateDebtWeights,
    HistoricalObservation,
)


class TestClimateDebtEngine(unittest.TestCase):

    def setUp(self):
        self.engine = ClimateDebtEngine()

    def test_schema_keys_and_types(self):
        """Verifies the exact JSON response contract mandated by specification."""
        inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=4.2,
            vegetation_loss_pct=22.5,
            built_up_growth_pct=78.0,
            flood_exposure_idx=0.65,
            air_pollution_pm25=75.0,
            water_stress_idx=0.60,
            population_vulnerability_pct=31.0,
            intervention_coverage_pct=20.0
        )
        res = self.engine.calculate(ward_id="WRD-01", inputs=inputs)

        required_keys = [
            "wardId",
            "climateDebt",
            "riskLevel",
            "heatRisk",
            "floodRisk",
            "vegetationLoss",
            "builtUpGrowth",
            "vulnerability",
            "adaptiveCapacity",
            "trend",
            "confidence",
            "contributingFactors",
        ]
        for key in required_keys:
            self.assertIn(key, res, f"Missing required response key: {key}")

        self.assertEqual(res["wardId"], "WRD-01")
        self.assertIsInstance(res["climateDebt"], (int, float))
        self.assertIsInstance(res["riskLevel"], str)
        self.assertIn(res["riskLevel"], ["CRITICAL", "ELEVATED", "MODERATE", "LOW"])
        self.assertIsInstance(res["heatRisk"], (int, float))
        self.assertIsInstance(res["floodRisk"], (int, float))
        self.assertIsInstance(res["vegetationLoss"], (int, float))
        self.assertIsInstance(res["builtUpGrowth"], (int, float))
        self.assertIsInstance(res["vulnerability"], (int, float))
        self.assertIsInstance(res["adaptiveCapacity"], (int, float))
        self.assertIsInstance(res["trend"], str)
        self.assertIn(res["trend"], ["ACCELERATING", "INCREASING", "STABLE", "RECOVERING"])
        self.assertIsInstance(res["confidence"], (int, float))
        self.assertIsInstance(res["contributingFactors"], list)
        self.assertGreater(len(res["contributingFactors"]), 0)

        # Check factor item contract
        factor = res["contributingFactors"][0]
        self.assertIn("factor", factor)
        self.assertIn("category", factor)
        self.assertIn("rawValue", factor)
        self.assertIn("normalizedScore", factor)
        self.assertIn("weight", factor)
        self.assertIn("contributionPoints", factor)
        self.assertIn("direction", factor)

    def test_normalization_bounds_and_clamping(self):
        """Verifies boundary conditions: scores are strictly clamped to [0, 100]."""
        # Beyond maximum indicators
        extreme_inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=25.0, # Beyond max 8.0
            vegetation_loss_pct=100.0,          # Beyond max 35.0
            built_up_growth_pct=150.0,          # Beyond max 100
            flood_exposure_idx=2.5,             # Beyond max 1.0
            air_pollution_pm25=500.0,           # Beyond max 150
            water_stress_idx=3.0,               # Beyond max 1.0
            population_vulnerability_pct=90.0,  # Beyond max 40%
            intervention_coverage_pct=0.0
        )
        norm, conf, _ = self.engine.normalize_indicators(extreme_inputs)
        for key, val in norm.items():
            self.assertGreaterEqual(val, 0.0, f"{key} below 0")
            self.assertLessEqual(val, 100.0, f"{key} exceeded 100")

        res = self.engine.calculate("EXTREME", extreme_inputs)
        self.assertLessEqual(res["climateDebt"], 100.0)
        self.assertGreaterEqual(res["climateDebt"], 85.0)
        self.assertEqual(res["riskLevel"], "CRITICAL")

    def test_pristine_baseline_zero_debt(self):
        """Verifies that an ecologically pristine ward has low climate debt."""
        pristine_inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=0.0,
            vegetation_loss_pct=0.0,
            built_up_growth_pct=5.0,
            flood_exposure_idx=0.05,
            air_pollution_pm25=12.0, # Below 15 ug/m3
            water_stress_idx=0.05,
            population_vulnerability_pct=2.0,
            intervention_coverage_pct=85.0
        )
        res = self.engine.calculate("PRISTINE", pristine_inputs)
        self.assertLess(res["climateDebt"], 20.0)
        self.assertIn(res["riskLevel"], ["STABLE", "LOW"])
        self.assertGreater(res["adaptiveCapacity"], 70.0)

    def test_missing_data_imputation_and_confidence(self):
        """Verifies that missing indicators are imputed and confidence is deducted."""
        # 3 missing indicators
        partial_inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=3.8,
            vegetation_loss_pct=None, # Missing 1
            built_up_growth_pct=70.0,
            flood_exposure_idx=None,  # Missing 2
            air_pollution_pm25=None,  # Missing 3
            water_stress_idx=0.50,
            population_vulnerability_pct=25.0
        )
        norm, conf, meta = self.engine.normalize_indicators(partial_inputs)
        self.assertEqual(meta["missing_count"], 3)
        self.assertEqual(len(meta["imputed_fields"]), 3)
        # 100 - (3 * 8.0) = 76.0
        self.assertEqual(conf, 76.0)

        # Output calculation should still succeed deterministically
        res = self.engine.calculate("PARTIAL", partial_inputs)
        self.assertEqual(res["confidence"], 76.0)
        self.assertGreater(res["climateDebt"], 0)

    def test_collinearity_dampening(self):
        """Verifies correlation dampening prevents score inflation when both built-up and flood are high."""
        high_built_only = ClimateDebtInputs(
            surface_temp_anomaly_celsius=3.0,
            vegetation_loss_pct=15.0,
            built_up_growth_pct=90.0,
            flood_exposure_idx=0.30, # Low flood
            air_pollution_pm25=40.0,
            water_stress_idx=0.40,
            population_vulnerability_pct=20.0
        )
        high_both = ClimateDebtInputs(
            surface_temp_anomaly_celsius=3.0,
            vegetation_loss_pct=15.0,
            built_up_growth_pct=90.0,
            flood_exposure_idx=0.90, # High flood, collinear
            air_pollution_pm25=40.0,
            water_stress_idx=0.40,
            population_vulnerability_pct=20.0
        )
        norm_both, _, _ = self.engine.normalize_indicators(high_both)
        # Without dampening, norm_flood would be 90.0. With dampening, it should be damped down:
        self.assertLess(norm_both["norm_flood"], 90.0)

    def test_configurable_weights(self):
        """Verifies that custom weights alter the relative contribution and net debt score."""
        inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=7.5, # Very high heat
            vegetation_loss_pct=5.0,
            built_up_growth_pct=30.0,
            flood_exposure_idx=0.10,         # Very low flood
            air_pollution_pm25=30.0,
            water_stress_idx=0.20,
            population_vulnerability_pct=15.0
        )

        # Standard weights (Heat: 0.30, Flood: 0.25)
        res_default = self.engine.calculate("W1", inputs)

        # Heat-focused weights (Heat: 0.60, Flood: 0.05, Deg: 0.20, Vuln: 0.15)
        heat_heavy_weights = ClimateDebtWeights(
            w_heat=0.60,
            w_flood=0.05,
            w_degradation=0.20,
            w_vulnerability=0.15
        )
        self.assertTrue(heat_heavy_weights.validate())
        res_heat_heavy = self.engine.calculate("W1", inputs, custom_weights=heat_heavy_weights)

        # Because heat is elevated and flood is low, increasing heat weight must increase net score
        self.assertGreater(res_heat_heavy["climateDebt"], res_default["climateDebt"])

    def test_historical_velocity_and_trend(self):
        """Verifies rate of change classification over historical observation series."""
        now = datetime.utcnow()

        # Accelerating series: Debt increased by +12 points over 2 years (+6.0/yr > 2.0)
        accelerating_series = [
            HistoricalObservation(timestamp=now - timedelta(days=730), debt_score=60.0),
            HistoricalObservation(timestamp=now - timedelta(days=365), debt_score=66.0),
            HistoricalObservation(timestamp=now, debt_score=72.0),
        ]
        self.assertEqual(self.engine.calculate_trend(accelerating_series), "ACCELERATING")

        # Stable series: Debt changed by +0.1 points over 1 year
        stable_series = [
            HistoricalObservation(timestamp=now - timedelta(days=365), debt_score=50.0),
            HistoricalObservation(timestamp=now, debt_score=50.1),
        ]
        self.assertEqual(self.engine.calculate_trend(stable_series), "STABLE")

        # Recovering series: Debt dropped by -4.0 points over 1 year (-4.0/yr < -0.5)
        recovering_series = [
            HistoricalObservation(timestamp=now - timedelta(days=365), debt_score=68.0),
            HistoricalObservation(timestamp=now, debt_score=64.0),
        ]
        self.assertEqual(self.engine.calculate_trend(recovering_series), "RECOVERING")


if __name__ == "__main__":
    unittest.main()
