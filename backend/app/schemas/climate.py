from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class ClimateMetricBase(BaseModel):
    ward_id: int
    timestamp: datetime
    ndvi: float = Field(..., ge=-1.0, le=1.0, example=0.18)
    ndbi: float = Field(..., ge=-1.0, le=1.0, example=0.45)
    lst_celsius: float = Field(..., example=39.4)
    surface_temp_anomaly: float = Field(..., example=4.2)
    air_temp_celsius: float = Field(..., example=34.1)
    relative_humidity_pct: float = Field(..., example=52.0)
    aqi_pm25: float = Field(..., example=68.5)
    precipitation_mm: float = Field(..., example=0.0)
    runoff_coefficient: float = Field(..., ge=0.0, le=1.0, example=0.82)
    soil_moisture_pct: float = Field(..., example=12.4)
    # Provenance & Epistemics
    data_type: str = Field(default="OBSERVED", example="OBSERVED")
    is_simulated: bool = Field(default=False, example=False)
    is_verified: bool = Field(default=True, example=True)
    confidence_score: float = Field(default=95.0, example=95.0)
    source: str = Field(..., example="Copernicus Sentinel-2 Level-2A")
    source_name: Optional[str] = Field(None, example="Copernicus Sentinel-2 MSI Level-2A")
    source_url: Optional[str] = Field(None, example="https://dataspace.copernicus.eu")
    sensor_id: Optional[str] = Field(None, example="S2A_MSIL2A_2026")
    acquisition_date: Optional[str] = Field(None, example="2026-10-18")
    processing_date: Optional[str] = Field(None, example="2026-10-19")
    spatial_resolution: Optional[str] = Field(None, example="10m (VNIR)")
    temporal_resolution: Optional[str] = Field(None, example="5-day revisit")
    quality_flag: str = Field(default="CALIBRATED_OBSERVATION", example="CALIBRATED_OBSERVATION")
    methodology: Optional[str] = Field(None, example="Bottom-of-atmosphere surface reflectance processing.")
    limitations: Optional[str] = Field(None, example="Screened for cloud cover < 5%.")
    notes: Optional[str] = None

class ClimateMetricCreate(ClimateMetricBase):
    pass

class ClimateMetricResponse(ClimateMetricBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClimateDebtSummary(BaseModel):
    city_average_debt_score: float = Field(..., example=63.3)
    accumulated_thermal_debt_celsius_years: float = Field(..., example=126.8)
    total_canopy_deficit_sq_km: float = Field(..., example=22.4)
    total_unmitigated_runoff_m3_yr: float = Field(..., example=4850000.0)
    estimated_remediation_capital_needed_usd: float = Field(..., example=71680000.0)
    wards_in_critical_debt: int = Field(..., example=2)

class MonthlyTrendPoint(BaseModel):
    month: str # e.g. "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"
    timestamp: str
    avg_lst_celsius: float
    avg_ndvi: float
    baseline_lst_celsius: float
    precipitation_mm: float

class RecentClimateEvent(BaseModel):
    id: str
    timestamp: str
    ward_code: str
    ward_name: str
    title: str
    severity: str # "CRITICAL" | "WARNING" | "INFO"
    category: str # "HEAT" | "FLOOD" | "CANOPY" | "SATELLITE"
    description: str
    source: str

class CityOverviewMetrics(BaseModel):
    city_name: str = "Pune Metropolitan Region (PMC)"
    total_wards: int = 7
    total_population: int = 994000
    population_exposed: int = 247374
    average_heat_index_celsius: float = 37.6
    peak_surface_temp_celsius: float = 41.8
    average_canopy_cover_pct: float = 16.9
    critical_wards_count: int = 2
    elevated_wards_count: int = 3
    stable_wards_count: int = 2
    total_active_interventions: int = 14
    total_committed_budget_usd: float = 4850000.0
    telemetry_health: str = "100% OPERATIONAL"
    climate_debt: ClimateDebtSummary
    environmental_trends: List[MonthlyTrendPoint] = []
    hazard_distribution: Dict[str, int] = {}
    debt_distribution: Dict[str, int] = {}
    recent_events: List[RecentClimateEvent] = []

class DataQualitySummary(BaseModel):
    total_study_areas: int = Field(..., example=7)
    verified_boundaries_count: int = Field(..., example=0)
    approximate_boundaries_count: int = Field(..., example=7)
    observed_metrics_count: int = Field(..., example=18)
    derived_metrics_count: int = Field(..., example=21)
    simulated_metrics_count: int = Field(..., example=6)
    projected_metrics_count: int = Field(..., example=14)
    missing_source_count: int = Field(..., example=0)
    unverified_measurements_count: int = Field(..., example=2)
    boundary_disclaimer: str = Field(
        default="All spatial boundaries in CLIMASCOPE are approximate demonstration study envelopes for microclimate modeling and do not represent legally demarcated municipal cadastre limits."
    )
    jurisdictions_breakdown: Dict[str, int] = Field(default_factory=dict)
