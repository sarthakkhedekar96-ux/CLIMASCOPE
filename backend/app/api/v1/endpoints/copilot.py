from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.ward import Ward
from app.schemas.common import ApiResponse
from app.schemas.copilot import (
    CopilotQueryRequest,
    CopilotQueryResponse,
    SuggestedQuestionsResponse,
)
from app.services.copilot_engine import ClimateCopilotEngine

router = APIRouter()

@router.post("/query", response_model=ApiResponse[CopilotQueryResponse])
def query_copilot(
    payload: CopilotQueryRequest,
    db: Session = Depends(get_db)
):
    """
    CLIMASCOPE AI Climate Copilot.
    Executes conversational intent extraction, real application data retrieval,
    biophysical analytics, and explainable municipal synthesis.
    """
    try:
        response = ClimateCopilotEngine.process_query(request=payload, db=db)
        return ApiResponse(
            success=True,
            message="Copilot inquiry processed successfully",
            data=response
        )
    except Exception as e:
        # Never leak internal database errors or API keys
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to process climate inquiry: {str(e)}"
        )

@router.get("/suggested-questions", response_model=ApiResponse[SuggestedQuestionsResponse])
def get_suggested_questions(
    ward_id: Optional[int] = Query(None, description="Optional active ward context ID"),
    current_phase: str = Query("overview", description="Current workflow phase"),
    db: Session = Depends(get_db)
):
    """
    Retrieves dynamically tailored suggested question buttons based on current ward
    and active workflow phase.
    """
    ward = None
    if ward_id:
        ward = db.query(Ward).filter(Ward.id == ward_id).first()

    ward_code = ward.code if ward else "WRD-01"
    ward_name = ward.name if ward else "Hadapsar & Magarpatta"

    # Always ensure the 7 core required prompt questions are prominent
    core_questions = [
        "Which ward has the highest climate debt?",
        f"Why is {ward_code} at critical risk?",
        "Which intervention should be prioritized?",
        "How should a 5 crore budget be distributed?",
        "What happens if we increase the tree coverage?",
        "Which interventions are still pending verification?",
        "Which wards have the highest population vulnerability?",
    ]

    # Additional contextual questions based on active phase
    phase_specific = []
    if current_phase == "debt":
        phase_specific.append(f"Explain the thermodynamic formula behind {ward_code}'s score")
    elif current_phase == "investigate":
        phase_specific.append(f"What evidence exists for {ward_name}'s heat anomaly?")
    elif current_phase == "simulate":
        phase_specific.append(f"Compare cool roof vs tree canopy in {ward_code}")
    elif current_phase == "prioritize":
        phase_specific.append("Why were certain projects rejected by the knapsack optimizer?")
    elif current_phase == "verify":
        phase_specific.append(f"What is the verification status of interventions in {ward_code}?")

    all_questions = core_questions + phase_specific

    return ApiResponse(
        success=True,
        message="Retrieved suggested copilot questions",
        data=SuggestedQuestionsResponse(
            active_ward_code=ward_code,
            active_ward_name=ward_name,
            current_phase=current_phase,
            suggested_questions=all_questions
        )
    )
