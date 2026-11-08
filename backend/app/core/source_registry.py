"""
Unified Climate Data Source Registry
CLIMASCOPE Urban Climate Platform
==================================

Centralized scientific catalog for all observational, derived,
simulated, and projected climate datasets integrated across CLIMASCOPE.

Provides rigorous transparency regarding data providers, acquisition
methods, spatial/temporal resolutions, calibration standards, and
scientific limitations. Zero fabricated sensor feeds.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ClimateDataSource(BaseModel):
    source_id: str = Field(..., description="Unique source identifier")
    name: str = Field(..., description="Canonical dataset name")
    provider: str = Field(..., description="Operating agency or scientific institution")
    official_url: str = Field(..., description="Official repository or portal URL")
    sensor_platform: str = Field(..., description="Satellite instrument, sensor array, or numerical model")
    spectral_or_variable_bands: List[str] = Field(default_factory=list, description="Bands or variables utilized")
    spatial_resolution: str = Field(..., description="Spatial resolution (e.g. 10m, 30m, 100m, point)")
    temporal_resolution: str = Field(..., description="Revisit frequency or logging interval")
    integration_status: str = Field(
        ...,
        description="CALIBRATED_BENCHMARK_OBSERVATION, DERIVED_BIOPHYSICAL_MODEL, MODEL_ESTIMATE, or LIVE_FEED_PENDING"
    )
    calibration_standard: str = Field(..., description="Radiometric, atmospheric, or institutional calibration standard")
    processing_level: str = Field(..., description="Standard data processing level (e.g. Level-1T, Level-2A, L3, Modeled)")
    data_limitations: str = Field(..., description="Explicit scientific caveats, cloud constraints, or spatial assumptions")
    notes: Optional[str] = None


class UnifiedSourceRegistry:
    """
    Central authoritative repository for all data source provenance in CLIMASCOPE.
    """

    SOURCES: Dict[str, ClimateDataSource] = {
        "SRC-LANDSAT8-TIRS": ClimateDataSource(
            source_id="SRC-LANDSAT8-TIRS",
            name="Landsat-8 Thermal Infrared Sensor (TIRS) Band 10 Radiance",
            provider="United States Geological Survey (USGS) / NASA",
            official_url="https://earthexplorer.usgs.gov",
            sensor_platform="Landsat-8 TIRS-1",
            spectral_or_variable_bands=["Band 10 Thermal Infrared (10.60 - 11.19 µm)"],
            spatial_resolution="100m resampled to 30m by USGS",
            temporal_resolution="16-day orbital revisit",
            integration_status="CALIBRATED_BENCHMARK_OBSERVATION",
            calibration_standard="USGS Calibration Parameter Files; Split-Window / Single-Channel Radiative Transfer Algorithm",
            processing_level="Level-2 Science Product (Surface Temperature)",
            data_limitations=(
                "Subject to optical cloud occlusion during southwest monsoon (Jun-Sep); "
                "represents instantaneous radiometric surface skin temperature (LST) at ~10:45 AM local solar overpass, "
                "not 2-meter ambient dry-bulb air temperature."
            ),
            notes="Calibrated historical benchmarks ingested for Pune Metropolitan Region study areas."
        ),
        "SRC-SENTINEL2-MSI": ClimateDataSource(
            source_id="SRC-SENTINEL2-MSI",
            name="Copernicus Sentinel-2 MultiSpectral Instrument (MSI) Surface Reflectance",
            provider="European Space Agency (ESA) / Copernicus Programme",
            official_url="https://dataspace.copernicus.eu",
            sensor_platform="Sentinel-2A / Sentinel-2B MSI",
            spectral_or_variable_bands=[
                "Band 4 Red (665 nm)",
                "Band 8 NIR (842 nm)",
                "Band 11 SWIR-1 (1610 nm)",
                "Band 12 SWIR-2 (2190 nm)"
            ],
            spatial_resolution="10m (Bands 4 & 8) / 20m (Bands 11 & 12)",
            temporal_resolution="5-day constellation revisit at equator",
            integration_status="CALIBRATED_BENCHMARK_OBSERVATION",
            calibration_standard="Sen2Cor Bottom-Of-Atmosphere (BOA) Atmospheric Correction; ISO 19115 compliant metadata",
            processing_level="Level-2A (Surface Reflectance)",
            data_limitations=(
                "NDVI vegetation indices saturate over dense canopies (NDVI > 0.80); "
                "soil moisture fluctuations immediately post-monsoon affect bare ground spectral reflectance."
            ),
            notes="Powers ward canopy deficit (NDVI) and built-up index (NDBI) measurements."
        ),
        "SRC-CPCB-CAAQMS": ClimateDataSource(
            source_id="SRC-CPCB-CAAQMS",
            name="Continuous Ambient Air Quality Monitoring Station (CAAQMS) Telemetry",
            provider="Central Pollution Control Board (CPCB) / Maharashtra Pollution Control Board (MPCB)",
            official_url="https://app.cpcbccr.com/ccr/#/caaqms-dashboard-all/caaqms-landing",
            sensor_platform="In-situ BAM-1020 / TEOM particulate mass monitors",
            spectral_or_variable_bands=["PM2.5", "PM10", "NO2", "Ambient Temperature", "Relative Humidity"],
            spatial_resolution="Point sensor station (~2.5 km spatial representative radius)",
            temporal_resolution="15-minute sampling aggregated to 24-hour mean",
            integration_status="CALIBRATED_BENCHMARK_OBSERVATION",
            calibration_standard="CPCB Guidelines for Continuous Ambient Air Monitoring; NIST-traceable mass calibration",
            processing_level="Level-3 Validated Regional Telemetry",
            data_limitations=(
                "Sparse spatial coverage across peripheral industrial zones (e.g. Bhosari/PCMC); "
                "requires spatial kriging interpolation between municipal monitoring stations."
            ),
            notes="Calibrated regional PM2.5 baseline incorporated into Climate Debt degradation module."
        ),
        "SRC-IMD-WEATHER": ClimateDataSource(
            source_id="SRC-IMD-WEATHER",
            name="India Meteorological Department (IMD) Pune Surface Observations",
            provider="India Meteorological Department (IMD), Ministry of Earth Sciences",
            official_url="https://mausam.imd.gov.in/pune",
            sensor_platform="IMD Shivaji Nagar Observatory & Lohegaon AWS",
            spectral_or_variable_bands=["Precipitation (mm)", "Dry-Bulb Air Temp (°C)", "Dew Point (°C)", "Wind Velocity (km/h)"],
            spatial_resolution="Point observatory station (Macro-urban Pune valley representative)",
            temporal_resolution="Hourly automated weather station telemetry / daily 08:30 IST rainfall",
            integration_status="CALIBRATED_BENCHMARK_OBSERVATION",
            calibration_standard="WMO (World Meteorological Organization) Guide to Meteorological Instruments No. 8",
            processing_level="Quality Controlled Climatological Surface Record",
            data_limitations=(
                "Urban rain-gauge network does not capture extreme micro-scale cloudburst convective cells "
                "that can deposit >50mm/hr in localized 2 km² patches along western hill ridges (Vetal Tekdi)."
            ),
            notes="Provides seasonal monsoonal precipitation calibration."
        ),
        "SRC-PMC-CADASTRE": ClimateDataSource(
            source_id="SRC-PMC-CADASTRE",
            name="Pune Municipal Corporation Urban Planning Cadastre & GIS Base Map",
            provider="PMC City Engineer Department / Pune Smart City Development Corp (PSCDCL)",
            official_url="https://pmc.gov.in",
            sensor_platform="High-resolution aerial orthophoto & total station parcel boundary surveys",
            spectral_or_variable_bands=["Impervious Surface Footprint", "Building Heights", "Road Widths", "Stormwater Outfalls"],
            spatial_resolution="Sub-meter (Vector polygons & parcel centroids)",
            temporal_resolution="Annual planning update cycle",
            integration_status="DERIVED_BIOPHYSICAL_MODEL",
            calibration_standard="Survey of India National Topographic Grid Framework",
            processing_level="Municipal GIS Vector Geodatabase",
            data_limitations=(
                "Informal settlements, slums, and peri-urban fringe developments may feature cadastre update lags of 12-24 months; "
                "study area polygons in CLIMASCOPE are microclimate modeling approximations, not legal property boundaries."
            ),
            notes="Forms the baseline for built-up impervious percentage and spatial study areas."
        ),
        "SRC-CGWB-HYDRO": ClimateDataSource(
            source_id="SRC-CGWB-HYDRO",
            name="Central Ground Water Board (CGWB) Aquifer Management Information System",
            provider="Ministry of Jal Shakti, Government of India / GSDA Maharashtra",
            official_url="https://cgwb.gov.in",
            sensor_platform="Piezometric monitoring well network & hydrogeological borehole logging",
            spectral_or_variable_bands=["Pre-monsoon Water Level (mbgl)", "Post-monsoon Recharge Delta", "Aquifer Transmissivity"],
            spatial_resolution="Micro-watershed hydrological sub-basin units (Mula-Mutha Basin)",
            temporal_resolution="Quarterly piezometric loggings (May, August, November, January)",
            integration_status="DERIVED_BIOPHYSICAL_MODEL",
            calibration_standard="CGWB Dynamic Ground Water Resources Assessment Methodology (GEC-2015)",
            processing_level="Hydrological Sub-basin Stress Model",
            data_limitations=(
                "Deccan basalt hard-rock fracture aquifer systems have localized flow pathways that vary within 50 meters."
            ),
            notes="Calibrates water stress indicator in Climate Debt formulation."
        ),
        "SRC-CMIP6-ENSEMBLE": ClimateDataSource(
            source_id="SRC-CMIP6-ENSEMBLE",
            name="WCRP Coupled Model Intercomparison Project Phase 6 (CMIP6) Scenarios",
            provider="World Climate Research Programme (WCRP) / IPCC Working Group I",
            official_url="https://pcmdi.llnl.gov/CMIP6",
            sensor_platform="Multi-Model Global Coupled General Circulation Models (GCMs)",
            spectral_or_variable_bands=["Near-surface Air Temperature (tas)", "Precipitation (pr)", "Extreme Heat Days (TX90p)"],
            spatial_resolution="0.25° x 0.25° statistical downscaling grid (~28 km over Pune)",
            temporal_resolution="Decadal and multi-decadal time slices (2026-2050)",
            integration_status="MODEL_ESTIMATE",
            calibration_standard="IPCC Sixth Assessment Report (AR6) Shared Socioeconomic Pathways (SSP2-4.5 & SSP5-8.5)",
            processing_level="Bias-Corrected Statistical Downscaling (BCSD)",
            data_limitations=(
                "Global climate models project macro-regional forcing pathways. "
                "Urban microclimate effects (such as street canyon heating or local tree shade) "
                "are downscaled approximations and do not represent deterministic weather forecasts."
            ),
            notes="Powers decadal trajectory scenarios in the Predict module."
        ),
        "SRC-MAHA-PWD-CSR": ClimateDataSource(
            source_id="SRC-MAHA-PWD-CSR",
            name="Maharashtra Public Works Department Common Schedule of Rates (PWD CSR 2024-25)",
            provider="Public Works Department, Government of Maharashtra",
            official_url="https://mahapwd.gov.in",
            sensor_platform="Empirical civil engineering works tender analysis and schedule of rates",
            spectral_or_variable_bands=["Civil works unit rates", "Tree plantation & maintenance rates", "Paving rates"],
            spatial_resolution="Pune PWD Region Schedule",
            temporal_resolution="Annual statutory rate revision",
            integration_status="CALIBRATED_BENCHMARK_OBSERVATION",
            calibration_standard="Maharashtra PWD Standard Specification & CPWD Analysis of Rates 2024",
            processing_level="Statutory Government Schedule of Rates",
            data_limitations=(
                "Actual contractor bid quotes may deviate by -5% to +15% based on localized site access, "
                "rock excavation depth, and material transport distance."
            ),
            notes="Calibrates all unit costs in the Budget Optimizer and Urban Climate Twin."
        ),
    }

    @classmethod
    def get_all_sources(cls) -> List[ClimateDataSource]:
        """Returns all registered data sources."""
        return list(cls.SOURCES.values())

    @classmethod
    def get_source(cls, source_id: str) -> Optional[ClimateDataSource]:
        """Retrieves a specific data source by ID."""
        return cls.SOURCES.get(source_id)
