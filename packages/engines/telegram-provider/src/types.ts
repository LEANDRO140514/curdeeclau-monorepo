// ── Telegram Provider Types ─────────────────────────────
//
// Provider-specific contracts for Telegram integration.
// These extend canonical DomainEvent payloads — never replace them.
//
// Design principles:
//   - providerIds SEPARADOS de canonical ids (ownership runtime)
//   - Metadata extension point, not core type pollution
//   - All timestamps in ISO 8601 for human readability in logs

export interface TelegramMessagePayload {
  /** Source discriminator — always 'telegram' */
  source: 'telegram';

  /** Telegram user ID (from Telegram API — provider-scoped, not canonical) */
  telegram_user_id: string;

  /** Telegram chat ID (provider-scoped) */
  chat_id: string;

  /** Raw message text from user */
  message_text: string;

  /** ISO 8601 timestamp of when Telegram received the message */
  timestamp: string;
}

export interface TelegramProviderConfig {
  /** Telegram Bot Token from @BotFather */
  botToken: string;

  /** Polling options */
  polling?: {
    /** Polling interval in seconds (default: 2) */
    interval?: number;
    /** Telegram update offset (auto-managed if not set) */
    offset?: number;
  };
}
