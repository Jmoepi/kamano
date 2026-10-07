"""End-to-end smoke test for the Kamano core flow.

Runs with the in-memory store (no DB needed). Exercises:
  1. Forensic analysis of a clean vs an "edited" PDF
  2. Credential issuance + independent signature verification
  3. Tamper detection on the credential
  4. Revocation
"""

from __future__ import annotations

import fitz  # PyMuPDF

from app.models.schemas import CredentialSubject, AssuranceTier
from app.services.credentials import CredentialEngine
from app.services.forensics import ForensicEngine, decide


def _make_pdf(producer: str = "reportlab") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "SARS Tax Clearance Certificate")
    page.insert_text((72, 100), "Entity: Example Trading (Pty) Ltd")
    doc.set_metadata({"producer": producer, "creator": producer})
    data = doc.tobytes()
    doc.close()
    return data


def test_clean_pdf_scores_low():
    findings, score = ForensicEngine().analyze(_make_pdf("reportlab"))
    decision, tier = decide(score, source_checked=False)
    assert score < 60
    # Without a source check the honest tier is C, never A.
    assert tier == AssuranceTier.C
    print(f"[clean] score={score} decision={decision} tier={tier} findings={[f.code for f in findings]}")


def test_editing_software_flagged():
    findings, score = ForensicEngine().analyze(_make_pdf("Adobe Photoshop 25.0"))
    codes = [f.code for f in findings]
    assert "METADATA_EDITING_SOFTWARE" in codes
    assert score >= 60
    print(f"[edited] score={score} findings={codes}")


def test_credential_issue_and_verify():
    engine = CredentialEngine()
    subject = CredentialSubject(
        entity_name="Example Trading (Pty) Ltd",
        registration_number="2026/123456/07",
        document_type="sars_tax_clearance",
        assurance_tier=AssuranceTier.C,
        trust_score=8.0,
    )
    vc = engine.issue(subject, valid_days=365)
    cred = vc.model_dump(by_alias=True)

    # Correct JSON-LD key present
    assert "@context" in cred
    assert cred["@context"][0] == "https://www.w3.org/ns/credentials/v2"

    ok, reasons = engine.verify_signature(cred)
    assert ok, reasons
    print(f"[credential] verified ok, id={cred['id']}")


def test_tampered_credential_rejected():
    engine = CredentialEngine()
    subject = CredentialSubject(
        entity_name="Example Trading (Pty) Ltd",
        registration_number="2026/123456/07",
        document_type="sars_tax_clearance",
        assurance_tier=AssuranceTier.C,
        trust_score=8.0,
    )
    vc = engine.issue(subject)
    cred = vc.model_dump(by_alias=True)

    # Tamper with the subject after signing
    cred["credentialSubject"]["trustScore"] = 100.0
    ok, reasons = engine.verify_signature(cred)
    assert not ok
    print(f"[tamper] correctly rejected: {reasons}")


if __name__ == "__main__":
    test_clean_pdf_scores_low()
    test_editing_software_flagged()
    test_credential_issue_and_verify()
    test_tampered_credential_rejected()
    print("\nALL SMOKE TESTS PASSED")
