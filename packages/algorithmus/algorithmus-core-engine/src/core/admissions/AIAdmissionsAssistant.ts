// ── UV-2: AI Admissions Assistant ────────────────────────────
//
// Conversational assistant for Universidad Latino admissions.
// Collects prospect data through natural conversation,
// answers FAQs using static knowledge, and delegates
// lead capture to LeadCaptureService (UV-1).
//
// Design:
//   - LLMProvider injected (testable with mocks)
//   - State machine drives conversation flow
//   - Static knowledge base (no RAG in v1)
//   - LeadCaptureService injected as capture function
//   - No direct GHL access — UV-1 handles that
//
// Autoridad: UV-0 (scope), UV-1 (LeadCaptureService contract)

import type { LLMProvider, LLMRequest } from '@curdeeclau/shared';
import { LLMProviderError } from '@curdeeclau/shared';
import type { Logger } from 'pino';
import pino from 'pino';
import type {
  AdmissionsAssistantInput,
  AdmissionsAssistantResponse,
  AdmissionsCollectedLeadData,
  AdmissionsKnowledge,
  AIAdmissionsAssistantConfig,
} from './types';
import {
  REQUIRED_FIELDS,
  FIELD_PROMPTS,
} from './types';
import type { Carrera, Horario, CanalOrigen, LeadCapturePayload, LeadCaptureResult } from '../leads/types';

// ── Capture function type (injectable) ────────────────────

export type LeadCaptureFn = (payload: LeadCapturePayload) => Promise<LeadCaptureResult>;

// ── Constants ─────────────────────────────────────────────

const VALID_CARRERAS: Carrera[] = [
  'DERECHO', 'ADMINISTRACION', 'PSICOLOGIA', 'CONTADURIA',
  'INGENIERIA_SISTEMAS', 'MERCADOTECNIA', 'COMUNICACION',
  'PEDAGOGIA', 'GASTRONOMIA', 'ENFERMERIA',
];

const VALID_HORARIOS: Horario[] = ['MATUTINO', 'VESPERTINO', 'SABATINO', 'ONLINE'];

const VALID_CANALES: CanalOrigen[] = ['WHATSAPP', 'WEB', 'TELEFONO', 'FACEBOOK', 'INSTAGRAM'];

const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const NAME_MIN_LENGTH = 2;

// ── Assistant ─────────────────────────────────────────────

export class AIAdmissionsAssistant {
  private readonly llmProvider: LLMProvider;
  private readonly captureFn: LeadCaptureFn;
  private readonly tenantId: string;
  private readonly defaultCanal: CanalOrigen;
  private readonly knowledge: AdmissionsKnowledge;
  private readonly logger: Logger;

  constructor(
    llmProvider: LLMProvider,
    captureFn: LeadCaptureFn,
    config: AIAdmissionsAssistantConfig,
    logger?: Logger,
  ) {
    this.llmProvider = llmProvider;
    this.captureFn = captureFn;
    this.tenantId = config.tenantId;
    this.defaultCanal = config.defaultCanal ?? 'WHATSAPP';
    this.knowledge = config.knowledge;
    this.logger = logger ?? pino({ level: 'info', name: 'admissions-assistant' });
  }

  /** Main entry point: process a user message and advance the conversation */
  async processMessage(input: AdmissionsAssistantInput): Promise<AdmissionsAssistantResponse> {
    const { userMessage, state, collectedData } = input;

    switch (state) {
      case 'GREETING':
        return this.handleGreeting(userMessage, collectedData);

      case 'COLLECTING':
        return this.handleCollecting(userMessage, collectedData);

      case 'CONFIRMING':
        return this.handleConfirming(userMessage, collectedData);

      case 'CAPTURING':
        return this.handleCapturing(collectedData);

      case 'DONE':
        return this.handleDone();

      case 'ERROR':
        return this.handleError(userMessage, collectedData);

      default:
        return this.handleGreeting(userMessage, collectedData);
    }
  }

  /** Create initial state for a new conversation */
  createInitialState(defaultCanal?: CanalOrigen): {
    state: 'GREETING';
    collectedData: AdmissionsCollectedLeadData;
  } {
    return {
      state: 'GREETING',
      collectedData: {
        nombre: null,
        telefono: null,
        carrera_interes: null,
        horario_deseado: null,
        canal_origen: defaultCanal ?? this.defaultCanal,
        nivel_interes: null,
      },
    };
  }

  // ── State handlers ──────────────────────────────────────

  private async handleGreeting(
    userMessage: string,
    collectedData: AdmissionsCollectedLeadData,
  ): Promise<AdmissionsAssistantResponse> {
    // Try to extract carrera from first message
    const carrera = this.extractCarrera(userMessage);
    const updatedData = { ...collectedData };
    if (carrera) {
      updatedData.carrera_interes = carrera;
    }

    const reply = await this.generateReply(
      this.buildSystemPrompt(updatedData, 'carrera_interes'),
      userMessage,
      `Responde como asistente de admisiones de Universidad Latino. El usuario dijo: "${userMessage}". ` +
      `Saluda, PRESENTATE como "asistente virtual de admisiones de Universidad Latino", y si el usuario menciono una carrera, ` +
      `muestra interes. Luego pregunta por el siguiente dato: ${this.getNextFieldPrompt(updatedData)}. ` +
      `Se breve y natural.`,
    );

    return {
      reply,
      newState: 'COLLECTING',
      collectedData: updatedData,
      nextField: this.getNextMissingField(updatedData),
      conversationEnded: false,
    };
  }

  private async handleCollecting(
    userMessage: string,
    collectedData: AdmissionsCollectedLeadData,
  ): Promise<AdmissionsAssistantResponse> {
    // Extract data from user message
    const updatedData = this.extractData(userMessage, collectedData);

    // Check if all required fields are collected
    const missing = this.getNextMissingField(updatedData);

    if (!missing) {
      // All fields collected — move to confirming
      return this.transitionToConfirming(updatedData);
    }

    // Still collecting — ask for next field
    const reply = await this.generateReply(
      this.buildSystemPrompt(updatedData, missing),
      userMessage,
      `El usuario dijo: "${userMessage}". ` +
      `Dato que falta: ${FIELD_PROMPTS[missing]}. ` +
      `Reglas IMPORTANTES:\n` +
      `1. Si el usuario pregunto algo del FAQ o catalogo, RESPONDE su pregunta primero. Esa es la prioridad.\n` +
      `2. SOLO si ya respondiste su duda, menciona brevemente el dato faltante al final.\n` +
      `3. Si el usuario NO quiere dar el dato (ej: telefono), NO insistas. Aceptalo y pregunta por otro dato o dile "sin problema, me ayudaria saber tu numero para que un asesor te contacte, pero si prefieres podemos continuar con otra cosa".\n` +
      `4. NUNCA pidas el mismo dato dos veces seguidas. Si ya lo pediste y el usuario no lo dio, pasa a otro dato o responde su pregunta.\n` +
      `5. Se natural y breve. Maximo 2-3 oraciones. No suenes a robot recolectando formularios.`,
    );

    return {
      reply,
      newState: 'COLLECTING',
      collectedData: updatedData,
      nextField: missing,
      conversationEnded: false,
    };
  }

  private async handleConfirming(
    userMessage: string,
    collectedData: AdmissionsCollectedLeadData,
  ): Promise<AdmissionsAssistantResponse> {
    const lower = userMessage.toLowerCase().trim();
    const isConfirmation = ['si', 'sip', 'si correcto', 'correcto', 'esta bien', 'ok', 'vale', 'bien', 'yes'].some(
      (w) => lower.includes(w) || lower === w,
    );
    const isCorrection = ['no', 'corregir', 'cambiar', 'equivoco', 'error', 'mal'].some(
      (w) => lower.includes(w),
    );

    if (isCorrection && !isConfirmation) {
      // User wants to correct — ask what to change
      const reply = 'Entendido. Que dato necesitas corregir?';
      return {
        reply,
        newState: 'COLLECTING',
        collectedData,
        nextField: undefined,
        conversationEnded: false,
      };
    }

    if (isConfirmation || !isCorrection) {
      // User confirmed — proceed to capture
      return this.handleCapturing(collectedData);
    }

    // Ambiguous — ask again
    const reply = await this.generateReply(
      this.buildSystemPrompt(collectedData, undefined),
      userMessage,
      `El usuario dijo: "${userMessage}". Estos son los datos recolectados: ${JSON.stringify(collectedData)}. ` +
      `Pregunta amablemente si los datos son correctos. Si el usuario confirma, dile que en un momento registraremos sus datos.`,
    );

    return {
      reply,
      newState: 'CONFIRMING',
      collectedData,
      conversationEnded: false,
    };
  }

  private async handleCapturing(
    collectedData: AdmissionsCollectedLeadData,
  ): Promise<AdmissionsAssistantResponse> {
    const payload = this.buildCapturePayload(collectedData);

    this.logger.info({
      step: 'capturing_lead',
      phone: payload.telefono.slice(0, 4) + '***' + payload.telefono.slice(-2),
      carrera: payload.carrera_interes,
    }, 'Calling LeadCaptureService');

    try {
      const result = await this.captureFn(payload);

      this.logger.info({
        step: 'lead_captured',
        status: result.status,
        localLeadId: result.localLeadId,
        ghlContactId: result.ghlContactId,
      }, 'Lead captured via LeadCaptureService');

      const reply = result.ghlSynced
        ? `Tus datos han sido registrados correctamente. Un asesor de admisiones se pondra en contacto contigo para dar seguimiento a tu interes en ${collectedData.carrera_interes}. Muchas gracias por confiar en Universidad Latino.`
        : `Tus datos han sido registrados. Un asesor de admisiones te contactara pronto. Gracias por tu interes en Universidad Latino.`;

      return {
        reply,
        newState: 'DONE',
        collectedData,
        capturePayload: payload,
        conversationEnded: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ step: 'capture_failed', error: message }, 'LeadCaptureService failed');

      return {
        reply: 'Estoy teniendo un problema para registrar tus datos en este momento. Por favor intenta de nuevo en unos minutos o contactanos directamente. Un asesor estara disponible para ayudarte.',
        newState: 'ERROR',
        collectedData,
        capturePayload: payload,
        conversationEnded: false,
      };
    }
  }

  private handleDone(): Promise<AdmissionsAssistantResponse> {
    return Promise.resolve({
      reply: 'Un asesor de admisiones se pondra en contacto contigo pronto. Muchas gracias por tu interes en Universidad Latino.',
      newState: 'DONE',
      collectedData: {
        nombre: null, telefono: null, carrera_interes: null,
        horario_deseado: null, canal_origen: null, nivel_interes: null,
      },
      conversationEnded: true,
    });
  }

  private async handleError(
    userMessage: string,
    collectedData: AdmissionsCollectedLeadData,
  ): Promise<AdmissionsAssistantResponse> {
    const lower = userMessage.toLowerCase().trim();
    const wantsRetry = ['si', 'reintentar', 'intentar', 'de nuevo', 'ok', 'otra vez'].some(
      (w) => lower.includes(w),
    );

    if (wantsRetry) {
      return this.handleCapturing(collectedData);
    }

    return {
      reply: 'Si deseas intentar registrar tus datos de nuevo, dime "reintentar". Un asesor de admisiones tambien esta disponible para ayudarte.',
      newState: 'ERROR',
      collectedData,
      conversationEnded: false,
    };
  }

  // ── State transition helpers ────────────────────────────

  private transitionToConfirming(
    collectedData: AdmissionsCollectedLeadData,
  ): AdmissionsAssistantResponse {
    const summary = [
      `Nombre: ${collectedData.nombre}`,
      `Telefono: ${collectedData.telefono}`,
      `Carrera: ${collectedData.carrera_interes}`,
      `Horario: ${collectedData.horario_deseado}`,
      `Contacto via: ${collectedData.canal_origen}`,
    ].join('\n');

    return {
      reply: `Dejame confirmar tus datos:\n\n${summary}\n\nEs correcta la informacion?`,
      newState: 'CONFIRMING',
      collectedData,
      conversationEnded: false,
    };
  }

  // ── Data extraction ─────────────────────────────────────

  private extractData(
    userMessage: string,
    current: AdmissionsCollectedLeadData,
  ): AdmissionsCollectedLeadData {
    const updated = { ...current };
    const msg = userMessage.trim();

    // Try to extract phone (E.164)
    const phoneMatch = msg.match(/(\+[1-9]\d{6,14})/);
    if (phoneMatch && !updated.telefono) {
      const phone = phoneMatch[1];
      if (E164_REGEX.test(phone)) {
        updated.telefono = phone;
      }
    }

    // Try to extract carrera
    const carrera = this.extractCarrera(msg);
    if (carrera && !updated.carrera_interes) {
      updated.carrera_interes = carrera;
    }

    // Try to extract horario
    if (!updated.horario_deseado) {
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('matutino') || lowerMsg.includes('manana')) updated.horario_deseado = 'MATUTINO';
      else if (lowerMsg.includes('vespertino') || lowerMsg.includes('tarde')) updated.horario_deseado = 'VESPERTINO';
      else if (lowerMsg.includes('sabatino') || lowerMsg.includes('sabado')) updated.horario_deseado = 'SABATINO';
      else if (lowerMsg.includes('online') || lowerMsg.includes('linea') || lowerMsg.includes('en linea')) updated.horario_deseado = 'ONLINE';
    }

    // Try to extract canal (only if not already set)
    if (!updated.canal_origen) {
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('whatsapp')) updated.canal_origen = 'WHATSAPP';
      else if (lowerMsg.includes('web') || lowerMsg.includes('pagina') || lowerMsg.includes('sitio')) updated.canal_origen = 'WEB';
      else if (lowerMsg.includes('telefono') || lowerMsg.includes('llamada')) updated.canal_origen = 'TELEFONO';
      else if (lowerMsg.includes('facebook') || lowerMsg.includes('fb')) updated.canal_origen = 'FACEBOOK';
      else if (lowerMsg.includes('instagram') || lowerMsg.includes('ig')) updated.canal_origen = 'INSTAGRAM';
    }

    // Try to extract nombre — heuristic based on position and content
    if (!updated.nombre) {
      // Strategy: extract the name-like part from the message
      // If the message starts with words that look like a name (before any phone/colon/keyword)
      const namePart = msg
        .replace(/\b(mi\s+)?(telefono|numero|cel|celular|phone|tel|whatsapp)\b[:\s]*.*$/i, '')
        .replace(/\+\d{7,15}/, '')
        .replace(/[,\-:;].*$/, '')
        .trim();

      if (namePart.length >= NAME_MIN_LENGTH && namePart.length < 60) {
        const words = namePart.split(/\s+/);
        // Looks like a name: 1-4 words, no question marks, not just numbers
        const looksLikeName = words.length >= 1 && words.length <= 4 &&
          !namePart.includes('?') &&
          !/^\d+$/.test(namePart) &&
          !/^(hola|buenas|buenos|que|quisiera|me\s+interesa|quiero|informacion|si|no|sip|nop|ok|vale|bien|correcto|gracias)/i.test(namePart);

        if (looksLikeName) {
          updated.nombre = namePart;
        }
      }
    }

    return updated;
  }

  private extractCarrera(msg: string): Carrera | null {
    const lower = msg.toLowerCase();

    const mapping: [string, Carrera][] = [
      ['derecho', 'DERECHO'],
      ['administracion', 'ADMINISTRACION'],
      ['administración', 'ADMINISTRACION'],
      ['psicologia', 'PSICOLOGIA'],
      ['psicología', 'PSICOLOGIA'],
      ['contaduria', 'CONTADURIA'],
      ['contaduría', 'CONTADURIA'],
      ['ingenieria en sistemas', 'INGENIERIA_SISTEMAS'],
      ['ingeniería en sistemas', 'INGENIERIA_SISTEMAS'],
      ['sistemas', 'INGENIERIA_SISTEMAS'],
      ['mercadotecnia', 'MERCADOTECNIA'],
      ['comunicacion', 'COMUNICACION'],
      ['comunicación', 'COMUNICACION'],
      ['pedagogia', 'PEDAGOGIA'],
      ['pedagogía', 'PEDAGOGIA'],
      ['gastronomia', 'GASTRONOMIA'],
      ['gastronomía', 'GASTRONOMIA'],
      ['enfermeria', 'ENFERMERIA'],
      ['enfermería', 'ENFERMERIA'],
    ];

    for (const [keyword, carrera] of mapping) {
      if (lower.includes(keyword)) return carrera;
    }
    return null;
  }

  // ── Helpers ─────────────────────────────────────────────

  private getNextMissingField(data: AdmissionsCollectedLeadData): keyof AdmissionsCollectedLeadData | undefined {
    for (const field of REQUIRED_FIELDS) {
      if (!data[field]) return field;
    }
    return undefined;
  }

  private getNextFieldPrompt(data: AdmissionsCollectedLeadData): string {
    const missing = this.getNextMissingField(data);
    if (!missing) return 'Ya tengo todos los datos necesarios.';
    return FIELD_PROMPTS[missing];
  }

  private buildCapturePayload(data: AdmissionsCollectedLeadData): LeadCapturePayload {
    return {
      nombre: data.nombre!,
      telefono: data.telefono!,
      carrera_interes: data.carrera_interes!,
      horario_deseado: data.horario_deseado ?? undefined,
      canal_origen: data.canal_origen ?? this.defaultCanal,
      nivel_interes: data.nivel_interes ?? undefined,
      tenantId: this.tenantId,
    };
  }

  private buildSystemPrompt(
    data: AdmissionsCollectedLeadData,
    nextField: keyof AdmissionsCollectedLeadData | undefined,
  ): string {
    const collected = REQUIRED_FIELDS
      .map((f) => `  - ${f}: ${data[f] ?? '(pendiente)'}`)
      .join('\n');

    const next = nextField
      ? `Siguiente dato a solicitar: ${FIELD_PROMPTS[nextField]}`
      : 'Todos los datos recolectados. Confirma con el usuario.';

    let prompt = this.knowledge.systemPromptTemplate
      .replace('{{KNOWLEDGE}}', this.knowledge.faq)
      .replace('{{OFERTA_ACADEMICA}}', this.knowledge.ofertaAcademica)
      .replace('{{CATALOGO_CARRERAS}}', this.knowledge.catalogoCarreras ?? '')
      .replace('{{COLLECTED_DATA}}', `\n${collected}\n`)
      .replace('{{NEXT_FIELD}}', next);

    return prompt;
  }

  private async generateReply(
    systemPrompt: string,
    userMessage: string,
    instruction: string,
  ): Promise<string> {
    try {
      const request: LLMRequest = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: instruction },
        ],
        temperature: 0.7,
      };

      const response = await this.llmProvider.generate(request);
      return response.text.trim();
    } catch (err: unknown) {
      // Fallback: return a simple canned response if LLM fails
      this.logger.error({ error: err instanceof Error ? err.message : String(err) }, 'LLM failed, using fallback reply');

      if (err instanceof LLMProviderError && (err as LLMProviderError).retryable) {
        // For retryable errors, we could retry — but for v1, use fallback
        this.logger.warn('LLM retryable error, using fallback');
      }

      return this.generateFallbackReply(userMessage);
    }
  }

  private generateFallbackReply(_userMessage: string): string {
    // Minimal fallback when LLM is unavailable
    return 'Gracias por tu interes en Universidad Latino. Continuemos con tu registro.';
  }
}
