-- ADR-007 Step 2: backfill whatsapp identities from legacy phone_number
INSERT INTO lead_external_identities (
  tenant_id,
  lead_id,
  channel,
  external_id,
  is_primary,
  metadata,
  created_at,
  updated_at
)
SELECT
  l.tenant_id,
  l.id,
  'whatsapp' AS channel,
  l.phone_number AS external_id,
  true AS is_primary,
  '{}'::jsonb AS metadata,
  NOW() AS created_at,
  NOW() AS updated_at
FROM leads l
WHERE l.phone_number IS NOT NULL
  AND btrim(l.phone_number) <> ''
ON CONFLICT (tenant_id, channel, external_id) DO NOTHING;
