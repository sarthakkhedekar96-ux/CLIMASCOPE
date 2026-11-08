import os
import sys
import asyncio
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.data.seed_data import seed_database

async def run_all_tests():
    print("Setting up test database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Root
        r = await client.get("/")
        assert r.status_code == 200, f"Root failed: {r.status_code}"
        assert r.json()["status"] == "OPERATIONAL"
        print("✓ Root endpoint operational")

        # 2. Health
        r = await client.get("/api/v1/health")
        assert r.status_code == 200, f"Health failed: {r.status_code}"
        data = r.json()
        assert data["status"] == "HEALTHY"
        assert data["telemetry_status"] == "NOMINAL"
        assert data["active_wards_count"] >= 7
        print(f"✓ Health check nominal: {data['active_wards_count']} wards registered")

        # 3. Wards List
        r = await client.get("/api/v1/wards")
        assert r.status_code == 200
        payload = r.json()
        assert payload["success"] is True
        assert len(payload["data"]) == 7
        print(f"✓ Ward registry retrieved: {len(payload['data'])} wards loaded")

        # 4. Wards GeoJSON
        r = await client.get("/api/v1/wards/geojson")
        assert r.status_code == 200
        geojson = r.json()
        assert geojson["type"] == "FeatureCollection"
        assert len(geojson["features"]) == 7
        assert geojson["features"][0]["geometry"]["type"] == "Polygon"
        print("✓ GeoJSON FeatureCollection validated with valid polygon boundaries")

        # 5. City Overview
        r = await client.get("/api/v1/metrics/city-overview")
        assert r.status_code == 200
        ov = r.json()["data"]
        assert ov["total_wards"] == 7
        assert ov["climate_debt"]["city_average_debt_score"] > 0
        print(f"✓ City overview metrics validated: Avg Heat = {ov['average_heat_index_celsius']}°C, Debt = {ov['climate_debt']['city_average_debt_score']}")

        # 6. Knapsack Optimizer
        opt_req = {
            "budget_cap_usd": 1500000.0,
            "target_ward_ids": [1, 2],
            "primary_objective": "BALANCED"
        }
        r = await client.post("/api/v1/interventions/optimize", json=opt_req)
        assert r.status_code == 200
        opt_data = r.json()["data"]
        assert opt_data["total_cost_usd"] <= 1500000.0
        assert len(opt_data["selected_interventions"]) > 0
        print(f"✓ Budget-Constrained Optimizer converged: {len(opt_data['selected_interventions'])} interventions selected (${opt_data['total_cost_usd']:,.2f} / ${opt_req['budget_cap_usd']:,.2f})")

        # 7. Evidence Graph
        r = await client.get("/api/v1/evidence/1")
        assert r.status_code == 200
        eg = r.json()["data"]
        assert len(eg["nodes"]) > 0
        assert len(eg["edges"]) > 0
        print(f"✓ Evidence Graph verified: {len(eg['nodes'])} nodes, {len(eg['edges'])} causal links")

        # 8. Climate Action Ledger
        r = await client.get("/api/v1/ledger")
        assert r.status_code == 200
        led = r.json()["data"]
        assert len(led) > 0
        print(f"✓ Climate Action Ledger validated: {len(led)} immutable audit records")

    print("\n==========================================")
    print("ALL BACKEND TEST SUITES PASSED (8/8)")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
