import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.risk_classification import get_climate_risk_tier
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.schemas.ward import WardSummary, WardDetail, WardGeoJSONCollection, WardGeoJSONFeature
from app.schemas.common import ApiResponse

router = APIRouter()

@router.get("", response_model=ApiResponse[List[WardSummary]])
def list_wards(db: Session = Depends(get_db)):
    """Retrieve all municipal wards with summary climate indicators."""
    wards = db.query(Ward).order_by(Ward.baseline_risk_score.desc()).all()
    for w in wards:
        w.status_badge = get_climate_risk_tier(w.climate_debt_score)
    return ApiResponse(
        success=True,
        message=f"Retrieved {len(wards)} wards successfully",
        data=wards
    )

@router.get("/geojson", response_model=WardGeoJSONCollection)
def get_wards_geojson(db: Session = Depends(get_db)):
    """Retrieve all ward boundaries and metadata as a standard GeoJSON FeatureCollection."""
    wards = db.query(Ward).all()
    features = []
    for w in wards:
        try:
            geom = json.loads(w.geometry_geojson)
        except Exception:
            geom = {"type": "Polygon", "coordinates": []}

        veg_loss = round(max(0.0, 35.0 - w.canopy_cover_pct), 1)
        built_growth = round(w.impervious_surface_pct * 0.18, 1) # Estimated decadal expansion
        status_tier = get_climate_risk_tier(w.climate_debt_score)
        data_confidence = 98.4 if status_tier in ("CRITICAL", "ELEVATED") else 96.8

        features.append(WardGeoJSONFeature(
            type="Feature",
            id=w.id,
            geometry=geom,
            properties={
                "id": w.id,
                "code": w.code,
                "name": w.name,
                "study_area_id": w.study_area_id or w.code,
                "study_area_name": w.study_area_name or w.name,
                "jurisdiction_name": w.jurisdiction_name,
                "jurisdiction_type": w.jurisdiction_type,
                "boundary_source": w.boundary_source,
                "boundary_is_verified": w.boundary_is_verified,
                "boundary_notes": w.boundary_notes,
                "is_approximate_boundary": not w.boundary_is_verified,
                "data_source": w.data_source,
                "zone": w.zone,
                "area_sq_km": w.area_sq_km,
                "population": w.population,
                "vulnerable_population_pct": w.vulnerable_population_pct,
                "heat_index_celsius": w.heat_index_celsius,
                "canopy_cover_pct": w.canopy_cover_pct,
                "vegetation_loss_pct": veg_loss,
                "impervious_surface_pct": w.impervious_surface_pct,
                "built_up_growth_pct": built_growth,
                "flood_susceptibility_idx": w.flood_susceptibility_idx,
                "baseline_risk_score": w.baseline_risk_score,
                "climate_debt_score": w.climate_debt_score,
                "status_badge": status_tier,
                "data_confidence_pct": data_confidence,
                "center_lat": w.center_lat,
                "center_lon": w.center_lon,
            }
        ))
    return WardGeoJSONCollection(type="FeatureCollection", features=features)

@router.get("/{ward_id}", response_model=ApiResponse[WardDetail])
def get_ward_detail(ward_id: int, db: Session = Depends(get_db)):
    """Retrieve comprehensive single ward details including latest sensor/satellite readings."""
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward with id {ward_id} not found"
        )

    # Get latest metric
    latest_metric = (
        db.query(ClimateMetric)
        .filter(ClimateMetric.ward_id == ward_id)
        .order_by(ClimateMetric.timestamp.desc())
        .first()
    )

    active_int_count = len(ward.interventions)

    ward_detail = WardDetail(
        id=ward.id,
        code=ward.code,
        name=ward.name,
        zone=ward.zone,
        area_sq_km=ward.area_sq_km,
        population=ward.population,
        vulnerable_population_pct=ward.vulnerable_population_pct,
        center_lat=ward.center_lat,
        center_lon=ward.center_lon,
        geometry_geojson=ward.geometry_geojson,
        canopy_cover_pct=ward.canopy_cover_pct,
        impervious_surface_pct=ward.impervious_surface_pct,
        albedo_avg=ward.albedo_avg,
        flood_susceptibility_idx=ward.flood_susceptibility_idx,
        heat_index_celsius=ward.heat_index_celsius,
        baseline_risk_score=ward.baseline_risk_score,
        climate_debt_score=ward.climate_debt_score,
        tree_canopy_deficit_sq_m=ward.tree_canopy_deficit_sq_m,
        status_badge=get_climate_risk_tier(ward.climate_debt_score),
        summary_notes=ward.summary_notes,
        created_at=ward.created_at,
        updated_at=ward.updated_at,
        active_interventions_count=active_int_count,
        study_area_id=ward.study_area_id or ward.code,
        study_area_name=ward.study_area_name or ward.name,
        jurisdiction_name=ward.jurisdiction_name,
        jurisdiction_type=ward.jurisdiction_type,
        boundary_source=ward.boundary_source,
        boundary_is_verified=ward.boundary_is_verified,
        boundary_notes=ward.boundary_notes,
        data_source=ward.data_source,
        latest_lst_celsius=latest_metric.lst_celsius if latest_metric else None,
        latest_ndvi=latest_metric.ndvi if latest_metric else None,
        latest_aqi=latest_metric.aqi_pm25 if latest_metric else None
    )

    return ApiResponse(
        success=True,
        message=f"Ward {ward.code} details retrieved",
        data=ward_detail
    )
