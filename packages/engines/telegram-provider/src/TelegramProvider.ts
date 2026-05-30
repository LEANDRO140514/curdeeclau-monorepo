// ── Telegram Provider ────────────────────────────────────
//
// Inbound Telegram message receiver.
// Polls Telegram API → LeadStore identification → GHL sync → canonical DomainEvents → dispatches to orchestrator.
//
// BV-1.03: GHL sync on every inbound message (idempotent via providerIds.ghl).
// BV-1.02: Lead identification integrated on every inbound message.
// BV-1.01: Structured logging + DomainEvent emission.
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

export class TelegramProvider {
  private bot: TelegramBot;
  private dispatcher: RuntimeEventDispatcher;
  private leadStore: LeadStore;
  private ghlSync: GHLSyncService | null;
  private config: TelegramProviderConfig;

  constructor(
    config: TelegramProviderConfig,
    dispatcher: RuntimeEventDispatcher,
    leadStore: LeadStore,
    ghlSync: GHLSyncService | null = null,
  ) {
    this.config = config;
    this.dispatcher = dispatcher;
    this.leadStore = leadStore;
    this.ghlSync = ghlSync;
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

    // ── BV-1.02: Lead identification ──────────────────────
    const { lead, status } = await this.leadStore.identify(channel, channelUserId);

    // ── BV-1.03: GHL Sync ─────────────────────────────────
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
        timestamp: new Date(msg.date * 1000).toISOString(),
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
      timestamp: new Date(msg.date * 1000).toISOString(),
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

  // ── Error Handling ──────────────────────────────────────

  private handlePollingError(err: Error): void {
    console.error('[telegram-provider] Polling error:', err.message);
  }
}
