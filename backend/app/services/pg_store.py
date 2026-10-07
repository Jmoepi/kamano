"""PostgreSQL-backed Store implementation (SQLAlchemy async).

Implements the same async interface as MemoryStore. Record shapes in/out match
exactly what the API routes already use, so routes are unchanged.

Mapping notes:
  * Verification `id` from the route is a string UUID; stored in the UUID PK.
  * Credential `id` from the route is the UUID (last segment of the VC urn),
    reused as the trust_credentials PK so status/revoke lookups are O(1).
  * Revocation is modelled by `status='REVOKED'` + `revoked_at`, not a side set.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select

from app.core.database import get_sessionmaker
from app.models.db import AuditLog, Consent, TrustCredential, Verification


def _to_uuid(value: str) -> uuid.UUID:
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


class PgStore:
    backend = "postgresql"

    def __init__(self) -> None:
        self._sm = get_sessionmaker()

    # --- verifications -------------------------------------------------------

    async def save_verification(self, record: dict[str, Any]) -> None:
        async with self._sm() as s, s.begin():
            s.add(
                Verification(
                    id=_to_uuid(record["id"]),
                    document_sha256=record["document_sha256"],
                    decision=record["decision"],
                    assurance_tier=record["assurance_tier"],
                    risk_score=record["risk_score"],
                    source_checked=record.get("source_checked", False),
                    forensic_findings=record["findings"],
                    expires_at=_parse(record.get("expires_at")),
                )
            )

    async def get_verification(self, vid: str) -> dict[str, Any] | None:
        async with self._sm() as s:
            row = await s.get(Verification, _to_uuid(vid))
            return _verification_to_dict(row) if row else None

    async def list_verifications(self) -> list[dict[str, Any]]:
        async with self._sm() as s:
            rows = (await s.execute(select(Verification))).scalars().all()
            return [_verification_to_dict(r) for r in rows]

    # --- credentials ---------------------------------------------------------

    async def save_credential(self, record: dict[str, Any]) -> None:
        cred = record["credential"]
        subject = cred.get("credentialSubject", {})
        async with self._sm() as s, s.begin():
            s.add(
                TrustCredential(
                    id=_to_uuid(record["id"]),
                    credential_type=(cred.get("type") or ["KamanoTrustCredential"])[-1],
                    subject_name=subject.get("entityName", "unknown"),
                    assurance_tier=subject.get("assuranceTier", "C"),
                    credential=cred,
                    status="ACTIVE",
                    valid_until=_parse(cred.get("validUntil")),
                )
            )

    async def get_credential(self, cid: str) -> dict[str, Any] | None:
        async with self._sm() as s:
            row = await s.get(TrustCredential, _to_uuid(cid))
            if not row:
                return None
            return {"id": str(row.id), "credential": row.credential}

    async def list_credentials(self) -> list[dict[str, Any]]:
        async with self._sm() as s:
            rows = (await s.execute(select(TrustCredential))).scalars().all()
            return [{"id": str(r.id), "credential": r.credential} for r in rows]

    async def revoke(self, cid: str) -> bool:
        async with self._sm() as s, s.begin():
            row = await s.get(TrustCredential, _to_uuid(cid))
            if not row:
                return False
            row.status = "REVOKED"
            row.revoked_at = datetime.now(timezone.utc)
            return True

    async def is_revoked(self, cid: str) -> bool:
        async with self._sm() as s:
            row = await s.get(TrustCredential, _to_uuid(cid))
            return bool(row and row.status == "REVOKED")

    # --- consents ------------------------------------------------------------

    async def add_consent(self, record: dict[str, Any]) -> None:
        async with self._sm() as s, s.begin():
            s.add(
                Consent(
                    holder_id=str(record["holder_id"]),
                    verifier_id=str(record["verifier_id"]),
                    scope=record.get("scope", []),
                    expires_at=_parse(record.get("expires_at")),
                )
            )

    # --- audit ---------------------------------------------------------------

    async def add_audit(self, record: dict[str, Any]) -> None:
        async with self._sm() as s, s.begin():
            s.add(
                AuditLog(
                    event_type=record["event_type"],
                    resource_type=record.get("resource_type"),
                    resource_id=str(record.get("resource_id")) if record.get("resource_id") else None,
                    audit_metadata=record.get("metadata"),
                )
            )

    async def list_audit(self) -> list[dict[str, Any]]:
        async with self._sm() as s:
            rows = (
                await s.execute(select(AuditLog).order_by(AuditLog.created_at))
            ).scalars().all()
            return [
                {
                    "id": str(r.id),
                    "event_type": r.event_type,
                    "resource_type": r.resource_type,
                    "resource_id": r.resource_id,
                    "metadata": r.audit_metadata,
                    "created_at": _iso(r.created_at),
                }
                for r in rows
            ]


def _parse(value: Any) -> datetime | None:
    if value is None or isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _verification_to_dict(row: Verification) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "document_sha256": row.document_sha256,
        "decision": row.decision,
        "assurance_tier": row.assurance_tier,
        "risk_score": float(row.risk_score),
        "source_checked": row.source_checked,
        "findings": row.forensic_findings,
        "created_at": _iso(row.created_at),
        "expires_at": _iso(row.expires_at),
    }
