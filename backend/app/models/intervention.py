from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Intervention(Base, TimestampMixin):
    """
    Municipal Climate Mitigation and Resilience Intervention.
    Used for simulation, budget optimization, procurement actioning,
    lifecycle status tracking, and empirical verification.
    """
    __tablename__ = "interventions"

    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    intervention_code = Column(String(32), unique=True, index=True, nullable=False) # Unique Action ID e.g. "ACT-2026-HDP-01"
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False) # e.g. "CANOPY_EXPANSION", "COOL_ROOF", "PERMEABLE_PAVING", "BIOSWALE", "RETENTION_BASIN", "GREEN_CORRIDOR"

    # Financial & Scale (Primary INR Municipal Currency System)
    currency = Column(String(8), default="INR", nullable=False) # Primary: "INR"
    cost_inr = Column(Float, nullable=False, default=0.0) # Implementation cost in INR
    annual_maintenance_inr = Column(Float, nullable=False, default=0.0) # Annual upkeep in INR
    cost_usd = Column(Float, nullable=False, default=0.0) # Historical/legacy USD reference
    target_area_sq_m = Column(Float, nullable=False)
    annual_maintenance_usd = Column(Float, nullable=False, default=0.0)

    # Granular Financial Breakdown & Procurement Metadata
    cost_category = Column(String(64), default="CAPEX_CIVIL", nullable=False) # e.g. "CAPEX_CIVIL", "NATURE_BASED", "RETROFIT", "DRAINAGE"
    cost_per_unit = Column(Float, nullable=True, default=0.0) # e.g. ₹2,200 per tree, ₹650 per m² cool roof
    unit_measure = Column(String(32), nullable=True, default="units") # e.g. "trees", "sq_m", "cu_m"
    quantity = Column(Float, nullable=True, default=0.0)
    estimated_total_cost = Column(Float, nullable=True, default=0.0)
    funding_source = Column(String(128), default="15th Finance Commission Urban Climate Grant", nullable=False)
    fiscal_year = Column(String(16), default="FY 2026-27", nullable=False)
    jurisdiction = Column(String(128), default="Pune Municipal Corporation (PMC)", nullable=False)
    is_simulated = Column(Boolean, default=False, nullable=False)

    # Financial Execution & Budget Utilization
    approved_budget_inr = Column(Float, nullable=True, default=0.0)
    actual_expenditure_inr = Column(Float, nullable=True, default=0.0)
    financial_status = Column(String(32), default="PROPOSED", nullable=False) # "PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "VERIFIED"

    # Modeled Climate Impact (Deterministic Physics/Empirical calculations)
    cooling_effect_celsius = Column(Float, nullable=False) # Modeled LST cooling
    runoff_reduction_pct = Column(Float, nullable=False) # Modeled stormwater attenuation
    co2_sequestration_t_yr = Column(Float, nullable=False) # Modeled CO2 offset
    roi_score = Column(Float, nullable=False) # Marginal climate resilience benefit per $10k spent

    # Lifecycle Status:
    # "Proposed", "Approved", "In Progress", "Completed", "Verification Pending", "Verified", "Failed"
    status = Column(String(32), default="Proposed", nullable=False, index=True)
    timeline_months = Column(Integer, default=6, nullable=False)
    contractor = Column(String(128), nullable=True)
    responsible_authority = Column(String(128), default="PMC Urban Resilience Cell", nullable=False)
    start_date = Column(String(32), default="2026-03-01", nullable=False)
    deadline = Column(String(32), default="2026-09-30", nullable=False)
    progress_pct = Column(Integer, default=0, nullable=False)
    description = Column(Text, nullable=True)

    # Verification Module: Expected vs Observed Outcomes
    expected_outcome = Column(Text, nullable=True) # e.g. '{"cooling_celsius": 2.1, "runoff_reduction_pct": 0.0, "canopy_gain_pct": 0.0}'
    observed_outcome = Column(Text, nullable=True) # e.g. '{"cooling_celsius": 1.9, "runoff_reduction_pct": 0.0, "canopy_gain_pct": 0.0}'
    difference_outcome = Column(Text, nullable=True) # e.g. '{"cooling_celsius": 0.2, "cooling_status": "WITHIN_TOLERANCE"}'
    verification_status = Column(String(32), default="Verification Pending", nullable=False)
    evidence_source = Column(String(128), nullable=True) # e.g. "Sentinel-2 MSI BOA Reflectance", "Landsat-8 TIRS Radiometry"
    verification_date = Column(String(32), nullable=True)
    is_simulated_verification = Column(Boolean, default=False, nullable=False)
    attached_evidence_json = Column(Text, default="[]", nullable=False) # JSON list of attached evidence cards

    # Relationships
    ward = relationship("Ward", back_populates="interventions")
