"""Application configuration.

Data-sovereignty note: Kamano targets AWS af-south-1 (Cape Town) for the data
layer. Supabase Cloud does NOT offer an African region, so the production data
layer is AWS RDS PostgreSQL + S3 + KMS in af-south-1 (not Supabase Cloud).
See doc/Kamano_Strategic_Technical_Review.md section 3.1.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    app_name: str = "Kamano"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    debug: bool = True

    # --- Data residency ---
    # Enforced at startup: the data layer must live in an African region for
    # the POPIA sovereignty claim to hold. See startup check in main.py.
    data_region: str = "af-south-1"
    enforce_data_residency: bool = True

    # --- Database (any PostgreSQL; prod = AWS RDS af-south-1) ---
    database_url: str = (
        "postgresql+asyncpg://kamano:kamano@localhost:5432/kamano"
    )
    # When false, the app always uses the in-memory store (demo mode). When
    # true, it uses PostgreSQL if reachable, else falls back to in-memory.
    use_database: bool = False

    # --- Cryptographic signing (Ed25519) ---
    # In production these point at files mounted from a secrets manager / KMS.
    ed25519_private_key_path: str = "./keys/ed25519_private.pem"
    ed25519_public_key_path: str = "./keys/ed25519_public.pem"
    issuer_did: str = "did:web:kamano.co.za"

    # --- Auth ---
    secret_key: str = "dev-only-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # --- Document handling / POPIA ---
    max_upload_bytes: int = 20 * 1024 * 1024  # 20 MB
    allowed_mime_types: tuple[str, ...] = ("application/pdf",)
    raw_document_retention_days: int = 30  # raw PII purged at 30 days
    audit_record_retention_days: int = 365 * 5  # FICA: derived records kept 5y
    popia_audit_enabled: bool = True

    # --- Source-of-truth integrations (OFF until real API access exists) ---
    # When all are false, verifications can only reach assurance Tier B/C.
    enable_sars_integration: bool = False
    enable_cipc_integration: bool = False
    enable_home_affairs_integration: bool = False

    # --- CORS ---
    allowed_origins: tuple[str, ...] = ("http://localhost:3000",)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
