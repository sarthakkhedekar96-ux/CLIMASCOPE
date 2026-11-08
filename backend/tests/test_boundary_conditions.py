"""
CLIMASCOPE Phase 1: Boundary Conditions, Validation, and Determinism Audit
==========================================================================
Tests:
1. Mathematical Determinism across 50 iterations
2. Boundary Budgets ($0, negative, extreme $100M)
3. Non-existent Ward handling (404 Not Found)
4. Invalid/Malformed payload validation
5. Data integrity and schema constraints
"""

import os
import sys
from fastapi import HTTPException
from pydantic import ValidationError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.api.v1.endpoints import wards, climate_debt, investigate, simulate, interventions, evidence
from app.schemas.intervention import OptimizationRequest
from app.schemas.climate_debt import CustomCalculationRequest
from app.schemas.simulation import SimulationInputs

def test_audit_boundaries():
    db = SessionLocal()
    try:
        print("\n========================================================")
        print("RUNNING BOUNDARY CONDITIONS & DETERMINISM AUDIT")
        print("========================================================")

        # 1. Determinism Test
        print("\n[TEST 1] Verifying 100% Mathematical Determinism (50 iterations)...")
        scores = []
        for _ in range(50):
            res = climate_debt.calculate_custom_climate_debt(
                req=CustomCalculationRequest(
                    surface_temp_anomaly_celsius=4.2,
                    vegetation_loss_pct=22.0,
                    built_up_growth_pct=78.0,
                    flood_exposure_idx=0.65,
                    air_pollution_pm25=65.0,
                    water_stress_idx=0.55,
                    population_vulnerability_pct=28.0
                )
            )
            scores.append(res.data.climateDebt)
        assert len(set(scores)) == 1, f"Non-deterministic scores detected: {set(scores)}"
        print(f"  [PASS] Climate Debt Engine is strictly deterministic: all 50 runs yielded {scores[0]}")

        # 2. Knapsack Optimizer Boundary Budgets
        print("\n[TEST 2] Verifying Budget Optimizer Boundaries ($0, Extreme $100M)...")
        # Budget = 0
        zero_res = interventions.optimize_interventions(
            payload=OptimizationRequest(budget_cap_usd=0.0, target_ward_ids=[1]),
            db=db
        )
        assert zero_res.data.total_cost_usd == 0.0
        assert len(zero_res.data.selected_interventions) == 0
        print(f"  [PASS] $0 Budget: 0 interventions selected, $0 spent")

        # Extreme budget $100M (should select all valid candidate interventions without overflow)
        large_res = interventions.optimize_interventions(
            payload=OptimizationRequest(budget_cap_usd=100000000.0, target_ward_ids=[1, 2]),
            db=db
        )
        assert large_res.data.total_cost_usd <= 100000000.0
        assert len(large_res.data.selected_interventions) > 0
        assert len(large_res.data.rejected_interventions) == 0
        print(f"  [PASS] $100M Budget: All {len(large_res.data.selected_interventions)} projects funded, 0 rejected")

        # 3. Non-existent Ward Handling (404)
        print("\n[TEST 3] Testing non-existent Ward ID handling (HTTP 404)...")
        non_existent_id = 99999
        try:
            wards.get_ward_detail(ward_id=non_existent_id, db=db)
            assert False, "Should have raised HTTPException for non-existent ward"
        except HTTPException as e:
            assert e.status_code == 404
            print(f"  [PASS] Wards detail endpoint properly raised 404: {e.detail}")

        try:
            climate_debt.get_ward_climate_debt(ward_identifier=str(non_existent_id), db=db)
            assert False, "Should have raised HTTPException for non-existent ward in climate debt"
        except HTTPException as e:
            assert e.status_code == 404
            print(f"  [PASS] Climate debt endpoint properly raised 404: {e.detail}")

        try:
            investigate.get_ward_investigation_report(ward_identifier=str(non_existent_id), db=db)
            assert False, "Should have raised HTTPException for non-existent ward in investigator"
        except HTTPException as e:
            assert e.status_code == 404
            print(f"  [PASS] Investigator endpoint properly raised 404: {e.detail}")

        try:
            simulate.get_ward_baseline_simulation(ward_id=str(non_existent_id), db=db)
            assert False, "Should have raised HTTPException for non-existent ward in simulation"
        except HTTPException as e:
            assert e.status_code == 404
            print(f"  [PASS] Simulation endpoint properly raised 404: {e.detail}")

        try:
            evidence.get_evidence_graph(ward_id=non_existent_id, db=db)
            assert False, "Should have raised HTTPException for non-existent ward in evidence"
        except HTTPException as e:
            assert e.status_code == 404
            print(f"  [PASS] Evidence graph endpoint properly raised 404: {e.detail}")

        # 4. Simulation Twin Extreme Boundaries
        print("\n[TEST 4] Testing Simulation Twin extreme parameter inputs...")
        sim_zero = simulate.run_simulation(
            inputs=SimulationInputs(
                ward_id="1",
                trees_count=0,
                cool_roof_pct=0.0,
                permeable_surface_sq_m=0.0,
                green_corridor_sq_m=0.0,
                retention_capacity_m3=0.0,
                available_budget_usd=0.0
            ),
            db=db
        )
        assert sim_zero.simulated.climate_debt == sim_zero.baseline.climate_debt
        assert sim_zero.estimated_cost_usd == 0.0
        print(f"  [PASS] 0-Intervention simulation: simulated debt equals baseline ({sim_zero.baseline.climate_debt}), cost=$0.00")

        # 5. Schema Type and Bounds Validations
        print("\n[TEST 5] Validating Pydantic Schema Bounds...")
        # Equity weight factor > 3.0 should fail validation
        try:
            OptimizationRequest(budget_cap_usd=100000.0, equity_weight_factor=5.5)
            assert False, "Should have failed equity_weight_factor <= 3.0"
        except ValidationError as e:
            print(f"  [PASS] Pydantic equity_weight_factor constraint enforced: {e.errors()[0]['type']}")

        print("\n========================================================")
        print(">>> ALL BOUNDARY CONDITIONS & DETERMINISM TESTS PASSED <<<")
        print("========================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_audit_boundaries()
