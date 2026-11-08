import unittest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.schemas.simulation import SimulationInputs
from app.services.simulation_twin import SimulationTwinEngine

class TestSimulationTwinEngine(unittest.TestCase):
    def setUp(self):
        self.ward = Ward(
            id="WRD-TEST",
            code="WRD-TEST",
            name="Test Microclimate Ward",
            zone="Central Zone",
            area_sq_km=5.0,  # 5,000,000 m^2
            population=100000,
            vulnerable_population_pct=60.0,
            center_lat=18.5204,
            center_lon=73.8567,
            geometry_geojson='{"type":"Polygon","coordinates":[]}',
            canopy_cover_pct=10.0,
            impervious_surface_pct=65.0,
            albedo_avg=0.15,
            flood_susceptibility_idx=0.6,
            heat_index_celsius=40.0,
            baseline_risk_score=70.0,
            climate_debt_score=75.0,
            tree_canopy_deficit_sq_m=200000.0,
            status_badge="CRITICAL"
        )
        self.metric = ClimateMetric(
            ward_id=1,
            ndvi=0.25,
            ndbi=0.65,
            lst_celsius=40.0,
            surface_temp_anomaly=4.2,
            air_temp_celsius=36.0,
            relative_humidity_pct=45.0,
            aqi_pm25=80.0,
            precipitation_mm=12.0,
            runoff_coefficient=0.70,
            soil_moisture_pct=18.0,
            is_simulated=False,
            source="Sentinel-2 MultiSpectral Instrument",
            quality_flag="CALIBRATED_OBSERVATION"
        )

    def test_baseline_scenario(self):
        inputs = SimulationInputs(
            ward_id="WRD-TEST",
            trees_count=0,
            cool_roof_pct=0.0,
            permeable_surface_sq_m=0.0,
            green_corridor_sq_m=0.0,
            retention_capacity_m3=0.0,
            available_budget_usd=500000.0
        )
        result = SimulationTwinEngine.simulate(self.ward, self.metric, inputs)

        self.assertEqual(result.baseline.estimated_cost_usd, 0.0)
        self.assertEqual(result.simulated.estimated_cost_usd, 0.0)
        self.assertEqual(result.simulated.heat_risk_celsius, 40.0)
        self.assertEqual(result.simulated.green_coverage_pct, 10.0)
        self.assertEqual(result.simulated.climate_debt, 75.0)
        self.assertTrue(result.is_budget_sufficient)
        self.assertEqual(result.budget_surplus_deficit_usd, 500000.0)

    def test_compound_interventions(self):
        inputs = SimulationInputs(
            ward_id="WRD-TEST",
            trees_count=10000,              # 10,000 * $22 = $220,000. Area = 150,000 m2
            cool_roof_pct=25.0,             # 5,000,000 * 0.58 * 0.55 * 0.25 = 398,750 m2 * $8.5 = $3,389,375
            permeable_surface_sq_m=20000,   # 20,000 * $24 = $480,000
            green_corridor_sq_m=15000,      # 15,000 * $28 = $420,000
            retention_capacity_m3=10000,    # 10,000 * $35 = $350,000
            available_budget_usd=5000000.0
        )
        result = SimulationTwinEngine.simulate(self.ward, self.metric, inputs)

        # Check capex
        self.assertGreater(result.simulated.estimated_cost_usd, 4000000.0)
        self.assertTrue(result.is_budget_sufficient)

        # Check improvements
        self.assertLess(result.simulated.heat_risk_celsius, result.baseline.heat_risk_celsius)
        self.assertGreater(result.simulated.green_coverage_pct, result.baseline.green_coverage_pct)
        self.assertLess(result.simulated.surface_runoff_risk_pct, result.baseline.surface_runoff_risk_pct)
        self.assertLess(result.simulated.climate_debt, result.baseline.climate_debt)
        self.assertLess(result.simulated.population_exposure, result.baseline.population_exposure)

        # Check improvement metrics
        self.assertIn("climate_debt", result.improvements)
        self.assertTrue(result.improvements["climate_debt"].is_favorable)
        self.assertGreater(result.improvements["climate_debt"].pct_improvement, 0.0)

    def test_single_intervention_isolation(self):
        inputs = SimulationInputs(
            ward_id="WRD-TEST",
            trees_count=5000,
            cool_roof_pct=20.0,
            permeable_surface_sq_m=10000,
            green_corridor_sq_m=8000,
            retention_capacity_m3=5000,
            available_budget_usd=1000000.0
        )
        result = SimulationTwinEngine.simulate(self.ward, self.metric, inputs)

        expected_keys = [
            "Tree Plantation Only",
            "Cool Roofs Only",
            "Permeable Roads Only",
            "Green Corridors Only",
            "Retention Zones Only"
        ]
        for key in expected_keys:
            self.assertIn(key, result.single_interventions)

        tree_only = result.single_interventions["Tree Plantation Only"]
        self.assertEqual(tree_only.estimated_cost_inr, 5000 * 2200.0)
        self.assertEqual(tree_only.estimated_cost_usd, round((5000 * 2200.0) / 83.5, 2))
        self.assertGreater(tree_only.green_coverage_pct, result.baseline.green_coverage_pct)

    def test_budget_deficit(self):
        inputs = SimulationInputs(
            ward_id="WRD-TEST",
            trees_count=50000,
            cool_roof_pct=50.0,
            permeable_surface_sq_m=50000,
            green_corridor_sq_m=20000,
            retention_capacity_m3=20000,
            available_budget_usd=50000.0  # severely underfunded
        )
        result = SimulationTwinEngine.simulate(self.ward, self.metric, inputs)
        self.assertFalse(result.is_budget_sufficient)
        self.assertLess(result.budget_surplus_deficit_usd, 0.0)

    def test_documented_assumptions(self):
        assumptions = SimulationTwinEngine.get_documented_assumptions()
        self.assertGreaterEqual(len(assumptions), 6)
        params = [a.parameter for a in assumptions]
        self.assertTrue(any("Tree Plantation" in p for p in params))
        self.assertTrue(any("Cool Roofs" in p for p in params))
        self.assertTrue(any("Permeable" in p for p in params))
        self.assertTrue(any("Green Corridor" in p for p in params))
        self.assertTrue(any("Retention" in p for p in params))
        self.assertTrue(any("Compound Interaction" in p for p in params))

if __name__ == "__main__":
    unittest.main()
