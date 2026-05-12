-- Algorithmus Core Engine — esquema inicial (PostgreSQL / Supabase)
-- Requiere pgcrypto para gen_random_uuid()

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  email TEXT,
  tags JSONB DEFAULT '{}'::jsonb,
  fsm_state TEXT DEFAULT 'INIT',
  ai_confidence_score FLOAT DEFAULT 0,
  last_interaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_leads_tenant_phone UNIQUE (tenant_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads (tenant_id);

CREATE TABLE IF NOT EXISTS interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads (id),
  tenant_id UUID NOT NULL,
  trace_id TEXT NOT NULL,
  message TEXT,
  response TEXT,
  latency_ms INT,
  llm_provider TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_tenant_lead ON interaction_logs (tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_trace_id ON interaction_logs (trace_id);
