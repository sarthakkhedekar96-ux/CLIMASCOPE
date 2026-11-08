from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.schemas.investigation import InvestigationReportResponse
from app.schemas.common import ApiResponse
from app.services.investigator_engine import ClimateInvestigatorEngine

router = APIRouter()

@router.get("/{ward_identifier}", response_model=ApiResponse[InvestigationReportResponse])
def get_ward_investigation_report(ward_identifier: str, db: Session = Depends(get_db)):
    """
    AI Climate Investigator (Core Innovation).
    Generates a comprehensive, evidence-grounded investigation report explaining
    why a selected municipal ward is experiencing environmental deterioration.
    """
    if ward_identifier.isdigit():
        ward = db.query(Ward).filter(Ward.id == int(ward_identifier)).first()
    else:
        ward = db.query(Ward).filter(Ward.code == ward_identifier.upper()).first()

    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward '{ward_identifier}' not found in municipal registry."
        )

    latest_metric = (
        db.query(ClimateMetric)
        .filter(ClimateMetric.ward_id == ward.id)
        .order_by(ClimateMetric.timestamp.desc())
        .first()
    )

    historical_metrics = (
        db.query(ClimateMetric)
        .filter(ClimateMetric.ward_id == ward.id)
        .order_by(ClimateMetric.timestamp.asc())
        .all()
    )

    report = ClimateInvestigatorEngine.generate_investigation_report(
        ward=ward,
        latest_metric=latest_metric,
        historical_metrics=historical_metrics
    )

    return ApiResponse(
        success=True,
        message=f"Investigation report generated successfully for ward {ward.code}",
        data=report
    )
