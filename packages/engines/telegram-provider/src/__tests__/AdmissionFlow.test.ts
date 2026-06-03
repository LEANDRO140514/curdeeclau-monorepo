// ── AdmissionFlow Tests ───────────────────────────────────
//
// UV-1: Conversational admission flow unit tests.
// Covers: state transitions, field capture, optional fields, /start reset.

import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionFlow } from '../AdmissionFlow';
import type { AdmissionSession } from '../AdmissionFlow';

function sessionWithoutDynamicFields(s: AdmissionSession) {
  return {
    step: s.step,
    name: s.name,
    phone: s.phone,
    career: s.career,
    email: s.email,
    campus: s.campus,
  };
}

describe('AdmissionFlow — handleMessage', () => {
  let flow: AdmissionFlow;

  beforeEach(() => {
    flow = new AdmissionFlow();
  });

  // ── Full happy path ──────────────────────────────────────

  it('debe completar el flujo completo: nombre → teléfono → carrera → email → campus', () => {
    const chatId = 'chat_1';

    // Step 1: Name
    const r1 = flow.handleMessage(chatId, 'María García');
    expect(r1.reply).toContain('María García');
    expect(r1.reply).toContain('teléfono');
    expect(r1.leadStateChanged).toBe(true);
    expect(r1.newLeadState).toBe('LEAD_PROVISIONAL');
    expect(r1.fieldCaptured).toBe('name');
    expect(r1.isComplete).toBe(false);
    expect(r1.session).toMatchObject({ step: 'AWAITING_PHONE', name: 'María García' });

    // Step 2: Phone
    const r2 = flow.handleMessage(chatId, '5551234567');
    expect(r2.reply).toContain('carrera');
    expect(r2.leadStateChanged).toBe(true);
    expect(r2.newLeadState).toBe('LEAD_CAPTURADO');
    expect(r2.fieldCaptured).toBe('phone');
    expect(r2.isComplete).toBe(false);
    expect(r2.session).toMatchObject({ step: 'AWAITING_CAREER', phone: '5551234567' });

    // Step 3: Career
    const r3 = flow.handleMessage(chatId, 'Medicina');
    expect(r3.reply).toContain('correo electrónico');
    expect(r3.reply).toContain('saltar');
    expect(r3.leadStateChanged).toBe(false);
    expect(r3.fieldCaptured).toBe('career');
    expect(r3.session).toMatchObject({ step: 'AWAITING_EMAIL', career: 'Medicina' });

    // Step 4: Email
    const r4 = flow.handleMessage(chatId, 'maria@example.com');
    expect(r4.reply).toContain('campus');
    expect(r4.leadStateChanged).toBe(false);
    expect(r4.fieldCaptured).toBe('email');
    expect(r4.session).toMatchObject({ step: 'AWAITING_CAMPUS', email: 'maria@example.com' });

    // Step 5: Campus
    const r5 = flow.handleMessage(chatId, 'Norte');
    expect(r5.reply).toContain('Listo');
    expect(r5.reply).toContain('María García');
    expect(r5.reply).toContain('5551234567');
    expect(r5.reply).toContain('Medicina');
    expect(r5.reply).toContain('maria@example.com');
    expect(r5.reply).toContain('Norte');
    expect(r5.leadStateChanged).toBe(false);
    expect(r5.fieldCaptured).toBe('campus');
    expect(r5.isComplete).toBe(true);
    expect(r5.session).toMatchObject({ step: 'COMPLETED', campus: 'Norte' });

    // After complete — should say already registered
    const r6 = flow.handleMessage(chatId, 'hola');
    expect(r6.reply).toContain('Ya has completado tu registro');
    expect(r6.isComplete).toBe(true);
    expect(r6.leadStateChanged).toBe(false);
  });

  // ── Optional fields: skip with "saltar" ──────────────────

  it('debe permitir saltar email respondiendo "saltar"', () => {
    const chatId = 'chat_2';

    flow.handleMessage(chatId, 'Juan Pérez');
    flow.handleMessage(chatId, '5559999999');
    flow.handleMessage(chatId, 'Derecho');

    const r = flow.handleMessage(chatId, 'saltar');
    expect(r.fieldCaptured).toBe('email');
    expect(r.session.email).toBe('');
    expect(r.session.step).toBe('AWAITING_CAMPUS');
    expect(r.reply).toContain('campus');
  });

  it('debe permitir saltar campus respondiendo "saltar"', () => {
    const chatId = 'chat_3';

    flow.handleMessage(chatId, 'Ana López');
    flow.handleMessage(chatId, '5558888888');
    flow.handleMessage(chatId, 'Arquitectura');
    flow.handleMessage(chatId, 'saltar');

    const r = flow.handleMessage(chatId, 'saltar');
    expect(r.fieldCaptured).toBe('campus');
    expect(r.session.campus).toBe('');
    expect(r.session.step).toBe('COMPLETED');
    expect(r.isComplete).toBe(true);
    expect(r.reply).toContain('No proporcionado');
  });

  it('debe permitir saltar ambos campos opcionales', () => {
    const chatId = 'chat_4';

    flow.handleMessage(chatId, 'Pedro Ruiz');
    flow.handleMessage(chatId, '5557777777');
    flow.handleMessage(chatId, 'Ingeniería');
    flow.handleMessage(chatId, 'saltar'); // skip email
    const r = flow.handleMessage(chatId, 'saltar'); // skip campus

    expect(r.isComplete).toBe(true);
    expect(r.session.email).toBe('');
    expect(r.session.campus).toBe('');
    expect(r.reply).toContain('No proporcionado');
  });

  // ── /start reset ─────────────────────────────────────────

  it('/start debe reiniciar la conversación desde cualquier paso', () => {
    const chatId = 'chat_5';

    // Advance to middle of flow
    flow.handleMessage(chatId, 'Carlos');
    flow.handleMessage(chatId, '5556666666');
    expect(flow.getSession(chatId)?.step).toBe('AWAITING_CAREER');

    // Reset
    const r = flow.handleMessage(chatId, '/start');
    expect(r.reply).toContain('Bienvenido');
    expect(r.leadStateChanged).toBe(false);
    expect(r.isComplete).toBe(false);

    const session = flow.getSession(chatId)!;
    expect(session.step).toBe('AWAITING_NAME');
    expect(session.name).toBe('');
  });

  // ── Session isolation ────────────────────────────────────

  it('debe mantener sesiones independientes por chatId', () => {
    const r1 = flow.handleMessage('chat_a', 'Usuario A');
    const r2 = flow.handleMessage('chat_b', 'Usuario B');

    expect(r1.session.name).toBe('Usuario A');
    expect(r2.session.name).toBe('Usuario B');
    expect(r1.session.step).toBe('AWAITING_PHONE');
    expect(r2.session.step).toBe('AWAITING_PHONE');
  });

  // ── State transitions ────────────────────────────────────

  it('debe transicionar a LEAD_PROVISIONAL al capturar nombre', () => {
    const r = flow.handleMessage('chat_6', 'Laura Vega');
    expect(r.leadStateChanged).toBe(true);
    expect(r.newLeadState).toBe('LEAD_PROVISIONAL');
    expect(r.session.name).toBe('Laura Vega');
  });

  it('debe transicionar a LEAD_CAPTURADO al capturar teléfono', () => {
    const chatId = 'chat_7';

    flow.handleMessage(chatId, 'Diego Ramos');
    const r = flow.handleMessage(chatId, '5554443333');

    expect(r.leadStateChanged).toBe(true);
    expect(r.newLeadState).toBe('LEAD_CAPTURADO');
    expect(r.session.phone).toBe('5554443333');
  });

  it('no debe emitir leadStateChanged al capturar campos opcionales', () => {
    const chatId = 'chat_8';

    flow.handleMessage(chatId, 'Elena Torres');
    flow.handleMessage(chatId, '5553332222');

    const r = flow.handleMessage(chatId, 'Psicología');
    expect(r.leadStateChanged).toBe(false);
    expect(r.newLeadState).toBeNull();
    expect(r.fieldCaptured).toBe('career');
  });
});
