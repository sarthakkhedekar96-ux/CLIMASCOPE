import unittest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.schemas.intervention import OptimizationRequest
from app.services.budget_optimizer import BudgetOptimizationEngine

class TestBudgetOptimizationEngine(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_budget_constraint_strictly_enforced(self):
        budgets = [500000.0, 1000000.0, 2500000.0]
        for budget in budgets:
            req = OptimizationRequest(
                budget_cap_usd=budget,
                primary_objective="BALANCED",
                equity_weight_factor=1.0
            )
            res = BudgetOptimizationEngine.optimize(req, self.db)
            self.assertLessEqual(res.total_cost_usd, budget)
            self.assertGreaterEqual(res.remaining_budget_usd, 0.0)
            self.assertEqual(res.budget_cap_usd, budget)

    def test_rejected_interventions_with_reasons(self):
        req = OptimizationRequest(
            budget_cap_usd=600000.0,  # Tight budget
            primary_objective="BALANCED"
        )
        res = BudgetOptimizationEngine.optimize(req, self.db)

        self.assertGreater(len(res.rejected_interventions), 0)
        for rejected in res.rejected_interventions:
            self.assertTrue(len(rejected.rejection_reason) > 0)
            self.assertGreater(rejected.cost_usd, 0.0)
            self.assertIn(rejected.category, ["COOL_ROOF", "CANOPY_EXPANSION", "PERMEABLE_PAVING", "PERMEABLE_SURFACES", "BIOSWALE", "RETENTION_BASIN", "GREEN_CORRIDOR"])

    def test_equity_weighting_prioritization(self):
        # With high equity weight, vulnerable wards should receive prioritized allocation
        req_standard = OptimizationRequest(
            budget_cap_usd=1500000.0,
            primary_objective="BALANCED",
            equity_weight_factor=0.0  # No equity
        )
        res_standard = BudgetOptimizationEngine.optimize(req_standard, self.db)

        req_equity = OptimizationRequest(
            budget_cap_usd=1500000.0,
            primary_objective="BALANCED",
            equity_weight_factor=2.0  # Strong equity weighting
        )
        res_equity = BudgetOptimizationEngine.optimize(req_equity, self.db)

        self.assertGreater(len(res_equity.selected_wards), 0)
        self.assertGreaterEqual(res_equity.vulnerable_population_benefited, 0)

    def test_objective_specialization(self):
        # MAX_COOLING should achieve higher cooling per dollar than MAX_RUNOFF_REDUCTION
        req_cooling = OptimizationRequest(
            budget_cap_usd=2000000.0,
            primary_objective="MAX_COOLING"
        )
        res_cooling = BudgetOptimizationEngine.optimize(req_cooling, self.db)

        req_runoff = OptimizationRequest(
            budget_cap_usd=2000000.0,
            primary_objective="MAX_RUNOFF_REDUCTION"
        )
        res_runoff = BudgetOptimizationEngine.optimize(req_runoff, self.db)

        self.assertGreater(res_cooling.projected_mean_cooling_celsius, 0.0)
        self.assertGreater(res_runoff.projected_mean_runoff_reduction_pct, 0.0)

    def test_solver_diagnostics_and_explanation(self):
        req = OptimizationRequest(
            budget_cap_usd=1500000.0,
            primary_objective="BALANCED"
        )
        res = BudgetOptimizationEngine.optimize(req, self.db)

        self.assertEqual(res.solver_diagnostics.get("status"), "OPTIMAL_CONVERGED")
        self.assertIn("INTEGER KNAPSACK FORMULATION", res.mathematical_explanation)
        self.assertIn("PARETO OPTIMALITY", res.mathematical_explanation)
        self.assertGreater(len(res.cost_versus_impact), 0)

if __name__ == "__main__":
    unittest.main()
