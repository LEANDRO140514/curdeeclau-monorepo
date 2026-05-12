import type { ISender } from "./sender.interface";

const LOG_PREFIX = "[WhatsAppSender]";

export class WhatsAppSender implements ISender {
  async sendMessage(to: string, message: string): Promise<void> {
    const apiKey = process.env.YCLOUD_API_KEY?.trim();
    if (!apiKey) {
      console.log(`${LOG_PREFIX} to: ${to} message: ${message}`);
      return;
    }

    const apiUrl = process.env.YCLOUD_API_URL?.trim();
    if (!apiUrl) {
      console.error(
        `${LOG_PREFIX} YCLOUD_API_URL is missing; skipping HTTP send to=${to}`,
      );
      return;
    }

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          to,
          type: "text",
          text: { body: message },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(
          `${LOG_PREFIX} HTTP ${String(res.status)} to=${to} response=${body}`,
        );
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`${LOG_PREFIX} request failed to=${to} error=${detail}`);
    }
  }
}
