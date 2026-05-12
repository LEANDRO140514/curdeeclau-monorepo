/**
 * Contrato interno de mensaje saliente por canal (sin conocimiento de proveedores).
 */
export type OutboundChannelMessage = {
  channel: "whatsapp";
  to: string;
  text: string;
  tenantId: string;
  traceId: string;
};
