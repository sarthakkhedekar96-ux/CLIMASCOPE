from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class ClimateMetric(Base, TimestampMixin):
    """
    Empirical or Simulated Climate Metric Observation for a Ward.
    Every single observation or projection strictly declares its provenance,
    observation versus simulation status, and sensor/satellite calibration metadata.
    """
    __tablename__ = "climate_metrics"

    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Vegetation & Built Index
    ndvi = Column(Float, nullable=False) # Normalized Difference Vegetation Index (-1.0 to 1.0)
    ndbi = Column(Float, nullable=False) # Normalized Difference Built-up Index (-1.0 to 1.0)

    # Thermal & Atmospheric
    lst_celsius = Column(Float, nullable=False) # Land Surface Temperature
    surface_temp_anomaly = Column(Float, nullable=False) # Delta vs city-wide baseline (+X.X°C)
    air_temp_celsius = Column(Float, nullable=False)
    relative_humidity_pct = Column(Float, nullable=False)
    aqi_pm25 = Column(Float, nullable=False) # PM2.5 in ug/m3

    # Hydrological
    precipitation_mm = Column(Float, nullable=False)
    runoff_coefficient = Column(Float, nullable=False) # 0.05 to 0.95
    soil_moisture_pct = Column(Float, nullable=False)

    # Provenance & Epistemic Classification (OBSERVED, DERIVED, SIMULATED, PROJECTED)
    data_type = Column(String(32), default="OBSERVED", nullable=False, index=True)
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    confidence_score = Column(Float, default=95.0, nullable=False)
    source = Column(String(128), nullable=False)
    # e.g. "Sentinel-2 MultiSpectral Instrument", "Landsat-8 TIRS", "Climascope Synthetic Sim Twin"
    source_name = Column(String(128), nullable=True)
    source_url = Column(String(256), nullable=True)
    sensor_id = Column(String(64), nullable=True)
    acquisition_date = Column(String(32), nullable=True)
    processing_date = Column(String(32), nullable=True)
    spatial_resolution = Column(String(64), nullable=True)
    temporal_resolution = Column(String(64), nullable=True)
    methodology = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    quality_flag = Column(String(32), default="CALIBRATED_OBSERVATION", nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    ward = relationship("Ward", back_populates="metrics")
