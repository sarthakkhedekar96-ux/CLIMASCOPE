from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class WardBase(BaseModel):
    code: str = Field(..., example="WRD-01")
    name: str = Field(..., example="Industrial Harbor")
    zone: str = Field(..., example="Maritime Industrial")
    area_sq_km: float = Field(..., example=8.45)
    population: int = Field(..., example=64200)
    vulnerable_population_pct: float = Field(..., example=24.5)
    center_lat: float = Field(..., example=37.7749)
    center_lon: float = Field(..., example=-122.4194)
    canopy_cover_pct: float = Field(..., example=8.5)
    impervious_surface_pct: float = Field(..., example=82.4)
    albedo_avg: float = Field(..., example=0.11)
    flood_susceptibility_idx: float = Field(..., example=0.76)
    heat_index_celsius: float = Field(..., example=41.8)
    baseline_risk_score: float = Field(..., example=88.4)
    climate_debt_score: float = Field(..., example=82.1)
    tree_canopy_deficit_sq_m: float = Field(..., example=420000.0)
    status_badge: str = Field(default="CRITICAL", example="CRITICAL")
    summary_notes: Optional[str] = None

    # Administrative Jurisdiction & Study Area Demarcation
    study_area_id: Optional[str] = Field(None, example="PMR-HAD-01")
    study_area_name: Optional[str] = Field(None, example="Hadapsar & Magarpatta Industrial Study Area")
    jurisdiction_name: str = Field(default="Pune Municipal Corporation (PMC)", example="Pune Municipal Corporation (PMC)")
    jurisdiction_type: str = Field(default="PMC_STUDY_AREA", example="PMC_STUDY_AREA")
    boundary_source: str = Field(default="Approximate Demonstration Study Boundary", example="Approximate Demonstration Study Boundary")
    boundary_is_verified: bool = Field(default=False, example=False)
    boundary_notes: Optional[str] = Field(None, example="Approximate spatial boundary for demonstration modeling.")
    data_source: Optional[str] = Field(None, example="Copernicus Sentinel-2, USGS Landsat-8, IMD Gridded Telemetry")

class WardCreate(WardBase):
    geometry_geojson: str

class WardSummary(WardBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WardDetail(WardSummary):
    geometry_geojson: str
    active_interventions_count: int = 0
    latest_lst_celsius: Optional[float] = None
    latest_ndvi: Optional[float] = None
    latest_aqi: Optional[float] = None

    class Config:
        from_attributes = True

class WardGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: int
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class WardGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[WardGeoJSONFeature]
