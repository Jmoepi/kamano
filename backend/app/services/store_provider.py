"""Selects the active Store implementation at startup.

Decision logic:
  * If settings.use_database is False -> MemoryStore (explicit demo mode).
  * Else try to reach the database; on success -> PgStore (schema ensured),
    otherwise fall back to MemoryStore so the app still boots for demos.

Routes call `get_store()` which always returns a ready Store.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.services.store import MemoryStore, Store

logger = logging.getLogger("kamano.store")

_store: Store | None = None


def get_store() -> Store:
    """Return the active store, defaulting to in-memory if init hasn't run."""
    global _store
    if _store is None:
        _store = MemoryStore()
        logger.info("Store not initialised yet; using in-memory default.")
    return _store


def set_store(store: Store) -> None:
    global _store
    _store = store


async def init_store() -> Store:
    """Initialise the active store. Called once on app startup."""
    global _store

    if not settings.use_database:
        _store = MemoryStore()
        logger.info("use_database=false -> in-memory store (demo mode).")
        return _store

    # Import lazily so demo mode needs no DB driver imported.
    from app.core.database import init_models, ping
    from app.services.pg_store import PgStore

    if await ping():
        try:
            await init_models()
            _store = PgStore()
            logger.info("Connected to PostgreSQL; using durable store.")
            return _store
        except Exception as exc:  # noqa: BLE001
            logger.warning("DB reachable but init failed (%s); using in-memory.", exc)
    else:
        logger.warning(
            "DATABASE_URL not reachable; falling back to in-memory store. "
            "Set up Postgres (docker/docker-compose.dev.yml) for durability."
        )

    _store = MemoryStore()
    return _store
