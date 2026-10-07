"""Store interface + in-memory implementation.

Two implementations share one async interface (`Store`):
  * MemoryStore — zero-dependency, used for demos/tests when no DB is reachable.
  * PgStore (app/services/pg_store.py) — PostgreSQL via SQLAlchemy async.

Routes depend only on the interface, so swapping is transparent. All methods
are async even in the memory store so the call sites are identical.
"""

from __future__ import annotations

import threading
from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class Store(Protocol):
    async def save_verification(self, record: dict[str, Any]) -> None: ...
    async def get_verification(self, vid: str) -> dict[str, Any] | None: ...
    async def list_verifications(self) -> list[dict[str, Any]]: ...
    async def save_credential(self, record: dict[str, Any]) -> None: ...
    async def get_credential(self, cid: str) -> dict[str, Any] | None: ...
    async def list_credentials(self) -> list[dict[str, Any]]: ...
    async def revoke(self, cid: str) -> bool: ...
    async def is_revoked(self, cid: str) -> bool: ...
    async def add_consent(self, record: dict[str, Any]) -> None: ...
    async def add_audit(self, record: dict[str, Any]) -> None: ...
    async def list_audit(self) -> list[dict[str, Any]]: ...


class MemoryStore:
    """Process-local store. Not durable; for demos and unit tests only."""

    backend = "memory"

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.verifications: dict[str, dict[str, Any]] = {}
        self.credentials: dict[str, dict[str, Any]] = {}
        self.revoked: set[str] = set()
        self.consents: list[dict[str, Any]] = []
        self.audit: list[dict[str, Any]] = []

    async def save_verification(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.verifications[record["id"]] = record

    async def get_verification(self, vid: str) -> dict[str, Any] | None:
        return self.verifications.get(vid)

    async def list_verifications(self) -> list[dict[str, Any]]:
        return list(self.verifications.values())

    async def save_credential(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.credentials[record["id"]] = record

    async def get_credential(self, cid: str) -> dict[str, Any] | None:
        return self.credentials.get(cid)

    async def list_credentials(self) -> list[dict[str, Any]]:
        return list(self.credentials.values())

    async def revoke(self, cid: str) -> bool:
        with self._lock:
            if cid in self.credentials:
                self.revoked.add(cid)
                return True
            return False

    async def is_revoked(self, cid: str) -> bool:
        return cid in self.revoked

    async def add_consent(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.consents.append(record)

    async def add_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.audit.append(record)

    async def list_audit(self) -> list[dict[str, Any]]:
        return list(self.audit)
