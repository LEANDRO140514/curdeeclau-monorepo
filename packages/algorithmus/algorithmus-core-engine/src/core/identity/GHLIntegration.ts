/**
 * Contrato para recuperar datos de contacto desde GoHighLevel cuando el lead
 * no existe aún en Postgres (Supabase). PRD §3.1.
 */
export type GHLLeadProfile = {
  firstName: string | null;
  email: string | null;
};

export interface GHLIntegration {
  fetchLeadByPhone(
    phone: string,
    tenantId: string,
    traceId: string,
  ): Promise<GHLLeadProfile>;
}

/** Implementación temporal hasta conectar API/workflows reales de GHL. */
export class GHLIntegrationStub implements GHLIntegration {
  async fetchLeadByPhone(): Promise<GHLLeadProfile> {
    return { firstName: null, email: null };
  }
}
