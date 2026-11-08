from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ContributingFactor(BaseModel):
    factor: str
    category: str
    indicator: str
    rawValue: str
    normalizedScore: float
    weight: float
    contributionPoints: float
    direction: str
    description: str

class ExplainabilityBreakdown(BaseModel):
    thermalContribution: float
    canopyDeficitContribution: float
    imperviousnessContribution: float
    floodContribution: float
    demographicContribution: float
    adaptiveCapacityOffset: float
    totalClimateDebt: float

class ClimateDebtResponse(BaseModel):
    wardId: str
    climateDebt: float
    riskLevel: str
    heatRisk: float
    floodRisk: float
    vegetationLoss: float
    builtUpGrowth: float
    vulnerability: float
    adaptiveCapacity: float
    trend: str
    confidence: float
    dataCompletenessLevel: Optional[str] = "HIGH_COMPLETENESS"
    methodologyNotes: Optional[str] = None
    explainabilityBreakdown: Optional[ExplainabilityBreakdown] = None
    contributingFactors: List[ContributingFactor]

class CustomCalculationRequest(BaseModel):
    wardId: Optional[str] = "CUSTOM-01"
    surface_temp_anomaly_celsius: Optional[float] = None
    vegetation_loss_pct: Optional[float] = None
    built_up_growth_pct: Optional[float] = None
    flood_exposure_idx: Optional[float] = None
    air_pollution_pm25: Optional[float] = None
    water_stress_idx: Optional[float] = None
    population_vulnerability_pct: Optional[float] = None
    intervention_coverage_pct: Optional[float] = 15.0
    w_heat: Optional[float] = None
    w_flood: Optional[float] = None
    w_degradation: Optional[float] = None
    w_vulnerability: Optional[float] = None
