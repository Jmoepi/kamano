"""Tiny in-memory store so the skeleton runs end-to-end without a database.

In production this is replaced by the SQLAlchemy models backed by AWS RDS
PostgreSQL in af-south-1 (see supabase/migrations for the schema). Kept behind
a narrow interface so swapping it is low-risk.
"""

from __future__ import annotations

import threading
from typing import Any


class MemoryStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.verifications: dict[str, dict[str, Any]] = {}
        self.credentials: dict[str, dict[str, Any]] = {}
        self.revoked: set[str] = set()
        self.consents: list[dict[str, Any]] = []
        self.audit: list[dict[str, Any]] = []

    def save_verification(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.verifications[record["id"]] = record

    def get_verification(self, vid: str) -> dict[str, Any] | None:
        return self.verifications.get(vid)

    def list_verifications(self) -> list[dict[str, Any]]:
        return list(self.verifications.values())

    def save_credential(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.credentials[record["id"]] = record

    def get_credential(self, cid: str) -> dict[str, Any] | None:
        return self.credentials.get(cid)

    def list_credentials(self) -> list[dict[str, Any]]:
        return list(self.credentials.values())

    def revoke(self, cid: str) -> bool:
        with self._lock:
            if cid in self.credentials:
                self.revoked.add(cid)
                return True
            return False

    def is_revoked(self, cid: str) -> bool:
        return cid in self.revoked

    def add_consent(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.consents.append(record)

    def add_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.audit.append(record)

    def list_audit(self) -> list[dict[str, Any]]:
        return list(self.audit)


store = MemoryStore()
