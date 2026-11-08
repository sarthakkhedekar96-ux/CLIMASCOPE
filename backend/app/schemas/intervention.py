from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class InterventionBase(BaseModel):
    ward_id: int
    intervention_code: str = Field(..., example="ACT-2026-HDP-01")
    name: str = Field(..., example="Industrial Rooftop Albedo Coating (24,000 m²)")
    category: str = Field(..., example="COOL_ROOF")

    # Financial Architecture (INR Primary)
    currency: str = Field(default="INR", example="INR")
    cost_inr: float = Field(default=0.0, example=2800000.0) # Implementation cost in INR
    annual_maintenance_inr: float = Field(default=0.0, example=120000.0)
    cost_usd: float = Field(default=0.0, example=34000.0) # Maintained for backward compatibility
    target_area_sq_m: float = Field(..., example=24000.0)
    annual_maintenance_usd: float = Field(default=0.0, example=1500.0)

    # Granular Financial Breakdown & Procurement
    cost_category: str = Field(default="CAPEX_CIVIL", example="COOL_ROOF")
    cost_per_unit: Optional[float] = Field(default=0.0, example=650.0)
    unit_measure: Optional[str] = Field(default="units", example="sq_m")
    quantity: Optional[float] = Field(default=0.0, example=4000.0)
    estimated_total_cost: Optional[float] = Field(default=0.0, example=2800000.0)
    funding_source: str = Field(default="15th Finance Commission Urban Climate Grant", example="15th Finance Commission Urban Climate Grant")
    fiscal_year: str = Field(default="FY 2026-27", example="FY 2026-27")
    jurisdiction: str = Field(default="Pune Municipal Corporation (PMC)", example="Pune Municipal Corporation (PMC)")
    is_simulated: bool = False

    # Financial Execution & Utilization
    approved_budget_inr: Optional[float] = Field(default=0.0, example=3000000.0)
    actual_expenditure_inr: Optional[float] = Field(default=0.0, example=1400000.0)
    financial_status: str = Field(default="PROPOSED", example="PROPOSED")

    cooling_effect_celsius: float = Field(..., example=1.8)
    runoff_reduction_pct: float = Field(..., example=0.0)
    co2_sequestration_t_yr: float = Field(..., example=42.0)
    roi_score: float = Field(..., example=8.4)
    status: str = Field(default="Proposed", example="Proposed")
    timeline_months: int = Field(default=6, example=6)
    contractor: Optional[str] = None
    responsible_authority: str = Field(default="PMC Urban Resilience Cell", example="PMC Urban Resilience Cell")
    start_date: str = Field(default="2026-03-01", example="2026-03-01")
    deadline: str = Field(default="2026-09-30", example="2026-09-30")
    progress_pct: int = Field(default=0, ge=0, le=100, example=25)
    description: Optional[str] = None

    # Verification Module
    expected_outcome: Optional[str] = None
    observed_outcome: Optional[str] = None
    difference_outcome: Optional[str] = None
    verification_status: str = Field(default="Verification Pending", example="Verification Pending")
    evidence_source: Optional[str] = None
    verification_date: Optional[str] = None
    is_simulated_verification: bool = False
    attached_evidence_json: str = "[]"

class InterventionCreate(InterventionBase):
    pass

class InterventionUpdatePayload(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_inr: Optional[float] = None
    cost_usd: Optional[float] = None
    annual_maintenance_inr: Optional[float] = None
    actual_expenditure_inr: Optional[float] = None
    approved_budget_inr: Optional[float] = None
    financial_status: Optional[str] = None
    responsible_authority: Optional[str] = None
    contractor: Optional[str] = None
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    progress_pct: Optional[int] = None
    status: Optional[str] = None # Proposed, Approved, In Progress, Completed, Verification Pending, Verified, Failed
    description: Optional[str] = None

class AttachEvidencePayload(BaseModel):
    evidence_id: Optional[str] = None
    evidence_type: str = Field(..., example="SATELLITE_RADIOMETRY")
    source: str = Field(..., example="Copernicus Sentinel-2 MSI BOA Surface Analysis")
    observation_date: str = Field(..., example="2026-10-18")
    geographic_location: str = Field(..., example="18.5204° N, 73.8567° E")
    description: str = Field(..., example="Post-implementation thermal radiance check.")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    is_simulated: bool = False

class VerifyInterventionPayload(BaseModel):
    simulate: bool = Field(default=False, description="Whether this is a demonstration simulated verification")
    observed_cooling_celsius: Optional[float] = None
    observed_runoff_reduction_pct: Optional[float] = None
    evidence_source: Optional[str] = None
    notes: Optional[str] = None

class OutcomeComparisonResult(BaseModel):
    intervention_id: int
    intervention_code: str
    name: str
    ward_id: int
    ward_code: str
    status: str
    verification_status: str
    is_simulated: bool
    evidence_source: str
    verification_date: str

    # Planned vs Observed vs Difference
    planned_cooling_celsius: float
    observed_cooling_celsius: float
    cooling_difference_celsius: float
    cooling_target_met: bool

    planned_runoff_reduction_pct: float
    observed_runoff_reduction_pct: float
    runoff_difference_pct: float
    runoff_target_met: bool

    verification_summary: str
    audit_block_hash: str

class InterventionResponse(InterventionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OptimizedIntervention(InterventionResponse):
    ward_code: str
    ward_name: str
    equity_multiplier: float
    feasibility_score: float
    utility_score: float
    marginal_efficiency: float
    population_benefited: int
    projected_debt_relief: float

class RejectedIntervention(BaseModel):
    id: int
    intervention_code: str
    name: str
    ward_code: str
    ward_name: str
    category: str
    cost_inr: float = 0.0
    cost_usd: float = 0.0
    cooling_effect_celsius: float
    runoff_reduction_pct: float
    utility_score: float
    marginal_efficiency: float
    rejection_reason: str
    budget_deficit_inr: float = 0.0
    budget_deficit_usd: float = 0.0

class WardAllocationSummary(BaseModel):
    ward_id: int
    ward_code: str
    ward_name: str
    ward_zone: str
    vulnerability_pct: float
    climate_debt_score: float
    allocated_inr: float = 0.0
    allocated_usd: float = 0.0
    pct_of_total_budget: float
    interventions_count: int
    projected_cooling_celsius: float
    projected_runoff_reduction_pct: float
    projected_debt_relief: float
    population_benefited: int

class CategoryAllocation(BaseModel):
    category: str
    allocated_inr: float = 0.0
    allocated_usd: float = 0.0
    pct_of_total: float
    projects_count: int

class CostImpactDataPoint(BaseModel):
    id: int
    code: str
    name: str
    ward_code: str
    cost_lakhs: float = 0.0
    cost_inr: float = 0.0
    cost_k: float = 0.0 # Legacy USD
    risk_reduction: float
    population_benefited: int
    is_selected: bool
    roi_score: float
    category: str

class OptimizationRequest(BaseModel):
    budget_inr: Optional[float] = Field(default=None, example=5000000.0, description="Available municipal budget in INR (e.g. ₹50 Lakh, ₹1 Crore, ₹5 Crore)")
    budget_cap_usd: Optional[float] = Field(default=None, example=1500000.0, description="Available municipal budget in USD (backward compatibility)")
    currency: str = Field(default="INR", description="Primary currency (INR)")
    target_ward_ids: Optional[List[int]] = Field(default=None, example=[1, 2, 4], description="Optional filter by Ward IDs")
    primary_objective: str = Field(
        default="BALANCED",
        description="BALANCED, MAX_COOLING, MAX_RUNOFF_REDUCTION, MAX_POPULATION, or MAX_EQUITY"
    )
    equity_weight_factor: float = Field(default=1.0, ge=0.0, le=3.0, description="Multiplier for vulnerable population and debt weighting")

class OptimizationResult(BaseModel):
    # Primary INR Financial System fields
    currency: str = "INR"
    budget_cap_inr: float = 0.0
    total_cost_inr: float = 0.0
    remaining_budget_inr: float = 0.0
    budget_utilization_pct: float = 0.0

    # Core legacy fields for backward compatibility
    budget_cap_usd: float = 0.0
    total_cost_usd: float = 0.0
    remaining_budget_usd: float = 0.0
    selected_interventions: List[InterventionResponse]
    projected_mean_cooling_celsius: float
    projected_mean_runoff_reduction_pct: float
    projected_annual_co2_offset_tons: float
    cost_efficiency_rating: str
    optimization_method: str = "Deterministic Integer Knapsack (SciPy MILP / Branch-and-Bound)"

    # Comprehensive Budget Optimization Engine fields
    selected_wards: List[WardAllocationSummary] = Field(default_factory=list)
    recommended_interventions: List[OptimizedIntervention] = Field(default_factory=list)
    rejected_interventions: List[RejectedIntervention] = Field(default_factory=list)

    total_population_benefited: int = 0
    vulnerable_population_benefited: int = 0
    aggregate_debt_reduction: float = 0.0

    allocation_by_ward: List[WardAllocationSummary] = Field(default_factory=list)
    allocation_by_category: List[CategoryAllocation] = Field(default_factory=list)
    cost_versus_impact: List[CostImpactDataPoint] = Field(default_factory=list)

    mathematical_explanation: str = Field(
        default="Deterministic 0/1 knapsack optimization maximizing equity-weighted risk reduction under municipal capital ceiling."
    )
    solver_diagnostics: Dict[str, Any] = Field(default_factory=dict)
    epistemic_disclaimer: str = Field(
        default="DETERMINISTIC INTEGER KNAPSACK OPTIMIZATION (SCIPY MILP) — Mathematical allocation computed via branch-and-bound integer programming with zero LLM heuristic hallucination."
    )

class CostAssumptionItem(BaseModel):
    category: str
    intervention_name: str
    unit_cost_inr: float
    unit_label: str
    annual_maintenance_inr_pct: float
    expected_lifespan_years: int
    cooling_benefit_per_unit: str
    stormwater_benefit_per_unit: str
    methodology: str
    official_reference: str

class FinancialSummaryResponse(BaseModel):
    total_available_budget_inr: float
    total_allocated_budget_inr: float
    total_expenditure_inr: float
    total_remaining_budget_inr: float
    budget_utilization_pct: float
    cost_by_category: Dict[str, float]
    cost_by_jurisdiction: Dict[str, float]
    cost_per_beneficiary_inr: float
    total_beneficiaries: int
    resilience_benefit_per_lakh_inr: float
    fiscal_year: str = "FY 2026-27"
    currency: str = "INR"
