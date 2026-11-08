"""
Automated Test Suite for Geographic Accuracy, Jurisdictions & Climate Data Provenance
CLIMASCOPE Urban Climate Platform
"""

import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric
from app.api.v1.endpoints import wards as wards_endpoint
from app.api.v1.endpoints import metrics as metrics_endpoint


def test_study_area_jurisdictions_and_classification():
    """Verify that all 7 study areas are accurately classified by jurisdiction."""
    db = SessionLocal()
    try:
        wards = db.query(Ward).order_by(Ward.id).all()
        assert len(wards) == 7, f"Expected 7 study areas, got {len(wards)}"

        ward_map = {w.code: w for w in wards}

        # 1. Hadapsar & Magarpatta: PMC Study Area
        w1 = ward_map.get("WRD-01")
        assert w1 is not None
        assert w1.jurisdiction_type == "PMC_STUDY_AREA"
        assert "Pune Municipal Corporation" in w1.jurisdiction_name
        assert w1.boundary_is_verified is False
        assert "demonstration" in w1.boundary_notes.lower()
        assert "approximate" in w1.boundary_source.lower()

        # 2. Kasba Peth & Shivajinagar: PMC Study Area
        w2 = ward_map.get("WRD-02")
        assert w2 is not None
        assert w2.jurisdiction_type == "PMC_STUDY_AREA"
        assert "Pune Municipal Corporation" in w2.jurisdiction_name
        assert w2.boundary_is_verified is False

        # 3. Mula-Mutha Riparian Lowlands: Inter-jurisdictional PMR Study Area
        w3 = ward_map.get("WRD-03")
        assert w3 is not None
        assert w3.jurisdiction_type == "PMR_STUDY_AREA"
        assert "PMR" in w3.jurisdiction_type
        assert w3.boundary_is_verified is False

        # 4. Hinjawadi & Baner: PMRDA / PMC Cross-Jurisdiction (NOT solely a PMC ward)
        w4 = ward_map.get("WRD-04")
        assert w4 is not None
        assert w4.jurisdiction_type == "PMR_STUDY_AREA"
        assert "PMRDA" in w4.jurisdiction_name or "PMR" in w4.jurisdiction_name
        assert "PMRDA" in w4.boundary_notes
        assert w4.boundary_is_verified is False

        # 5. Kothrud & Vetal Tekdi: PMC Study Area
        w5 = ward_map.get("WRD-05")
        assert w5 is not None
        assert w5.jurisdiction_type == "PMC_STUDY_AREA"
        assert w5.boundary_is_verified is False

        # 6. Aundh & Pune University: PMC Study Area
        w6 = ward_map.get("WRD-06")
        assert w6 is not None
        assert w6.jurisdiction_type == "PMC_STUDY_AREA"
        assert w6.boundary_is_verified is False

        # 7. Bhosari: Strictly PCMC (Pimpri Chinchwad Municipal Corporation), NOT PMC
        w7 = ward_map.get("WRD-07")
        assert w7 is not None
        assert w7.jurisdiction_type == "PCMC_STUDY_AREA"
        assert "Pimpri Chinchwad" in w7.jurisdiction_name or "PCMC" in w7.jurisdiction_name
        assert "PCMC" in w7.boundary_notes
        assert w7.boundary_is_verified is False

        print("[PASS] All 7 study areas correctly classified by administrative jurisdiction.")
    finally:
        db.close()


def test_geojson_endpoint_coordinates_and_properties():
    """Verify GeoJSON endpoint returns valid EPSG:4326 closed polygons with provenance properties."""
    db = SessionLocal()
    try:
        geojson_obj = wards_endpoint.get_wards_geojson(db=db)
        # Convert Pydantic model to dict if needed
        geojson = geojson_obj.model_dump() if hasattr(geojson_obj, "model_dump") else geojson_obj.dict()

        assert geojson["type"] == "FeatureCollection"
        assert len(geojson["features"]) == 7

        for feature in geojson["features"]:
            assert feature["type"] == "Feature"
            geom = feature["geometry"]
            assert geom["type"] == "Polygon"

            coords = geom["coordinates"][0]
            assert len(coords) >= 4, "Polygon must have at least 4 coordinates (triangle + close)"
            assert coords[0] == coords[-1], f"Polygon {feature['properties']['code']} is not closed: {coords[0]} != {coords[-1]}"

            # Verify coordinates are in valid Pune bounding envelope [73.5 to 74.2 E, 18.3 to 18.8 N]
            for pt in coords:
                lon, lat = pt[0], pt[1]
                assert 73.5 <= lon <= 74.2, f"Invalid longitude {lon} for Pune region"
                assert 18.3 <= lat <= 18.8, f"Invalid latitude {lat} for Pune region"

            # Check properties
            props = feature["properties"]
            assert "jurisdiction_name" in props
            assert "jurisdiction_type" in props
            assert "boundary_is_verified" in props
            assert props["boundary_is_verified"] is False
            assert props["is_approximate_boundary"] is True

        print("[PASS] GeoJSON coordinates validated in EPSG:4326 with closed rings and provenance properties.")
    finally:
        db.close()


def test_data_quality_summary_endpoint():
    """Verify GET /api/v1/metrics/data-quality-summary computes live database counts."""
    db = SessionLocal()
    try:
        api_res = metrics_endpoint.get_data_quality_summary(db=db)
        assert api_res.success is True
        summary_obj = api_res.data
        summary = summary_obj.model_dump() if hasattr(summary_obj, "model_dump") else summary_obj.dict()

        assert summary["total_study_areas"] == 7
        assert summary["verified_boundaries_count"] == 0
        assert summary["approximate_boundaries_count"] == 7
        assert summary["observed_metrics_count"] > 0
        assert summary["derived_metrics_count"] > 0
        assert summary["missing_source_count"] == 0
        assert "jurisdictions_breakdown" in summary

        # Verify jurisdiction breakdown has PMC, PCMC, PMR
        jb = summary["jurisdictions_breakdown"]
        assert any("PCMC" in k or "Pimpri" in k for k in jb.keys())
        assert any("PMC" in k or "Pune Municipal" in k for k in jb.keys())
        assert any("PMR" in k or "Drainage" in k for k in jb.keys())

        print(f"[PASS] Data quality summary validated: {summary['observed_metrics_count']} observed, {summary['derived_metrics_count']} derived.")
    finally:
        db.close()


def test_climate_metric_provenance_fields():
    """Verify climate metrics stored in database adhere to epistemic classifications."""
    db = SessionLocal()
    try:
        metrics = db.query(ClimateMetric).all()
        assert len(metrics) > 0

        valid_types = {"OBSERVED", "DERIVED", "SIMULATED", "PROJECTED"}
        for m in metrics:
            assert m.data_type in valid_types, f"Invalid data_type {m.data_type} on metric {m.id}"
            assert m.source_name is not None and len(m.source_name.strip()) > 0
            assert m.confidence_score is not None and 0.0 <= m.confidence_score <= 100.0

        print(f"[PASS] All {len(metrics)} climate metrics contain valid provenance metadata.")
    finally:
        db.close()


if __name__ == "__main__":
    print("\n--- RUNNING GEOGRAPHY & PROVENANCE TEST SUITE ---")
    test_study_area_jurisdictions_and_classification()
    test_geojson_endpoint_coordinates_and_properties()
    test_data_quality_summary_endpoint()
    test_climate_metric_provenance_fields()
    print("\nALL GEOGRAPHIC ACCURACY & DATA INTEGRITY TESTS PASSED SUCCESSFULLY.\n")
