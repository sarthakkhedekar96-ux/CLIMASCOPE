from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class EvidenceItem(BaseModel):
    evidence_id: str
    evidence_type: str # "SATELLITE_OBSERVATION", "LAND_USE_RECORD", "TEMPERATURE_OBSERVATION", "GROUND_SENSOR", "CIVIL_SURVEY", "METEOROLOGICAL_STATION"
    source: str
    observation_date: str
    geographic_location: str
    confidence: float
    description: str
    is_observed_fact: bool = True
    category: str # "Vegetation Loss", "Built-up Growth", "Heat Risk", "Flood Risk", "Air Quality"

class ObservedChange(BaseModel):
    metric_name: str
    observed_value: str
    baseline_value: str
    delta: str
    epistemic_status: str = "OBSERVED_FACT" # Strictly facts
    sensor_source: str

class ContributingFactorHypothesis(BaseModel):
    factor_name: str
    category: str
    mechanism_hypothesis: str # Scientific explanation of biophysical mechanism (non-accusatory)
    confidence: float
    epistemic_status: str = "HYPOTHESIS" # Strictly hypothesis
    supporting_evidence_ids: List[str]
    alternative_explanations: List[str] = Field(default_factory=list)
    correlation_vs_causation_note: Optional[str] = None

class HierarchicalEvidenceBranch(BaseModel):
    category: str
    indicator_summary: str
    evidence_items: List[EvidenceItem]

class InvestigationReportResponse(BaseModel):
    ward_id: str
    ward_name: str
    ward_zone: str
    investigation_date: str
    executive_summary: str
    observed_environmental_changes: List[ObservedChange]
    potential_contributing_factors: List[ContributingFactorHypothesis]
    supporting_evidence: List[EvidenceItem]
    confidence_level: float
    missing_information: List[str]
    recommended_field_investigation: List[str]
    suggested_interventions: List[str]
    relationship_graph: Dict[str, Any]
    scientific_questions_assessment: Optional[Dict[str, str]] = None
