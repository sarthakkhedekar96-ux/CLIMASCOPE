import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.models.ward import Ward
from app.models.intervention import Intervention
from app.schemas.common import HealthStatus

logger = logging.getLogger("climascope.health")

router = APIRouter()

@router.get("", response_model=HealthStatus)
def get_health(db: Session = Depends(get_db)):
    """System health check and live operational telemetry status."""
    db_ok = True
    ward_count = 0
    intervention_count = 0
    try:
        db.execute(text("SELECT 1"))
        ward_count = db.query(Ward).count()
        intervention_count = db.query(Intervention).count()
    except Exception as e:
        logger.error(f"Health database query failed: {e}")
        db_ok = False

    is_healthy = db_ok and ward_count >= 7
    return HealthStatus(
        status="HEALTHY" if is_healthy else "DEGRADED",
        version=settings.VERSION,
        database_connected=db_ok,
        telemetry_status="NOMINAL" if is_healthy else "ALERT",
        active_wards_count=ward_count,
        active_interventions_count=intervention_count
    )
