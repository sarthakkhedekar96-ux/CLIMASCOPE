from typing import Generic, TypeVar, Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field

T = TypeVar("T")

class HealthStatus(BaseModel):
    status: str = Field(..., example="HEALTHY")
    version: str = Field(..., example="1.0.0")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    database_connected: bool = True
    telemetry_status: str = Field(default="NOMINAL", example="NOMINAL")
    active_wards_count: int = 0
    active_interventions_count: int = 0

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    error_details: Optional[str] = None

class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[str | int] = None
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
