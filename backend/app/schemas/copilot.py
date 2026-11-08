from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CopilotQueryRequest(BaseModel):
    query: str = Field(
        ...,
        description="Natural language climate, risk, or budget question from municipal officer",
        example="Which ward has the highest climate debt?"
    )
    ward_id: Optional[int] = Field(
        None,
        description="Optional active ward context ID",
        example=1
    )
    current_phase: Optional[str] = Field(
        "overview",
        description="Current workflow phase in CLIMASCOPE UI (e.g. debt, investigate, simulate, prioritize, verify)",
        example="debt"
    )
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default_factory=list,
        description="Optional prior chat turns for multi-turn contextual continuity"
    )

class CopilotEvidenceRef(BaseModel):
    evidence_id: str
    evidence_type: str
    source: str
    observation_date: str
    description: str
    confidence: float

class CopilotQueryResponse(BaseModel):
    query: str
    intent: str
    ward_id: Optional[int] = None
    ward_code: Optional[str] = None
    ward_name: Optional[str] = None
    executive_summary: str
    response_text: str
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    evidence_references: List[CopilotEvidenceRef] = Field(default_factory=list)
    confidence: float
    missing_information: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)
    sources_used: List[str] = Field(default_factory=list)
    execution_time_ms: float
    is_llm_synthesized: bool = False

class SuggestedQuestionsResponse(BaseModel):
    active_ward_code: Optional[str] = None
    active_ward_name: Optional[str] = None
    current_phase: str
    suggested_questions: List[str]
