from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.schemas.climate_debt import ClimateDebtResponse, CustomCalculationRequest
from app.schemas.common import ApiResponse
from app.services.climate_debt_engine import (
    ClimateDebtEngine,
    ClimateDebtInputs,
    ClimateDebtWeights,
    HistoricalObservation,
)

router = APIRouter()
engine = ClimateDebtEngine()

@router.get("/{ward_identifier}", response_model=ApiResponse[ClimateDebtResponse])
def get_ward_climate_debt(ward_identifier: str, db: Session = Depends(get_db)):
    """
    Computes explainable Climate Debt Score and breakdown for a municipal ward.
    Accepts either integer ward ID (e.g. '1') or string ward code (e.g. 'WRD-01').
    """
    if ward_identifier.isdigit():
        ward = db.query(Ward).filter(Ward.id == int(ward_identifier)).first()
    else:
        ward = db.query(Ward).filter(Ward.code == ward_identifier.upper()).first()

    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward '{ward_identifier}' not found in municipal registry."
        )

    # Latest empirical or calibrated observation
    latest_metric = (
        db.query(ClimateMetric)
        .filter(ClimateMetric.ward_id == ward.id)
        .order_by(ClimateMetric.timestamp.desc())
        .first()
    )

    # Historical metrics series
    metrics_history = (
        db.query(ClimateMetric)
        .filter(ClimateMetric.ward_id == ward.id)
        .order_by(ClimateMetric.timestamp.asc())
        .all()
    )

    hist_obs = []
    for m in metrics_history:
        # Approximate monthly historical debt based on historical LST & canopy
        approx_hist_debt = (
            (m.surface_temp_anomaly / 8.0 * 100.0 * 0.30) +
            (max(0.0, 35.0 - ward.canopy_cover_pct) / 35.0 * 100.0 * 0.25) +
            (ward.impervious_surface_pct * 0.25) +
            (ward.flood_susceptibility_idx * 100.0 * 0.20)
        )
        hist_obs.append(HistoricalObservation(
            timestamp=m.timestamp,
            debt_score=float(approx_hist_debt)
        ))

    # Construct biophysical inputs
    temp_anomaly = (
        latest_metric.surface_temp_anomaly
        if latest_metric
        else max(0.0, ward.heat_index_celsius - 34.5)
    )
    air_pm25 = latest_metric.aqi_pm25 if latest_metric else 62.0
    water_stress = (
        round(max(0.1, 1.0 - (latest_metric.soil_moisture_pct / 100.0)), 2)
        if latest_metric
        else 0.58
    )

    veg_loss = round(max(0.0, 35.0 - ward.canopy_cover_pct), 1)
    built_growth = ward.impervious_surface_pct
    intervention_cov = float(min(100.0, len(ward.interventions) * 15.0))

    inputs = ClimateDebtInputs(
        surface_temp_anomaly_celsius=temp_anomaly,
        vegetation_loss_pct=veg_loss,
        built_up_growth_pct=built_growth,
        flood_exposure_idx=ward.flood_susceptibility_idx,
        air_pollution_pm25=air_pm25,
        water_stress_idx=water_stress,
        population_vulnerability_pct=ward.vulnerable_population_pct,
        intervention_coverage_pct=intervention_cov,
        historical_series=hist_obs
    )

    res = engine.calculate(ward_id=ward.code, inputs=inputs)
    return ApiResponse(
        success=True,
        message=f"Climate debt calculated successfully for ward {ward.code}",
        data=ClimateDebtResponse(**res)
    )


@router.post("/calculate", response_model=ApiResponse[ClimateDebtResponse])
def calculate_custom_climate_debt(req: CustomCalculationRequest):
    """
    On-demand calculation endpoint allowing simulation of custom indicator values
    and custom multi-criteria weights.
    """
    custom_weights = None
    if any([req.w_heat, req.w_flood, req.w_degradation, req.w_vulnerability]):
        w_heat = req.w_heat if req.w_heat is not None else 0.30
        w_flood = req.w_flood if req.w_flood is not None else 0.25
        w_deg = req.w_degradation if req.w_degradation is not None else 0.25
        w_vuln = req.w_vulnerability if req.w_vulnerability is not None else 0.20

        # Normalize weights to sum to 1.0 if not exact
        total_w = w_heat + w_flood + w_deg + w_vuln
        if total_w > 0:
            w_heat /= total_w
            w_flood /= total_w
            w_deg /= total_w
            w_vuln /= total_w

        custom_weights = ClimateDebtWeights(
            w_heat=w_heat,
            w_flood=w_flood,
            w_degradation=w_deg,
            w_vulnerability=w_vuln
        )

    inputs = ClimateDebtInputs(
        surface_temp_anomaly_celsius=req.surface_temp_anomaly_celsius,
        vegetation_loss_pct=req.vegetation_loss_pct,
        built_up_growth_pct=req.built_up_growth_pct,
        flood_exposure_idx=req.flood_exposure_idx,
        air_pollution_pm25=req.air_pollution_pm25,
        water_stress_idx=req.water_stress_idx,
        population_vulnerability_pct=req.population_vulnerability_pct,
        intervention_coverage_pct=req.intervention_coverage_pct or 15.0
    )

    res = engine.calculate(
        ward_id=req.wardId or "SIM-WARD",
        inputs=inputs,
        custom_weights=custom_weights
    )

    return ApiResponse(
        success=True,
        message="Custom climate debt evaluated successfully",
        data=ClimateDebtResponse(**res)
    )
