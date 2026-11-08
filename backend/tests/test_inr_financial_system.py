"""
Automated Test Suite for INR Financial System & Municipal Budget Intelligence
CLIMASCOPE Urban Climate Platform
"""

import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.ward import Ward
from app.models.intervention import Intervention
from app.models.ledger import LedgerEntry
from app.schemas.intervention import OptimizationRequest, InterventionCreate, InterventionUpdatePayload
from app.schemas.simulation import SimulationInputs
from app.services.budget_optimizer import BudgetOptimizationEngine
from app.services.simulation_twin import SimulationTwinEngine
from app.services.action_ledger_service import ActionLedgerService
from app.api.v1.endpoints import interventions as interventions_endpoint


class TestINRFinancialSystem(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_inr_cost_assumptions_endpoint(self):
        """Test GET /api/v1/interventions/cost-assumptions returns 6 empirical benchmarks."""
        response = interventions_endpoint.get_cost_assumptions()
        self.assertTrue(response.success)
        assumptions = response.data
        self.assertEqual(len(assumptions), 6)

        categories = {a.category: a for a in assumptions}
        self.assertIn("URBAN_FORESTRY", categories)
        self.assertIn("COOL_ROOF", categories)
        self.assertIn("PERMEABLE_PAVEMENT", categories)
        self.assertIn("GREEN_CORRIDOR", categories)
        self.assertIn("RETENTION_BASIN", categories)
        self.assertIn("WETLAND_RESTORATION", categories)

        # Verify unit rates and citations
        canopy = categories["URBAN_FORESTRY"]
        self.assertEqual(canopy.unit_cost_inr, 2200.0)
        self.assertIn("₹2,200", canopy.unit_label)
        self.assertIn("Maharashtra PWD", canopy.official_reference)

        roof = categories["COOL_ROOF"]
        self.assertEqual(roof.unit_cost_inr, 650.0)
        self.assertIn("₹650", roof.unit_label)
        self.assertIn("CPWD", roof.official_reference)

        retention = categories["RETENTION_BASIN"]
        self.assertEqual(retention.unit_cost_inr, 2850.0)
        self.assertIn("₹2,850", retention.unit_label)
        self.assertIn("CGWB", retention.official_reference)

    def test_inr_financial_summary_endpoint(self):
        """Test GET /api/v1/interventions/financial-summary returns aggregated municipal financial metrics."""
        response = interventions_endpoint.get_financial_summary(self.db)
        self.assertTrue(response.success)
        summary = response.data
        self.assertEqual(summary.currency, "INR")
        self.assertGreater(summary.total_allocated_budget_inr, 0)
        self.assertGreater(summary.total_expenditure_inr, 0)
        self.assertGreater(summary.budget_utilization_pct, 0.0)
        self.assertLessEqual(summary.budget_utilization_pct, 120.0)

        # Check jurisdiction breakdown
        self.assertTrue(len(summary.cost_by_jurisdiction) > 0)
        # Check category breakdown
        self.assertTrue(len(summary.cost_by_category) > 0)
        for cat, cost in summary.cost_by_category.items():
            self.assertGreater(cost, 0)

    def test_scipy_highs_knapsack_inr_scenarios(self):
        """Test SciPy HiGHS knapsack optimization across standard municipal INR budget tiers."""
        budget_tiers = [
            1000000.0,   # ₹10 Lakh (Tight budget - cheapest item is ₹15 Lakh, so 0 items selected, all rejected with ₹ reasons)
            2500000.0,   # ₹25 Lakh (Selects items within budget)
            5000000.0,   # ₹50 Lakh
            10000000.0,  # ₹1 Crore
            50000000.0,  # ₹5 Crore
        ]

        for budget_inr in budget_tiers:
            req = OptimizationRequest(
                budget_inr=budget_inr,
                primary_objective="BALANCED",
                equity_weight_factor=1.0
            )
            result = BudgetOptimizationEngine.optimize(req, self.db)

            # 1. Budget constraint strictly respected in INR
            self.assertLessEqual(result.total_cost_inr, budget_inr)
            self.assertEqual(result.budget_cap_inr, budget_inr)
            self.assertAlmostEqual(
                result.remaining_budget_inr,
                budget_inr - result.total_cost_inr,
                delta=1.0
            )
            self.assertGreaterEqual(result.budget_utilization_pct, 0.0)
            self.assertLessEqual(result.budget_utilization_pct, 100.0)

            # 2. Dual currency fields present
            self.assertGreater(result.budget_cap_usd, 0)

            # 3. If budget >= 25 Lakh, at least one item should be selected
            if budget_inr >= 2500000.0:
                self.assertGreater(result.total_cost_inr, 0)
                self.assertGreater(result.total_cost_usd, 0)
                self.assertGreater(len(result.recommended_interventions), 0)
                for item in result.recommended_interventions:
                    self.assertGreater(item.cost_inr, 0)
                    self.assertGreater(item.cost_usd, 0)

            # 4. Rejection reasons contain ₹ notation
            for rej in result.rejected_interventions:
                self.assertGreater(rej.cost_inr, 0)
                self.assertIn("₹", rej.rejection_reason)

            # 5. Explanation contains Indian numbering system (Lakh / Crore) and ₹
            self.assertIn("₹", result.mathematical_explanation)
            self.assertTrue(
                "Lakh" in result.mathematical_explanation or "Crore" in result.mathematical_explanation or "Cr" in result.mathematical_explanation
            )

    def test_negative_budget_rejected(self):
        """Test that negative budget requests are rejected with ValueError / 400."""
        req = OptimizationRequest(budget_inr=-1000000.0)
        with self.assertRaises(ValueError):
            BudgetOptimizationEngine.optimize(req, self.db)

    def test_dual_currency_backward_compatibility(self):
        """Test that requests with legacy budget_cap_usd operate seamlessly and return dual currency."""
        legacy_budget_usd = 300000.0  # ~$300k USD => ~₹2.505 Crore
        req = OptimizationRequest(
            budget_cap_usd=legacy_budget_usd,
            primary_objective="MAX_HEAT_REDUCTION",
            equity_weight_factor=1.2
        )
        result = BudgetOptimizationEngine.optimize(req, self.db)

        # Budget cap in USD matches input, and budget_inr was normalized correctly
        self.assertEqual(result.budget_cap_usd, legacy_budget_usd)
        self.assertAlmostEqual(result.budget_cap_inr, legacy_budget_usd * 83.5, delta=100.0)

        # Strict constraint satisfaction in both currencies
        self.assertLessEqual(result.total_cost_usd, legacy_budget_usd)
        self.assertLessEqual(result.total_cost_inr, result.budget_cap_inr)
        self.assertGreater(len(result.recommended_interventions), 0)

    def test_urban_climate_twin_inr_benchmarks(self):
        """Test that the Urban Climate Twin calculates transparent INR capex and opex."""
        from app.models.climate_metric import ClimateMetric
        ward = self.db.query(Ward).filter(Ward.id == 1).first()
        metric = self.db.query(ClimateMetric).filter(ClimateMetric.ward_id == 1).first()

        sim_inputs = SimulationInputs(
            ward_id=str(ward.id),
            trees_count=1000,
            cool_roof_pct=20.0,
            permeable_surface_sq_m=10000.0,
            green_corridor_sq_m=5000.0,
            retention_capacity_m3=2000.0,
            available_budget_inr=50000000.0  # ₹5 Crore
        )
        sim_result = SimulationTwinEngine.simulate(ward, metric, sim_inputs)

        # Baseline cost should be 0
        self.assertEqual(sim_result.baseline.estimated_cost_inr, 0.0)
        self.assertEqual(sim_result.currency, "INR")

        # Simulated capex & opex should be non-zero and computed in INR
        self.assertGreater(sim_result.simulated.estimated_cost_inr, 0)
        self.assertGreater(sim_result.simulated.annual_maintenance_inr, 0)
        self.assertGreater(sim_result.simulated.estimated_cost_usd, 0)

        # Budget calculation verification
        self.assertEqual(
            sim_result.budget_surplus_deficit_inr,
            50000000.0 - sim_result.simulated.estimated_cost_inr
        )
        self.assertEqual(sim_result.is_budget_sufficient, sim_result.budget_surplus_deficit_inr >= 0)

    def test_action_ledger_inr_and_overspending(self):
        """Test Action Ledger tracking in INR, dual-currency persistence, and overspending detection."""
        # 1. Create intervention with INR fields
        create_payload = InterventionCreate(
            ward_id=1,
            intervention_code="TEST-INR-ACT-01",
            name="Test Miyawaki Pocket Forest Pune",
            category="CANOPY_EXPANSION",
            cost_inr=1500000.0,
            approved_budget_inr=1500000.0,
            annual_maintenance_inr=120000.0,
            currency="INR",
            cost_category="CAPITAL_EXPENDITURE",
            cost_per_unit=2200.0,
            unit_measure="per sapling",
            quantity=680.0,
            funding_source="PMC Green Climate Fund",
            fiscal_year="FY 2026-27",
            jurisdiction="Pune Municipal Corporation (PMC)",
            target_area_sq_m=5000,
            cooling_effect_celsius=1.1,
            runoff_reduction_pct=15.0,
            co2_sequestration_t_yr=35.0,
            roi_score=8.2,
            status="Proposed",
            responsible_authority="PMC Directorate of Urban Forestry"
        )
        itv = ActionLedgerService.create_intervention(create_payload, self.db)
        self.assertEqual(itv.currency, "INR")
        self.assertEqual(itv.cost_inr, 1500000.0)
        self.assertEqual(itv.approved_budget_inr, 1500000.0)
        self.assertEqual(itv.financial_status, "PROPOSED")

        # 2. Check initial ledger block
        ledger_entry = (
            self.db.query(LedgerEntry)
            .filter(LedgerEntry.intervention_name == itv.name)
            .first()
        )
        self.assertIsNotNone(ledger_entry)
        self.assertEqual(ledger_entry.budget_allocated_inr, 1500000.0)
        self.assertFalse(ledger_entry.is_overspent)

        # 3. Simulate overspending update: actual expenditure exceeds approved budget
        update_payload = InterventionUpdatePayload(
            status="In Progress",
            progress_pct=60,
            actual_expenditure_inr=1850000.0,  # ₹3.5 Lakh over approved budget
            description="Cost overrun due to rocky subsoil excavation"
        )
        updated_itv = ActionLedgerService.update_intervention(itv.id, update_payload, self.db)
        self.assertEqual(updated_itv.actual_expenditure_inr, 1850000.0)
        self.assertEqual(updated_itv.financial_status, "OVERSPENT")

        # Verify latest ledger entry flags overspending
        latest_entry = (
            self.db.query(LedgerEntry)
            .filter(LedgerEntry.intervention_name == itv.name)
            .order_by(LedgerEntry.id.desc())
            .first()
        )
        self.assertTrue(latest_entry.is_overspent)
        self.assertIsNotNone(latest_entry.overspend_warning)
        self.assertIn("exceeds approved allocation", latest_entry.overspend_warning)
        self.assertIn("350,000", latest_entry.overspend_warning)

        # 4. Verify SHA-256 chain integrity remains valid
        from app.api.v1.endpoints.ledger import get_ledger_audit_summary
        audit_res = get_ledger_audit_summary(db=self.db)
        audit_summary = audit_res.data
        self.assertTrue(audit_summary.ledger_integrity_verified)
        self.assertGreater(audit_summary.total_budget_allocated_inr, 0)
        self.assertGreater(audit_summary.overspent_entries_count, 0)
        self.assertTrue(audit_summary.has_overspend_warnings)

        # Cleanup test records
        self.db.query(LedgerEntry).filter(LedgerEntry.intervention_name == itv.name).delete()
        self.db.query(Intervention).filter(Intervention.id == itv.id).delete()
        self.db.commit()


if __name__ == "__main__":
    unittest.main()
