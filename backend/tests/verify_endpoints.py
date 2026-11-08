import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.api.v1.endpoints import health, wards, metrics, interventions, evidence, ledger, climate_debt, investigate, simulate
from app.schemas.intervention import OptimizationRequest
from app.schemas.climate_debt import CustomCalculationRequest
from app.schemas.simulation import SimulationInputs

def verify_all():
    # Ensure database tables and idempotent seed data exist before verifying endpoints
    init_db()

    db = SessionLocal()
    try:
        print("Testing health endpoint...")
        h = health.get_health(db=db)
        print(f"Health Status: {h.status}, Wards: {h.active_wards_count}")
        assert h.status == "HEALTHY"
        assert h.active_wards_count == 7

        print("Testing wards listing...")
        w_res = wards.list_wards(db=db)
        print(f"Wards count: {len(w_res.data)}")
        assert len(w_res.data) == 7

        print("Testing wards GeoJSON...")
        geojson = wards.get_wards_geojson(db=db)
        print(f"Features: {len(geojson.features)}, Type: {geojson.type}")
        assert geojson.type == "FeatureCollection"
        assert len(geojson.features) == 7

        print("Testing city overview metrics...")
        ov = metrics.get_city_overview(db=db)
        print(f"City: {ov.data.city_name}, Avg Heat: {ov.data.average_heat_index_celsius}°C, Debt Score: {ov.data.climate_debt.city_average_debt_score}")
        assert ov.data.total_wards == 7

        print("Testing budget-constrained optimizer...")
        req = OptimizationRequest(budget_cap_usd=1000000.0, target_ward_ids=[1, 2], primary_objective="BALANCED")
        opt = interventions.optimize_interventions(payload=req, db=db)
        print(f"Optimizer Selected: {len(opt.data.selected_interventions)} projects, Spent: ${opt.data.total_cost_usd:,.2f}, Pop Benefited: {opt.data.total_population_benefited:,}")
        assert opt.data.total_cost_usd <= 1000000.0
        assert len(opt.data.rejected_interventions) > 0
        assert len(opt.data.selected_wards) > 0
        assert opt.data.total_population_benefited > 0
        assert "INTEGER KNAPSACK FORMULATION" in opt.data.mathematical_explanation

        print("Testing evidence graph for Ward 1...")
        ev = evidence.get_evidence_graph(ward_id=1, db=db)
        print(f"Evidence Graph: {len(ev.data.nodes)} nodes, {len(ev.data.edges)} edges")
        assert len(ev.data.nodes) > 0

        print("Testing ledger audit...")
        led = ledger.list_ledger_entries(ward_id=None, action_type=None, db=db)
        audit = ledger.get_ledger_audit_summary(db=db)
        print(f"Ledger entries: {len(led.data)}, Total Allocated: ${audit.data.total_budget_allocated_usd:,.2f}")
        assert len(led.data) > 0

        print("Testing Climate Debt Engine endpoint...")
        cd_res = climate_debt.get_ward_climate_debt(ward_identifier="1", db=db)
        print(f"Climate Debt: {cd_res.data.climateDebt}/100, Risk: {cd_res.data.riskLevel}, Heat: {cd_res.data.heatRisk}, Trend: {cd_res.data.trend}")
        assert cd_res.data.wardId == "WRD-01"
        assert cd_res.data.climateDebt > 0
        assert len(cd_res.data.contributingFactors) == 8

        custom_calc = climate_debt.calculate_custom_climate_debt(
            req=CustomCalculationRequest(
                surface_temp_anomaly_celsius=5.5,
                vegetation_loss_pct=25.0,
                built_up_growth_pct=85.0,
                flood_exposure_idx=0.75,
                air_pollution_pm25=80.0,
                water_stress_idx=0.70,
                population_vulnerability_pct=35.0
            )
        )
        print(f"Custom Simulation Debt: {custom_calc.data.climateDebt}, Factors: {len(custom_calc.data.contributingFactors)}")
        assert custom_calc.data.climateDebt > 60

        print("Testing AI Climate Investigator endpoint...")
        inv_res = investigate.get_ward_investigation_report(ward_identifier="1", db=db)
        print(f"Investigator Report for {inv_res.data.ward_id}: Changes={len(inv_res.data.observed_environmental_changes)}, Factors={len(inv_res.data.potential_contributing_factors)}, Evidence={len(inv_res.data.supporting_evidence)}")
        assert inv_res.data.ward_id == "WRD-01"
        assert len(inv_res.data.observed_environmental_changes) >= 4
        assert len(inv_res.data.potential_contributing_factors) >= 3
        assert len(inv_res.data.supporting_evidence) >= 5
        assert len(inv_res.data.missing_information) >= 2
        assert len(inv_res.data.recommended_field_investigation) >= 2
        assert len(inv_res.data.suggested_interventions) >= 3
        assert "children" in inv_res.data.relationship_graph

        print("Testing Urban Climate Twin simulation endpoint...")
        sim_input = SimulationInputs(
            ward_id="1",
            trees_count=15000,
            cool_roof_pct=30.0,
            permeable_surface_sq_m=25000.0,
            green_corridor_sq_m=12000.0,
            retention_capacity_m3=8000.0,
            available_budget_usd=2500000.0
        )
        sim_res = simulate.run_simulation(inputs=sim_input, db=db)
        print(f"Simulation Result for {sim_res.ward_name}: Baseline Debt={sim_res.baseline.climate_debt} -> Sim Debt={sim_res.simulated.climate_debt} (-{sim_res.improvements['climate_debt'].pct_improvement}%), Cost=${sim_res.estimated_cost_usd:,.2f}")
        assert sim_res.ward_id == 1 or sim_res.ward_code == "WRD-01"
        assert sim_res.simulated.climate_debt < sim_res.baseline.climate_debt
        assert len(sim_res.single_interventions) == 5
        assert len(sim_res.assumptions) >= 6

        assumptions_list = simulate.get_simulation_assumptions()
        assert len(assumptions_list) >= 6
        print(f"Assumptions documented: {len(assumptions_list)} items with physical rationale")

        print("Testing Action Ledger Endpoints...")
        from app.schemas.intervention import (
            InterventionCreate,
            InterventionUpdatePayload,
            AttachEvidencePayload,
            VerifyInterventionPayload
        )
        ledger_itv = interventions.create_intervention(
            payload=InterventionCreate(
                ward_id=2,
                intervention_code="ACT-VERIFY-001",
                name="Aundh Permeable Pavement Corridor",
                category="PERMEABLE_SURFACES",
                cost_usd=120000.0,
                target_area_sq_m=8000.0,
                annual_maintenance_usd=5000.0,
                cooling_effect_celsius=0.8,
                runoff_reduction_pct=22.0,
                co2_sequestration_t_yr=12.0,
                roi_score=8.5,
                status="Proposed",
                responsible_authority="PMC Drainage & Road Infrastructure Dept",
                start_date="2026-05-01",
                deadline="2026-11-01"
            ),
            db=db
        )
        assert ledger_itv.data.status == "Proposed"
        assert ledger_itv.data.responsible_authority == "PMC Drainage & Road Infrastructure Dept"

        # Update
        updated_itv = interventions.update_intervention(
            intervention_id=ledger_itv.data.id,
            payload=InterventionUpdatePayload(status="In Progress", progress_pct=50, contractor="Deccan Infra Corp"),
            db=db
        )
        assert updated_itv.data.status == "In Progress"
        assert updated_itv.data.progress_pct == 50

        # Attach Evidence
        ev_res = interventions.attach_evidence(
            intervention_id=ledger_itv.data.id,
            payload=AttachEvidencePayload(
                evidence_type="DRONE_THERMAL_SURVEY",
                source="PMC Geospatial Drone Survey Unit (DJI Matrice 300 RTK)",
                observation_date="2026-06-15",
                geographic_location="18.5580° N, 73.8070° E",
                description="Mid-construction radiometric baseline audit of permeable sub-base layer.",
                confidence=0.96,
                is_simulated=False
            ),
            db=db
        )
        assert len(json.loads(ev_res.data.attached_evidence_json)) >= 1

        # Verify
        verif_res = interventions.verify_intervention(
            intervention_id=ledger_itv.data.id,
            payload=VerifyInterventionPayload(
                simulate=True,
                observed_cooling_celsius=0.75,
                observed_runoff_reduction_pct=21.0,
                evidence_source="Simulated Runoff Gauge Telemetry"
            ),
            db=db
        )
        assert verif_res.data.verification_status == "Verified"
        assert verif_res.data.is_simulated is True

        # Outcome comparison
        comp_res = interventions.get_outcome_comparison(intervention_id=ledger_itv.data.id, db=db)
        assert comp_res.data.cooling_target_met is True
        print(f"Action Ledger verified: Action {comp_res.data.intervention_code} verified={comp_res.data.verification_status}")

        print("Testing AI Climate Copilot Endpoints...")
        from app.api.v1.endpoints import copilot
        from app.schemas.copilot import CopilotQueryRequest

        copilot_res = copilot.query_copilot(
            payload=CopilotQueryRequest(query="Which ward has the highest climate debt?", ward_id=1),
            db=db
        )
        assert copilot_res.success is True
        assert copilot_res.data.ward_code == "WRD-01"
        assert len(copilot_res.data.evidence_references) > 0
        assert copilot_res.data.confidence > 0.9
        print(f"Copilot Query Verified: Intent={copilot_res.data.intent}, Ward={copilot_res.data.ward_code}, Confidence={copilot_res.data.confidence}")

        questions_res = copilot.get_suggested_questions(ward_id=1, current_phase="debt", db=db)
        assert questions_res.success is True
        assert len(questions_res.data.suggested_questions) >= 7
        print(f"Copilot Suggested Questions Verified: {len(questions_res.data.suggested_questions)} questions available")

        print("\n>>> ALL BACKEND API ENDPOINTS VERIFIED AND OPERATIONAL <<<")
    finally:
        db.close()

if __name__ == "__main__":
    verify_all()
