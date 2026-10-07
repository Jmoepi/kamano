-- Row-Level Security scaffold for multi-tenant isolation (POPIA access control).
-- Assumes a `tenant_id` is added per table and set via a session GUC
-- (e.g. SET app.tenant_id = '...') by the application connection.
--
-- This migration is a STARTING POINT: add tenant_id columns before enabling in
-- production. Left commented so the dev schema runs without a tenant model yet.

-- ALTER TABLE verifications ADD COLUMN tenant_id UUID;
-- ALTER TABLE trust_credentials ADD COLUMN tenant_id UUID;

-- ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_verifications ON verifications
--     USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ALTER TABLE trust_credentials ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_credentials ON trust_credentials
--     USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
