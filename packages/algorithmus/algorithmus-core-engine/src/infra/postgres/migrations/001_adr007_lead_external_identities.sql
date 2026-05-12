-- ADR-007 Step 1: multichannel identities table
CREATE TABLE IF NOT EXISTS lead_external_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  external_id TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lead_external_identities_tenant_channel_external
    UNIQUE (tenant_id, channel, external_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_external_identities_lead_id
  ON lead_external_identities (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_external_identities_tenant_lead
  ON lead_external_identities (tenant_id, lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_external_identities_tenant_channel
  ON lead_external_identities (tenant_id, channel);
