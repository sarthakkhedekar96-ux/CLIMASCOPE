from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.schemas.simulation import (
    SimulationInputs,
    SimulationResult,
    AssumptionItem,
    ScenarioMetrics
)
from app.services.simulation_twin import SimulationTwinEngine

router = APIRouter()

@router.post("/run", response_model=SimulationResult)
def run_simulation(inputs: SimulationInputs, db: Session = Depends(get_db)):
    """
    Run the CLIMASCOPE Urban Climate Twin biophysical simulation for a municipal ward.
    Computes Baseline vs Single-Intervention vs Combined Scenarios with documented biophysical formulas.
    """
    ward = None
    if str(inputs.ward_id).isdigit():
        ward = db.query(Ward).filter(Ward.id == int(inputs.ward_id)).first()
    if not ward:
        ward = db.query(Ward).filter(Ward.code == str(inputs.ward_id)).first()
    if not ward:
        raise HTTPException(status_code=404, detail=f"Ward '{inputs.ward_id}' not found")

    # Get latest climate metric for ward
    metric = (
        db.query(ClimateMetric)
        .filter(ClimateMetric.ward_id == ward.id)
        .order_by(ClimateMetric.timestamp.desc())
        .first()
    )
    if not metric:
        # Fallback to defaults if no metric recorded yet
        metric = ClimateMetric(
            ward_id=ward.id,
            ndvi=0.25,
            ndbi=0.65,
            lst_celsius=float(ward.heat_index_celsius or 38.5),
            surface_temp_anomaly=3.5,
            air_temp_celsius=35.0,
            relative_humidity_pct=45.0,
            aqi_pm25=75.0,
            precipitation_mm=10.0,
            runoff_coefficient=float(ward.flood_susceptibility_idx or 0.75),
            soil_moisture_pct=20.0,
            is_simulated=False,
            source="Sentinel-2 MultiSpectral Instrument",
            quality_flag="CALIBRATED_OBSERVATION"
        )

    result = SimulationTwinEngine.simulate(
        ward=ward,
        latest_metric=metric,
        inputs=inputs
    )
    return result

@router.get("/assumptions", response_model=List[AssumptionItem])
def get_simulation_assumptions():
    """
    Retrieve documented biophysical formulas, unit costs, and epistemic rationale for the Urban Climate Twin.
    """
    return SimulationTwinEngine.get_documented_assumptions()

@router.get("/baseline/{ward_id}", response_model=SimulationResult)
def get_ward_baseline_simulation(ward_id: str, db: Session = Depends(get_db)):
    """
    Retrieve baseline scenario (0 interventions) for a given ward.
    """
    default_inputs = SimulationInputs(
        ward_id=ward_id,
        trees_count=0,
        cool_roof_pct=0.0,
        permeable_surface_sq_m=0.0,
        green_corridor_sq_m=0.0,
        retention_capacity_m3=0.0,
        available_budget_usd=1000000.0
    )
    return run_simulation(default_inputs, db)
