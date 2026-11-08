from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class DecadalProjectionPoint(BaseModel):
    year: int
    heat_index_p10: float = Field(..., description="10th percentile multi-model lower bound (°C)")
    heat_index_p50: float = Field(..., description="50th percentile multi-model ensemble median (°C)")
    heat_index_p90: float = Field(..., description="90th percentile multi-model upper bound (°C)")
    heatwave_days_p50: int = Field(..., description="Projected annual days with Tmax > 38°C (median)")
    extreme_precip_risk_p50: float = Field(..., description="Projected flash flood susceptibility index (0-100)")
    climate_debt_p50: float = Field(..., description="Projected climate debt index score (0-100)")

class ScenarioProjection(BaseModel):
    scenario_id: str
    scenario_name: str
    radiative_forcing_wm2: float
    description: str
    annual_warming_rate_celsius: float
    trajectory: List[DecadalProjectionPoint]

class BaselineComparisonRow(BaseModel):
    time_horizon: str # e.g. "Historical Baseline (1995–2014)", "Current Observation (2026)", "Mid-Century 2035", "Long-Term 2050"
    scenario: str # "OBSERVED", "SSP2-4.5", "SSP5-8.5"
    heat_index_celsius: float
    heat_index_range: str # e.g. "36.2 – 38.0°C"
    heatwave_days_per_year: int
    flood_susceptibility_idx: float
    climate_debt_score: float
    projected_economic_loss_inr_cr: float
    epistemic_status: str # "CALIBRATED_BENCHMARK_OBSERVATION", "EMPIRICAL_STATISTICAL_DOWNSCALING", "MODEL_ESTIMATE"

class CMIP6ProjectionResponse(BaseModel):
    ward_id: int
    ward_code: str
    ward_name: str
    study_area_id: Optional[str]
    jurisdiction_name: str
    baseline_period: str = "1995–2014 (CMIP6 Climatological Baseline)"
    current_observation_year: int = 2026
    historical_baseline_lst_celsius: float
    current_lst_celsius: float
    downscaling_methodology: str
    downscaling_disclaimer: str
    models_in_ensemble: List[str]
    scenarios: Dict[str, ScenarioProjection]
    comparison_table: List[BaselineComparisonRow]
