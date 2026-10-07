"""Async SQLAlchemy engine + session management.

The production data layer is PostgreSQL in AWS af-south-1 (NOT Supabase Cloud —
see doc/Kamano_Strategic_Technical_Review.md 3.1). The same code runs against a
local Postgres for development via docker-compose.

The engine is created lazily so the app can start in demo mode (in-memory
store) when no database is configured or reachable.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug and settings.environment == "development",
            pool_pre_ping=True,
        )
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            get_engine(), expire_on_commit=False, class_=AsyncSession
        )
    return _sessionmaker


async def session_scope() -> AsyncIterator[AsyncSession]:
    """Async context-managed session for a unit of work."""
    maker = get_sessionmaker()
    async with maker() as session:
        yield session


async def ping() -> bool:
    """Return True if the database answers a trivial query."""
    from sqlalchemy import text

    try:
        async with get_sessionmaker()() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 — any failure means "not reachable"
        return False


async def init_models() -> None:
    """Create tables if they don't exist (dev convenience).

    In production, schema is owned by the SQL migrations in supabase/migrations/
    (which also install the append-only audit trigger and RLS scaffold). This
    helper only creates the ORM-known tables and is safe to call repeatedly.
    """
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def dispose_engine() -> None:
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
