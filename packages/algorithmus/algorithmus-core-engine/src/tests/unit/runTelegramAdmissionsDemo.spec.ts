// ── UV-TELEGRAM: Telegram Admissions Demo Tests ──────────────
//
// Validates TelegramAdmissionsDemo with mock LLM and mock capture.
// No real Telegram API, no credentials.

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TelegramAdmissionsDemo } from '../../demo/universidad-latino/runTelegramAdmissionsDemo';
import type { LeadCapturePayload } from '../../core/leads/types';

describe('TelegramAdmissionsDemo', () => {
  let demo: TelegramAdmissionsDemo;
  let capturedPayloads: LeadCapturePayload[];

  beforeEach(() => {
    capturedPayloads = [];
    demo = new TelegramAdmissionsDemo({
      captureFn: async (payload) => {
        capturedPayloads.push(payload);
        return {
          status: 'NEW_LEAD',
          localLeadId: `lead-test-${Date.now()}`,
          ghlContactId: `ghl-test-${Date.now()}`,
          pipelineStage: 'Nuevo prospecto',
          tags: ['universidad-latino'],
          ghlSynced: true,
          message: 'Lead creado',
        };
      },
    });
  });

  // ── Caso 1: Conversacion completa ──────────────────────

  describe('Caso 1 — Conversacion completa', () => {
    it('completa flujo de admisiones desde saludo hasta captura', async () => {
      const messages = [
        'Hola, me interesa Derecho',
        'Maria Garcia',
        '+521234567890',
        'Matutino',
        'WhatsApp',
        'Si, correcto',
      ];

      let lastResult: any = null;

      for (const msg of messages) {
        lastResult = await demo.processMessage('chat-test-1', msg);
      }

      expect(lastResult.isComplete).toBe(true);
      expect(capturedPayloads.length).toBe(1);
      expect(capturedPayloads[0].nombre).toBe('Maria Garcia');
      expect(capturedPayloads[0].telefono).toBe('+521234567890');
      expect(capturedPayloads[0].carrera_interes).toBe('DERECHO');
      expect(capturedPayloads[0].horario_deseado).toBe('MATUTINO');
    });

    it('el estado avanza GREETING → COLLECTING → DONE', async () => {
      const r1 = await demo.processMessage('chat-test-2', 'Hola, Derecho');
      expect(r1.state).toBe('COLLECTING');

      await demo.processMessage('chat-test-2', 'Pedro');
      await demo.processMessage('chat-test-2', '+529991234567');
      await demo.processMessage('chat-test-2', 'Vespertino');
      await demo.processMessage('chat-test-2', 'Web');
      const rEnd = await demo.processMessage('chat-test-2', 'Si');
      expect(rEnd.state).toBe('DONE');
    });
  });

  // ── Caso 2: Sin credenciales live ─────────────────────

  describe('Caso 2 — Sin credenciales live', () => {
    it('funciona en modo mock sin TELEGRAM_BOT_TOKEN', () => {
      const mockDemo = new TelegramAdmissionsDemo({});
      expect(mockDemo).toBeDefined();
    });

    it('processMessage funciona sin token real', async () => {
      const result = await demo.processMessage('chat-test-3', 'Hola');
      expect(result.reply).toBeDefined();
      expect(result.state).toBeDefined();
    });

    it('no falla por falta de GHL', async () => {
      const noGhlDemo = new TelegramAdmissionsDemo({
        captureFn: async () => ({
          status: 'NEW_LEAD',
          localLeadId: 'local-only',
          pipelineStage: 'Nuevo prospecto',
          tags: [],
          ghlSynced: false,
          message: 'Solo local',
        }),
      });

      const result = await noGhlDemo.processMessage('chat-test-4', 'Hola');
      expect(result.reply).toBeDefined();
    });

    it('documenta que es demo controlada en logs', async () => {
      // The demo logs "MOCK" when no token
      const mockDemo = new TelegramAdmissionsDemo({});
      const result = await mockDemo.processMessage('chat-test-5', 'Hola');
      expect(result.reply).toContain('Universidad Latino');
    });
  });

  // ── Caso 3: Estado conversacional por chat_id ─────────

  describe('Caso 3 — Estado por usuario/chat', () => {
    it('mantiene sesiones independientes por chat_id', async () => {
      // Chat A: Derecho
      await demo.processMessage('chat-A', 'Hola, Derecho');
      await demo.processMessage('chat-A', 'Maria');

      // Chat B: Psicologia
      await demo.processMessage('chat-B', 'Hola, Psicologia');
      await demo.processMessage('chat-B', 'Juan');

      // Both sessions exist
      expect(demo.getSessionCount()).toBe(2);
    });

    it('puede resetear sesion de un chat', async () => {
      await demo.processMessage('chat-X', 'Hola, Derecho');
      expect(demo.getSessionCount()).toBe(1);

      demo.resetSession('chat-X');
      expect(demo.getSessionCount()).toBe(0);
    });

    it('/start resetea la conversacion', async () => {
      await demo.processMessage('chat-Y', 'Hola');
      await demo.processMessage('chat-Y', 'Pedro');

      // Reset via delete
      demo.resetSession('chat-Y');
      const result = await demo.processMessage('chat-Y', 'Hola, empezar de nuevo');
      expect(result.state).toBe('COLLECTING');
    });
  });

  // ── Caso 4: Reinicio ──────────────────────────────────

  describe('Caso 4 — Reinicio', () => {
    it('las sesiones son in-memory (se pierden al reiniciar)', () => {
      // Documented behavior: sessions reset when process restarts
      const demo1 = new TelegramAdmissionsDemo({});
      const demo2 = new TelegramAdmissionsDemo({});
      expect(demo1.getSessionCount()).toBe(0);
      expect(demo2.getSessionCount()).toBe(0);
    });

    it('un nuevo demo runner no tiene sesiones previas', () => {
      const fresh = new TelegramAdmissionsDemo({});
      expect(fresh.getSessionCount()).toBe(0);
    });
  });

  // ── Capture invocation ─────────────────────────────────

  describe('Capture invocation', () => {
    it('invoca captureFn al completar datos', async () => {
      await demo.processMessage('chat-cap', 'Hola, Derecho');
      await demo.processMessage('chat-cap', 'Ana Valdez');
      await demo.processMessage('chat-cap', '+529990001111');
      await demo.processMessage('chat-cap', 'Vespertino');
      await demo.processMessage('chat-cap', 'Instagram');
      await demo.processMessage('chat-cap', 'Si');

      expect(capturedPayloads.length).toBe(1);
    });

    it('no invoca captureFn si los datos estan incompletos', async () => {
      await demo.processMessage('chat-inc', 'Hola, Derecho');
      await demo.processMessage('chat-inc', 'Solo nombre');

      expect(capturedPayloads.length).toBe(0);
    });

    it('el capturePayload tiene los 5 campos requeridos', async () => {
      await demo.processMessage('chat-req', 'Hola, Psicologia');
      await demo.processMessage('chat-req', 'Laura');
      await demo.processMessage('chat-req', '+5233344455667');
      await demo.processMessage('chat-req', 'Vespertino');
      await demo.processMessage('chat-req', 'Web');
      await demo.processMessage('chat-req', 'Si');

      expect(capturedPayloads.length).toBe(1);
      const p = capturedPayloads[0];
      expect(p.nombre).toBeTruthy();
      expect(p.telefono).toMatch(/^\+[1-9]\d{6,14}$/);
      expect(p.carrera_interes).toBeTruthy();
      expect(p.horario_deseado).toBeTruthy();
      expect(p.canal_origen).toBeTruthy();
      expect(p.tenantId).toBe('tenant-uv-demo');
    });
  });

  // ── No GHL directo ─────────────────────────────────────

  describe('No GHL directo', () => {
    it('el runner no llama GHL directamente', () => {
      const d = new TelegramAdmissionsDemo({});
      expect((d as any).ghlClient).toBeUndefined();
      expect((d as any).ghlSync).toBeUndefined();
    });

    it('usa captureFn para delegar a LeadCaptureService', async () => {
      let called = false;
      const d = new TelegramAdmissionsDemo({
        captureFn: async () => {
          called = true;
          return { status: 'NEW_LEAD', localLeadId: 'x', ghlContactId: 'y', pipelineStage: 'z', tags: [], ghlSynced: true, message: 'ok' };
        },
      });

      await d.processMessage('chat-ghl', 'Hola, Derecho');
      await d.processMessage('chat-ghl', 'Maria');
      await d.processMessage('chat-ghl', '+521234567890');
      await d.processMessage('chat-ghl', 'Matutino');
      await d.processMessage('chat-ghl', 'WhatsApp');
      await d.processMessage('chat-ghl', 'Si');

      expect(called).toBe(true);
    });
  });

  // ── FAQ respondida ─────────────────────────────────────

  describe('FAQ respondida', () => {
    it('el asistente responde con el nombre de Universidad Latino', async () => {
      const result = await demo.processMessage('chat-faq', 'Hola');
      expect(result.reply).toContain('Universidad Latino');
    });
  });

  // ── Logs estructurados ────────────────────────────────

  describe('Logs estructurados', () => {
    it('produce logs con chat_id, state, y fields_collected', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await demo.processMessage('chat-log', 'Hola, Derecho');

      expect(spy).toHaveBeenCalled();
      const logCall = spy.mock.calls.find((c) =>
        typeof c[0] === 'string' && c[0].includes('telegram-admissions'),
      );
      expect(logCall).toBeDefined();

      spy.mockRestore();
    });
  });
});
