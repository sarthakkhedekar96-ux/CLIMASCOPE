import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.data.seed_data import seed_database

class TestClimascopeBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
        cls.client_cm = TestClient(app)
        cls.client = cls.client_cm.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_cm.__exit__(None, None, None)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "OPERATIONAL")

    def test_health_endpoint(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertEqual(data["telemetry_status"], "NOMINAL")
        self.assertGreaterEqual(data["active_wards_count"], 7)

    def test_list_wards(self):
        response = self.client.get("/api/v1/wards")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(len(payload["data"]), 7)

    def test_wards_geojson(self):
        response = self.client.get("/api/v1/wards/geojson")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["type"], "FeatureCollection")
        self.assertEqual(len(payload["features"]), 7)

    def test_city_overview_metrics(self):
        response = self.client.get("/api/v1/metrics/city-overview")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        data = payload["data"]
        self.assertEqual(data["total_wards"], 7)
        self.assertIn("climate_debt", data)

    def test_intervention_optimizer(self):
        req = {
            "budget_cap_usd": 1500000.0,
            "target_ward_ids": [1, 2],
            "primary_objective": "BALANCED"
        }
        response = self.client.post("/api/v1/interventions/optimize", json=req)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        data = payload["data"]
        self.assertLessEqual(data["total_cost_usd"], 1500000.0)

    def test_evidence_graph(self):
        response = self.client.get("/api/v1/evidence/1")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        data = payload["data"]
        self.assertGreater(len(data["nodes"]), 0)

    def test_ledger(self):
        response = self.client.get("/api/v1/ledger")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertGreater(len(payload["data"]), 0)

if __name__ == "__main__":
    unittest.main()
