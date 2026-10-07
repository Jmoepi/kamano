"""Kamano API v1 — fintech-KYC-first launch surface.

Only the endpoints needed for the launch vertical are implemented. Other
verticals (property, vehicle finance, legal, government) are roadmap, not
launch surface — see Kamano_Strategic_Technical_Review.md 3.2.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.models.schemas import (
    ConsentRecord,
    CredentialStatus,
    CredentialSubject,
    CredentialVerifyRequest,
    CredentialVerifyResponse,
    IssueCredentialRequest,
    VerificationResult,
)
from app.services.credentials import CredentialEngine, status_from
from app.services.forensics import ForensicEngine, decide, sha256_bytes
from app.services.store import store

router = APIRouter(prefix=settings.api_prefix)

_forensics = ForensicEngine()
_credentials = CredentialEngine()


def _audit(event: str, resource_type: str, resource_id: str, meta: dict | None = None):
    if settings.popia_audit_enabled:
        store.add_audit(
            {
                "id": str(uuid.uuid4()),
                "event_type": event,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "metadata": meta or {},
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )


# --- Health ------------------------------------------------------------------


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "data_region": settings.data_region}


@router.get("/health/ready")
async def ready() -> dict:
    return {"ready": True}


# --- Document verification ---------------------------------------------------


@router.post("/verify/document", response_model=VerificationResult)
async def verify_document(file: UploadFile = File(...)) -> VerificationResult:
    if file.content_type not in settings.allowed_mime_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported type {file.content_type}; allowed: {settings.allowed_mime_types}",
        )

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large.")

    findings, score = _forensics.analyze(data)

    # Source-of-truth check only possible if an integration is enabled.
    source_checked = any(
        [
            settings.enable_sars_integration,
            settings.enable_cipc_integration,
            settings.enable_home_affairs_integration,
        ]
    )
    decision, tier = decide(score, source_checked)

    now = datetime.now(timezone.utc)
    result = VerificationResult(
        id=str(uuid.uuid4()),
        document_sha256=sha256_bytes(data),
        decision=decision,
        assurance_tier=tier,
        risk_score=score,
        findings=findings,
        source_checked=source_checked,
        created_at=now,
        expires_at=now + timedelta(days=settings.raw_document_retention_days),
    )
    store.save_verification(result.model_dump(mode="json"))
    # NOTE: only the derived record is retained; the raw document buffer is not
    # persisted here (POPIA data minimisation / 30-day purge, review 3.4).
    _audit("verification.created", "verification", result.id, {"tier": tier.value})
    return result


@router.get("/verification/{vid}", response_model=VerificationResult)
async def get_verification(vid: str) -> VerificationResult:
    rec = store.get_verification(vid)
    if not rec:
        raise HTTPException(status_code=404, detail="Not found.")
    return VerificationResult.model_validate(rec)


@router.get("/verifications")
async def list_verifications() -> dict:
    items = store.list_verifications()
    return {"count": len(items), "items": items}


# --- Trust credentials -------------------------------------------------------


@router.post("/credential/issue")
async def issue_credential(req: IssueCredentialRequest) -> dict:
    verification = store.get_verification(req.verification_id)
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found.")
    if verification["decision"] == "REJECTED":
        raise HTTPException(
            status_code=409,
            detail="Cannot issue a credential for a rejected verification.",
        )

    subject = CredentialSubject.model_validate(req.subject.model_dump())
    vc = _credentials.issue(subject, valid_days=req.valid_days)
    cred_id = vc.id.split(":")[-1]
    store.save_credential({"id": cred_id, "credential": vc.model_dump(by_alias=True)})
    _audit("credential.issued", "credential", cred_id, {"tier": subject.assurance_tier.value})
    return {"id": cred_id, "credential": vc.model_dump(by_alias=True)}


@router.get("/credential/{cid}")
async def get_credential(cid: str) -> dict:
    rec = store.get_credential(cid)
    if not rec:
        raise HTTPException(status_code=404, detail="Not found.")
    return rec


@router.get("/credentials")
async def list_credentials() -> dict:
    items = store.list_credentials()
    return {"count": len(items), "items": items}


@router.post("/credential/{cid}/revoke")
async def revoke_credential(cid: str) -> dict:
    """Revoke a credential after issuance (review 2.3)."""
    if not store.revoke(cid):
        raise HTTPException(status_code=404, detail="Credential not found.")
    _audit("credential.revoked", "credential", cid)
    return {"id": cid, "status": CredentialStatus.REVOKED.value}


@router.get("/credentials/status/{cid}")
async def credential_status(cid: str) -> dict:
    """Public status endpoint referenced by each credential's credentialStatus."""
    rec = store.get_credential(cid)
    if not rec:
        raise HTTPException(status_code=404, detail="Unknown credential.")
    valid_until = rec["credential"].get("validUntil")
    status = status_from(valid_until, store.is_revoked(cid))
    return {"id": cid, "status": status.value}


@router.post("/credential/consent")
async def record_consent(consent: ConsentRecord) -> dict:
    """Holder grants a verifier consent to read a credential (review 2.3)."""
    store.add_consent(consent.model_dump(mode="json"))
    _audit("consent.granted", "consent", consent.holder_id, {"verifier": consent.verifier_id})
    return {"recorded": True}


@router.post("/credential/verify", response_model=CredentialVerifyResponse)
async def verify_credential(req: CredentialVerifyRequest) -> CredentialVerifyResponse:
    """Public verification: checks signature, expiry, and revocation status."""
    credential = req.credential
    cid = str(credential.get("id", "")).split(":")[-1]

    sig_ok, reasons = _credentials.verify_signature(credential)
    if store.is_revoked(cid):
        reasons.append("Credential has been revoked.")
        return CredentialVerifyResponse(
            valid=False, status=CredentialStatus.REVOKED, reasons=reasons
        )

    status = status_from(credential.get("validUntil"), False)
    valid = sig_ok and status == CredentialStatus.ACTIVE
    return CredentialVerifyResponse(valid=valid, status=status, reasons=reasons)


# --- Dashboard & compliance --------------------------------------------------


@router.get("/dashboard/stats")
async def dashboard_stats() -> dict:
    verifications = store.list_verifications()
    tiers: dict[str, int] = {}
    decisions: dict[str, int] = {}
    for v in verifications:
        tiers[v["assurance_tier"]] = tiers.get(v["assurance_tier"], 0) + 1
        decisions[v["decision"]] = decisions.get(v["decision"], 0) + 1
    return {
        "total_verifications": len(verifications),
        "total_credentials": len(store.list_credentials()),
        "by_assurance_tier": tiers,
        "by_decision": decisions,
    }


@router.get("/audit/log")
async def audit_log() -> dict:
    items = store.list_audit()
    return {"count": len(items), "items": items}
