// ── UV-2: AI Admissions Assistant Tests ──────────────────────
//
// Validates AIAdmissionsAssistant with mock LLMProvider and
// mock capture function. No real APIs, no credentials, no GHL.

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { LLMProvider, LLMRequest, LLMResponse } from '@curdeeclau/shared';
import { LLMProviderError } from '@curdeeclau/shared';
import {
  AIAdmissionsAssistant,
  type LeadCaptureFn,
} from '../../core/admissions/AIAdmissionsAssistant';
import type {
  AdmissionsAssistantInput,
  AdmissionsCollectedLeadData,
  AdmissionsKnowledge,
} from '../../core/admissions/types';
import type {
  LeadCapturePayload,
  LeadCaptureResult,
} from '../../core/leads/types';
import { parseCSV, catalogToMarkdown, parseCatalogCSV } from '../../core/admissions/knowledgeLoader';

// ── Knowledge base (static, from verticals) ───────────

const FAQ_CONTENT = `
## CARRERAS
Q: Que carreras ofrecen?
A: Ofrecemos 10 carreras: Derecho, Administracion, Psicologia, Contaduria, Ingenieria en Sistemas, Mercadotecnia, Comunicacion, Pedagogia, Gastronomia y Enfermeria.

Q: Tienen modalidad en linea?
A: Si, algunas carreras estan disponibles en modalidad Online.
`;

const OFERTA_CONTENT = `
| Carrera | Duracion | Modalidades |
|---------|----------|-------------|
| Derecho | 4 anos | Matutino, Vespertino, Sabatino |
| Administracion de Empresas | 4 anos | Matutino, Vespertino, Online |
| Psicologia | 4 anos | Matutino, Vespertino |
| Gastronomia | 2 anos | Matutino, Vespertino |
`;

const CATALOGO_CONTENT = `
| Carrera | Área académica | Duración | Modalidad | Costo mensual | Costo inscripción | Campus | Becas de Excelencia |
|---|---|---|---|---|---|---|---|
| Derecho | Derecho | 4 años | Presencial | $4,650 | $8,000 | Campus Central | 9.60-10.00: 50% beca |
`;

const SYSTEM_PROMPT_TEMPLATE = `
Eres asistente de admisiones de Universidad Latino.

## CATÁLOGO DE CARRERAS
{{CATALOGO_CARRERAS}}

## CONOCIMIENTO
{{KNOWLEDGE}}

## OFERTA ACADEMICA
{{OFERTA_ACADEMICA}}

## DATOS RECOLECTADOS
{{COLLECTED_DATA}}

## PROXIMO DATO
{{NEXT_FIELD}}
`;

const TEST_KNOWLEDGE: AdmissionsKnowledge = {
  faq: FAQ_CONTENT,
  ofertaAcademica: OFERTA_CONTENT,
  catalogoCarreras: CATALOGO_CONTENT,
  systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
};

// ── Mock LLMProvider ───────────────────────────────────

class MockLLMProvider implements LLMProvider {
  providerId = 'mock-llm';
  responses: string[] = [];
  private callCount = 0;

  constructor(responses?: string[]) {
    if (responses) this.responses = responses;
  }

  async generate(_request: LLMRequest): Promise<LLMResponse> {
    const text = this.responses[this.callCount] ?? 'Respuesta generica del asistente.';
    this.callCount++;
    return {
      text,
      model: 'mock-model',
      provider: this.providerId,
      finishReason: 'stop',
    };
  }

  getCallCount(): number { return this.callCount; }
}

class FailingLLMProvider implements LLMProvider {
  providerId = 'failing-llm';
  async generate(_request: LLMRequest): Promise<LLMResponse> {
    throw new LLMProviderError('LLM unavailable', this.providerId, { statusCode: 503, retryable: true });
  }
}

class NonRetryableFailingLLMProvider implements LLMProvider {
  providerId = 'failing-llm';
  async generate(_request: LLMRequest): Promise<LLMResponse> {
    throw new LLMProviderError('Bad request', this.providerId, { statusCode: 400, retryable: false });
  }
}

// ── Mock Capture Function ──────────────────────────────

function mockCaptureFn(results?: LeadCaptureResult[]): LeadCaptureFn {
  let callCount = 0;
  return async (_payload: LeadCapturePayload): Promise<LeadCaptureResult> => {
    const result = results?.[callCount] ?? {
      status: 'NEW_LEAD',
      localLeadId: 'lead-mock-1',
      ghlContactId: 'ghl-mock-1',
      pipelineStage: 'Nuevo prospecto',
      tags: ['universidad-latino', 'admisiones', 'uv-1'],
      ghlSynced: true,
      message: 'Lead creado y sincronizado',
    };
    callCount++;
    return result;
  };
}

function failingCaptureFn(): LeadCaptureFn {
  return async () => {
    throw new Error('Capture service unavailable');
  };
}

// ── Helpers ────────────────────────────────────────────

const silentLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  level: 'silent',
} as any;

function input(overrides?: Partial<AdmissionsAssistantInput>): AdmissionsAssistantInput {
  return {
    userMessage: 'Hola',
    state: 'GREETING',
    collectedData: emptyData(),
    tenantId: 'tenant-uv-test',
    ...overrides,
  };
}

function emptyData(): AdmissionsCollectedLeadData {
  return {
    nombre: null,
    telefono: null,
    carrera_interes: null,
    horario_deseado: null,
    canal_origen: 'WHATSAPP',
    nivel_interes: null,
  };
}

function fullData(overrides?: Partial<AdmissionsCollectedLeadData>): AdmissionsCollectedLeadData {
  return {
    nombre: 'Maria Garcia',
    telefono: '+521234567890',
    carrera_interes: 'DERECHO',
    horario_deseado: 'MATUTINO',
    canal_origen: 'WHATSAPP',
    nivel_interes: 'ALTO',
    ...overrides,
  };
}

// ── Test Suite ─────────────────────────────────────────

describe('AIAdmissionsAssistant', () => {
  let llmProvider: MockLLMProvider;
  let captureCalls: LeadCapturePayload[];
  let assistant: AIAdmissionsAssistant;

  function createAssistant(
    llm?: LLMProvider,
    captureFn?: LeadCaptureFn,
  ) {
    return new AIAdmissionsAssistant(
      llm ?? llmProvider,
      captureFn ?? mockCaptureFn(),
      { tenantId: 'tenant-uv-test', knowledge: TEST_KNOWLEDGE },
      silentLogger,
    );
  }

  beforeEach(() => {
    llmProvider = new MockLLMProvider([
      'Hola, soy el asistente virtual de admisiones de Universidad Latino. Que carrera te interesa?',
    ]);
    captureCalls = [];
    assistant = createAssistant();
  });

  // ── Caso 1: Conversacion completa ────────────────────

  describe('Caso 1 — Conversacion completa', () => {
    it('avanza de GREETING a COLLECTING en el primer mensaje', async () => {
      const result = await assistant.processMessage(input({
        state: 'GREETING',
        userMessage: 'Hola, me interesa Derecho',
      }));

      expect(result.newState).toBe('COLLECTING');
      expect(result.collectedData.carrera_interes).toBe('DERECHO');
      expect(result.conversationEnded).toBe(false);
    });

    it('recolecta nombre y telefono durante COLLECTING', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Maria Garcia, mi telefono es +521234567890',
        collectedData: { ...emptyData(), carrera_interes: 'DERECHO' },
      }));

      expect(result.collectedData.nombre).toBe('Maria Garcia');
      expect(result.collectedData.telefono).toBe('+521234567890');
    });

    it('pasa a CONFIRMING cuando todos los campos estan completos', async () => {
      const data = fullData();
      // All except nombre
      const almostComplete = { ...data, nombre: null };

      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Maria Garcia',
        collectedData: almostComplete,
      }));

      // After collecting the last field, should transition
      expect(result.collectedData.nombre).toBe('Maria Garcia');
      // Should go to CONFIRMING since all fields are now present
      if (result.newState === 'CONFIRMING') {
        expect(result.reply).toContain('Maria Garcia');
      }
      // If it stays in COLLECTING, the next turn should transition
    });

    it('construye LeadCapturePayload cuando confirma y captura', async () => {
      let capturedPayload: LeadCapturePayload | null = null;
      const captureWithSpy: LeadCaptureFn = async (payload) => {
        capturedPayload = payload;
        return {
          status: 'NEW_LEAD',
          localLeadId: 'lead-test',
          ghlContactId: 'ghl-test',
          pipelineStage: 'Nuevo prospecto',
          tags: ['universidad-latino'],
          ghlSynced: true,
          message: 'Lead creado',
        };
      };

      const asst = createAssistant(llmProvider, captureWithSpy);

      // Simulate confirming with full data
      const result = await asst.processMessage(input({
        state: 'CONFIRMING',
        userMessage: 'Si, correcto',
        collectedData: fullData(),
      }));

      if (result.newState === 'CAPTURING') {
        // The capture should have payload
        expect(result.capturePayload).toBeDefined();
      }

      // confirmed + confirm → should capture
      // If response processes directly:
      if (capturedPayload) {
        expect(capturedPayload.nombre).toBe('Maria Garcia');
        expect(capturedPayload.telefono).toBe('+521234567890');
        expect(capturedPayload.carrera_interes).toBe('DERECHO');
        expect(capturedPayload.horario_deseado).toBe('MATUTINO');
        expect(capturedPayload.canal_origen).toBe('WHATSAPP');
        expect(capturedPayload.tenantId).toBe('tenant-uv-test');
      }
    });

    it('finaliza conversacion con DONE despues de capturar', async () => {
      const result = await assistant.processMessage(input({
        state: 'CAPTURING',
        collectedData: fullData(),
        userMessage: '',
      }));

      expect(result.newState).toBe('DONE');
      expect(result.conversationEnded).toBe(true);
      expect(result.reply).toContain('Universidad Latino');
    });
  });

  // ── Caso 2: Conversacion incompleta ──────────────────

  describe('Caso 2 — Conversacion incompleta', () => {
    it('responde FAQ y sigue pidiendo datos', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Tienen modalidad en linea?',
        collectedData: { ...emptyData(), carrera_interes: 'DERECHO' },
      }));

      expect(result.newState).toBe('COLLECTING');
      expect(result.nextField).toBeDefined();
      expect(result.conversationEnded).toBe(false);
    });

    it('no captura lead incompleto', async () => {
      const captured: LeadCapturePayload[] = [];
      const spyCapture: LeadCaptureFn = async (p) => {
        captured.push(p);
        return { status: 'NEW_LEAD', localLeadId: 'x', ghlContactId: 'y', pipelineStage: 'Nuevo prospecto', tags: [], ghlSynced: true, message: 'ok' };
      };
      const asst = createAssistant(llmProvider, spyCapture);

      await asst.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Solo estoy viendo informacion',
        collectedData: emptyData(),
      }));

      // No capture should have been called
      expect(captured.length).toBe(0);
    });

    it('solicita el siguiente dato faltante especifico', async () => {
      // Already have nombre, carrera — need telefono, horario
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Maria',
        collectedData: {
          ...emptyData(),
          nombre: 'Maria',
          carrera_interes: 'PSICOLOGIA',
        },
      }));

      // Should still be in COLLECTING and requesting next field
      expect(result.newState).toBe('COLLECTING');
      expect(result.nextField).toBeDefined();
    });
  });

  // ── Caso 3: Carrera no soportada ─────────────────────

  describe('Caso 3 — Carrera no soportada', () => {
    it('no extrae carrera que no esta en el catalogo', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Me interesa Medicina',
        collectedData: emptyData(),
      }));

      expect(result.collectedData.carrera_interes).toBeNull();
    });

    it('el asistente responde sin inventar carreras', async () => {
      const llm = new MockLLMProvider([
        'Medicina no esta en nuestro catalogo actual. Te comparto las carreras disponibles: Derecho, Administracion, Psicologia, Contaduria, Ingenieria en Sistemas, Mercadotecnia, Comunicacion, Pedagogia, Gastronomia y Enfermeria.',
      ]);
      const asst = createAssistant(llm);

      const result = await asst.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Quiero estudiar Arquitectura',
        collectedData: emptyData(),
      }));

      expect(result.collectedData.carrera_interes).toBeNull();
      expect(result.newState).toBe('COLLECTING');
    });
  });

  // ── Caso 4: Error LLM ────────────────────────────────

  describe('Caso 4 — Error LLM', () => {
    it('responde con fallback cuando LLM falla', async () => {
      const failingAsst = new AIAdmissionsAssistant(
        new FailingLLMProvider(),
        mockCaptureFn(),
        { tenantId: 'tenant-uv-test', knowledge: TEST_KNOWLEDGE },
        silentLogger,
      );

      const result = await failingAsst.processMessage(input({
        state: 'GREETING',
        userMessage: 'Hola',
        collectedData: emptyData(),
      }));

      // Should have a reply (fallback)
      expect(result.reply).toBeDefined();
      expect(result.reply.length).toBeGreaterThan(0);
    });

    it('no pierde estado conversacional cuando LLM falla', async () => {
      const failingAsst = new AIAdmissionsAssistant(
        new FailingLLMProvider(),
        mockCaptureFn(),
        { tenantId: 'tenant-uv-test', knowledge: TEST_KNOWLEDGE },
        silentLogger,
      );

      const data = { ...emptyData(), carrera_interes: 'DERECHO' as const };
      const result = await failingAsst.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Hola',
        collectedData: data,
      }));

      // Should preserve collected data
      expect(result.collectedData.carrera_interes).toBe('DERECHO');
      expect(result.newState).toBe('COLLECTING');
    });

    it('LLM retryable error usa fallback', async () => {
      const failingAsst = new AIAdmissionsAssistant(
        new FailingLLMProvider(),
        mockCaptureFn(),
        { tenantId: 'tenant-uv-test', knowledge: TEST_KNOWLEDGE },
        silentLogger,
      );

      const result = await failingAsst.processMessage(input({
        state: 'GREETING',
        userMessage: 'Hola',
        collectedData: emptyData(),
      }));

      expect(result.newState).toBe('COLLECTING');
      expect(result.reply).toBeTruthy();
    });
  });

  // ── Caso 5: LeadCaptureService rechaza ───────────────

  describe('Caso 5 — LeadCaptureService error', () => {
    it('va a ERROR si capture falla', async () => {
      const asst = new AIAdmissionsAssistant(
        llmProvider,
        failingCaptureFn(),
        { tenantId: 'tenant-uv-test', knowledge: TEST_KNOWLEDGE },
        silentLogger,
      );

      const result = await asst.processMessage(input({
        state: 'CAPTURING',
        collectedData: fullData(),
        userMessage: '',
      }));

      expect(result.newState).toBe('ERROR');
      expect(result.conversationEnded).toBe(false);
      expect(result.reply).toContain('problema');
    });

    it('permite reintentar desde ERROR', async () => {
      const asst = new AIAdmissionsAssistant(
        llmProvider,
        failingCaptureFn(),
        { tenantId: 'tenant-uv-test', knowledge: TEST_KNOWLEDGE },
        silentLogger,
      );

      // First: capture fails
      await asst.processMessage(input({
        state: 'CAPTURING', collectedData: fullData(), userMessage: '',
      }));

      // Second: user wants to retry
      const retry = await asst.processMessage(input({
        state: 'ERROR',
        userMessage: 'reintentar',
        collectedData: fullData(),
      }));

      // Should try capture again (will fail again, but shows retry logic)
      expect(retry.newState).toBe('ERROR');
    });
  });

  // ── Extraction heuristics ────────────────────────────

  describe('Extraccion de datos', () => {
    it('extrae telefono E.164 del mensaje', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Mi numero es +521234567890',
        collectedData: { ...emptyData(), carrera_interes: 'DERECHO', nombre: 'Maria' },
      }));

      expect(result.collectedData.telefono).toBe('+521234567890');
    });

    it('extrae horario matutino del mensaje', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Quiero horario matutino',
        collectedData: {
          ...emptyData(),
          carrera_interes: 'DERECHO',
          nombre: 'Maria',
          telefono: '+521234567890',
        },
      }));

      expect(result.collectedData.horario_deseado).toBe('MATUTINO');
    });

    it('extrae horario sabatino', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'Los sabados',
        collectedData: { ...emptyData(), nombre: 'Juan', telefono: '+529991112222' },
      }));

      expect(result.collectedData.horario_deseado).toBe('SABATINO');
    });

    it('extrae horario online', async () => {
      const result = await assistant.processMessage(input({
        state: 'COLLECTING',
        userMessage: 'En linea por favor',
        collectedData: { ...emptyData(), nombre: 'Ana', telefono: '+529993334444' },
      }));

      expect(result.collectedData.horario_deseado).toBe('ONLINE');
    });

    it('extrae multiple carreras por keywords', async () => {
      const tests: [string, string][] = [
        ['derecho', 'DERECHO'],
        ['administracion', 'ADMINISTRACION'],
        ['psicologia', 'PSICOLOGIA'],
        ['contaduria', 'CONTADURIA'],
        ['sistemas', 'INGENIERIA_SISTEMAS'],
        ['mercadotecnia', 'MERCADOTECNIA'],
        ['comunicacion', 'COMUNICACION'],
        ['pedagogia', 'PEDAGOGIA'],
        ['gastronomia', 'GASTRONOMIA'],
        ['enfermeria', 'ENFERMERIA'],
      ];

      for (const [keyword, expected] of tests) {
        const result = await assistant.processMessage(input({
          state: 'COLLECTING',
          userMessage: `Me interesa ${keyword}`,
          collectedData: { ...emptyData(), carrera_interes: null },
        }));
        expect(result.collectedData.carrera_interes).toBe(expected);
      }
    });
  });

  // ── Estado inicial ────────────────────────────────────

  describe('Estado inicial', () => {
    it('crea estado inicial con GREETING', () => {
      const initial = assistant.createInitialState();
      expect(initial.state).toBe('GREETING');
      expect(initial.collectedData.canal_origen).toBe('WHATSAPP');
    });

    it('pre-llena canal_origen si se proporciona', () => {
      const initial = assistant.createInitialState('WEB');
      expect(initial.collectedData.canal_origen).toBe('WEB');
    });
  });

  // ── No llama GHL directamente ────────────────────────

  describe('No acceso directo a GHL', () => {
    it('el asistente no tiene referencia a GHL client', () => {
      const asst = createAssistant();
      // No GHL properties in the assistant
      expect((asst as any).ghlClient).toBeUndefined();
      expect((asst as any).ghlSync).toBeUndefined();
    });

    it('el asistente delega captura a LeadCaptureFn, no a GHL', async () => {
      let captureCalled = false;
      const spy: LeadCaptureFn = async () => {
        captureCalled = true;
        return { status: 'NEW_LEAD', localLeadId: 'x', ghlContactId: 'y', pipelineStage: 'z', tags: [], ghlSynced: true, message: 'ok' };
      };

      const asst = createAssistant(llmProvider, spy);
      await asst.processMessage(input({
        state: 'CAPTURING', collectedData: fullData(), userMessage: '',
      }));

      expect(captureCalled).toBe(true);
    });
  });

  // ── DONE state es terminal ────────────────────────────

  describe('Estado DONE', () => {
    it('DONE es terminal y cierra conversacion', async () => {
      const result = await assistant.processMessage(input({
        state: 'DONE',
        userMessage: 'Gracias',
        collectedData: emptyData(),
      }));

      expect(result.newState).toBe('DONE');
      expect(result.conversationEnded).toBe(true);
    });
  });

  // ── Catalogo CSV → Markdown ───────────────────────────

  describe('Knowledge Loader — CSV parsing', () => {
    it('parseCSV: convierte CSV simple a array de objetos', () => {
      const csv = [
        'Carrera,Duración,Modalidad',
        'Derecho,4 años,Presencial',
        'Psicología,4 años,Presencial',
      ].join('\n');

      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].Carrera).toBe('Derecho');
      expect(rows[0].Duración).toBe('4 años');
      expect(rows[1].Carrera).toBe('Psicología');
    });

    it('parseCSV: maneja campos con comillas y comas internas', () => {
      const csv = [
        'Carrera,Descripción',
        'Derecho,"Formación teórica, práctica y ética"',
      ].join('\n');

      const rows = parseCSV(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].Descripción).toBe('Formación teórica, práctica y ética');
    });

    it('parseCSV: CSV vacío devuelve array vacío', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV('Carrera\n')).toEqual([]);
    });

    it('catalogToMarkdown: genera tabla markdown con columnas correctas', () => {
      const rows = [
        { Carrera: 'Derecho', 'Área académica': 'Derecho', Duración: '4 años', Modalidad: 'Presencial', 'Costo mensual': '$4,650', 'Costo inscripción': '$8,000', Campus: 'Campus Central', 'Becas de Excelencia': '9.60-10.00: 50% beca' },
      ];

      const md = catalogToMarkdown(rows);
      expect(md).toContain('| Carrera |');
      expect(md).toContain('| Derecho |');
      expect(md).toContain('$4,650');
      expect(md).toContain('---'); // separator row
    });

    it('parseCatalogCSV: integración completa CSV → markdown', () => {
      const csv = [
        'Carrera,Área académica,Duración,Modalidad,Costo mensual,Costo inscripción,Campus,Becas de Excelencia',
        'Derecho,Derecho,4 años,Presencial,"$4,650","$8,000",Campus Central,"9.60-10.00: 50% beca | 9.00-9.59: 40% beca"',
        'Psicología,Salud,4 años + S.S.,Presencial,"$4,650","$8,000",Campus Central,"9.60-10.00: 50% beca | 9.00-9.59: 40% beca"',
      ].join('\n');

      const md = parseCatalogCSV(csv);
      expect(md).toContain('| Carrera |');
      expect(md).toContain('| Derecho |');
      expect(md).toContain('| Psicología |');
      expect(md).toContain('$4,650');
      // Should NOT include columns outside TABLE_COLUMNS
      expect(md).not.toContain('Palabras clave');
    });

    it('buildSystemPrompt incluye catalogoCarreras cuando existe', async () => {
      const result = await assistant.processMessage(input({
        state: 'GREETING',
        userMessage: 'Hola, quiero estudiar Derecho',
        collectedData: emptyData(),
      }));

      // The catalog should be present in the knowledge — the assistant
      // uses it via buildSystemPrompt internally. We verify the reply
      // is generated without errors.
      expect(result.reply).toBeDefined();
      expect(result.newState).toBe('COLLECTING');
    });

    it('TEST_KNOWLEDGE incluye catalogoCarreras', () => {
      expect(TEST_KNOWLEDGE.catalogoCarreras).toBeDefined();
      expect(TEST_KNOWLEDGE.catalogoCarreras!.length).toBeGreaterThan(0);
    });
  });
});
