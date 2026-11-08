from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class SimulationInputs(BaseModel):
    ward_id: str = Field(..., description="Target Ward ID (e.g. WRD-01)")
    trees_count: int = Field(default=0, ge=0, le=200000, description="Number of mature shade trees planted")
    cool_roof_pct: float = Field(default=0.0, ge=0.0, le=100.0, description="Percentage of built-up roof area retrofitted with high-albedo coating")
    permeable_surface_sq_m: float = Field(default=0.0, ge=0.0, le=500000, description="Area of permeable interlocking paving installed in sq meters")
    green_corridor_sq_m: float = Field(default=0.0, ge=0.0, le=300000, description="Area of urban green corridor and bioswales installed in sq meters")
    retention_capacity_m3: float = Field(default=0.0, ge=0.0, le=200000, description="Stormwater detention and retention capacity in cubic meters")
    available_budget_inr: Optional[float] = Field(default=None, ge=0.0, description="Available municipal capital expenditure budget in INR")
    available_budget_usd: float = Field(default=1000000.0, ge=0.0, description="Available municipal capital expenditure budget in USD (backward compatibility)")
    currency: str = Field(default="INR", description="Currency (INR)")

class ScenarioMetrics(BaseModel):
    climate_debt: float = Field(..., description="Overall Climate Debt Score (0-100)")
    heat_risk_celsius: float = Field(..., description="Land Surface Temperature (°C)")
    green_coverage_pct: float = Field(..., description="Canopy & Vegetative Coverage (%)")
    surface_runoff_risk_pct: float = Field(..., description="Surface Runoff & Infiltration Deficit Risk (%)")
    population_exposure: int = Field(..., description="Population directly exposed to extreme heat and flooding")
    estimated_cost_inr: float = Field(default=0.0, description="Total capital expenditure in INR")
    annual_maintenance_inr: float = Field(default=0.0, description="Annual maintenance expenditure in INR")
    estimated_cost_usd: float = Field(default=0.0, description="Total capital expenditure for the scenario in USD")

class MetricImprovement(BaseModel):
    baseline_value: float
    simulated_value: float
    delta: float
    pct_improvement: float
    unit: str
    is_favorable: bool

class AssumptionItem(BaseModel):
    parameter: str
    unit_cost_or_coefficient: str
    formula: str
    scientific_rationale: str
    time_to_benefit_horizon: Optional[str] = None
    physical_mechanism: Optional[str] = None
    limitations: Optional[str] = None
    degradation_or_maintenance_factor: Optional[str] = None

class SimulationResult(BaseModel):
    ward_id: str
    ward_name: str
    ward_code: str
    area_sq_km: float
    population: int
    currency: str = "INR"
    available_budget_inr: float = 0.0
    estimated_cost_inr: float = 0.0
    annual_maintenance_inr: float = 0.0
    budget_surplus_deficit_inr: float = 0.0
    budget_utilization_pct: float = 0.0
    epistemic_status: str = "MODEL_ESTIMATE"

    available_budget_usd: float = 0.0
    estimated_cost_usd: float = 0.0
    budget_surplus_deficit_usd: float = 0.0
    is_budget_sufficient: bool = True

    baseline: ScenarioMetrics
    simulated: ScenarioMetrics
    single_interventions: Dict[str, ScenarioMetrics]
    improvements: Dict[str, MetricImprovement]

    assumptions: List[AssumptionItem]
    epistemic_disclaimer: str = Field(
        default="MODELED ESTIMATE (PHYSICS TWIN) — Deterministic microclimate scenario projection based on localized heat transfer equations and empirical runoff coefficients. Not a substitute for decadal mesoscale atmospheric simulation."
    )
