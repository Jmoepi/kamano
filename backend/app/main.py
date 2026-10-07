"""Kamano FastAPI application entrypoint.

Data-residency guard: if `enforce_data_residency` is on, the app refuses to
start unless `data_region` is an African AWS region. This makes the sovereignty
promise an enforced invariant rather than a marketing claim (review 3.1).
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes import router
from app.core.config import settings
from app.services.store_provider import init_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kamano")

_AFRICAN_REGIONS = {"af-south-1"}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    store = await init_store()
    logger.info("Store backend: %s", getattr(store, "backend", "unknown"))
    yield
    if settings.use_database:
        from app.core.database import dispose_engine

        await dispose_engine()


def _check_data_residency() -> None:
    if settings.enforce_data_residency and settings.data_region not in _AFRICAN_REGIONS:
        raise RuntimeError(
            f"Data residency violation: data_region='{settings.data_region}' is not "
            f"an African region ({_AFRICAN_REGIONS}). Refusing to start. "
            "Set KAMANO data_region to af-south-1 or disable enforce_data_residency "
            "for non-sovereign environments only."
        )


def create_app() -> FastAPI:
    _check_data_residency()

    app = FastAPI(
        title="Kamano Trust API",
        version=__version__,
        description=(
            "Digital trust infrastructure for South Africa. Offline forensic "
            "verification + reusable Ed25519 W3C credentials. Data stays in "
            f"{settings.data_region}."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    @app.get("/")
    async def root() -> dict:
        return {
            "service": "Kamano Trust API",
            "version": __version__,
            "docs": "/docs",
            "data_region": settings.data_region,
        }

    logger.info("Kamano started | region=%s | env=%s", settings.data_region, settings.environment)
    return app


app = create_app()
