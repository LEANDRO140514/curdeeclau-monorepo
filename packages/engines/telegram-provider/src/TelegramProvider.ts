// ── Telegram Provider ────────────────────────────────────
//
// Inbound Telegram message receiver.
// Polls Telegram API → LeadStore identification → GHL sync → canonical DomainEvents → dispatches to orchestrator.
//
// BV-1.03: GHL sync on every inbound message (idempotent via providerIds.ghl).
// BV-1.02: Lead identification integrated on every inbound message.
// BV-1.01: Structured logging + DomainEvent emission.
//
// UV-1: AdmissionFlow integration — conversational lead capture.
//   LEAD_PROVISIONAL (name) → LEAD_CAPTURADO (name + phone) → sync to PostgreSQL + GHL.
//
// Explicitly NOT in scope:
//   - CRM Engine calls (LeadStore is local)
//   - AI / memory / ownership / handoffs

import TelegramBot from 'node-telegram-bot-api';
import {
  createDomainEvent,
  type DomainEvent,
  type RuntimeEventDispatcher,
} from '@curdeeclau/shared';
import type { TelegramMessagePayload, TelegramProviderConfig } from './types';
import { LeadStore } from './LeadStore';
import { GHLSyncService } from './GHLSyncService';
import { AdmissionFlow } from './AdmissionFlow';
import type { LeadCaptureState } from './AdmissionFlow';

export class TelegramProvider {
  private bot: TelegramBot;
  private dispatcher: RuntimeEventDispatcher;
  private leadStore: LeadStore;
  private ghlSync: GHLSyncService | null;
  private admissionFlow: AdmissionFlow | null;
  private config: TelegramProviderConfig;

  constructor(
    config: TelegramProviderConfig,
    dispatcher: RuntimeEventDispatcher,
    leadStore: LeadStore,
    ghlSync: GHLSyncService | null = null,
    admissionFlow: AdmissionFlow | null = null,
  ) {
    this.config = config;
    this.dispatcher = dispatcher;
    this.leadStore = leadStore;
    this.ghlSync = ghlSync;
    this.admissionFlow = admissionFlow;
    this.bot = new TelegramBot(config.botToken, {
      polling: {
        interval: config.polling?.interval ?? 2000,
        params: config.polling?.offset !== undefined
          ? { offset: config.polling.offset }
          : undefined,
      },
    });
  }

  // ── Lifecycle ───────────────────────────────────────────

  start(): void {
    this.bot.on('message', (msg) => this.handleMessage(msg));
    this.bot.on('polling_error', (err) => this.handlePollingError(err));
    console.log('[telegram-provider] Polling started — waiting for messages');
  }

  async stop(): Promise<void> {
    await this.bot.stopPolling();
    console.log('[telegram-provider] Polling stopped');
  }

  getBot(): TelegramBot {
    return this.bot;
  }

  getLeadStore(): LeadStore {
    return this.leadStore;
  }

  // ── Message Handling ────────────────────────────────────

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    const channel = 'telegram';
    const channelUserId = String(msg.from?.id ?? 'unknown');
    const chatId = String(msg.chat.id);
    const messageText = msg.text ?? '[non-text message]';

    // Skip non-text messages (stickers, photos, etc.)
    if (!msg.text) return;

    // ── BV-1.02: Lead identification ──────────────────────
    const { lead, status } = await this.leadStore.identify(channel, channelUserId);

    // ── UV-1: Admission Flow ──────────────────────────────
    const timestamp = new Date(msg.date * 1000).toISOString();

    if (this.admissionFlow) {
      await this.handleAdmissionMessage(
        chatId,
        channelUserId,
        messageText,
        timestamp,
        lead,
        status,
        msg,
      );
      return;
    }

    // ── BV-1.03: GHL Sync (legacy path — no AdmissionFlow) ─
    let ghlSyncResult: string | null = null;
    let ghlContactId: string | null = null;

    if (this.ghlSync) {
      const result = await this.ghlSync.syncToGHL(lead);
      ghlSyncResult = result.action;
      if (result.action !== 'GHLSYNC_ERROR') {
        ghlContactId = result.ghlContactId;
      }
    }

    // ── Structured log ────────────────────────────────────
    console.log(
      JSON.stringify({
        source: 'telegram',
        telegram_user_id: channelUserId,
        chat_id: chatId,
        message_text: messageText,
        timestamp,
        lead_action: status,
        lead_id: lead.id,
        ghl_sync: ghlSyncResult,
        ghl_contact_id: ghlContactId,
      }),
    );

    // ── Canonical DomainEvent ─────────────────────────────
    const payload: TelegramMessagePayload = {
      source: 'telegram',
      telegram_user_id: channelUserId,
      chat_id: chatId,
      message_text: messageText,
      timestamp,
    };

    const event: DomainEvent = createDomainEvent('TelegramMessageReceived', {
      payload,
      metadata: {
        providerName: 'telegram',
        messageId: String(msg.message_id),
        chatType: msg.chat.type,
        leadId: lead.id,
        leadStatus: status,
        ghlSyncResult,
        ghlContactId,
      },
    });

    // ── Dispatch to orchestrator ──────────────────────────
    try {
      await this.dispatcher.dispatch(event);
    } catch (err) {
      console.error('[telegram-provider] Dispatch error:', err);
    }
  }

  // ── UV-1: Admission Message Handler ─────────────────────

  private async handleAdmissionMessage(
    chatId: string,
    channelUserId: string,
    messageText: string,
    timestamp: string,
    lead: { id: string; providerIds: Record<string, string> },
    _status: 'NEW_LEAD' | 'EXISTING_LEAD',
    msg: TelegramBot.Message,
  ): Promise<void> {
    const flow = this.admissionFlow!;
    const result = flow.handleMessage(chatId, messageText);

    // ── 1. Send reply to user immediately ─────────────────
    await this.bot.sendMessage(chatId, result.reply);

    // ── 2. Persist based on lead state transitions ────────
    let ghlSyncResult: string | null = null;
    let ghlContactId: string | null = null;
    const leadStateTag: LeadCaptureState | null = result.newLeadState;

    if (result.leadStateChanged) {
      const provider = this.leadStore.getProvider();
      const contactId = lead.id;

      if (result.newLeadState === 'LEAD_PROVISIONAL') {
        // Name captured → update lead + tag
        await provider.updateContact(contactId, {
          firstName: result.session.name,
          name: result.session.name,
        });
        await provider.addTag(contactId, 'LEAD_PROVISIONAL');
      }

      if (result.newLeadState === 'LEAD_CAPTURADO') {
        // Name + phone captured → update lead + tag + sync to GHL
        await provider.updateContact(contactId, {
          firstName: result.session.name,
          name: result.session.name,
          phone: result.session.phone,
        });
        await provider.addTag(contactId, 'LEAD_CAPTURADO');

        // Sync to GHL with real lead data
        if (this.ghlSync) {
          const updatedLead = await provider.getContact(contactId);
          if (updatedLead) {
            const syncResult = await this.ghlSync.syncToGHL(updatedLead);
            ghlSyncResult = syncResult.action;
            if (syncResult.action !== 'GHLSYNC_ERROR') {
              ghlContactId = syncResult.ghlContactId;
            }
          }
        }
      }
    }

    // ── 3. Persist optional fields (career, email, campus) ─
    if (!result.leadStateChanged && result.fieldCaptured && result.fieldCaptured !== 'name' && result.fieldCaptured !== 'phone') {
      const provider = this.leadStore.getProvider();
      const contactId = lead.id;

      switch (result.fieldCaptured) {
        case 'career': {
          await provider.addTag(contactId, `career:${result.session.career}`);
          break;
        }
        case 'email': {
          if (result.session.email) {
            await provider.updateContact(contactId, { email: result.session.email });
          }
          break;
        }
        case 'campus': {
          if (result.session.campus) {
            await provider.addTag(contactId, `campus:${result.session.campus}`);
          }
          break;
        }
      }
    }

    // ── 4. Structured log ─────────────────────────────────
    console.log(
      JSON.stringify({
        source: 'telegram',
        telegram_user_id: channelUserId,
        chat_id: chatId,
        message_text: messageText,
        timestamp,
        lead_id: lead.id,
        admission_step: result.session.step,
        lead_state: leadStateTag,
        field_captured: result.fieldCaptured,
        is_complete: result.isComplete,
        ghl_sync: ghlSyncResult,
        ghl_contact_id: ghlContactId,
      }),
    );

    // ── 5. Canonical DomainEvent ──────────────────────────
    const payload: TelegramMessagePayload = {
      source: 'telegram',
      telegram_user_id: channelUserId,
      chat_id: chatId,
      message_text: messageText,
      timestamp,
    };

    const event: DomainEvent = createDomainEvent('TelegramMessageReceived', {
      payload,
      metadata: {
        providerName: 'telegram',
        messageId: String(msg.message_id),
        chatType: msg.chat.type,
        leadId: lead.id,
        leadState: leadStateTag,
        admissionStep: result.session.step,
        fieldCaptured: result.fieldCaptured,
        isComplete: result.isComplete,
        ghlSyncResult,
        ghlContactId,
      },
    });

    // ── Dispatch to orchestrator ──────────────────────────
    try {
      await this.dispatcher.dispatch(event);
    } catch (err) {
      console.error('[telegram-provider] Dispatch error:', err);
    }
  }

  // ── Error Handling ──────────────────────────────────────

  private handlePollingError(err: Error): void {
    console.error('[telegram-provider] Polling error:', err.message);
  }
}
