from typing import Optional, List
from pydantic import BaseModel, Field

class EvidenceNodeResponse(BaseModel):
    id: int
    ward_id: int
    node_id: str
    node_type: str # "CAUSE", "STRESSOR", "IMPACT", "VULNERABILITY", "MITIGATION"
    label: str
    description: Optional[str] = None
    value_display: str
    confidence_score: float
    evidence_source: str
    evidence_type: Optional[str] = "SATELLITE_OBSERVATION"
    observation_date: Optional[str] = "2026-10-15"
    geographic_location: Optional[str] = "Pune Metropolitan Region"
    is_observed_fact: Optional[bool] = True
    category: Optional[str] = "Environmental Indicator"

    class Config:
        from_attributes = True

class EvidenceEdgeResponse(BaseModel):
    id: int
    source_node_id: str
    target_node_id: str
    relation_type: str
    weight: float
    statistical_significance: Optional[float] = None
    mechanism_explanation: str

    class Config:
        from_attributes = True

class EvidenceGraphResponse(BaseModel):
    ward_id: int
    ward_name: str
    nodes: List[EvidenceNodeResponse]
    edges: List[EvidenceEdgeResponse]
    causal_summary: str
    data_provenance: str
