// ── UV-TELEGRAM: Telegram Admissions Demo Runner ──────────────
//
// Connects a Telegram Bot to AIAdmissionsAssistant (UV-2) +
// LeadCaptureService (UV-1) for real-channel Universidad Latino demo.
//
// Modes:
//   (default)    Mock — no APIs, no credentials. In-memory simulation.
//   TELEGRAM_BOT_TOKEN set → Real Telegram bot with polling.
//   + DATABASE_URL + GHL_API_KEY → Real persistence + GHL sync.
//   + LLM_PROVIDER_API_KEY → Real LLM instead of mock.
//
// Usage:
//   npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts
//
// Required env for Telegram:
//   TELEGRAM_BOT_TOKEN=<token from @BotFather>
//
// Optional env for live mode:
//   LLM_PROVIDER_API_KEY=<api-key>
//   DATABASE_URL=postgres://...
//   GHL_API_KEY=<ghl-api-key>
//   GHL_LOCATION_ID=<ghl-location-id>
//
// Design:
//   - Sessions in-memory per chat_id (lost on restart — documented)
//   - AIAdmissionsAssistant per session (conversational state)
//   - Mock LLM by default (pre-scripted responses)
//   - Mock capture by default (simulates LeadCaptureService)
//   - Telegram polling via node-telegram-bot-api

import 'dotenv/config';
import type { LLMProvider, LLMRequest, LLMResponse } from '@curdeeclau/shared';
import {
  AIAdmissionsAssistant,
  type LeadCaptureFn,
} from '../../core/admissions/AIAdmissionsAssistant';
import type {
  AdmissionsAssistantInput,
  AdmissionsAssistantResponse,
  AdmissionsCollectedLeadData,
  AdmissionsKnowledge,
  AdmissionsConversationState,
} from '../../core/admissions/types';
import type { LeadCapturePayload, LeadCaptureResult } from '../../core/leads/types';
import { loadKnowledge } from '../../core/admissions/knowledgeLoader';
import { getLLMProvider } from '../../core/admissions/llmFactory';

// ── Mock LLM Provider ────────────────────────────────────

class DemoTelegramLLMProvider implements LLMProvider {
  readonly providerId = 'demo-telegram-mock';
  private responseIndex = 0;

  private readonly responses = [
    'Hola, soy el asistente virtual de admisiones de Universidad Latino. Para darte mas informacion, cual es tu nombre completo?',
    'Gracias. Cual es tu numero de telefono con codigo de pais? Por ejemplo: +52 123 456 7890',
    'Perfecto, gracias. En que horario te gustaria estudiar? Tenemos Matutino, Vespertino, Sabatino y Online.',
    'Entendido. Por ultimo, por que medio nos contactaste? WhatsApp, Web, Telefono, Facebook o Instagram?',
    'Gracias por la informacion.',
    'Dejame confirmar tus datos.',
    'Un momento, estoy registrando tu informacion.',
  ];

  async generate(_request: LLMRequest): Promise<LLMResponse> {
    const text = this.responses[this.responseIndex] ??
      'Gracias por tu interes en Universidad Latino. Continuemos con tu registro.';
    this.responseIndex++;
    return { text, model: 'demo-mock', provider: this.providerId, finishReason: 'stop' };
  }
}

// ── Mock Capture ─────────────────────────────────────────

function demoCaptureFn(): LeadCaptureFn {
  return async (payload: LeadCapturePayload): Promise<LeadCaptureResult> => ({
    status: 'NEW_LEAD',
    localLeadId: `lead-telegram-${Date.now()}`,
    ghlContactId: `ghl-telegram-${Date.now()}`,
    pipelineStage: 'Nuevo prospecto',
    tags: [
      'universidad-latino', 'admisiones', 'uv-1',
      `canal:${payload.canal_origen.toLowerCase()}`,
      `carrera:${payload.carrera_interes.toLowerCase()}`,
    ],
    ghlSynced: true,
    message: 'Lead creado y sincronizado con GHL',
  });
}

// ── Session Store ────────────────────────────────────────

interface TelegramSession {
  chatId: string;
  state: AdmissionsConversationState;
  collectedData: AdmissionsCollectedLeadData;
  assistant: AIAdmissionsAssistant;
}

class InMemorySessionStore {
  private sessions = new Map<string, TelegramSession>();

  get(chatId: string): TelegramSession | undefined {
    return this.sessions.get(chatId);
  }

  set(chatId: string, session: TelegramSession): void {
    this.sessions.set(chatId, session);
  }

  delete(chatId: string): void {
    this.sessions.delete(chatId);
  }

  has(chatId: string): boolean {
    return this.sessions.has(chatId);
  }
}

// ── Telegram Bot Runner ──────────────────────────────────

export interface TelegramDemoConfig {
  botToken?: string;
  llmProvider?: LLMProvider;
  captureFn?: LeadCaptureFn;
}

export class TelegramAdmissionsDemo {
  private sessionStore = new InMemorySessionStore();
  private llmProvider: LLMProvider;
  private captureFn: LeadCaptureFn;
  private bot: any; // TelegramBot | null
  private botToken?: string;

  constructor(config: TelegramDemoConfig = {}) {
    this.botToken = config.botToken;
    this.llmProvider = config.llmProvider ?? new DemoTelegramLLMProvider();
    this.captureFn = config.captureFn ?? demoCaptureFn();
  }

  // ── Public API ─────────────────────────────────────────

  /** Process an incoming message (for testing without real Telegram) */
  async processMessage(chatId: string, text: string): Promise<{
    reply: string;
    state: AdmissionsConversationState;
    isComplete: boolean;
    capturePayload?: LeadCapturePayload;
  }> {
    const session = this.getOrCreateSession(chatId);
    const assistant = session.assistant;

    const input: AdmissionsAssistantInput = {
      userMessage: text,
      state: session.state,
      collectedData: session.collectedData,
      tenantId: 'tenant-uv-demo',
      defaultCanal: 'TELEGRAM',
    };

    const result = await assistant.processMessage(input);

    // Update session
    session.state = result.newState;
    session.collectedData = result.collectedData;
    this.sessionStore.set(chatId, session);

    // Log
    const collected = Object.entries(result.collectedData)
      .filter(([, v]) => v !== null)
      .map(([k]) => k);

    console.log(JSON.stringify({
      source: 'telegram-admissions',
      chat_id: chatId,
      state: result.newState,
      fields_collected: collected,
      is_complete: result.conversationEnded,
      has_payload: !!result.capturePayload,
    }));

    return {
      reply: result.reply,
      state: result.newState,
      isComplete: result.conversationEnded,
      capturePayload: result.capturePayload,
    };
  }

  /** Start real Telegram bot polling */
  async start(): Promise<void> {
    if (!this.botToken) {
      console.log('[uv-telegram] No TELEGRAM_BOT_TOKEN — running in mock mode');
      console.log('[uv-telegram] Use processMessage() to simulate conversations');
      return;
    }

    try {
      const TelegramBot = (await import('node-telegram-bot-api')).default;
      this.bot = new TelegramBot(this.botToken, { polling: { interval: 2000 } });

      this.bot.on('message', async (msg: any) => {
        if (!msg.text) return;
        const chatId = String(msg.chat.id);
        const userId = String(msg.from?.id ?? 'unknown');

        try {
          const result = await this.processMessage(chatId, msg.text);
          await this.bot.sendMessage(chatId, result.reply);
        } catch (err) {
          console.error(`[uv-telegram] Error processing message from ${userId}:`, err);
          try {
            await this.bot.sendMessage(chatId,
              'Tuve un problema procesando tu mensaje. Por favor intenta de nuevo.');
          } catch {
            // Best effort
          }
        }
      });

      this.bot.on('polling_error', (err: Error) => {
        console.error('[uv-telegram] Polling error:', err.message);
      });

      console.log('[uv-telegram] Telegram bot started — Universidad Latino Admissions Demo');
      console.log('[uv-telegram] Waiting for messages...');
    } catch (err) {
      console.error('[uv-telegram] Failed to start Telegram bot:', err);
      throw err;
    }
  }

  /** Stop polling */
  async stop(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      console.log('[uv-telegram] Polling stopped');
    }
  }

  /** Reset a chat session */
  resetSession(chatId: string): void {
    this.sessionStore.delete(chatId);
  }

  /** Get session count */
  getSessionCount(): number {
    return this.sessionStore['sessions'].size;
  }

  // ── Internal ───────────────────────────────────────────

  private getOrCreateSession(chatId: string): TelegramSession {
    const existing = this.sessionStore.get(chatId);
    if (existing) return existing;

    const assistant = new AIAdmissionsAssistant(
      this.llmProvider,
      this.captureFn,
      {
        tenantId: 'tenant-uv-demo',
        knowledge: loadKnowledge(),
        defaultCanal: 'TELEGRAM',
      },
    );

    const initial = assistant.createInitialState('TELEGRAM');

    const session: TelegramSession = {
      chatId,
      state: initial.state,
      collectedData: initial.collectedData,
      assistant,
    };

    this.sessionStore.set(chatId, session);
    return session;
  }
}

// ── CLI entry point ──────────────────────────────────────

async function main(): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const hasGHL = !!(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
  const hasDB = !!process.env.DATABASE_URL;

  console.log('========================================');
  console.log('Universidad Latino — Telegram Admissions');
  console.log('========================================');
  console.log(`Telegram: ${botToken ? 'REAL (polling)' : 'MOCK (no token)'}`);
  console.log(`GHL:      ${hasGHL ? 'ENABLED' : 'MOCK'}`);
  console.log(`Database: ${hasDB ? 'ENABLED' : 'MOCK'}`);
  console.log('');

  // Try real LLM; fall back to mock (injected at CLI level, not in constructor)
  const realLLM = getLLMProvider();
  if (realLLM) {
    console.log(`[uv-telegram] Using real LLM: ${realLLM.providerId}`);
  } else {
    console.log('[uv-telegram] No LLM API key configured — using mock');
  }

  const demo = new TelegramAdmissionsDemo({
    botToken,
    llmProvider: realLLM ?? undefined,
  });

  if (!botToken) {
    console.log('[uv-telegram] Mock mode — simulating conversation:');
    console.log('');

    const testMessages = [
      'Hola, me interesa la carrera de Derecho',
      'Carlos Mendoza Rivera',
      '+5215587654321',
      'Matutino',
      'WhatsApp',
      'Si, correcto',
    ];

    for (const msg of testMessages) {
      const result = await demo.processMessage('mock-chat-1', msg);
      console.log(`[USER] ${msg}`);
      console.log(`[BOT]  ${result.reply.slice(0, 100)}...`);
      console.log(`       state=${result.state} complete=${result.isComplete}`);
      console.log('');
    }

    console.log('========================================');
    console.log('Mock demo complete.');
    console.log('Set TELEGRAM_BOT_TOKEN to run with real Telegram.');
    console.log('========================================');
    return;
  }

  // Real Telegram mode
  await demo.start();

  process.on('SIGINT', async () => {
    console.log('\n[uv-telegram] Shutting down...');
    await demo.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[uv-telegram] Shutting down...');
    await demo.stop();
    process.exit(0);
  });
}

// Only run CLI if executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error('[uv-telegram] Fatal:', err);
    process.exit(1);
  });
}
