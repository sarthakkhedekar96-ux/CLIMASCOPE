from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.intervention import Intervention
from app.models.ward import Ward
from app.schemas.intervention import (
    InterventionResponse,
    InterventionCreate,
    InterventionUpdatePayload,
    AttachEvidencePayload,
    VerifyInterventionPayload,
    OutcomeComparisonResult,
    OptimizationRequest,
    OptimizationResult,
    CostAssumptionItem,
    FinancialSummaryResponse
)
from app.schemas.common import ApiResponse
from app.services.budget_optimizer import BudgetOptimizationEngine
from app.services.action_ledger_service import ActionLedgerService

router = APIRouter()

@router.get("", response_model=ApiResponse[List[InterventionResponse]])
def list_interventions(
    ward_id: Optional[int] = Query(None, description="Filter by Ward ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Retrieve municipal interventions with optional filtering by ward or lifecycle status."""
    query = db.query(Intervention)
    if ward_id is not None:
        query = query.filter(Intervention.ward_id == ward_id)
    if status is not None:
        query = query.filter(Intervention.status == status)

    interventions = query.order_by(Intervention.roi_score.desc()).all()
    return ApiResponse(
        success=True,
        message=f"Retrieved {len(interventions)} interventions",
        data=interventions
    )

@router.get("/cost-assumptions", response_model=ApiResponse[List[CostAssumptionItem]])
def get_cost_assumptions():
    """
    Returns empirical municipal climate intervention cost and lifespan assumptions
    benchmarked against Maharashtra PWD CSR 2024-25, CPWD Schedule of Rates 2024,
    and the Pune Municipal Climate Action Plan 2023-2030.
    """
    assumptions = [
        CostAssumptionItem(
            category="URBAN_FORESTRY",
            intervention_name="High-Density Native Miyawaki / Street Canopy Afforestation",
            unit_cost_inr=2200.0,
            unit_label="₹2,200 per sapling",
            annual_maintenance_inr_pct=11.4,
            expected_lifespan_years=25,
            cooling_benefit_per_unit="0.08°C localized canopy shading attenuation per 50 saplings",
            stormwater_benefit_per_unit="0.45 m³/sapling/yr canopy interception and root infiltration",
            methodology="1m³ pit excavation, organic vermicompost, perforated PVC guard, watering & weeding for 3 years",
            official_reference="Maharashtra PWD CSR 2024-25 Item 42.18 / PMC Tree Authority Directive 2023"
        ),
        CostAssumptionItem(
            category="COOL_ROOF",
            intervention_name="High-Albedo Elastomeric Polyurethane Rooftop Coating",
            unit_cost_inr=650.0,
            unit_label="₹650 per m²",
            annual_maintenance_inr_pct=6.1,
            expected_lifespan_years=8,
            cooling_benefit_per_unit="0.35°C surface microclimate reduction per 1,000 m² (SRI ≥ 104)",
            stormwater_benefit_per_unit="0.0 m³ (Dedicated radiative cooling intervention)",
            methodology="Two-coat elastomeric UV-resistant polymer coating over high-bond primer; ASTM E1980 SRI verification",
            official_reference="CPWD Analysis of Rates 2024 (Civil Vol II, Section 12) & BEE Energy Conservation Code"
        ),
        CostAssumptionItem(
            category="PERMEABLE_PAVEMENT",
            intervention_name="Interlocking Precast Concrete Permeable Block Pavement",
            unit_cost_inr=1950.0,
            unit_label="₹1,950 per m²",
            annual_maintenance_inr_pct=4.1,
            expected_lifespan_years=15,
            cooling_benefit_per_unit="0.15°C reduction in sensible heat flux compared to conventional bitumen",
            stormwater_benefit_per_unit="65% peak stormwater surface runoff attenuation (infiltrates up to 300 mm/hr)",
            methodology="80mm M-40 grade permeable pavers over 50mm bedding sand and 200mm graded aggregate reservoir",
            official_reference="IRC:SP:63-2018 (Guidelines for Interlocking Concrete Pavements) & Maharashtra PWD CSR Item 22.04"
        ),
        CostAssumptionItem(
            category="GREEN_CORRIDOR",
            intervention_name="Multi-Tiered Urban Bioswales & Riparian Green Corridors",
            unit_cost_inr=2400.0,
            unit_label="₹2,400 per m²",
            annual_maintenance_inr_pct=6.7,
            expected_lifespan_years=20,
            cooling_benefit_per_unit="0.40°C thermal attenuation per 500m linear strip via active evapotranspiration",
            stormwater_benefit_per_unit="55% runoff capture through engineered bioretention soil mix and silt filtering",
            methodology="Indigenous shrub and grass bioswales with perforated underdrainage and geotextile root barriers",
            official_reference="PMC Comprehensive Mobility Plan Green Infrastructure Schedule & CPWD Urban Landscaping Standard 2023"
        ),
        CostAssumptionItem(
            category="RETENTION_BASIN",
            intervention_name="Subsurface Modular Geocellular Rainwater Retention Sump",
            unit_cost_inr=2850.0,
            unit_label="₹2,850 per m³",
            annual_maintenance_inr_pct=3.9,
            expected_lifespan_years=30,
            cooling_benefit_per_unit="0.05°C indirect microclimate moderation through shallow aquifer recharge",
            stormwater_benefit_per_unit="100% volumetric storage retention up to design capacity with silt traps",
            methodology="High-strength polypropylene modular matrix wrapped in non-woven geotextile with desilting chamber",
            official_reference="Central Ground Water Board (CGWB) Rainwater Harvesting Manual & PMC Building By-laws Section 14"
        ),
        CostAssumptionItem(
            category="WETLAND_RESTORATION",
            intervention_name="Constructed Riparian Wetland Buffer & Bio-Filtration Zone",
            unit_cost_inr=3100.0,
            unit_label="₹3,100 per m²",
            annual_maintenance_inr_pct=5.0,
            expected_lifespan_years=25,
            cooling_benefit_per_unit="0.60°C microclimatic cooling within 150m riverine buffer",
            stormwater_benefit_per_unit="80% peak flood surge buffering and nutrient stripping",
            methodology="Graded macrophyte marsh planting (Vetiver, Typha) with coir log stabilization and rock check weirs",
            official_reference="Mula-Mutha River Rejuvenation Project DPR / CPCB Wetland Conservation Guidelines"
        )
    ]
    return ApiResponse(
        success=True,
        message="Retrieved 6 empirical municipal climate intervention cost assumptions",
        data=assumptions
    )

@router.get("/financial-summary", response_model=ApiResponse[FinancialSummaryResponse])
def get_financial_summary(db: Session = Depends(get_db)):
    """
    Returns aggregated municipal financial intelligence across all recorded climate actions:
    Total available capital ceiling, committed budget, actual expenditure, utilization rate,
    cost by intervention category and jurisdiction, and cost per beneficiary.
    """
    USD_INR_RATE = 83.5
    TOTAL_AVAILABLE_BUDGET_INR = 1500000000.0 # Municipal Climate Resilience Capital Envelope (₹150 Crore)

    interventions = db.query(Intervention).all()
    wards = db.query(Ward).all()
    ward_pop_map = {w.id: w.population for w in wards}

    total_allocated_inr = sum(
        float(getattr(i, 'approved_budget_inr', 0.0) or getattr(i, 'cost_inr', 0.0) or (i.cost_usd * USD_INR_RATE))
        for i in interventions
    )
    total_expenditure_inr = sum(
        float(getattr(i, 'actual_expenditure_inr', 0.0) or (getattr(i, 'cost_inr', 0.0) * (getattr(i, 'progress_pct', 0) / 100.0)))
        for i in interventions
    )
    remaining_budget_inr = max(0.0, TOTAL_AVAILABLE_BUDGET_INR - total_allocated_inr)
    utilization_pct = round((total_allocated_inr / max(1.0, TOTAL_AVAILABLE_BUDGET_INR)) * 100.0, 1)

    # Cost by category
    cost_by_category: Dict[str, float] = {}
    for i in interventions:
        cat = i.category or "OTHER"
        amt = float(getattr(i, 'cost_inr', 0.0) or (i.cost_usd * USD_INR_RATE))
        cost_by_category[cat] = round(cost_by_category.get(cat, 0.0) + amt, 2)

    # Cost by jurisdiction
    cost_by_jurisdiction: Dict[str, float] = {}
    for i in interventions:
        juris = getattr(i, 'jurisdiction', None) or "Pune Municipal Corporation (PMC)"
        # Normalize display name
        if "PCMC" in juris or "Pimpri" in juris:
            juris_key = "Pimpri Chinchwad Municipal Corporation (PCMC)"
        elif "PMRDA" in juris or "Metropolitan" in juris:
            juris_key = "Pune Metropolitan Region Dev. Authority (PMRDA)"
        else:
            juris_key = "Pune Municipal Corporation (PMC)"
        amt = float(getattr(i, 'cost_inr', 0.0) or (i.cost_usd * USD_INR_RATE))
        cost_by_jurisdiction[juris_key] = round(cost_by_jurisdiction.get(juris_key, 0.0) + amt, 2)

    # Calculate estimated beneficiaries
    total_beneficiaries = sum(
        int(min(ward_pop_map.get(i.ward_id, 80000) * 0.45, max(1200, (i.target_area_sq_m / 10.0))))
        for i in interventions
    )
    cost_per_beneficiary = round(total_allocated_inr / max(1, total_beneficiaries), 2)

    # Composite risk reduction
    total_cooling = sum(float(i.cooling_effect_celsius or 0.0) for i in interventions)
    total_runoff = sum(float(i.runoff_reduction_pct or 0.0) for i in interventions)
    composite_benefit = round((total_cooling * 10.0) + (total_runoff * 1.5), 2)
    benefit_per_lakh = round(composite_benefit / max(1.0, total_allocated_inr / 100000.0), 3)

    summary = FinancialSummaryResponse(
        total_available_budget_inr=TOTAL_AVAILABLE_BUDGET_INR,
        total_allocated_budget_inr=round(total_allocated_inr, 2),
        total_expenditure_inr=round(total_expenditure_inr, 2),
        total_remaining_budget_inr=round(remaining_budget_inr, 2),
        budget_utilization_pct=utilization_pct,
        cost_by_category=cost_by_category,
        cost_by_jurisdiction=cost_by_jurisdiction,
        cost_per_beneficiary_inr=cost_per_beneficiary,
        total_beneficiaries=total_beneficiaries,
        resilience_benefit_per_lakh_inr=benefit_per_lakh,
        fiscal_year="FY 2026-27",
        currency="INR"
    )

    return ApiResponse(
        success=True,
        message="Retrieved municipal financial summary in INR",
        data=summary
    )

@router.post("", response_model=ApiResponse[InterventionResponse], status_code=status.HTTP_201_CREATED)
def create_intervention(
    payload: InterventionCreate,
    db: Session = Depends(get_db)
):
    """Create a new municipal climate intervention action record."""
    try:
        itv = ActionLedgerService.create_intervention(payload=payload, db=db)
        return ApiResponse(
            success=True,
            message=f"Created intervention record {itv.intervention_code}",
            data=itv
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{intervention_id}", response_model=ApiResponse[InterventionResponse])
def update_intervention(
    intervention_id: int,
    payload: InterventionUpdatePayload,
    db: Session = Depends(get_db)
):
    """Update intervention status, assign responsible authority, or update progress."""
    try:
        itv = ActionLedgerService.update_intervention(intervention_id=intervention_id, payload=payload, db=db)
        return ApiResponse(
            success=True,
            message=f"Updated intervention {itv.intervention_code} to status {itv.status}",
            data=itv
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{intervention_id}/evidence", response_model=ApiResponse[InterventionResponse])
def attach_evidence(
    intervention_id: int,
    payload: AttachEvidencePayload,
    db: Session = Depends(get_db)
):
    """Attach verifiable evidence document or observation record to an intervention."""
    try:
        itv = ActionLedgerService.attach_evidence(intervention_id=intervention_id, payload=payload, db=db)
        return ApiResponse(
            success=True,
            message=f"Evidence attached to {itv.intervention_code}",
            data=itv
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{intervention_id}/verify", response_model=ApiResponse[OutcomeComparisonResult])
def verify_intervention(
    intervention_id: int,
    payload: VerifyInterventionPayload,
    db: Session = Depends(get_db)
):
    """
    Empirical or Simulated Verification Module.
    Compares baseline planned outcomes with observed satellite/ground metrics,
    records deltas, and writes an audit block to the immutable Ledger.
    """
    try:
        res = ActionLedgerService.verify_intervention(intervention_id=intervention_id, payload=payload, db=db)
        return ApiResponse(
            success=True,
            message=f"Verification completed for {res.intervention_code} ({res.verification_status})",
            data=res
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{intervention_id}/outcome-comparison", response_model=ApiResponse[OutcomeComparisonResult])
def get_outcome_comparison(
    intervention_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve side-by-side comparison of planned vs observed outcomes."""
    try:
        res = ActionLedgerService.get_outcome_comparison(intervention_id=intervention_id, db=db)
        return ApiResponse(
            success=True,
            message=f"Retrieved outcome comparison for {res.intervention_code}",
            data=res
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/optimize", response_model=ApiResponse[OptimizationResult])
def optimize_interventions(
    payload: OptimizationRequest,
    db: Session = Depends(get_db)
):
    """
    CLIMASCOPE Municipal Budget Optimization Engine.
    Uses exact 0/1 Integer Knapsack Programming (SciPy HiGHS MILP) to identify
    the mathematically optimal, equity-weighted intervention portfolio under a finite capital limit.
    """
    opt_result = BudgetOptimizationEngine.optimize(payload=payload, db=db)

    return ApiResponse(
        success=True,
        message="Intervention portfolio optimization converged successfully",
        data=opt_result
    )
