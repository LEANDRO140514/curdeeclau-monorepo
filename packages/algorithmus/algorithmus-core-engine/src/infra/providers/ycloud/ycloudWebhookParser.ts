import type { InboundChannelMessage } from "../../../core/channels/channelMessage";

const MAX_NODES = 80;
const MAX_DEPTH = 10;

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function pickNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== "string") {
    return undefined;
  }
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Recolecta objetos anidados acotados (tolerante a BSUID / envoltorios).
 */
function collectRecordNodes(root: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();

  function walk(node: unknown, depth: number): void {
    if (out.length >= MAX_NODES || depth > MAX_DEPTH) {
      return;
    }
    if (node === null || node === undefined) {
      return;
    }
    if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
      return;
    }
    if (seen.has(node)) {
      return;
    }
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, depth + 1);
      }
      return;
    }

    if (isRecord(node)) {
      out.push(node);
      for (const v of Object.values(node)) {
        walk(v, depth + 1);
      }
    }
  }

  walk(root, 0);
  return out;
}

const DISALLOWED_TYPES = new Set([
  "image",
  "audio",
  "video",
  "document",
  "sticker",
  "reaction",
  "interactive",
  "button",
  "location",
  "contacts",
  "template",
  "order",
  "system",
]);

function extractInboundText(obj: Record<string, unknown>): string | undefined {
  const tRaw = pickNonEmptyString(obj.type);
  if (tRaw) {
    const t = tRaw.toLowerCase();
    if (DISALLOWED_TYPES.has(t)) {
      return undefined;
    }
  }

  const textVal = obj.text;
  if (isRecord(textVal)) {
    const body = pickNonEmptyString(textVal.body);
    if (body) {
      return body;
    }
  }

  const body = pickNonEmptyString(obj.body);
  if (body && !obj.text) {
    return body;
  }

  return undefined;
}

function extractExternalUserId(obj: Record<string, unknown>): string | undefined {
  return (
    pickNonEmptyString(obj.from) ??
    pickNonEmptyString(obj.wa_id) ??
    pickNonEmptyString((obj as { customer?: { phone?: unknown } }).customer?.phone)
  );
}

function extractMessageId(obj: Record<string, unknown>): string | undefined {
  return (
    pickNonEmptyString(obj.id) ??
    pickNonEmptyString(obj.messageId) ??
    pickNonEmptyString((obj as { wamid?: unknown }).wamid) ??
    pickNonEmptyString((obj as { message_id?: unknown }).message_id)
  );
}

function looksLikeOutboundEcho(obj: Record<string, unknown>): boolean {
  const d = pickNonEmptyString(obj.direction)?.toLowerCase();
  if (d === "outbound" || d === "out") {
    return true;
  }
  if (obj.fromMe === true) {
    return true;
  }
  const ev = pickNonEmptyString(obj.event)?.toLowerCase() ?? "";
  if (ev.includes("outbound") && !ev.includes("inbound")) {
    return true;
  }
  return false;
}

function looksLikeStatusUpdate(obj: Record<string, unknown>): boolean {
  const ev = pickNonEmptyString(obj.event)?.toLowerCase() ?? "";
  if (
    ev.includes("status") ||
    ev.includes("delivered") ||
    ev.includes("read") ||
    ev.includes("sent") ||
    ev.includes("failed")
  ) {
    return true;
  }
  if (obj.status !== undefined && obj.text === undefined && obj.type === undefined) {
    return pickNonEmptyString(obj.status) !== undefined;
  }
  return false;
}

export type ParseInboundContext = {
  tenantId: string;
  receivedAt: string;
};

/**
 * Convierte payload YCloud (variantes) en mensaje interno de texto entrante, o null si no aplica.
 * No lanza por campos ausentes.
 */
export function parseYCloudInboundWhatsAppText(
  raw: unknown,
  ctx: ParseInboundContext,
): InboundChannelMessage | null {
  if (ctx.tenantId.trim() === "") {
    return null;
  }

  const nodes = collectRecordNodes(raw);

  for (const node of nodes) {
    if (looksLikeOutboundEcho(node) || looksLikeStatusUpdate(node)) {
      continue;
    }

    const text = extractInboundText(node);
    if (!text || !text.trim()) {
      continue;
    }
    const textNormalized = text.trim();

    const externalUserId = extractExternalUserId(node);
    const messageId = extractMessageId(node);

    if (!externalUserId || !messageId) {
      continue;
    }

    return {
      channel: "whatsapp",
      tenantId: ctx.tenantId.trim(),
      externalUserId,
      messageId,
      text: textNormalized,
      raw,
      receivedAt: ctx.receivedAt,
    };
  }

  return null;
}
