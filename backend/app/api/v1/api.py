from fastapi import APIRouter
from app.api.v1.endpoints import health, wards, metrics, interventions, evidence, ledger, climate_debt, investigate, simulate, copilot

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(wards.router, prefix="/wards", tags=["Wards"])
api_router.include_router(climate_debt.router, prefix="/climate-debt", tags=["Climate Debt Engine"])
api_router.include_router(investigate.router, prefix="/investigate", tags=["AI Climate Investigator"])
api_router.include_router(simulate.router, prefix="/simulate", tags=["Urban Climate Twin"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Climate Metrics"])
api_router.include_router(interventions.router, prefix="/interventions", tags=["Interventions"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence Graph"])
api_router.include_router(ledger.router, prefix="/ledger", tags=["Climate Action Ledger"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["AI Climate Copilot"])
