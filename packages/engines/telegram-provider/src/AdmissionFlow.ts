// ── Admission Flow ──────────────────────────────────────────
//
// In-memory conversational state machine for admissions capture.
// UV-1 scope: Nombre → Teléfono → Carrera → Email? → Campus?
//
// Lead states:
//   LEAD_PROVISIONAL → name captured
//   LEAD_CAPTURADO   → name + phone captured → triggers PostgreSQL + GHL sync
//
// Explicitly NOT in scope:
//   - Persistence (handled by caller via CRMProvider)
//   - GHL sync (handled by caller via GHLSyncService)
//   - Multi-tenant session isolation
//   - Session expiry / cleanup

export type AdmissionStep =
  | 'AWAITING_NAME'
  | 'AWAITING_PHONE'
  | 'AWAITING_CAREER'
  | 'AWAITING_EMAIL'
  | 'AWAITING_CAMPUS'
  | 'COMPLETED';

export type LeadCaptureState = 'LEAD_PROVISIONAL' | 'LEAD_CAPTURADO';

export interface AdmissionSession {
  step: AdmissionStep;
  name: string;
  phone: string;
  career: string;
  email: string;
  campus: string;
}

export interface AdmissionResult {
  /** Text reply to send back to the user */
  reply: string;
  /** Whether the lead state just changed (triggers persistence) */
  leadStateChanged: boolean;
  /** The new lead state if leadStateChanged is true */
  newLeadState: LeadCaptureState | null;
  /** Which field was just captured (for targeted persistence) */
  fieldCaptured: keyof AdmissionSession | null;
  /** Whether the flow is complete */
  isComplete: boolean;
  /** Current session data */
  session: AdmissionSession;
}

const WELCOME_MESSAGE =
  '¡Bienvenido al proceso de admisión! ¿Cuál es tu nombre completo?';

const COMPLETED_MESSAGE =
  'Ya has completado tu registro. Un asesor se pondrá en contacto contigo pronto.';

export class AdmissionFlow {
  private sessions = new Map<string, AdmissionSession>();

  // ── Public API ─────────────────────────────────────────────

  /**
   * Process an incoming message and advance the conversation state.
   *
   * Returns a structured result with the reply and state change info.
   * The caller is responsible for persistence and sync.
   */
  handleMessage(chatId: string, text: string): AdmissionResult {
    const input = text.trim();

    // /start resets the conversation
    if (input === '/start') {
      this.sessions.delete(chatId);
      const fresh = this.ensureSession(chatId);
      return {
        reply: WELCOME_MESSAGE,
        leadStateChanged: false,
        newLeadState: null,
        fieldCaptured: null,
        isComplete: false,
        session: fresh,
      };
    }

    const session = this.ensureSession(chatId);

    switch (session.step) {
      case 'AWAITING_NAME':
        return this.handleName(chatId, session, input);

      case 'AWAITING_PHONE':
        return this.handlePhone(chatId, session, input);

      case 'AWAITING_CAREER':
        return this.handleCareer(chatId, session, input);

      case 'AWAITING_EMAIL':
        return this.handleEmail(chatId, session, input);

      case 'AWAITING_CAMPUS':
        return this.handleCampus(chatId, session, input);

      case 'COMPLETED':
        return this.buildResult(
          chatId,
          COMPLETED_MESSAGE,
          false,
          null,
          null,
          true,
        );

      default:
        return this.buildResult(
          chatId,
          WELCOME_MESSAGE,
          false,
          null,
          null,
          false,
        );
    }
  }

  /**
   * Get current session state for a chat (undefined if not started).
   */
  getSession(chatId: string): AdmissionSession | undefined {
    return this.sessions.get(chatId);
  }

  /**
   * Reset a chat's conversation (e.g., for testing or admin override).
   */
  reset(chatId: string): void {
    this.sessions.delete(chatId);
  }

  // ── Step Handlers ──────────────────────────────────────────

  private handleName(
    chatId: string,
    session: AdmissionSession,
    input: string,
  ): AdmissionResult {
    session.name = input;
    session.step = 'AWAITING_PHONE';
    this.sessions.set(chatId, session);

    return this.buildResult(
      chatId,
      `Gracias, ${input}. ¿Cuál es tu número de teléfono?`,
      true,
      'LEAD_PROVISIONAL',
      'name',
      false,
    );
  }

  private handlePhone(
    chatId: string,
    session: AdmissionSession,
    input: string,
  ): AdmissionResult {
    session.phone = input;
    session.step = 'AWAITING_CAREER';
    this.sessions.set(chatId, session);

    return this.buildResult(
      chatId,
      '¿Qué carrera te interesa estudiar?',
      true,
      'LEAD_CAPTURADO',
      'phone',
      false,
    );
  }

  private handleCareer(
    chatId: string,
    session: AdmissionSession,
    input: string,
  ): AdmissionResult {
    session.career = input;
    session.step = 'AWAITING_EMAIL';
    this.sessions.set(chatId, session);

    return this.buildResult(
      chatId,
      '¿Cuál es tu correo electrónico? (Opcional — responde "saltar" para omitir)',
      false,
      null,
      'career',
      false,
    );
  }

  private handleEmail(
    chatId: string,
    session: AdmissionSession,
    input: string,
  ): AdmissionResult {
    if (input.toLowerCase() !== 'saltar') {
      session.email = input;
    }
    session.step = 'AWAITING_CAMPUS';
    this.sessions.set(chatId, session);

    return this.buildResult(
      chatId,
      '¿En qué campus te gustaría estudiar? (Opcional — responde "saltar" para omitir)',
      false,
      null,
      'email',
      false,
    );
  }

  private handleCampus(
    chatId: string,
    session: AdmissionSession,
    input: string,
  ): AdmissionResult {
    if (input.toLowerCase() !== 'saltar') {
      session.campus = input;
    }
    session.step = 'COMPLETED';
    this.sessions.set(chatId, session);

    const summary = [
      `¡Listo! Tus datos han sido registrados:\n`,
      `• Nombre: ${session.name}`,
      `• Teléfono: ${session.phone}`,
      `• Carrera: ${session.career}`,
      `• Email: ${session.email || 'No proporcionado'}`,
      `• Campus: ${session.campus || 'No proporcionado'}`,
      `\nUn asesor se pondrá en contacto contigo pronto.`,
    ].join('\n');

    return this.buildResult(chatId, summary, false, null, 'campus', true);
  }

  // ── Helpers ────────────────────────────────────────────────

  private ensureSession(chatId: string): AdmissionSession {
    const existing = this.sessions.get(chatId);
    if (existing) return existing;

    const session: AdmissionSession = {
      step: 'AWAITING_NAME',
      name: '',
      phone: '',
      career: '',
      email: '',
      campus: '',
    };
    this.sessions.set(chatId, session);
    return session;
  }

  private buildResult(
    chatId: string,
    reply: string,
    leadStateChanged: boolean,
    newLeadState: LeadCaptureState | null,
    fieldCaptured: keyof AdmissionSession | null,
    isComplete: boolean,
  ): AdmissionResult {
    return {
      reply,
      leadStateChanged,
      newLeadState,
      fieldCaptured,
      isComplete,
      session: this.sessions.get(chatId)!,
    };
  }
}
