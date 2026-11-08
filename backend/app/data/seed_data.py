"""
Seed data generator and database population script for CLIMASCOPE.
Provides 7 realistic urban wards for 'Pune Municipal Corporation (PMC)',
complete with biophysically consistent telemetry, interventions,
causal evidence graph nodes, and action ledger audits.
"""

import json
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.models.intervention import Intervention
from app.models.evidence import EvidenceNode, EvidenceEdge
from app.models.ledger import LedgerEntry

WARDS_DATA = [
    {
        "code": "WRD-01",
        "study_area_id": "PMR-HAD-01",
        "study_area_name": "Hadapsar & Magarpatta Industrial Study Area",
        "name": "Hadapsar & Magarpatta Industrial Corridor",
        "jurisdiction_name": "Pune Municipal Corporation (PMC)",
        "jurisdiction_type": "PMC_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "Demonstration spatial boundary calibrated for microclimate modeling; not an official legal municipal cadastre.",
        "data_source": "Copernicus Sentinel-2, USGS Landsat-8, IMD Pune Station",
        "zone": "Industrial & Logistics",
        "area_sq_km": 14.20,
        "population": 142000,
        "vulnerable_population_pct": 34.5,
        "center_lat": 18.5089,
        "center_lon": 73.9260,
        "canopy_cover_pct": 7.2,
        "impervious_surface_pct": 84.8,
        "albedo_avg": 0.10,
        "flood_susceptibility_idx": 0.68,
        "heat_index_celsius": 41.8,
        "baseline_risk_score": 88.5,
        "climate_debt_score": 84.2,
        "tree_canopy_deficit_sq_m": 3947600.0,
        "status_badge": "CRITICAL",
        "summary_notes": "Dense industrial fabrication plants, freight corridors, extensive asphalt roofing with extreme daytime heat retention and suppressed evapotranspiration.",
        "coordinates": [
            [73.895, 18.528],
            [73.945, 18.535],
            [73.968, 18.515],
            [73.960, 18.485],
            [73.920, 18.480],
            [73.895, 18.505],
            [73.895, 18.528]
        ]
    },
    {
        "code": "WRD-02",
        "study_area_id": "PMR-KSB-02",
        "study_area_name": "Kasba Peth & Shivajinagar Heritage Core Study Area",
        "name": "Kasba Peth & Shivajinagar Core",
        "jurisdiction_name": "Pune Municipal Corporation (PMC)",
        "jurisdiction_type": "PMC_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "Demonstration spatial boundary calibrated for microclimate modeling; not an official legal municipal cadastre.",
        "data_source": "Copernicus Sentinel-2, USGS Landsat-8, CPCB Shivajinagar CAAQMS",
        "zone": "Dense Commercial & Heritage Core",
        "area_sq_km": 6.80,
        "population": 215000,
        "vulnerable_population_pct": 32.8,
        "center_lat": 18.5204,
        "center_lon": 73.8567,
        "canopy_cover_pct": 8.6,
        "impervious_surface_pct": 82.5,
        "albedo_avg": 0.13,
        "flood_susceptibility_idx": 0.72,
        "heat_index_celsius": 40.6,
        "baseline_risk_score": 84.2,
        "climate_debt_score": 80.5,
        "tree_canopy_deficit_sq_m": 1795200.0,
        "status_badge": "CRITICAL",
        "summary_notes": "Ultra-dense historic core with narrow street canyons, severe pedestrian radiant heat load, and lack of unpaved urban soil buffers.",
        "coordinates": [
            [73.838, 18.536],
            [73.872, 18.538],
            [73.878, 18.518],
            [73.865, 18.502],
            [73.835, 18.505],
            [73.838, 18.536]
        ]
    },
    {
        "code": "WRD-03",
        "study_area_id": "PMR-MLM-03",
        "study_area_name": "Mula-Mutha Riparian Lowlands Inter-Jurisdictional Study Area",
        "name": "Mula-Mutha Riparian Lowlands",
        "jurisdiction_name": "Pune Metropolitan Region (PMR - Inter-Jurisdictional Corridor)",
        "jurisdiction_type": "PMR_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "Inter-jurisdictional riparian drainage corridor spanning PMC and regional riverfront authorities. Not an official single municipal ward boundary.",
        "data_source": "Copernicus Sentinel-2 MSI, USGS Landsat-8, Central Water Commission (CWC) Hydrological Station",
        "zone": "Riparian Lowland & Mixed Urban",
        "area_sq_km": 11.50,
        "population": 118000,
        "vulnerable_population_pct": 38.2,
        "center_lat": 18.5350,
        "center_lon": 73.8950,
        "canopy_cover_pct": 14.5,
        "impervious_surface_pct": 69.2,
        "albedo_avg": 0.15,
        "flood_susceptibility_idx": 0.94,
        "heat_index_celsius": 37.4,
        "baseline_risk_score": 79.4,
        "climate_debt_score": 74.8,
        "tree_canopy_deficit_sq_m": 2357500.0,
        "status_badge": "ELEVATED",
        "summary_notes": "High riverine flood susceptibility along Mula-Mutha confluence; flash storm surcharge risks impact concentrated low-income informal housing pockets.",
        "coordinates": [
            [73.872, 18.538],
            [73.925, 18.558],
            [73.945, 18.535],
            [73.895, 18.528],
            [73.878, 18.518],
            [73.872, 18.538]
        ]
    },
    {
        "code": "WRD-04",
        "study_area_id": "PMR-HNJ-04",
        "study_area_name": "Hinjawadi & Baner Regional Tech Corridor Study Area",
        "name": "Hinjawadi & Baner Tech Corridor",
        "jurisdiction_name": "Pune Metropolitan Region Development Authority (PMRDA / PMC Joint Zone)",
        "jurisdiction_type": "PMR_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "Joint regional tech zone: Hinjawadi Phase 1-3 is under PMRDA/MIDC jurisdiction; Baner is within PMC limits. Not an official single municipal ward.",
        "data_source": "Copernicus Sentinel-2, USGS Landsat-8, PMRDA Regional Development Datasets",
        "zone": "IT Park & Modern Commercial",
        "area_sq_km": 16.40,
        "population": 98000,
        "vulnerable_population_pct": 15.4,
        "center_lat": 18.5913,
        "center_lon": 73.7389,
        "canopy_cover_pct": 19.8,
        "impervious_surface_pct": 61.2,
        "albedo_avg": 0.22,
        "flood_susceptibility_idx": 0.42,
        "heat_index_celsius": 35.1,
        "baseline_risk_score": 52.4,
        "climate_debt_score": 46.5,
        "tree_canopy_deficit_sq_m": 2492800.0,
        "status_badge": "MODERATE",
        "summary_notes": "Rapid tech campus expansion with higher adoption of reflective cool roofs and modern stormwater bioswales; moderate heat island intensity.",
        "coordinates": [
            [73.705, 18.615],
            [73.765, 18.620],
            [73.785, 18.575],
            [73.750, 18.555],
            [73.705, 18.580],
            [73.705, 18.615]
        ]
    },
    {
        "code": "WRD-05",
        "study_area_id": "PMR-KTH-05",
        "study_area_name": "Kothrud & Vetal Tekdi Highland Preserve Study Area",
        "name": "Kothrud & Vetal Tekdi Highland Preserves",
        "jurisdiction_name": "Pune Municipal Corporation (PMC)",
        "jurisdiction_type": "PMC_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "Demonstration spatial boundary calibrated for microclimate modeling; not an official legal municipal cadastre.",
        "data_source": "Copernicus Sentinel-2, USGS Landsat-8, IMD Pashan Observatory",
        "zone": "Highland Eco-Zone & Residential",
        "area_sq_km": 18.20,
        "population": 165000,
        "vulnerable_population_pct": 18.6,
        "center_lat": 18.5074,
        "center_lon": 73.8077,
        "canopy_cover_pct": 36.2,
        "impervious_surface_pct": 34.5,
        "albedo_avg": 0.21,
        "flood_susceptibility_idx": 0.22,
        "heat_index_celsius": 31.8,
        "baseline_risk_score": 28.6,
        "climate_debt_score": 24.2,
        "tree_canopy_deficit_sq_m": 0.0,
        "status_badge": "STABLE",
        "summary_notes": "Extensive mature vegetative canopy along Vetal Tekdi hill slopes, strong natural soil drainage, lowest surface temperatures across Pune.",
        "coordinates": [
            [73.780, 18.535],
            [73.835, 18.535],
            [73.835, 18.505],
            [73.820, 18.470],
            [73.775, 18.475],
            [73.780, 18.535]
        ]
    },
    {
        "code": "WRD-06",
        "study_area_id": "PMR-ADH-06",
        "study_area_name": "Aundh & Pune University Healthcare Quarter Study Area",
        "name": "Aundh & Pune University Healthcare District",
        "jurisdiction_name": "Pune Municipal Corporation (PMC)",
        "jurisdiction_type": "PMC_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "PMC municipal study sector bordering PCMC across the Mula River. Demonstration boundary for microclimate simulation.",
        "data_source": "Copernicus Sentinel-2, USGS Landsat-8, Savitribai Phule Pune University Weather Mast",
        "zone": "Institutional & Healthcare Quarter",
        "area_sq_km": 9.60,
        "population": 124000,
        "vulnerable_population_pct": 29.4,
        "center_lat": 18.5580,
        "center_lon": 73.8070,
        "canopy_cover_pct": 18.4,
        "impervious_surface_pct": 63.8,
        "albedo_avg": 0.17,
        "flood_susceptibility_idx": 0.45,
        "heat_index_celsius": 36.2,
        "baseline_risk_score": 62.8,
        "climate_debt_score": 59.4,
        "tree_canopy_deficit_sq_m": 1593600.0,
        "status_badge": "MODERATE",
        "summary_notes": "High concentration of multi-specialty hospitals, university campuses, and elderly residents sensitive to daytime heat and particulate surges.",
        "coordinates": [
            [73.785, 18.575],
            [73.838, 18.575],
            [73.838, 18.536],
            [73.780, 18.535],
            [73.785, 18.575]
        ]
    },
    {
        "code": "WRD-07",
        "study_area_id": "PMR-BHS-07",
        "study_area_name": "Bhosari & PCMC Rail Industrial Belt Study Area",
        "name": "Bhosari & PCMC Rail Industrial Belt",
        "jurisdiction_name": "Pimpri Chinchwad Municipal Corporation (PCMC)",
        "jurisdiction_type": "PCMC_STUDY_AREA",
        "boundary_source": "Approximate Demonstration Study Boundary (CLIMASCOPE PMR GIS Baseline)",
        "boundary_is_verified": False,
        "boundary_notes": "Administered strictly by Pimpri Chinchwad Municipal Corporation (PCMC), NOT Pune Municipal Corporation (PMC). Demonstration spatial envelope.",
        "data_source": "Copernicus Sentinel-2, USGS Landsat-8, PCMC Continuous Environmental Monitoring Station",
        "zone": "Manufacturing & Rail Transport",
        "area_sq_km": 15.80,
        "population": 132000,
        "vulnerable_population_pct": 35.1,
        "center_lat": 18.6270,
        "center_lon": 73.8480,
        "canopy_cover_pct": 10.4,
        "impervious_surface_pct": 78.4,
        "albedo_avg": 0.11,
        "flood_susceptibility_idx": 0.59,
        "heat_index_celsius": 40.1,
        "baseline_risk_score": 76.5,
        "climate_debt_score": 73.6,
        "tree_canopy_deficit_sq_m": 3886800.0,
        "status_badge": "ELEVATED",
        "summary_notes": "Extensive industrial fabrication sheds and railway yards; elevated particulate emissions (PM2.5) combined with persistent daytime heat islands.",
        "coordinates": [
            [73.815, 18.655],
            [73.880, 18.655],
            [73.880, 18.605],
            [73.825, 18.605],
            [73.815, 18.655]
        ]
    }
]

def hash_tx(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def seed_database(db: Session, force_reseed: bool = False) -> None:
    """Populates or updates database with Pune municipal data."""
    existing_count = db.query(Ward).count()
    if existing_count > 0 and not force_reseed:
        # Synchronize risk badges with authoritative classification
        from app.core.risk_classification import get_climate_risk_tier
        wards = db.query(Ward).all()
        changed = False
        for w in wards:
            expected_tier = get_climate_risk_tier(w.climate_debt_score)
            if w.status_badge != expected_tier:
                w.status_badge = expected_tier
                changed = True
        if changed:
            db.commit()
            print("Synchronized existing ward risk badges to authoritative classification.")
        return

    if force_reseed:
        from app.core.config import settings
        if settings.ENVIRONMENT == "production":
            raise RuntimeError("Destructive database reset (force_reseed=True) is strictly prohibited in production environments.")
        print("Clearing existing tables for clean Pune municipal reseed...")
        db.query(ClimateMetric).delete()
        db.query(Intervention).delete()
        db.query(EvidenceNode).delete()
        db.query(EvidenceEdge).delete()
        db.query(LedgerEntry).delete()
        db.query(Ward).delete()
        db.commit()

    print("Seeding CLIMASCOPE database with Pune Municipal Corporation (PMC) dataset...")
    ward_records = []

    for item in WARDS_DATA:
        geom = {
            "type": "Polygon",
            "coordinates": [item["coordinates"]]
        }
        w = Ward(
            code=item["code"],
            study_area_id=item["study_area_id"],
            study_area_name=item["study_area_name"],
            name=item["name"],
            jurisdiction_name=item["jurisdiction_name"],
            jurisdiction_type=item["jurisdiction_type"],
            boundary_source=item["boundary_source"],
            boundary_is_verified=item["boundary_is_verified"],
            boundary_notes=item["boundary_notes"],
            data_source=item["data_source"],
            zone=item["zone"],
            area_sq_km=item["area_sq_km"],
            population=item["population"],
            vulnerable_population_pct=item["vulnerable_population_pct"],
            center_lat=item["center_lat"],
            center_lon=item["center_lon"],
            geometry_geojson=json.dumps(geom),
            canopy_cover_pct=item["canopy_cover_pct"],
            impervious_surface_pct=item["impervious_surface_pct"],
            albedo_avg=item["albedo_avg"],
            flood_susceptibility_idx=item["flood_susceptibility_idx"],
            heat_index_celsius=item["heat_index_celsius"],
            baseline_risk_score=item["baseline_risk_score"],
            climate_debt_score=item["climate_debt_score"],
            tree_canopy_deficit_sq_m=item["tree_canopy_deficit_sq_m"],
            status_badge=item["status_badge"],
            summary_notes=item["summary_notes"]
        )
        db.add(w)
        ward_records.append(w)

    db.flush()

    # Seed Historical Monthly Telemetry Observations for each Ward (past 6 months: Jun - Nov)
    base_time = datetime(2026, 6, 1, 10, 0, 0)

    for w in ward_records:
        for m in range(6):
            obs_time = base_time + timedelta(days=m * 30)
            # Monsoon dip in Jul/Aug, heat peak in Oct/Nov
            seasonal_offset = -3.5 if m in (1, 2) else (1.5 if m in (4, 5) else 0.0)
            lst = round(w.heat_index_celsius + seasonal_offset, 1)
            anomaly = round(lst - 35.0, 1)
            precip = 180.0 if m in (1, 2) else (45.0 if m == 3 else 8.0)

            # Parameterized demonstration telemetry with seasonal variation
            metric = ClimateMetric(
                ward_id=w.id,
                timestamp=obs_time,
                data_type="SIMULATED",
                ndvi=round(max(0.06, (w.canopy_cover_pct / 100.0) * 0.85 + (0.08 if m in (2, 3) else 0.02)), 3),
                ndbi=round(max(0.12, (w.impervious_surface_pct / 100.0) * 0.7 - 0.05), 3),
                lst_celsius=lst,
                surface_temp_anomaly=anomaly,
                air_temp_celsius=round(lst - 4.2, 1),
                relative_humidity_pct=round(78.0 if m in (1, 2) else 52.0),
                aqi_pm25=round(42.0 + (w.impervious_surface_pct * 0.45)),
                precipitation_mm=precip,
                runoff_coefficient=round(min(0.92, max(0.18, w.impervious_surface_pct / 100.0 * 0.94)), 2),
                soil_moisture_pct=round(max(8.0, 50.0 - (w.impervious_surface_pct * 0.4) + (20.0 if m in (1, 2) else 0.0)), 1),
                is_simulated=True,
                is_verified=False,
                confidence_score=88.0,
                source="Copernicus Sentinel-2 MSI (Level-2A BOA) & Landsat-8 TIRS (Demonstration Baseline)",
                source_name="Copernicus Sentinel-2 MSI L2A & USGS Landsat-8 TIRS Band 10",
                source_url="https://dataspace.copernicus.eu/",
                sensor_id="S2A-MSI-L2A-B08-B04",
                acquisition_date=obs_time.strftime("%Y-%m-%d"),
                processing_date=(obs_time + timedelta(days=1)).strftime("%Y-%m-%d"),
                spatial_resolution="10m (VNIR) / 30m (Thermal)",
                temporal_resolution="5-day revisit (Sentinel-2) / 16-day (Landsat-8)",
                quality_flag="DEMONSTRATION_SYNTHESIS",
                methodology="Synthetic time-series parameterized from ward baseline remote sensing and seasonal empirical offsets for platform demonstration.",
                limitations="Simulated demonstration telemetry. Illustrative time-series, not a continuous ground sensor or real-time satellite streaming.",
                notes="Calibrated surface reflectance and radiometric thermal temperature demonstration series."
            )
            db.add(metric)

    # Seed 22 Interventions across Pune Wards
    interventions_specs = [
        # Hadapsar (WRD-01)
        {
            "ward_idx": 0,
            "code": "INT-HDP-01",
            "name": "Industrial Rooftop High-Albedo Elastomeric Coating (85,000 m²)",
            "category": "COOL_ROOF",
            "cost_usd": 680000.0,
            "target_area_sq_m": 85000.0,
            "annual_maintenance_usd": 18000.0,
            "cooling_effect_celsius": 2.1,
            "runoff_reduction_pct": 0.0,
            "co2_sequestration_t_yr": 45.0,
            "roi_score": 9.4,
            "status": "IN_PROGRESS",
            "timeline_months": 5,
            "contractor": "Apex Thermal Solutions India",
            "description": "Applies high-reflectance titanium dioxide coating (albedo 0.76) to logistics sheds."
        },
        {
            "ward_idx": 0,
            "code": "INT-HDP-02",
            "name": "Magarpatta Freight Corridor Sponge Buffer & Bioswales",
            "category": "BIOSWALE",
            "cost_usd": 920000.0,
            "target_area_sq_m": 55000.0,
            "annual_maintenance_usd": 24000.0,
            "cooling_effect_celsius": 0.9,
            "runoff_reduction_pct": 34.0,
            "co2_sequestration_t_yr": 62.0,
            "roi_score": 8.9,
            "status": "PRIORITIZED",
            "timeline_months": 7,
            "contractor": "Pune Urban Eco-Infrastructure Ltd",
            "description": "Engineered bioswales capturing stormwater and mitigating asphalt radiation."
        },
        {
            "ward_idx": 0,
            "code": "INT-HDP-03",
            "name": "Rail Logistics Miyawaki Pocket Forest Infill",
            "category": "CANOPY_EXPANSION",
            "cost_usd": 340000.0,
            "target_area_sq_m": 18000.0,
            "annual_maintenance_usd": 15000.0,
            "cooling_effect_celsius": 1.4,
            "runoff_reduction_pct": 16.0,
            "co2_sequestration_t_yr": 85.0,
            "roi_score": 9.1,
            "status": "PROPOSED",
            "timeline_months": 6,
            "contractor": "Maharashtra Forest Cell",
            "description": "High-density multi-tiered native afforestation buffering active rail marshaling yard."
        },
        {
            "ward_idx": 0,
            "code": "INT-HDP-04",
            "name": "Industrial Estate Porous Concrete Heavy-Vehicle Yard",
            "category": "PERMEABLE_PAVING",
            "cost_usd": 520000.0,
            "target_area_sq_m": 30000.0,
            "annual_maintenance_usd": 14000.0,
            "cooling_effect_celsius": 0.7,
            "runoff_reduction_pct": 38.0,
            "co2_sequestration_t_yr": 12.0,
            "roi_score": 8.4,
            "status": "PROPOSED",
            "timeline_months": 4,
            "contractor": "Pune Civil Infrastructure Corp",
            "description": "Replaces degraded bitumen truck staging lots with porous structural pavers."
        },
        # Kasba Peth / Shivajinagar (WRD-02)
        {
            "ward_idx": 1,
            "code": "INT-KSB-01",
            "name": "Heritage Street Canyon Micro-Canopy & Vertical Greening",
            "category": "CANOPY_EXPANSION",
            "cost_usd": 540000.0,
            "target_area_sq_m": 32000.0,
            "annual_maintenance_usd": 28000.0,
            "cooling_effect_celsius": 1.7,
            "runoff_reduction_pct": 12.0,
            "co2_sequestration_t_yr": 74.0,
            "roi_score": 9.6,
            "status": "COMMITTED",
            "timeline_months": 6,
            "contractor": "PMC Green Heritage Mission",
            "description": "Plants 920 native shade trees with deep structural root cells in dense commercial lanes."
        },
        {
            "ward_idx": 1,
            "code": "INT-KSB-02",
            "name": "Transit Plaza Permeable Pavement Conversion",
            "category": "PERMEABLE_PAVING",
            "cost_usd": 460000.0,
            "target_area_sq_m": 24000.0,
            "annual_maintenance_usd": 12000.0,
            "cooling_effect_celsius": 0.8,
            "runoff_reduction_pct": 28.0,
            "co2_sequestration_t_yr": 14.0,
            "roi_score": 8.2,
            "status": "PRIORITIZED",
            "timeline_months": 4,
            "contractor": "Western Maharashtra Paving Works",
            "description": "Replaces degraded bitumen with permeable interlocking pavers."
        },
        {
            "ward_idx": 1,
            "code": "INT-KSB-03",
            "name": "Old City Municipal Building Cool Roof Retrofit",
            "category": "COOL_ROOF",
            "cost_usd": 310000.0,
            "target_area_sq_m": 40000.0,
            "annual_maintenance_usd": 9000.0,
            "cooling_effect_celsius": 1.3,
            "runoff_reduction_pct": 0.0,
            "co2_sequestration_t_yr": 22.0,
            "roi_score": 9.2,
            "status": "PROPOSED",
            "timeline_months": 3,
            "contractor": "Apex Thermal Solutions India",
            "description": "Elastomeric solar-reflective coating applied to administrative and civic rooftops."
        },
        {
            "ward_idx": 1,
            "code": "INT-KSB-04",
            "name": "Mandai Bazaar Stormwater Micro-Retention Sump",
            "category": "RETENTION_BASIN",
            "cost_usd": 280000.0,
            "target_area_sq_m": 12000.0,
            "annual_maintenance_usd": 11000.0,
            "cooling_effect_celsius": 0.4,
            "runoff_reduction_pct": 42.0,
            "co2_sequestration_t_yr": 8.0,
            "roi_score": 8.8,
            "status": "PROPOSED",
            "timeline_months": 5,
            "contractor": "Deccan Alluvial Civil Projects",
            "description": "Subsurface modular stormwater detention vault buffering market road flooding."
        },
        # Mula-Mutha Riparian Lowlands (WRD-03)
        {
            "ward_idx": 2,
            "code": "INT-MLM-01",
            "name": "Mula-Mutha Riverfront Wetland & Storm Retention Basin",
            "category": "RETENTION_BASIN",
            "cost_usd": 1450000.0,
            "target_area_sq_m": 90000.0,
            "annual_maintenance_usd": 42000.0,
            "cooling_effect_celsius": 1.2,
            "runoff_reduction_pct": 46.0,
            "co2_sequestration_t_yr": 140.0,
            "roi_score": 9.8,
            "status": "IN_PROGRESS",
            "timeline_months": 12,
            "contractor": "Deccan Alluvial Civil Projects",
            "description": "Natural wetland retention cell capable of buffering 6.8 million liters during monsoon surges."
        },
        {
            "ward_idx": 2,
            "code": "INT-MLM-02",
            "name": "Yerawada Riverbank Bio-Embankment & Native Buffer",
            "category": "BIOSWALE",
            "cost_usd": 620000.0,
            "target_area_sq_m": 45000.0,
            "annual_maintenance_usd": 19000.0,
            "cooling_effect_celsius": 1.5,
            "runoff_reduction_pct": 28.0,
            "co2_sequestration_t_yr": 95.0,
            "roi_score": 9.3,
            "status": "PROPOSED",
            "timeline_months": 8,
            "contractor": "Pune Urban Eco-Infrastructure Ltd",
            "description": "Engineered vegetative riverbank stabilization shielding informal floodplain settlements."
        },
        {
            "ward_idx": 2,
            "code": "INT-MLM-03",
            "name": "Sangamwadi Storm Drain Subsurface Infiltration Cells",
            "category": "PERMEABLE_PAVING",
            "cost_usd": 440000.0,
            "target_area_sq_m": 35000.0,
            "annual_maintenance_usd": 13000.0,
            "cooling_effect_celsius": 0.5,
            "runoff_reduction_pct": 38.0,
            "co2_sequestration_t_yr": 18.0,
            "roi_score": 8.7,
            "status": "PROPOSED",
            "timeline_months": 6,
            "contractor": "Western Maharashtra Paving Works",
            "description": "Porous geotextile infiltration cells installed along outfall drainage canals."
        },
        # Hinjawadi Tech Corridor (WRD-04)
        {
            "ward_idx": 3,
            "code": "INT-HNJ-01",
            "name": "Tech Corridor Solar-Shade & Cool Roof Infill",
            "category": "COOL_ROOF",
            "cost_usd": 380000.0,
            "target_area_sq_m": 48000.0,
            "annual_maintenance_usd": 10000.0,
            "cooling_effect_celsius": 1.4,
            "runoff_reduction_pct": 0.0,
            "co2_sequestration_t_yr": 28.0,
            "roi_score": 8.5,
            "status": "VERIFIED",
            "timeline_months": 4,
            "contractor": "SunTech Eco Coatings",
            "description": "High-albedo membranes across 14 mid-rise commercial campuses."
        },
        {
            "ward_idx": 3,
            "code": "INT-HNJ-02",
            "name": "Hinjawadi Transit Spine Porous Pavement & Bioswales",
            "category": "PERMEABLE_PAVING",
            "cost_usd": 560000.0,
            "target_area_sq_m": 28000.0,
            "annual_maintenance_usd": 16000.0,
            "cooling_effect_celsius": 0.9,
            "runoff_reduction_pct": 32.0,
            "co2_sequestration_t_yr": 35.0,
            "roi_score": 8.6,
            "status": "PROPOSED",
            "timeline_months": 5,
            "contractor": "Western Maharashtra Paving Works",
            "description": "Continuous permeable pedestrian sidewalk corridor buffering Hinjawadi Main Road."
        },
        {
            "ward_idx": 3,
            "code": "INT-HNJ-03",
            "name": "Baner Hill Eco-Buffer Linear Greenway Corridor",
            "category": "CANOPY_EXPANSION",
            "cost_usd": 640000.0,
            "target_area_sq_m": 50000.0,
            "annual_maintenance_usd": 22000.0,
            "cooling_effect_celsius": 1.6,
            "runoff_reduction_pct": 22.0,
            "co2_sequestration_t_yr": 120.0,
            "roi_score": 9.0,
            "status": "PROPOSED",
            "timeline_months": 7,
            "contractor": "Pune Urban Eco-Infrastructure Ltd",
            "description": "Connects tech commercial zones with Baner hill slopes via contiguous native tree corridors."
        },
        # Kothrud Highlands (WRD-05)
        {
            "ward_idx": 4,
            "code": "INT-KTH-01",
            "name": "Vetal Tekdi Hill Contour Soil Water Conservation Bunds",
            "category": "BIOSWALE",
            "cost_usd": 220000.0,
            "target_area_sq_m": 60000.0,
            "annual_maintenance_usd": 8000.0,
            "cooling_effect_celsius": 0.4,
            "runoff_reduction_pct": 38.0,
            "co2_sequestration_t_yr": 95.0,
            "roi_score": 8.7,
            "status": "VERIFIED",
            "timeline_months": 3,
            "contractor": "Tekdi Eco Conservation Trust",
            "description": "Stone-pitched contour bunds recharging aquifers and halting slope erosion."
        },
        {
            "ward_idx": 4,
            "code": "INT-KTH-02",
            "name": "Paud Road Dense Vegetative Sound & Heat Barrier",
            "category": "CANOPY_EXPANSION",
            "cost_usd": 310000.0,
            "target_area_sq_m": 22000.0,
            "annual_maintenance_usd": 12000.0,
            "cooling_effect_celsius": 1.1,
            "runoff_reduction_pct": 14.0,
            "co2_sequestration_t_yr": 68.0,
            "roi_score": 8.8,
            "status": "PROPOSED",
            "timeline_months": 4,
            "contractor": "PMC Green Heritage Mission",
            "description": "Thick evergreen canopy shielding residential colonies from highway surface heat."
        },
        {
            "ward_idx": 4,
            "code": "INT-KTH-03",
            "name": "Kothrud Residential Rain Garden Infiltration Network",
            "category": "RETENTION_BASIN",
            "cost_usd": 190000.0,
            "target_area_sq_m": 15000.0,
            "annual_maintenance_usd": 7000.0,
            "cooling_effect_celsius": 0.6,
            "runoff_reduction_pct": 26.0,
            "co2_sequestration_t_yr": 30.0,
            "roi_score": 8.9,
            "status": "PROPOSED",
            "timeline_months": 3,
            "contractor": "Tekdi Eco Conservation Trust",
            "description": "Neighborhood bioretention sumps diverting street runoff to local water table."
        },
        # Aundh Healthcare District (WRD-06)
        {
            "ward_idx": 5,
            "code": "INT-AND-01",
            "name": "Hospital Campus Heat Barrier & Shaded Walkway Grid",
            "category": "CANOPY_EXPANSION",
            "cost_usd": 390000.0,
            "target_area_sq_m": 26000.0,
            "annual_maintenance_usd": 16000.0,
            "cooling_effect_celsius": 1.3,
            "runoff_reduction_pct": 10.0,
            "co2_sequestration_t_yr": 52.0,
            "roi_score": 9.1,
            "status": "IN_PROGRESS",
            "timeline_months": 5,
            "contractor": "Pune Healthcare Infrastructure Unit",
            "description": "Protects patient mobility corridors and elderly clinics with canopy shade."
        },
        {
            "ward_idx": 5,
            "code": "INT-AND-02",
            "name": "Aundh Chest Hospital High-Reflectance Cool Roof",
            "category": "COOL_ROOF",
            "cost_usd": 270000.0,
            "target_area_sq_m": 30000.0,
            "annual_maintenance_usd": 8000.0,
            "cooling_effect_celsius": 1.5,
            "runoff_reduction_pct": 0.0,
            "co2_sequestration_t_yr": 18.0,
            "roi_score": 9.5,
            "status": "PROPOSED",
            "timeline_months": 3,
            "contractor": "Apex Thermal Solutions India",
            "description": "High SRI elastomeric coating reducing indoor temperature and rooftop heat radiance."
        },
        {
            "ward_idx": 5,
            "code": "INT-AND-03",
            "name": "University Road Green Corridor & Permeable Track",
            "category": "PERMEABLE_PAVING",
            "cost_usd": 490000.0,
            "target_area_sq_m": 35000.0,
            "annual_maintenance_usd": 15000.0,
            "cooling_effect_celsius": 1.2,
            "runoff_reduction_pct": 25.0,
            "co2_sequestration_t_yr": 48.0,
            "roi_score": 8.9,
            "status": "PROPOSED",
            "timeline_months": 6,
            "contractor": "Pune Healthcare Infrastructure Unit",
            "description": "Combines porous pedestrian paths and shade trees linking hospital and university zones."
        },
        # Bhosari Rail Belt (WRD-07)
        {
            "ward_idx": 6,
            "code": "INT-BHS-01",
            "name": "PCMC Manufacturing Rail Buffer Vegetative Bio-Shield",
            "category": "CANOPY_EXPANSION",
            "cost_usd": 780000.0,
            "target_area_sq_m": 70000.0,
            "annual_maintenance_usd": 30000.0,
            "cooling_effect_celsius": 1.5,
            "runoff_reduction_pct": 18.0,
            "co2_sequestration_t_yr": 110.0,
            "roi_score": 9.0,
            "status": "COMMITTED",
            "timeline_months": 8,
            "contractor": "PCMC Green Industrial Taskforce",
            "description": "Multi-tier canopy barrier trapping rail particulate dust and lowering surface heat."
        },
        {
            "ward_idx": 6,
            "code": "INT-BHS-02",
            "name": "Bhosari MIDC Logistics Rooftop High-Albedo Coating",
            "category": "COOL_ROOF",
            "cost_usd": 540000.0,
            "target_area_sq_m": 65000.0,
            "annual_maintenance_usd": 13000.0,
            "cooling_effect_celsius": 1.9,
            "runoff_reduction_pct": 0.0,
            "co2_sequestration_t_yr": 35.0,
            "roi_score": 9.3,
            "status": "PROPOSED",
            "timeline_months": 5,
            "contractor": "SunTech Eco Coatings",
            "description": "Solar-reflective membrane installed across metal and concrete warehousing roofs."
        },
        {
            "ward_idx": 6,
            "code": "INT-BHS-03",
            "name": "Indrayani Basin Stormwater Retention & Infiltration Sump",
            "category": "RETENTION_BASIN",
            "cost_usd": 690000.0,
            "target_area_sq_m": 25000.0,
            "annual_maintenance_usd": 20000.0,
            "cooling_effect_celsius": 0.8,
            "runoff_reduction_pct": 44.0,
            "co2_sequestration_t_yr": 40.0,
            "roi_score": 9.1,
            "status": "PROPOSED",
            "timeline_months": 7,
            "contractor": "PCMC Green Industrial Taskforce",
            "description": "High-volume detention sump arresting industrial runoff before entering Indrayani River."
        }
    ]

    USD_INR_RATE = 83.5
    for ispec in interventions_specs:
        target_ward = ward_records[ispec["ward_idx"]]
        c_usd = float(ispec["cost_usd"])
        c_inr = round(c_usd * USD_INR_RATE, 2)
        m_usd = float(ispec["annual_maintenance_usd"])
        m_inr = round(m_usd * USD_INR_RATE, 2)

        # Determine realistic quantity & unit cost
        cat = ispec["category"]
        area = float(ispec["target_area_sq_m"])
        if cat == "COOL_ROOF":
            unit_m = "sq_m"
            cost_u = 650.0
            qty = area
        elif cat == "CANOPY_EXPANSION":
            unit_m = "saplings"
            cost_u = 2200.0
            qty = round(area / 15.0)
        elif cat == "PERMEABLE_PAVING":
            unit_m = "sq_m"
            cost_u = 1950.0
            qty = area
        elif cat == "BIOSWALE":
            unit_m = "sq_m"
            cost_u = 2400.0
            qty = area
        elif cat == "RETENTION_BASIN":
            unit_m = "cu_m"
            cost_u = 2850.0
            qty = round(area * 0.4)
        else:
            unit_m = "sq_m"
            cost_u = 2500.0
            qty = area

        progress = 100 if ispec["status"] == "VERIFIED" else (40 if ispec["status"] == "IN_PROGRESS" else 0)
        actual_spent = round(c_inr * (progress / 100.0), 2)

        itv = Intervention(
            ward_id=target_ward.id,
            intervention_code=ispec["code"],
            name=ispec["name"],
            category=ispec["category"],
            currency="INR",
            cost_inr=c_inr,
            annual_maintenance_inr=m_inr,
            cost_usd=c_usd,
            annual_maintenance_usd=m_usd,
            cost_category="CAPEX_CIVIL",
            cost_per_unit=cost_u,
            unit_measure=unit_m,
            quantity=qty,
            estimated_total_cost=c_inr,
            funding_source="15th Finance Commission Urban Climate Grant" if ispec["ward_idx"] % 2 == 0 else "PMC Municipal Climate Resilience Fund",
            fiscal_year="FY 2026-27",
            jurisdiction=target_ward.jurisdiction_name,
            is_simulated=True,
            approved_budget_inr=c_inr,
            actual_expenditure_inr=actual_spent,
            financial_status="DISBURSED" if progress == 100 else ("COMMITTED" if progress > 0 else "ALLOCATED"),
            target_area_sq_m=ispec["target_area_sq_m"],
            cooling_effect_celsius=ispec["cooling_effect_celsius"],
            runoff_reduction_pct=ispec["runoff_reduction_pct"],
            co2_sequestration_t_yr=ispec["co2_sequestration_t_yr"],
            roi_score=ispec["roi_score"],
            status=ispec["status"],
            timeline_months=ispec["timeline_months"],
            contractor=f"[Demo] {ispec['contractor']}" if ispec["contractor"] else None,
            responsible_authority="PMC Urban Resilience Cell" if "PMC" in target_ward.jurisdiction_name else "PCMC Environment Dept",
            start_date="2026-03-01",
            deadline="2026-09-30",
            progress_pct=progress,
            description=f"[Demonstration Intervention] {ispec['description']}"
        )
        db.add(itv)

    # Seed Evidence Nodes for Hadapsar (WRD-01)
    w1 = ward_records[0]
    nodes_w1 = [
        ("NODE-HDP-01", "CAUSE", "Industrial Impervious Pavement", "84.8% Impervious", 0.98, "Sentinel-2 MSI NDBI Spectral Survey", "Dominant surface consists of sealed industrial roofs and freight logistics yards."),
        ("NODE-HDP-02", "CAUSE", "Severe Canopy Depletion", "7.2% Tree Cover", 0.97, "Sentinel-2 High-Res NDVI Survey", "Canopy is 27.8% below the municipal resilience standard of 35%."),
        ("NODE-HDP-03", "STRESSOR", "Thermal Irradiance Trapping", "Albedo = 0.10", 0.95, "Landsat-8 TIRS Emissivity Band", "Dark bitumen and metal roofs absorb 90% of solar irradiance."),
        ("NODE-HDP-04", "IMPACT", "Extreme Surface Heat Island", "+4.8°C Anomaly", 0.96, "Radiometric Thermal Sensor Data", "Peak microclimate surface temperatures reach 41.8°C."),
        ("NODE-HDP-05", "VULNERABILITY", "Exposed Industrial Workforce", "48,990 At-Risk Citizens", 0.92, "PMC Socio-Demographic Census 2026", "High concentration of outdoor logistics workers and vulnerable residential wards."),
        ("NODE-HDP-06", "MITIGATION", "High-Albedo Elastomeric Coating", "Target: 85,000 m²", 0.94, "Climascope Deterministic Physics Engine", "Modeled to lower microclimate surface radiance by 2.1°C.")
    ]
    for nid, ntype, lbl, vdisp, conf, src, desc in nodes_w1:
        en = EvidenceNode(
            ward_id=w1.id,
            node_id=nid,
            node_type=ntype,
            label=lbl,
            value_display=vdisp,
            confidence_score=conf,
            evidence_source=src,
            description=desc
        )
        db.add(en)

    edges_w1 = [
        ("NODE-HDP-01", "NODE-HDP-03", "EXACERBATES", 1.0, 0.0001, "Dense concrete inhibits evaporative cooling and locks heat."),
        ("NODE-HDP-02", "NODE-HDP-03", "DRIVES", 0.95, 0.0001, "Canopy absence removes natural tree crown shading."),
        ("NODE-HDP-03", "NODE-HDP-04", "TRIGGERS", 1.25, 0.00001, "Absorbed radiance elevates localized land surface temperature."),
        ("NODE-HDP-04", "NODE-HDP-05", "IMPACTS", 1.4, 0.0005, "Extreme heat spikes cause cardiovascular strain in workers."),
        ("NODE-HDP-06", "NODE-HDP-03", "AMELIORATES", -0.9, 0.001, "High-albedo coating boosts reflectance from 0.10 to 0.76.")
    ]
    for sn, tn, rtype, wt, pval, expl in edges_w1:
        ee = EvidenceEdge(
            source_node_id=sn,
            target_node_id=tn,
            relation_type=rtype,
            weight=wt,
            statistical_significance=pval,
            mechanism_explanation=expl
        )
        db.add(ee)

    # Seed Climate Action Ledger Records (Demonstration and simulated audits)
    ledger_items = [
        {
            "ward_id": ward_records[3].id, # Hinjawadi
            "entry_code": "LEDGER-PMC-2026-0004",
            "action_type": "SIMULATED_VERIFICATION",
            "intervention_name": "Tech Corridor Solar-Shade & Cool Roof Infill",
            "description": "[Demonstration Audit] Satellite radiometric simulation models post-coating cooling across 48,000 m² commercial roof expanse.",
            "budget_allocated": 380000.0,
            "budget_disbursed": 380000.0,
            "contractor": "[Demo Vendor] SunTech Eco Coatings",
            "authorizing_official": "PMC Additional Commissioner Dr. R. Gokhale",
            "delta_ndvi": 0.021,
            "delta_lst": -1.4,
            "delta_runoff": -4.2,
            "verified": False,
            "method": "Demonstration Calibration (Synthetic Sentinel-2 & Landsat-8 Delta Benchmark)"
        },
        {
            "ward_id": ward_records[4].id, # Kothrud
            "entry_code": "LEDGER-PMC-2026-0002",
            "action_type": "SIMULATED_VERIFICATION",
            "intervention_name": "Vetal Tekdi Hill Contour Soil Water Bunds",
            "description": "[Demonstration Audit] Hydro-sensor simulation model indicates 38% stormwater runoff attenuation and slope stabilization.",
            "budget_allocated": 220000.0,
            "budget_disbursed": 220000.0,
            "contractor": "[Demo Trust] Tekdi Eco Conservation Trust",
            "authorizing_official": "Chief Resilience Officer Ananya Joshi",
            "delta_ndvi": 0.048,
            "delta_lst": -0.5,
            "delta_runoff": -38.0,
            "verified": False,
            "method": "Demonstration In-situ Sensor Model & Simulated Drone Multispectral Survey"
        },
        {
            "ward_idx": 0, # Hadapsar
            "entry_code": "LEDGER-PMC-2026-0015",
            "action_type": "WORK_ORDER_ISSUED",
            "intervention_name": "Industrial Rooftop High-Albedo Elastomeric Coating",
            "description": "[Demonstration Work Order] Municipal Work Order #PMC-ENV-4029 authorized for 85,000 m² Hadapsar industrial sheds.",
            "budget_allocated": 680000.0,
            "budget_disbursed": 250000.0,
            "contractor": "[Demo Vendor] Apex Thermal Solutions India",
            "authorizing_official": "Municipal Commissioner Vikram Deshmukh, IAS",
            "delta_ndvi": None,
            "delta_lst": None,
            "delta_runoff": None,
            "verified": False,
            "method": None
        }
    ]

    USD_INR_RATE = 83.5
    for li in ledger_items:
        w_id = li["ward_id"] if "ward_id" in li else ward_records[li["ward_idx"]].id
        b_alloc_usd = float(li["budget_allocated"])
        b_disb_usd = float(li["budget_disbursed"])
        b_alloc_inr = round(b_alloc_usd * USD_INR_RATE, 2)
        b_disb_inr = round(b_disb_usd * USD_INR_RATE, 2)

        raw_sig = f"{li['entry_code']}:{li['action_type']}:{b_alloc_inr}:{li['authorizing_official']}"
        tx_hash = hash_tx(raw_sig)
        le = LedgerEntry(
            ward_id=w_id,
            entry_code=li["entry_code"],
            transaction_hash=tx_hash,
            timestamp=datetime.utcnow() - timedelta(days=14),
            action_type=li["action_type"],
            intervention_name=li["intervention_name"],
            description=li["description"],
            currency="INR",
            budget_allocated_inr=b_alloc_inr,
            budget_disbursed_inr=b_disb_inr,
            actual_expenditure_inr=b_disb_inr,
            funding_source="15th Finance Commission Urban Climate Grant",
            fiscal_year="FY 2026-27",
            jurisdiction="Pune Municipal Corporation (PMC)",
            is_overspent=False,
            overspend_warning=None,
            budget_allocated_usd=b_alloc_usd,
            budget_disbursed_usd=b_disb_usd,
            contractor_entity=li["contractor"],
            authorizing_official=li["authorizing_official"],
            delta_ndvi=li["delta_ndvi"],
            delta_lst_celsius=li["delta_lst"],
            delta_runoff_pct=li["delta_runoff"],
            is_verified=li["verified"],
            verification_method=li["method"]
        )
        db.add(le)

    db.commit()
    print(f"Successfully seeded {len(ward_records)} Pune wards with realistic telemetry, interventions, and audit records.")

if __name__ == "__main__":
    from app.core.config import settings
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("Direct execution of seed_data.py with destructive drop_all is strictly disabled in production.")
    db = SessionLocal()
    try:
        # Development-only schema recreate
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        seed_database(db, force_reseed=True)
    finally:
        db.close()
