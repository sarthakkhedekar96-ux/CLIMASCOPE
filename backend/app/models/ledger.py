from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class LedgerEntry(Base, TimestampMixin):
    """
    Climate Action Ledger entry.
    Maintains an auditable, verifiable record of capital deployed,
    milestones met, and empirical climate delta verifications.
    """
    __tablename__ = "climate_action_ledger"

    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_code = Column(String(64), unique=True, index=True, nullable=False) # e.g. "LEDGER-2026-0041"
    transaction_hash = Column(String(64), unique=True, index=True, nullable=False) # SHA-256 integrity hash
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    action_type = Column(String(64), nullable=False) # "BUDGET_ALLOCATION", "WORK_ORDER_ISSUED", "COMPLETION_REPORT", "EMPIRICAL_VERIFICATION"
    intervention_name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)

    # Financial Audit (Primary INR System)
    currency = Column(String(8), default="INR", nullable=False)
    budget_allocated_inr = Column(Float, nullable=False, default=0.0)
    budget_disbursed_inr = Column(Float, nullable=False, default=0.0)
    actual_expenditure_inr = Column(Float, nullable=False, default=0.0)
    budget_allocated_usd = Column(Float, nullable=False, default=0.0)
    budget_disbursed_usd = Column(Float, nullable=False, default=0.0)
    funding_source = Column(String(128), default="15th Finance Commission Urban Climate Grant", nullable=True)
    fiscal_year = Column(String(16), default="FY 2026-27", nullable=False)
    financial_status = Column(String(32), default="APPROVED", nullable=False) # "PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "VERIFIED"
    jurisdiction = Column(String(128), default="Pune Municipal Corporation (PMC)", nullable=True)
    is_overspent = Column(Boolean, default=False, nullable=False)
    overspend_warning = Column(String(256), nullable=True)

    contractor_entity = Column(String(128), nullable=True)
    authorizing_official = Column(String(128), nullable=False)

    # Verification Audit Metrics (Populated when action_type is EMPIRICAL_VERIFICATION)
    delta_ndvi = Column(Float, nullable=True) # e.g. +0.08
    delta_lst_celsius = Column(Float, nullable=True) # e.g. -1.4°C
    delta_runoff_pct = Column(Float, nullable=True) # e.g. -18.2%
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_method = Column(String(128), nullable=True) # e.g. "Bi-temporal Sentinel-2 MSI Surface Analysis"

    # Relationships
    ward = relationship("Ward", back_populates="ledger_entries")
