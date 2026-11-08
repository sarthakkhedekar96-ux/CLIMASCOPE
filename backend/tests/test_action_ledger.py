import unittest
import os
import sys
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.intervention import Intervention
from app.models.ledger import LedgerEntry
from app.schemas.intervention import (
    InterventionCreate,
    InterventionUpdatePayload,
    AttachEvidencePayload,
    VerifyInterventionPayload
)
from app.services.action_ledger_service import ActionLedgerService

class TestActionLedgerService(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_create_and_lifecycle_tracking(self):
        # 1. Create intervention
        new_itv = InterventionCreate(
            ward_id=1,
            intervention_code="ACT-TEST-001",
            name="Test Miyawaki Pocket Forest Infill",
            category="CANOPY_EXPANSION",
            cost_usd=250000.0,
            target_area_sq_m=15000.0,
            annual_maintenance_usd=10000.0,
            cooling_effect_celsius=1.4,
            runoff_reduction_pct=15.0,
            co2_sequestration_t_yr=50.0,
            roi_score=9.2,
            status="Proposed",
            timeline_months=6,
            responsible_authority="PMC Directorate of Urban Forestry",
            start_date="2026-04-01",
            deadline="2026-10-01",
            description="High-density urban forest mitigating industrial surface temperature."
        )
        created = ActionLedgerService.create_intervention(new_itv, self.db)
        self.assertIsNotNone(created.id)
        self.assertEqual(created.status, "Proposed")
        self.assertEqual(created.responsible_authority, "PMC Directorate of Urban Forestry")

        # 2. Update status and assign contractor
        update_payload = InterventionUpdatePayload(
            status="In Progress",
            progress_pct=45,
            contractor="Western India Bio-Engineering Ltd"
        )
        updated = ActionLedgerService.update_intervention(created.id, update_payload, self.db)
        self.assertEqual(updated.status, "In Progress")
        self.assertEqual(updated.progress_pct, 45)
        self.assertEqual(updated.contractor, "Western India Bio-Engineering Ltd")

        # 3. Attach evidence
        ev_payload = AttachEvidencePayload(
            evidence_type="SATELLITE_MULTISPECTRAL",
            source="Copernicus Sentinel-2 MSI Band 8 NIR",
            observation_date="2026-05-15",
            geographic_location="18.5089° N, 73.9260° E",
            description="Baseline canopy NDVI spectral calibration prior to earthworks.",
            confidence=0.98,
            is_simulated=False
        )
        with_evidence = ActionLedgerService.attach_evidence(created.id, ev_payload, self.db)
        ev_list = json.loads(with_evidence.attached_evidence_json)
        self.assertEqual(len(ev_list), 1)
        self.assertEqual(ev_list[0]["source"], "Copernicus Sentinel-2 MSI Band 8 NIR")

        # 4. Verify implementation (Simulated demonstration workflow)
        verif_payload = VerifyInterventionPayload(
            simulate=True,
            observed_cooling_celsius=1.35,
            observed_runoff_reduction_pct=14.0,
            evidence_source="Copernicus Sentinel-2 MSI Synthetic Re-Pass (Demonstration Sim)"
        )
        verif_res = ActionLedgerService.verify_intervention(created.id, verif_payload, self.db)
        self.assertEqual(verif_res.verification_status, "Verified")
        self.assertTrue(verif_res.is_simulated)
        self.assertEqual(verif_res.planned_cooling_celsius, 1.4)
        self.assertEqual(verif_res.observed_cooling_celsius, 1.35)
        self.assertAlmostEqual(verif_res.cooling_difference_celsius, -0.05, places=2)
        self.assertTrue(len(verif_res.audit_block_hash) == 64)

        # 5. Outcome comparison retrieval
        comp = ActionLedgerService.get_outcome_comparison(created.id, self.db)
        self.assertEqual(comp.intervention_id, created.id)
        self.assertTrue(comp.cooling_target_met)

    def test_cryptographic_ledger_immutability(self):
        blocks = self.db.query(LedgerEntry).all()
        self.assertGreater(len(blocks), 0)
        for b in blocks:
            self.assertEqual(len(b.transaction_hash), 64)
            self.assertTrue(b.entry_code.startswith("LEDGER-"))

if __name__ == "__main__":
    unittest.main()
