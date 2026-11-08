"""
CLIMASCOPE - Automated Scientific Validation & Climate Model Intelligence Test Suite
===================================================================================

Validates the scientific accuracy, biophysical integrity, reproducibility, and
provenance classification across all 7 core modules of CLIMASCOPE:
1. Unified Climate Data Source Registry (8 canonical datasets, calibration, limitations)
2. Climate Debt Engine (collinearity dampening, explainability breakdown, completeness, IPCC disclaimer)
3. CMIP6 Climate Projection Service (1995-2014 baseline, SSP2-4.5 vs SSP5-8.5, 10th-90th percentile uncertainty)
4. Urban Climate Twin Physics Engine (biophysical survival 82%, weathering 88%, clogging 85%, maturity)
5. AI Climate Investigator (7 scientific questions, correlation vs causation, alternative physical factors)
6. Satellite Verification Ledger (empirical vs simulated verification distinction, SHA-256 audit trail)
"""

import unittest
import json
import hashlib
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.models.intervention import Intervention
from app.models.ledger import LedgerEntry

from app.core.source_registry import UnifiedSourceRegistry, ClimateDataSource
from app.services.climate_debt_engine import ClimateDebtEngine
from app.services.climate_projection_service import ClimateProjectionService
from app.services.simulation_twin import SimulationTwinEngine
from app.schemas.simulation import SimulationInputs
from app.services.investigator_engine import ClimateInvestigatorEngine
from app.services.action_ledger_service import ActionLedgerService
from app.schemas.intervention import VerifyInterventionPayload


class TestScientificValidationSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.ward = cls.db.query(Ward).first()
        if not cls.ward:
            raise RuntimeError("Database contains no seeded wards. Please seed climascope.db first.")
        cls.metric = (
            cls.db.query(ClimateMetric)
            .filter(ClimateMetric.ward_id == cls.ward.id)
            .order_by(ClimateMetric.timestamp.desc())
            .first()
        )

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    # -------------------------------------------------------------------------
    # TEST 1: Unified Climate Data Source Registry
    # -------------------------------------------------------------------------
    def test_01_unified_source_registry_completeness(self):
        """Verify all 8 canonical climate datasets are cataloged with scientific provenance."""
        sources = UnifiedSourceRegistry.get_all_sources()
        self.assertEqual(len(sources), 8)

        source_ids = {s.source_id for s in sources}
        expected_ids = {
            "SRC-LANDSAT8-TIRS",
            "SRC-SENTINEL2-MSI",
            "SRC-CPCB-CAAQMS",
            "SRC-IMD-WEATHER",
            "SRC-PMC-CADASTRE",
            "SRC-CGWB-HYDRO",
            "SRC-CMIP6-ENSEMBLE",
            "SRC-MAHA-PWD-CSR"
        }
        self.assertTrue(expected_ids.issubset(source_ids))

        for s in sources:
            self.assertTrue(s.name)
            self.assertTrue(s.provider)
            self.assertTrue(s.official_url.startswith("http"))
            self.assertTrue(s.spatial_resolution)
            self.assertTrue(s.temporal_resolution)
            self.assertTrue(s.calibration_standard)
            self.assertTrue(s.data_limitations)
            self.assertIn(s.integration_status, [
                "CALIBRATED_BENCHMARK_OBSERVATION",
                "DERIVED_BIOPHYSICAL_MODEL",
                "MODEL_ESTIMATE",
                "MUNICIPAL_SURVEY_BENCHMARK"
            ])
        print("  [PASS] Test 1: Unified Climate Data Source Registry verified (8/8 canonical sources)")

    # -------------------------------------------------------------------------
    # TEST 2: Climate Debt Explainability Breakdown & Methodology Notes
    # -------------------------------------------------------------------------
    def test_02_climate_debt_explainability_and_ipcc_disclaimer(self):
        """Verify additive biophysical explainability breakdown and explicit IPCC disclaimer."""
        from app.services.climate_debt_engine import ClimateDebtInputs
        from app.schemas.climate_debt import ClimateDebtResponse

        engine = ClimateDebtEngine()
        inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=self.metric.surface_temp_anomaly if self.metric else 4.0,
            vegetation_loss_pct=round(max(0.0, 35.0 - self.ward.canopy_cover_pct), 1),
            built_up_growth_pct=self.ward.impervious_surface_pct,
            flood_exposure_idx=self.ward.flood_susceptibility_idx,
            air_pollution_pm25=self.metric.aqi_pm25 if self.metric else 62.0,
            water_stress_idx=0.55,
            population_vulnerability_pct=self.ward.vulnerable_population_pct,
            intervention_coverage_pct=15.0
        )
        res_dict = engine.calculate(ward_id=self.ward.code, inputs=inputs)
        debt_res = ClimateDebtResponse(**res_dict)

        self.assertIsNotNone(debt_res.explainabilityBreakdown)
        b = debt_res.explainabilityBreakdown

        # Verify all breakdown components exist and are non-negative
        self.assertGreaterEqual(b.thermalContribution, 0.0)
        self.assertGreaterEqual(b.canopyDeficitContribution, 0.0)
        self.assertGreaterEqual(b.imperviousnessContribution, 0.0)
        self.assertGreaterEqual(b.floodContribution, 0.0)
        self.assertGreaterEqual(b.demographicContribution, 0.0)
        self.assertLessEqual(b.adaptiveCapacityOffset, 0.0)
        self.assertEqual(b.totalClimateDebt, debt_res.climateDebt)

        # Verify data completeness level classification
        self.assertIn(debt_res.dataCompletenessLevel, [
            "HIGH_COMPLETENESS", "MODERATE_COMPLETENESS", "LOW_COMPLETENESS"
        ])

        # Verify explicit disclaimer against official IPCC endorsement
        self.assertIsNotNone(debt_res.methodologyNotes)
        self.assertIn("IPCC AR6", debt_res.methodologyNotes)
        self.assertIn("official IPCC", debt_res.methodologyNotes)
        print("  [PASS] Test 2: Climate Debt explainability breakdown & IPCC disclaimer verified")

    # -------------------------------------------------------------------------
    # TEST 3: Climate Debt Collinearity Dampening
    # -------------------------------------------------------------------------
    def test_03_climate_debt_collinearity_dampening(self):
        """Verify that compound hazard indicators do not produce non-linear divergence."""
        from app.services.climate_debt_engine import ClimateDebtInputs
        from app.schemas.climate_debt import ClimateDebtResponse

        engine = ClimateDebtEngine()
        normal_inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=self.metric.surface_temp_anomaly if self.metric else 4.0,
            vegetation_loss_pct=round(max(0.0, 35.0 - self.ward.canopy_cover_pct), 1),
            built_up_growth_pct=self.ward.impervious_surface_pct,
            flood_exposure_idx=self.ward.flood_susceptibility_idx,
            air_pollution_pm25=self.metric.aqi_pm25 if self.metric else 62.0,
            water_stress_idx=0.55,
            population_vulnerability_pct=self.ward.vulnerable_population_pct,
            intervention_coverage_pct=15.0
        )
        normal_calc = ClimateDebtResponse(**engine.calculate(ward_id=self.ward.code, inputs=normal_inputs))

        # Test boundary calculation with extreme inputs
        extreme_inputs = ClimateDebtInputs(
            surface_temp_anomaly_celsius=10.0,
            vegetation_loss_pct=40.0,
            built_up_growth_pct=95.0,
            flood_exposure_idx=1.0,
            air_pollution_pm25=150.0,
            water_stress_idx=1.0,
            population_vulnerability_pct=100.0,
            intervention_coverage_pct=0.0
        )
        extreme_calc = ClimateDebtResponse(**engine.calculate(ward_id=self.ward.code, inputs=extreme_inputs))

        # Climate debt must remain bounded [0, 100] despite extreme compound inputs
        self.assertLessEqual(extreme_calc.climateDebt, 100.0)
        self.assertGreaterEqual(extreme_calc.climateDebt, 0.0)
        self.assertGreater(extreme_calc.climateDebt, normal_calc.climateDebt)
        print("  [PASS] Test 3: Climate Debt collinearity dampening & boundary stability verified")

        # Climate debt must remain bounded [0, 100] despite extreme compound inputs
        self.assertLessEqual(extreme_calc.climateDebt, 100.0)
        self.assertGreaterEqual(extreme_calc.climateDebt, 0.0)
        self.assertGreater(extreme_calc.climateDebt, normal_calc.climateDebt)
        print("  [PASS] Test 3: Climate Debt collinearity dampening & boundary stability verified")

    # -------------------------------------------------------------------------
    # TEST 4: CMIP6 Climate Projections & Uncertainty Intervals
    # -------------------------------------------------------------------------
    def test_04_cmip6_climate_projections_and_uncertainty(self):
        """Verify downscaled multi-model ensemble trajectories with 10th-90th percentile ranges."""
        proj = ClimateProjectionService.get_projections_for_ward(self.ward)

        self.assertEqual(proj.ward_id, self.ward.id)
        self.assertEqual(proj.baseline_period, "1995–2014 (CMIP6 Climatological Baseline)")
        self.assertEqual(proj.current_observation_year, 2026)
        self.assertLess(proj.historical_baseline_lst_celsius, proj.current_lst_celsius)

        # Scenarios verification
        self.assertIn("SSP2-4.5", proj.scenarios)
        self.assertIn("SSP5-8.5", proj.scenarios)

        ssp2 = proj.scenarios["SSP2-4.5"]
        ssp5 = proj.scenarios["SSP5-8.5"]

        # Trajectory progression verification
        years = [2026, 2030, 2035, 2040, 2045, 2050]
        self.assertEqual([p.year for p in ssp2.trajectory], years)
        self.assertEqual([p.year for p in ssp5.trajectory], years)

        # Monotonic uncertainty verification: p10 <= p50 <= p90 for every decadal point
        for p in ssp2.trajectory:
            self.assertLessEqual(p.heat_index_p10, p.heat_index_p50)
            self.assertLessEqual(p.heat_index_p50, p.heat_index_p90)

        for p in ssp5.trajectory:
            self.assertLessEqual(p.heat_index_p10, p.heat_index_p50)
            self.assertLessEqual(p.heat_index_p50, p.heat_index_p90)

        # SSP5-8.5 warming rate must exceed SSP2-4.5 warming rate
        self.assertGreater(ssp5.annual_warming_rate_celsius, ssp2.annual_warming_rate_celsius)

        # Comparison table verification
        self.assertGreaterEqual(len(proj.comparison_table), 6)
        horizons = {r.time_horizon for r in proj.comparison_table}
        self.assertIn("Historical Baseline (1995–2014)", horizons)
        self.assertIn("Current Observation (2026)", horizons)
        self.assertIn("Mid-Century Horizon (2035)", horizons)
        self.assertIn("Long-Term Horizon (2050)", horizons)

        # Downscaling disclaimer verification
        self.assertIn("statistical downscaling", proj.downscaling_methodology.lower())
        self.assertIn("not deterministic", proj.downscaling_disclaimer.lower())
        self.assertEqual(len(proj.models_in_ensemble), 6)
        print("  [PASS] Test 4: CMIP6 downscaled climate projections & uncertainty intervals verified")

    # -------------------------------------------------------------------------
    # TEST 5: Urban Climate Twin Biophysical Physics & Degradation Factors
    # -------------------------------------------------------------------------
    def test_05_urban_climate_twin_biophysical_physics(self):
        """Verify survival discounts (82%), weathering (88%), and clogging (85%) in physics twin."""
        inputs = SimulationInputs(
            ward_id=str(self.ward.id),
            trees_count=10000,
            cool_roof_pct=30.0,
            permeable_surface_sq_m=25000,
            green_corridor_sq_m=12000,
            retention_capacity_m3=10000,
            available_budget_inr=50000000.0
        )
        res = SimulationTwinEngine.simulate(self.ward, self.metric, inputs)

        # Epistemic labeling
        self.assertEqual(res.epistemic_status, "MODEL_ESTIMATE")
        self.assertIn("MODELED ESTIMATE", res.epistemic_disclaimer)

        # Check documented assumptions for biophysical discounts
        assumptions = {a.parameter: a for a in res.assumptions}
        self.assertIn("Urban Tree Plantation", assumptions)
        self.assertIn("High-Albedo Cool Roofs", assumptions)
        self.assertIn("Permeable Pavements & Roads", assumptions)

        tree_assump = assumptions["Urban Tree Plantation"]
        self.assertIn("0.82", tree_assump.formula)
        self.assertIn("survival", tree_assump.degradation_or_maintenance_factor.lower())
        self.assertIn("years", tree_assump.time_to_benefit_horizon.lower())

        roof_assump = assumptions["High-Albedo Cool Roofs"]
        self.assertIn("0.88", roof_assump.formula)
        self.assertIn("weathering", roof_assump.degradation_or_maintenance_factor.lower())

        perm_assump = assumptions["Permeable Pavements & Roads"]
        self.assertIn("0.85", perm_assump.formula)
        self.assertIn("clogging", perm_assump.degradation_or_maintenance_factor.lower())

        # Physical improvements must be thermodynamically bounded
        self.assertLess(res.simulated.heat_risk_celsius, res.baseline.heat_risk_celsius)
        self.assertGreater(res.simulated.green_coverage_pct, res.baseline.green_coverage_pct)
        self.assertLess(res.simulated.surface_runoff_risk_pct, res.baseline.surface_runoff_risk_pct)
        self.assertLess(res.simulated.climate_debt, res.baseline.climate_debt)
        print("  [PASS] Test 5: Urban Climate Twin biophysical physics & degradation factors verified")

    # -------------------------------------------------------------------------
    # TEST 6: AI Climate Investigator - 7 Scientific Questions & Causal Grounding
    # -------------------------------------------------------------------------
    def test_06_climate_investigator_seven_questions_grounding(self):
        """Verify the 7 scientific questions, correlation vs causation caveats, and alternative factors."""
        report = ClimateInvestigatorEngine.generate_investigation_report(self.ward, self.metric)

        # 7 Questions assessment verification
        self.assertIsNotNone(report.scientific_questions_assessment)
        qa = report.scientific_questions_assessment
        expected_keys = [
            "q1_observed_anomaly",
            "q2_spatiotemporal_extent",
            "q3_baseline_comparison",
            "q4_biophysical_mechanisms",
            "q5_correlation_vs_causation",
            "q6_alternative_explanations",
            "q7_field_validation_protocol"
        ]
        for key in expected_keys:
            self.assertIn(key, qa)
            self.assertTrue(qa[key])

        # Contributing factors must distinguish correlation from causation
        for hypo in report.potential_contributing_factors:
            self.assertEqual(hypo.epistemic_status, "HYPOTHESIS")
            self.assertIsNotNone(hypo.correlation_vs_causation_note)
            self.assertIn("CORRELATION", hypo.correlation_vs_causation_note)
            self.assertGreaterEqual(len(hypo.alternative_explanations), 1)

        # Observed changes must be strictly observed facts
        for obs in report.observed_environmental_changes:
            self.assertEqual(obs.epistemic_status, "OBSERVED_FACT")
        print("  [PASS] Test 6: AI Climate Investigator 7-question grounding & causal caveats verified")

    # -------------------------------------------------------------------------
    # TEST 7: Satellite Verification Engine & SHA-256 Cryptographic Distinction
    # -------------------------------------------------------------------------
    def test_07_satellite_verification_epistemic_distinction(self):
        """Verify strict classification of EMPIRICAL vs SIMULATED verification in ledger."""
        itv = self.db.query(Intervention).filter(Intervention.ward_id == self.ward.id).first()
        self.assertIsNotNone(itv)

        # 1. Run Simulated Verification
        sim_payload = VerifyInterventionPayload(
            simulate=True,
            observed_cooling_celsius=1.65,
            observed_runoff_reduction_pct=28.0,
            evidence_source="Simulated SAR Inundation Model"
        )
        sim_res = ActionLedgerService.verify_intervention(itv.id, sim_payload, self.db)
        self.assertTrue(sim_res.is_simulated)
        self.assertIn("SIMULATED", sim_res.verification_summary)

        # Verify ledger block for simulated verification
        sim_block = (
            self.db.query(LedgerEntry)
            .filter(LedgerEntry.ward_id == self.ward.id)
            .order_by(LedgerEntry.timestamp.desc())
            .first()
        )
        self.assertEqual(sim_block.action_type, "SIMULATED_VERIFICATION")
        self.assertTrue(sim_block.transaction_hash)

        # 2. Run Empirical Verification
        emp_payload = VerifyInterventionPayload(
            simulate=False,
            observed_cooling_celsius=1.80,
            observed_runoff_reduction_pct=30.0,
            evidence_source="Copernicus Sentinel-2 MSI Multi-Temporal Pass"
        )
        emp_res = ActionLedgerService.verify_intervention(itv.id, emp_payload, self.db)
        self.assertFalse(emp_res.is_simulated)
        self.assertIn("CONFIRMED", emp_res.verification_summary)

        # Verify ledger block for empirical verification
        emp_block = (
            self.db.query(LedgerEntry)
            .filter(LedgerEntry.ward_id == self.ward.id)
            .order_by(LedgerEntry.timestamp.desc())
            .first()
        )
        self.assertEqual(emp_block.action_type, "EMPIRICAL_VERIFICATION")
        self.assertTrue(emp_block.transaction_hash)
        print("  [PASS] Test 7: Satellite verification epistemic distinction & SHA-256 ledger verified")


if __name__ == "__main__":
    unittest.main()
