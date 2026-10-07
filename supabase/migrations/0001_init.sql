-- Kamano core schema
-- Works on any PostgreSQL 14+ (target: AWS RDS PostgreSQL in af-south-1).
-- NOTE: Supabase Cloud has no African region; do not host production data on
-- Supabase Cloud if the POPIA sovereignty claim must hold. See
-- doc/Kamano_Strategic_Technical_Review.md section 3.1.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Encrypted document references. The raw file itself lives in S3 (af-south-1)
-- with a 30-day lifecycle purge; only the reference + hash are stored here.
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key     VARCHAR(512) NOT NULL,
    file_sha256     VARCHAR(64)  NOT NULL,
    file_type       VARCHAR(50)  NOT NULL,
    file_size_bytes INTEGER      NOT NULL,
    auto_purge_at   TIMESTAMPTZ  NOT NULL,  -- raw PII purged at 30 days
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Verification results. Retained for the FICA audit window (5 years) because
-- these are DERIVED records (hashes, scores, findings), not raw PII.
CREATE TABLE IF NOT EXISTS verifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_sha256   VARCHAR(64)  NOT NULL,
    decision          VARCHAR(20)  NOT NULL CHECK (decision IN ('VERIFIED','REVIEW','REJECTED')),
    assurance_tier    CHAR(1)      NOT NULL CHECK (assurance_tier IN ('A','B','C')),
    risk_score        NUMERIC(5,2) NOT NULL,
    source_checked    BOOLEAN      NOT NULL DEFAULT false,
    forensic_findings JSONB        NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verifications_created ON verifications (created_at);
CREATE INDEX IF NOT EXISTS idx_verifications_tier ON verifications (assurance_tier);

-- W3C Verifiable Credentials. The signed JSON-LD lives in `credential`.
CREATE TABLE IF NOT EXISTS trust_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_type VARCHAR(64)  NOT NULL,
    subject_name    VARCHAR(256) NOT NULL,
    assurance_tier  CHAR(1)      NOT NULL CHECK (assurance_tier IN ('A','B','C')),
    credential      JSONB        NOT NULL,  -- full signed VC (@context, proof, ...)
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','REVOKED','EXPIRED')),
    valid_from      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    valid_until     TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Holder consent for a verifier to read a credential (review 2.3).
CREATE TABLE IF NOT EXISTS consents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID REFERENCES trust_credentials(id),
    holder_id     UUID NOT NULL,
    verifier_id   UUID NOT NULL,
    scope         TEXT[] NOT NULL DEFAULT '{}',
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ
);

-- Append-only POPIA audit trail. UPDATE/DELETE blocked via trigger.
CREATE TABLE IF NOT EXISTS audit_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type    VARCHAR(50) NOT NULL,
    user_id       UUID,
    resource_type VARCHAR(50),
    resource_id   VARCHAR(128),
    metadata      JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_log;
CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
