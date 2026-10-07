"""API-level smoke test using FastAPI's test transport (no server needed)."""

from __future__ import annotations

import io

import fitz
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _pdf(producer: str = "reportlab") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "SARS Tax Clearance Certificate")
    doc.set_metadata({"producer": producer, "creator": producer})
    data = doc.tobytes()
    doc.close()
    return data


def test_health_and_region():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["data_region"] == "af-south-1"


def test_verify_then_issue_then_verify_credential():
    files = {"file": ("clean.pdf", io.BytesIO(_pdf()), "application/pdf")}
    r = client.post("/api/v1/verify/document", files=files)
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["assurance_tier"] == "C"
    assert v["decision"] == "VERIFIED"

    issue = {
        "verification_id": v["id"],
        "subject": {
            "entity_name": "Example Trading (Pty) Ltd",
            "registration_number": "2026/123456/07",
            "document_type": "sars_tax_clearance",
            "assurance_tier": "C",
            "trust_score": v["risk_score"],
        },
        "valid_days": 365,
    }
    r = client.post("/api/v1/credential/issue", json=issue)
    assert r.status_code == 200, r.text
    cred = r.json()["credential"]

    r = client.post("/api/v1/credential/verify", json={"credential": cred})
    assert r.status_code == 200, r.text
    assert r.json()["valid"] is True

    # Revoke, then verification should fail
    cid = r.json()
    cred_id = cred["id"].split(":")[-1]
    r = client.post(f"/api/v1/credential/{cred_id}/revoke")
    assert r.status_code == 200
    r = client.post("/api/v1/credential/verify", json={"credential": cred})
    assert r.json()["valid"] is False
    assert r.json()["status"] == "REVOKED"


def test_rejects_non_pdf():
    files = {"file": ("x.txt", io.BytesIO(b"hello"), "text/plain")}
    r = client.post("/api/v1/verify/document", files=files)
    assert r.status_code == 415
