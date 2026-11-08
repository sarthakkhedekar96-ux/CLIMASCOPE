from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class LedgerEntryBase(BaseModel):
    ward_id: int
    entry_code: str = Field(..., example="LEDGER-2026-0041")
    transaction_hash: str = Field(..., example="8f4b23c9a1d5e6834b6e8f498c1b7a2d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b")
    timestamp: datetime
    action_type: str = Field(..., example="EMPIRICAL_VERIFICATION")
    intervention_name: str = Field(..., example="Canopy Planting Phase 1")
    description: str = Field(..., example="Post-implementation satellite surface temperature check.")

    # Primary INR Financial System
    currency: str = Field(default="INR", example="INR")
    budget_allocated_inr: float = Field(default=0.0, example=2500000.0)
    budget_disbursed_inr: float = Field(default=0.0, example=2200000.0)
    actual_expenditure_inr: float = Field(default=0.0, example=2200000.0)
    funding_source: Optional[str] = Field(default="15th Finance Commission Urban Climate Grant", example="15th Finance Commission")
    fiscal_year: str = Field(default="FY 2026-27", example="FY 2026-27")
    financial_status: str = Field(default="APPROVED", example="APPROVED")
    jurisdiction: Optional[str] = Field(default="Pune Municipal Corporation (PMC)", example="PMC")
    is_overspent: bool = Field(default=False, example=False)
    overspend_warning: Optional[str] = None

    # Backward Compatibility
    budget_allocated_usd: float = Field(default=0.0, example=30000.0)
    budget_disbursed_usd: float = Field(default=0.0, example=26000.0)

    contractor_entity: Optional[str] = Field(None, example="Urban Forest Green Inc.")
    authorizing_official: str = Field(..., example="Chief Resilience Officer Dr. E. Martinez")
    delta_ndvi: Optional[float] = Field(None, example=0.09)
    delta_lst_celsius: Optional[float] = Field(None, example=-1.3)
    delta_runoff_pct: Optional[float] = Field(None, example=-14.2)
    is_verified: bool = Field(default=False, example=True)
    verification_method: Optional[str] = Field(None, example="Bi-temporal Sentinel-2 MSI Surface Analysis")

class LedgerEntryCreate(LedgerEntryBase):
    pass

class LedgerEntryResponse(LedgerEntryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LedgerAuditSummary(BaseModel):
    total_entries_count: int
    currency: str = "INR"
    total_budget_allocated_inr: float = 0.0
    total_budget_disbursed_inr: float = 0.0
    total_actual_expenditure_inr: float = 0.0
    total_remaining_budget_inr: float = 0.0
    overspent_entries_count: int = 0
    has_overspend_warnings: bool = False

    # Backward compatibility
    total_budget_allocated_usd: float = 0.0
    total_budget_disbursed_usd: float = 0.0
    total_verified_actions: int
    net_verified_surface_cooling_celsius: float
    net_verified_vegetation_gain_ndvi: float
    ledger_integrity_verified: bool = True
