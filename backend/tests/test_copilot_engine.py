import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.schemas.copilot import CopilotQueryRequest
from app.services.copilot_engine import ClimateCopilotEngine
from app.api.v1.endpoints import copilot

class TestClimateCopilotEngine(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_1_highest_climate_debt(self):
        req = CopilotQueryRequest(query="Which ward has the highest climate debt?")
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_HIGHEST_CLIMATE_DEBT)
        self.assertEqual(res.ward_code, "WRD-01")
        self.assertIn("Hadapsar", res.ward_name)
        self.assertGreaterEqual(res.key_metrics["highest_debt_score"], 70.0)
        self.assertGreater(len(res.evidence_references), 0)
        self.assertGreater(res.confidence, 0.9)
        self.assertIn("Landsat-8", res.evidence_references[0].source)
        self.assertTrue(len(res.missing_information) > 0)
        self.assertTrue(len(res.suggested_actions) > 0)

    def test_2_why_ward_14_at_critical_risk(self):
        req = CopilotQueryRequest(query="Why is Ward 14 at critical risk?")
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_WARD_CRITICAL_RISK)
        self.assertEqual(res.ward_code, "WRD-01")
        self.assertIn("Hadapsar", res.ward_name)
        self.assertIn("Thermal", res.response_text)
        self.assertGreaterEqual(res.key_metrics["climate_debt"], 70.0)
        self.assertGreater(len(res.evidence_references), 0)
        self.assertTrue(len(res.missing_information) > 0)

    def test_3_prioritize_intervention(self):
        req = CopilotQueryRequest(query="Which intervention should be prioritized?", ward_id=1)
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_PRIORITIZE_INTERVENTION)
        self.assertIsNotNone(res.key_metrics["top_intervention_code"])
        self.assertGreater(res.key_metrics["cost_usd"], 0)
        self.assertGreater(res.key_metrics["cooling_effect_celsius"], 0)
        self.assertTrue("ACT-" in res.key_metrics["top_intervention_code"] or "INT-" in res.key_metrics["top_intervention_code"])

    def test_4_budget_distribution_5_crore(self):
        req = CopilotQueryRequest(query="How should a 5 crore budget be distributed?")
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_BUDGET_DISTRIBUTION)
        self.assertEqual(res.key_metrics["budget_cap_usd"], 600000.0)
        self.assertLessEqual(res.key_metrics["total_invested_usd"], 600000.0)
        self.assertGreater(res.key_metrics["projects_selected"], 0)
        self.assertGreater(res.key_metrics["population_benefited"], 0)
        self.assertIn("HiGHS", res.response_text)

    def test_5_tree_coverage_simulation(self):
        req = CopilotQueryRequest(query="What happens if we increase the tree coverage?", ward_id=1)
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_TREE_COVERAGE_SIMULATION)
        self.assertGreater(res.key_metrics["canopy_delta_pct"], 0)
        self.assertLess(res.key_metrics["cooling_delta_celsius"], 0)
        self.assertLess(res.key_metrics["simulated_debt"], res.key_metrics["baseline_debt"])
        self.assertIn("Akbari", res.response_text)

    def test_6_pending_verification(self):
        req = CopilotQueryRequest(query="Which interventions are still pending verification?")
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_PENDING_VERIFICATION)
        self.assertGreaterEqual(res.key_metrics["unverified_count"], 0)
        self.assertEqual(res.confidence, 1.0)
        self.assertIn("Sentinel-2", res.response_text)

    def test_7_population_vulnerability(self):
        req = CopilotQueryRequest(query="Which wards have the highest population vulnerability?")
        res = ClimateCopilotEngine.process_query(req, self.db)
        self.assertEqual(res.intent, ClimateCopilotEngine.INTENT_POPULATION_VULNERABILITY)
        self.assertEqual(res.key_metrics["highest_rate_ward"], "WRD-03")
        self.assertEqual(res.key_metrics["highest_count_ward"], "WRD-02")
        self.assertIn("Mula-Mutha", res.response_text)
        self.assertIn("Kasba Peth", res.response_text)

    def test_suggested_questions_api(self):
        res = copilot.get_suggested_questions(ward_id=1, current_phase="debt", db=self.db)
        self.assertTrue(res.success)
        self.assertGreaterEqual(len(res.data.suggested_questions), 7)
        self.assertIn("Which ward has the highest climate debt?", res.data.suggested_questions)
        self.assertIn("How should a 5 crore budget be distributed?", res.data.suggested_questions)

if __name__ == "__main__":
    unittest.main()
