/**
 * Contrato interno de mensaje entrante por canal (sin conocimiento de proveedores).
 */
export type InboundChannelMessage = {
  channel: "whatsapp";
  tenantId: string;
  externalUserId: string;
  messageId: string;
  text: string;
  raw?: unknown;
  receivedAt: string;
};
