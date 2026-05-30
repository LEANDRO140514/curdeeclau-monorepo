// ── Telegram Provider — Standalone Entry Point ────────────
//
// BV-1.03: Telegram → LeadStore → GHL Sync → Orchestrator.
//
// Credentials: create a .env file in this directory:
//   TELEGRAM_BOT_TOKEN=<token>
//   GHL_API_KEY=<ghl-api-key>
//   GHL_LOCATION_ID=<ghl-location-id>
//
// Or set them as environment variables directly.
//
// Usage:
//   npx tsx src/run.ts

import * as path from 'node:path';

// Load .env from package root (Node 22 built-in, no dependency needed)
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  process.loadEnvFile(envPath);
} catch {
  // .env file is optional — env vars can be set directly in shell
}
// GHL_API_KEY and GHL_LOCATION_ID are optional — if not set, GHL sync is skipped.
//
// Acceptance test:
//   Send "Hola" from Telegram →
//     First message:  NEW_LEAD → GHLSYNC_CREATED
//     Second message: EXISTING_LEAD → GHLSYNC_SKIPPED

import { WorkflowOrchestrator } from '@curdeeclau/workflow-orchestrator';
import type { DomainEvent } from '@curdeeclau/workflow-orchestrator';
import { GHLClient } from '@curdeeclau/ghl-engine';
import { TelegramProvider } from './TelegramProvider';
import { LeadStore } from './LeadStore';
import { GHLSyncService } from './GHLSyncService';

// ── Config ────────────────────────────────────────────────

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('FATAL: TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('Usage: TELEGRAM_BOT_TOKEN=<token> npx tsx src/run.ts');
  process.exit(1);
}

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// ── Orchestrator ──────────────────────────────────────────

const orchestrator = new WorkflowOrchestrator({ verticalId: 'dental' });

// ── Event subscription: log ALL events ────────────────────

const dispatcher = orchestrator.getDispatcher();

dispatcher.on('*', (event: DomainEvent) => {
  console.log(
    JSON.stringify({
      orchestrator_event: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        payload: event.payload,
        metadata: event.metadata,
      },
    }),
  );
});

// ── Lead Store ────────────────────────────────────────────

const leadStore = new LeadStore();

// ── GHL Sync (optional — skipped if no credentials) ───────

let ghlSync: GHLSyncService | null = null;

if (GHL_API_KEY && GHL_LOCATION_ID) {
  const ghlClient = new GHLClient({
    apiKey: GHL_API_KEY,
    locationId: GHL_LOCATION_ID,
  });
  ghlSync = new GHLSyncService(ghlClient, leadStore);
  console.log('[bv-1.03] GHL sync enabled');
} else {
  console.log('[bv-1.03] GHL sync disabled — set GHL_API_KEY and GHL_LOCATION_ID to enable');
}

// ── Telegram Provider ─────────────────────────────────────

const provider = new TelegramProvider({ botToken: BOT_TOKEN }, dispatcher, leadStore, ghlSync);
provider.start();

console.log('[bv-1.03] Telegram → LeadStore → GHL → Orchestrator bridge active');
console.log('[bv-1.03] Send "Hola" from Telegram to verify full pipeline');

// ── Graceful shutdown ─────────────────────────────────────

process.on('SIGINT', async () => {
  console.log('\n[bv-1.03] Shutting down...');
  await provider.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[bv-1.03] Shutting down...');
  await provider.stop();
  process.exit(0);
});
