from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Ward(Base, TimestampMixin):
    """
    Municipal Administrative Ward Model.
    Represents the core spatial management unit in the climate intelligence platform.
    """
    __tablename__ = "wards"

    code = Column(String(32), unique=True, index=True, nullable=False) # e.g. "WRD-01"
    name = Column(String(128), nullable=False) # e.g. "Industrial Harbor"
    zone = Column(String(64), nullable=False) # e.g. "Maritime Industrial"
    area_sq_km = Column(Float, nullable=False)
    population = Column(Integer, nullable=False)
    vulnerable_population_pct = Column(Float, nullable=False) # elderly + children under 5 + low income

    # Administrative Jurisdiction & Study Area Demarcation
    study_area_id = Column(String(32), nullable=True, index=True) # e.g. "PMR-HAD-01"
    study_area_name = Column(String(128), nullable=True) # e.g. "Hadapsar & Magarpatta Industrial Study Area"
    jurisdiction_name = Column(String(128), default="Pune Municipal Corporation (PMC)", nullable=False)
    jurisdiction_type = Column(String(64), default="PMC_STUDY_AREA", nullable=False) # PMC_STUDY_AREA, PCMC_STUDY_AREA, PMR_STUDY_AREA

    # Spatial Centroid & Boundary Provenance
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=False) # GeoJSON Polygon coordinates string
    boundary_source = Column(String(256), default="Approximate Demonstration Study Boundary", nullable=False)
    boundary_is_verified = Column(Boolean, default=False, nullable=False)
    boundary_notes = Column(Text, nullable=True)
    data_source = Column(String(256), default="Copernicus Sentinel-2, USGS Landsat-8, IMD Gridded Telemetry", nullable=True)

    # Baseline Environmental State
    canopy_cover_pct = Column(Float, nullable=False)
    impervious_surface_pct = Column(Float, nullable=False)
    albedo_avg = Column(Float, nullable=False) # 0.05 (asphalt) - 0.40 (reflective)
    flood_susceptibility_idx = Column(Float, nullable=False) # 0.0 - 1.0
    heat_index_celsius = Column(Float, nullable=False)

    # Climate Debt & Risk Scores (Deterministic aggregate indexes)
    baseline_risk_score = Column(Float, nullable=False) # 0 - 100
    climate_debt_score = Column(Float, nullable=False) # 0 - 100
    tree_canopy_deficit_sq_m = Column(Float, nullable=False)

    # Status Alert: "CRITICAL", "ELEVATED", "MODERATE", "STABLE"
    status_badge = Column(String(32), default="MODERATE", nullable=False)
    summary_notes = Column(Text, nullable=True)

    # Relationships
    metrics = relationship("ClimateMetric", back_populates="ward", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="ward", cascade="all, delete-orphan")
    ledger_entries = relationship("LedgerEntry", back_populates="ward", cascade="all, delete-orphan")
    evidence_nodes = relationship("EvidenceNode", back_populates="ward", cascade="all, delete-orphan")
