from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class EvidenceNode(Base, TimestampMixin):
    """
    Node in the Causal Climate Evidence Graph.
    Connects root environmental causes, biophysical stressors,
    public vulnerabilities, and mitigation levers.
    """
    __tablename__ = "evidence_nodes"

    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "EV-SAT-01", "NODE-URB-01"
    node_type = Column(String(32), nullable=False) # "CAUSE", "STRESSOR", "IMPACT", "VULNERABILITY", "MITIGATION"
    label = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    value_display = Column(String(64), nullable=False) # e.g. "84.2% Impervious", "+4.2°C LST"
    confidence_score = Column(Float, nullable=False, default=0.95) # 0.0 to 1.0
    evidence_source = Column(String(128), nullable=False) # e.g. "Sentinel-2 Spectral Analysis", "Hydrological Surface Runoff Model"

    # Enhanced Investigation Fields
    evidence_type = Column(String(64), default="SATELLITE_OBSERVATION", nullable=True) # "SATELLITE_OBSERVATION", "LAND_USE_RECORD", "TEMPERATURE_OBSERVATION", etc.
    observation_date = Column(String(32), default="2026-10-15", nullable=True)
    geographic_location = Column(String(128), default="Pune Metropolitan Region", nullable=True)
    is_observed_fact = Column(Boolean, default=True, nullable=True) # True = Fact, False = Hypothesis
    category = Column(String(64), default="Environmental Indicator", nullable=True) # e.g. "Vegetation Loss", "Built-up Growth", "Heat Risk"

    # Relationships
    ward = relationship("Ward", back_populates="evidence_nodes")


class EvidenceEdge(Base, TimestampMixin):
    """
    Directed relationship between evidence nodes in the causal graph.
    """
    __tablename__ = "evidence_edges"

    source_node_id = Column(String(64), nullable=False, index=True)
    target_node_id = Column(String(64), nullable=False, index=True)
    relation_type = Column(String(64), nullable=False) # "DRIVES", "EXACERBATES", "TRIGGERS", "AMELIORATES"
    weight = Column(Float, nullable=False, default=1.0)
    statistical_significance = Column(Float, nullable=True) # e.g. p < 0.001
    mechanism_explanation = Column(Text, nullable=False)
