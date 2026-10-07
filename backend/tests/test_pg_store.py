"""Integration test for the PostgreSQL-backed store.

Skips automatically unless TEST_DATABASE_URL points at a reachable Postgres.
In CI, set e.g.:
    TEST_DATABASE_URL=postgresql+asyncpg://kamano:kamano@localhost:5432/kamano

The test exercises the full Store interface against real Postgres: verification
save/get/list, credential issue/get/revoke/is_revoked, consent, and the
append-only audit log.
"""

from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest

TEST_DB_URL = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_DB_URL, reason="TEST_DATABASE_URL not set; skipping Postgres integration test."
)


def _configure_db():
    """Point settings at the test DB and reset the engine singletons."""
    from app.core import config, database

    config.settings.database_url = TEST_DB_URL
    config.settings.use_database = True
    database._engine = None
    database._sessionmaker = None


async def _run_flow() -> dict:
    _configure_db()
    from app.core.database import dispose_engine, init_models, ping
    from app.services.pg_store import PgStore

    assert await ping(), "Postgres not reachable at TEST_DATABASE_URL"
    await init_models()
    store = PgStore()

    results: dict = {}

    # --- verification ---
    vid = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    await store.save_verification(
        {
            "id": vid,
            "document_sha256": "a" * 64,
            "decision": "VERIFIED",
            "assurance_tier": "C",
            "risk_score": 0.0,
            "source_checked": False,
            "findings": [{"code": "NO_SECURITY_IMAGERY", "severity": "info", "message": "x"}],
            "expires_at": (now + timedelta(days=30)).isoformat(),
        }
    )
    fetched = await store.get_verification(vid)
    results["verification_roundtrip"] = fetched is not None and fetched["decision"] == "VERIFIED"
    results["verification_list"] = any(v["id"] == vid for v in await store.list_verifications())

    # --- credential ---
    cid = str(uuid.uuid4())
    await store.save_credential(
        {
            "id": cid,
            "credential": {
                "@context": ["https://www.w3.org/ns/credentials/v2"],
                "id": f"urn:uuid:{cid}",
                "type": ["VerifiableCredential", "KamanoTrustCredential"],
                "validUntil": (now + timedelta(days=365)).isoformat(),
                "credentialSubject": {"entityName": "Example (Pty) Ltd", "assuranceTier": "C"},
            },
        }
    )
    results["credential_roundtrip"] = (await store.get_credential(cid)) is not None
    results["not_revoked_initially"] = not await store.is_revoked(cid)
    results["revoke_returns_true"] = await store.revoke(cid)
    results["revoked_after"] = await store.is_revoked(cid)

    # --- consent + audit ---
    await store.add_consent(
        {"holder_id": str(uuid.uuid4()), "verifier_id": str(uuid.uuid4()), "scope": ["read"]}
    )
    await store.add_audit(
        {"event_type": "test.event", "resource_type": "test", "resource_id": vid, "metadata": {"k": "v"}}
    )
    results["audit_has_entry"] = any(a["event_type"] == "test.event" for a in await store.list_audit())

    await dispose_engine()
    return results


def test_pg_store_full_flow():
    results = asyncio.run(_run_flow())
    assert results["verification_roundtrip"]
    assert results["verification_list"]
    assert results["credential_roundtrip"]
    assert results["not_revoked_initially"]
    assert results["revoke_returns_true"]
    assert results["revoked_after"]
    assert results["audit_has_entry"]
