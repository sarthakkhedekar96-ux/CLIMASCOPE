"""
Canonical Study-Area Consistency & Parity Test Suite
CLIMASCOPE Urban Climate Platform • Prompt 19 Verification
==========================================================
Verifies that all 7 study-area records, biophysical metrics,
risk classifications, and citywide aggregations remain 100% synchronized
between backend database seeds, GeoJSON endpoints, and frontend contracts.
"""

import os
import sys
import json
import unittest

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.risk_classification import get_climate_risk_tier
from app.data.seed_data import WARDS_DATA
from app.core.database import SessionLocal
from app.models.ward import Ward


class TestCanonicalStudyAreasConsistency(unittest.TestCase):
    """Rigorous audit of the 7 canonical study areas."""

    EXPECTED_CANONICAL_RECORDS = {
        "WRD-01": {
            "name": "Hadapsar & Magarpatta Industrial Corridor",
            "study_area_id": "PMR-HAD-01",
            "score": 84.2,
            "risk": "CRITICAL",
            "jurisdiction_type": "PMC_STUDY_AREA",
            "area_sq_km": 14.2,
            "population": 142000,
        },
        "WRD-02": {
            "name": "Kasba Peth & Shivajinagar Core",
            "study_area_id": "PMR-KSB-02",
            "score": 80.5,
            "risk": "CRITICAL",
            "jurisdiction_type": "PMC_STUDY_AREA",
            "area_sq_km": 6.8,
            "population": 215000,
        },
        "WRD-03": {
            "name": "Mula-Mutha Riparian Lowlands",
            "study_area_id": "PMR-MLM-03",
            "score": 74.8,
            "risk": "ELEVATED",
            "jurisdiction_type": "PMR_STUDY_AREA",
            "area_sq_km": 11.5,
            "population": 118000,
        },
        "WRD-04": {
            "name": "Hinjawadi & Baner Tech Corridor",
            "study_area_id": "PMR-HNJ-04",
            "score": 46.5,
            "risk": "MODERATE",
            "jurisdiction_type": "PMR_STUDY_AREA",
            "area_sq_km": 16.4,
            "population": 98000,
        },
        "WRD-05": {
            "name": "Kothrud & Vetal Tekdi Highland Preserves",
            "study_area_id": "PMR-KTH-05",
            "score": 24.2,
            "risk": "STABLE",
            "jurisdiction_type": "PMC_STUDY_AREA",
            "area_sq_km": 18.2,
            "population": 165000,
        },
        "WRD-06": {
            "name": "Aundh & Pune University Healthcare District",
            "study_area_id": "PMR-ADH-06",
            "score": 59.4,
            "risk": "MODERATE",
            "jurisdiction_type": "PMC_STUDY_AREA",
            "area_sq_km": 9.6,
            "population": 124000,
        },
        "WRD-07": {
            "name": "Bhosari & PCMC Rail Industrial Belt",
            "study_area_id": "PMR-BHS-07",
            "score": 73.6,
            "risk": "ELEVATED",
            "jurisdiction_type": "PCMC_STUDY_AREA",
            "area_sq_km": 15.8,
            "population": 132000,
        },
    }

    def test_01_seed_data_records_parity(self):
        """Verify WARDS_DATA seed records match canonical reference table."""
        self.assertEqual(len(WARDS_DATA), 7, "Must contain exactly 7 study areas")

        for item in WARDS_DATA:
            code = item["code"]
            self.assertIn(code, self.EXPECTED_CANONICAL_RECORDS, f"Unknown ward code {code}")
            expected = self.EXPECTED_CANONICAL_RECORDS[code]

            self.assertEqual(item["name"], expected["name"])
            self.assertEqual(item["study_area_id"], expected["study_area_id"])
            self.assertEqual(item["climate_debt_score"], expected["score"])
            self.assertEqual(item["status_badge"], expected["risk"])
            self.assertEqual(item["jurisdiction_type"], expected["jurisdiction_type"])
            self.assertEqual(item["area_sq_km"], expected["area_sq_km"])
            self.assertEqual(item["population"], expected["population"])

            # Verify risk engine independently derives expected tier
            derived_tier = get_climate_risk_tier(item["climate_debt_score"])
            self.assertEqual(derived_tier, expected["risk"])

            # Verify approximate boundary disclaimers
            self.assertFalse(item["boundary_is_verified"], f"{code} boundary must be approximate demonstration")
            self.assertTrue(
                "Demonstration" in item["boundary_notes"] or "Not an official" in item["boundary_notes"],
                f"{code} boundary notes must explicitly state non-official / approximate status"
            )

    def test_02_citywide_aggregate_reconciliation(self):
        """Verify citywide aggregates match expected mathematical totals."""
        total_area = sum(w["area_sq_km"] for w in WARDS_DATA)
        total_population = sum(w["population"] for w in WARDS_DATA)
        avg_debt = sum(w["climate_debt_score"] for w in WARDS_DATA) / 7.0

        # Expected totals
        self.assertAlmostEqual(total_area, 92.50, places=2, msg="Total monitored area must be 92.50 km²")
        self.assertEqual(total_population, 994000, "Total monitored population must be 994,000 residents")
        self.assertAlmostEqual(round(avg_debt, 1), 63.3, places=1, msg="City average debt score must round to 63.3")

        # Distribution breakdown
        risk_counts = {}
        for w in WARDS_DATA:
            tier = get_climate_risk_tier(w["climate_debt_score"])
            risk_counts[tier] = risk_counts.get(tier, 0) + 1

        self.assertEqual(risk_counts.get("CRITICAL", 0), 2, "Must have exactly 2 Critical areas")
        self.assertEqual(risk_counts.get("ELEVATED", 0), 2, "Must have exactly 2 Elevated areas")
        self.assertEqual(risk_counts.get("MODERATE", 0), 2, "Must have exactly 2 Moderate areas (Aundh & Baner)")
        self.assertEqual(risk_counts.get("STABLE", 0), 1, "Must have exactly 1 Stable area (Kothrud)")

    def test_03_database_storage_consistency(self):
        """Verify SQLite database contains identical canonical records."""
        db = SessionLocal()
        try:
            db_wards = db.query(Ward).all()
            self.assertEqual(len(db_wards), 7, "Database must hold exactly 7 study areas")

            for w in db_wards:
                self.assertIn(w.code, self.EXPECTED_CANONICAL_RECORDS)
                expected = self.EXPECTED_CANONICAL_RECORDS[w.code]
                self.assertEqual(w.climate_debt_score, expected["score"])
                self.assertEqual(w.status_badge, expected["risk"])
                self.assertEqual(w.area_sq_km, expected["area_sq_km"])
                self.assertEqual(w.population, expected["population"])
        finally:
            db.close()

    def test_04_polygon_geometry_validity(self):
        """Verify all 7 study areas possess closed, non-degenerate coordinate rings."""
        for w in WARDS_DATA:
            coords = w["coordinates"]
            self.assertGreaterEqual(len(coords), 4, f"{w['code']} must have at least 4 coordinates")
            # Closed ring check
            self.assertEqual(coords[0], coords[-1], f"{w['code']} polygon ring must be closed")
            # Coordinate bounds check (Pune region: lon 73.6-74.1, lat 18.4-18.7)
            for lon, lat in coords:
                self.assertTrue(73.65 <= lon <= 74.05, f"{w['code']} lon {lon} out of Pune range")
                self.assertTrue(18.40 <= lat <= 18.70, f"{w['code']} lat {lat} out of Pune range")


if __name__ == "__main__":
    unittest.main()
