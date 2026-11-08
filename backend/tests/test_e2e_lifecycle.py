"""
CLIMASCOPE Phase 3: Comprehensive 12-Step End-to-End Lifecycle Test
===================================================================
Tests the complete Detect-to-Verify workflow:
1. Select a ward.
2. Retrieve its climate metrics.
3. Calculate Climate Debt.
4. Open its Evidence Graph.
5. Generate an investigation report.
6. Run a climate simulation.
7. Submit a municipal budget.
8. Generate an optimized portfolio.
9. Create an intervention.
10. Update its implementation status.
11. Verify the intervention.
12. Generate an audit record.
All stages must share consistent data.
"""

import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.ward import Ward
from app.api.v1.endpoints import (
    wards,
    metrics,
    climate_debt,
    evidence,
    investigate,
    simulate,
    interventions,
    ledger
)
from app.schemas.climate_debt import CustomCalculationRequest
from app.schemas.simulation import SimulationInputs
from app.schemas.intervention import (
    OptimizationRequest,
    InterventionCreate,
    InterventionUpdatePayload,
    AttachEvidencePayload,
    VerifyInterventionPayload
)

def test_full_12_step_lifecycle():
    db = SessionLocal()
    try:
        print("\n========================================================")
        print("STARTING CLIMASCOPE 12-STEP END-TO-END LIFECYCLE AUDIT")
        print("========================================================")

        # ---------------------------------------------------------
        # STEP 1: Select a ward
        # ---------------------------------------------------------
        print("\n[STEP 1] Selecting target ward...")
        wards_list_res = wards.list_wards(db=db)
        assert wards_list_res.success is True
        assert len(wards_list_res.data) >= 7
        target_ward = wards_list_res.data[0] # WRD-01
        ward_id = target_ward.id
        ward_code = target_ward.code
        ward_name = target_ward.name
        print(f"  [PASS] Target Ward Selected: ID={ward_id}, Code='{ward_code}', Name='{ward_name}'")

        # ---------------------------------------------------------
        # STEP 2: Retrieve its climate metrics
        # ---------------------------------------------------------
        print("\n[STEP 2] Retrieving climate metrics and historical telemetry...")
        detail_res = wards.get_ward_detail(ward_id=ward_id, db=db)
        assert detail_res.success is True
        ward_detail = detail_res.data
        assert ward_detail.code == ward_code
        assert ward_detail.heat_index_celsius > 30.0

        history_res = metrics.get_ward_metric_history(ward_id=ward_id, db=db)
        assert history_res.success is True
        assert len(history_res.data) > 0
        latest_metric = history_res.data[0]
        print(f"  [PASS] Telemetry Retrieved: LST={ward_detail.heat_index_celsius}°C, Canopy={ward_detail.canopy_cover_pct}%, Impervious={ward_detail.impervious_surface_pct}%, History Records={len(history_res.data)}")

        # ---------------------------------------------------------
        # STEP 3: Calculate Climate Debt
        # ---------------------------------------------------------
        print("\n[STEP 3] Calculating biophysical Climate Debt...")
        debt_res = climate_debt.get_ward_climate_debt(ward_identifier=str(ward_id), db=db)
        assert debt_res.success is True
        debt_calc = debt_res.data
        assert debt_calc.wardId == ward_code
        assert debt_calc.climateDebt > 0
        assert len(debt_calc.contributingFactors) == 8
        print(f"  [PASS] Climate Debt Calculated: Score={debt_calc.climateDebt}/100, Risk='{debt_calc.riskLevel}', Velocity='{debt_calc.trend}', Confidence={debt_calc.confidence}%")

        # ---------------------------------------------------------
        # STEP 4: Open its Evidence Graph
        # ---------------------------------------------------------
        print("\n[STEP 4] Opening Causal Evidence Graph...")
        eg_res = evidence.get_evidence_graph(ward_id=ward_id, db=db)
        assert eg_res.success is True
        eg_data = eg_res.data
        assert eg_data.ward_id == ward_id
        assert len(eg_data.nodes) > 0
        assert len(eg_data.edges) > 0
        print(f"  [PASS] Evidence Graph Loaded: {len(eg_data.nodes)} topological nodes, {len(eg_data.edges)} causal edges")

        # ---------------------------------------------------------
        # STEP 5: Generate an investigation report
        # ---------------------------------------------------------
        print("\n[STEP 5] Generating AI Climate Investigation Report...")
        inv_res = investigate.get_ward_investigation_report(ward_identifier=str(ward_id), db=db)
        assert inv_res.success is True
        inv_data = inv_res.data
        assert inv_data.ward_id == ward_code
        assert len(inv_data.observed_environmental_changes) >= 4
        assert len(inv_data.potential_contributing_factors) >= 3
        assert len(inv_data.supporting_evidence) >= 5
        assert len(inv_data.suggested_interventions) >= 3
        print(f"  [PASS] Investigation Report Generated: Confidence={inv_data.confidence_level}, Changes={len(inv_data.observed_environmental_changes)}, Interventions={len(inv_data.suggested_interventions)}")

        # ---------------------------------------------------------
        # STEP 6: Run a climate simulation (Urban Climate Twin)
        # ---------------------------------------------------------
        print("\n[STEP 6] Running microclimate physical simulation (Urban Climate Twin)...")
        sim_inputs = SimulationInputs(
            ward_id=str(ward_id),
            trees_count=10000,
            cool_roof_pct=25.0,
            permeable_surface_sq_m=20000.0,
            green_corridor_sq_m=10000.0,
            retention_capacity_m3=6000.0,
            available_budget_usd=1500000.0
        )
        sim_res = simulate.run_simulation(inputs=sim_inputs, db=db)
        assert sim_res.ward_code == ward_code
        assert sim_res.simulated.climate_debt < sim_res.baseline.climate_debt
        assert sim_res.improvements["climate_debt"].pct_improvement > 0
        print(f"  [PASS] Simulation Complete: Baseline Debt={sim_res.baseline.climate_debt} -> Simulated Debt={sim_res.simulated.climate_debt} (-{sim_res.improvements['climate_debt'].pct_improvement}%), Capex=${sim_res.estimated_cost_usd:,.2f}")

        # ---------------------------------------------------------
        # STEP 7: Submit a municipal budget
        # ---------------------------------------------------------
        budget_cap = 1500000.0
        print(f"\n[STEP 7] Submitting municipal budget: ${budget_cap:,.2f} USD...")
        opt_req = OptimizationRequest(
            budget_cap_usd=budget_cap,
            target_ward_ids=[ward_id],
            primary_objective="BALANCED",
            equity_weight_factor=1.2
        )

        # ---------------------------------------------------------
        # STEP 8: Generate an optimized portfolio
        # ---------------------------------------------------------
        print("\n[STEP 8] Executing SciPy HiGHS Integer Knapsack Optimization...")
        opt_res = interventions.optimize_interventions(payload=opt_req, db=db)
        assert opt_res.success is True
        portfolio = opt_res.data
        assert portfolio.total_cost_usd <= budget_cap
        assert len(portfolio.selected_interventions) > 0
        assert portfolio.total_population_benefited > 0
        print(f"  [PASS] Optimal Portfolio Generated: Selected={len(portfolio.selected_interventions)} interventions, Total Cost=${portfolio.total_cost_usd:,.2f}, Unused=${portfolio.remaining_budget_usd:,.2f}, Pop Benefited={portfolio.total_population_benefited:,}")

        # ---------------------------------------------------------
        # STEP 9: Create an intervention
        # ---------------------------------------------------------
        print("\n[STEP 9] Creating new municipal intervention in Action Ledger...")
        unique_code = f"ACT-AUDIT-{int(datetime.utcnow().timestamp())}"
        create_payload = InterventionCreate(
            ward_id=ward_id,
            intervention_code=unique_code,
            name="Hadapsar Riparian Bioswale & Native Canopy Buffer",
            category="CANOPY_EXPANSION",
            cost_usd=280000.0,
            target_area_sq_m=18000.0,
            annual_maintenance_usd=12000.0,
            cooling_effect_celsius=1.35,
            runoff_reduction_pct=26.0,
            co2_sequestration_t_yr=45.0,
            roi_score=8.9,
            status="Proposed",
            responsible_authority="PMC Environmental Engineering Dept",
            start_date="2026-06-01",
            deadline="2026-12-15"
        )
        created_itv_res = interventions.create_intervention(payload=create_payload, db=db)
        assert created_itv_res.success is True
        created_itv = created_itv_res.data
        intervention_db_id = created_itv.id
        assert created_itv.intervention_code == unique_code
        assert created_itv.status == "Proposed"
        assert created_itv.ward_id == ward_id
        print(f"  [PASS] Intervention Created: ID={intervention_db_id}, Code='{created_itv.intervention_code}', Status='{created_itv.status}', Authority='{created_itv.responsible_authority}'")

        # ---------------------------------------------------------
        # STEP 10: Update its implementation status
        # ---------------------------------------------------------
        print("\n[STEP 10] Updating intervention implementation status to 'In Progress'...")
        update_payload = InterventionUpdatePayload(
            status="In Progress",
            progress_pct=60,
            contractor="Western Maharashtra Eco Infrastructure Ltd",
            responsible_authority="PMC Environmental Engineering Dept"
        )
        updated_itv_res = interventions.update_intervention(
            intervention_id=intervention_db_id,
            payload=update_payload,
            db=db
        )
        assert updated_itv_res.success is True
        assert updated_itv_res.data.status == "In Progress"
        assert updated_itv_res.data.progress_pct == 60
        print(f"  [PASS] Status Updated: Status='{updated_itv_res.data.status}', Progress={updated_itv_res.data.progress_pct}%, Contractor='{updated_itv_res.data.contractor}'")

        # Attach intermediate empirical evidence
        print("  Attaching drone thermal survey evidence...")
        attach_res = interventions.attach_evidence(
            intervention_id=intervention_db_id,
            payload=AttachEvidencePayload(
                evidence_type="DRONE_THERMAL_SURVEY",
                source="PMC Geospatial Drone Fleet (DJI Matrice 300 RTK)",
                observation_date="2026-07-20",
                geographic_location=f"{target_ward.center_lat}° N, {target_ward.center_lon}° E",
                description="Mid-construction radiometric baseline scan of bioswale excavation trench.",
                confidence=0.98,
                is_simulated=False
            ),
            db=db
        )
        assert attach_res.success is True

        # ---------------------------------------------------------
        # STEP 11: Verify the intervention
        # ---------------------------------------------------------
        print("\n[STEP 11] Verifying intervention outcomes (Planned vs Observed)...")
        verify_payload = VerifyInterventionPayload(
            simulate=False,
            observed_cooling_celsius=1.30,
            observed_runoff_reduction_pct=25.5,
            evidence_source="In-situ Thermal Hydro Sensors & Sentinel-2 BOA Surface Radiometry"
        )
        verified_res = interventions.verify_intervention(
            intervention_id=intervention_db_id,
            payload=verify_payload,
            db=db
        )
        assert verified_res.success is True
        v_data = verified_res.data
        assert v_data.verification_status == "Verified"
        assert v_data.is_simulated is False
        assert v_data.cooling_target_met is True
        assert v_data.runoff_target_met is True
        print(f"  [PASS] Intervention Verified: Status='{v_data.verification_status}', Expected Cooling={v_data.planned_cooling_celsius}°C, Observed={v_data.observed_cooling_celsius}°C (Delta={v_data.cooling_difference_celsius}°C)")

        # ---------------------------------------------------------
        # STEP 12: Generate an audit record & ledger verification
        # ---------------------------------------------------------
        print("\n[STEP 12] Auditing immutable cryptographic ledger records...")
        ledger_res = ledger.list_ledger_entries(ward_id=ward_id, action_type=None, db=db)
        assert ledger_res.success is True
        entries = ledger_res.data
        assert len(entries) > 0

        # Check latest entry
        latest_entry = entries[0]
        assert latest_entry.transaction_hash is not None
        assert len(latest_entry.transaction_hash) == 64 # SHA-256 hex length
        assert latest_entry.entry_code.startswith("LEDGER-PMC-2026-")

        audit_res = ledger.get_ledger_audit_summary(db=db)
        assert audit_res.success is True
        summary = audit_res.data
        assert summary.total_entries_count >= len(entries)
        assert summary.total_budget_allocated_usd > 0
        assert summary.ledger_integrity_verified is True
        print(f"  [PASS] Cryptographic Ledger Audit: Total Entries={summary.total_entries_count}, Disbursed=${summary.total_budget_disbursed_usd:,.2f}, Integrity='{summary.ledger_integrity_verified}', Latest SHA-256='{latest_entry.transaction_hash[:16]}...'")

        print("\n========================================================")
        print(">>> 12-STEP END-TO-END LIFECYCLE AUDIT PASSED (12/12) <<<")
        print("========================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_full_12_step_lifecycle()
