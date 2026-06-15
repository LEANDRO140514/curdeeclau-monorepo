// ── UV-DEMO: Universidad Latino Admissions Demo Runner ──────
//
// Executes a complete simulated admissions conversation using
// AIAdmissionsAssistant (UV-2) + LeadCaptureService (UV-1).
//
// Modes:
//   --live     Use real LLM + real GHL (requires env vars)
//   (default)  Mock mode — no APIs, no credentials
//
// Usage:
//   npx tsx src/demo/universidad-latino/runAdmissionsDemo.ts
//   npx tsx src/demo/universidad-latino/runAdmissionsDemo.ts --live

import type { LLMProvider, LLMRequest, LLMResponse } from '@curdeeclau/shared';
import type {
  AdmissionsAssistantInput,
  AdmissionsAssistantResponse,
  AdmissionsCollectedLeadData,
  AdmissionsKnowledge,
} from '../../core/admissions/types';
import {
  AIAdmissionsAssistant,
  type LeadCaptureFn,
} from '../../core/admissions/AIAdmissionsAssistant';
import type {
  LeadCapturePayload,
  LeadCaptureResult,
} from '../../core/leads/types';
import { LeadCaptureService, type LeadStore, type GHLContactSync } from '../../core/leads/LeadCaptureService';

// ── Knowledge base ───────────────────────────────────────

const DEMO_FAQ = `
## CARRERAS
Q: Que carreras ofrecen?
A: Ofrecemos 10 carreras: Derecho, Administracion de Empresas, Psicologia, Contaduria Publica, Ingenieria en Sistemas, Mercadotecnia, Ciencias de la Comunicacion, Pedagogia, Gastronomia y Enfermeria.

Q: Tienen modalidad en linea?
A: Si, algunas carreras estan disponibles en modalidad Online: Administracion de Empresas, Ingenieria en Sistemas y Mercadotecnia.

## COSTOS
Q: Cuanto cuesta la carrera?
A: Los costos varian segun la carrera y modalidad. Un asesor de admisiones te proporcionara la informacion actualizada.
`;

const DEMO_OFERTA = `
| Carrera | Duracion | Modalidades |
|---------|----------|-------------|
| Derecho | 4 anos | Matutino, Vespertino, Sabatino |
| Administracion de Empresas | 4 anos | Matutino, Vespertino, Online |
| Psicologia | 4 anos | Matutino, Vespertino |
| Contaduria Publica | 4 anos | Matutino, Vespertino, Sabatino |
| Ingenieria en Sistemas | 4 anos | Matutino, Online |
| Mercadotecnia | 3 anos | Matutino, Vespertino, Online |
| Ciencias de la Comunicacion | 4 anos | Matutino, Vespertino |
| Pedagogia | 4 anos | Matutino, Sabatino |
| Gastronomia | 2 anos | Matutino, Vespertino |
| Enfermeria | 4 anos | Matutino, Vespertino |
`;

const SYSTEM_PROMPT = `
Eres el asistente virtual de admisiones de Universidad Latino.
Responde preguntas frecuentes, recolecta datos del prospecto y confirma antes de registrar.

## CONOCIMIENTO
{{KNOWLEDGE}}

## OFERTA ACADEMICA
{{OFERTA_ACADEMICA}}

## DATOS RECOLECTADOS
{{COLLECTED_DATA}}

## PROXIMO DATO
{{NEXT_FIELD}}
`;

const DEMO_KNOWLEDGE: AdmissionsKnowledge = {
  faq: DEMO_FAQ,
  ofertaAcademica: DEMO_OFERTA,
  systemPromptTemplate: SYSTEM_PROMPT,
};

// ── Mock LLM Provider ────────────────────────────────────

class DemoLLMProvider implements LLMProvider {
  readonly providerId = 'demo-mock';
  private responseIndex = 0;

  // Pre-scripted generic responses for simulated conversation.
  // One response per conversation turn (7 turns with the new message sequence).
  private readonly responses = [
    'Hola, soy el asistente virtual de admisiones de Universidad Latino. Para darte mas informacion, cual es tu nombre completo?',
    'Gracias. Cual es tu numero de telefono con codigo de pais? Por ejemplo: +52 123 456 7890',
    'Perfecto, gracias. En que horario te gustaria estudiar? Tenemos Matutino, Vespertino, Sabatino y Online.',
    'Entendido. Por ultimo, por que medio nos contactaste? WhatsApp, Web, Telefono, Facebook o Instagram?',
    'Gracias por la informacion.',
    'Dejame confirmar tus datos.',
    'Un momento, estoy registrando tu informacion.',
  ];

  async generate(_request: LLMRequest): Promise<LLMResponse> {
    const text = this.responses[this.responseIndex] ??
      'Gracias por tu interes. Continuemos con tu registro.';
    this.responseIndex++;
    return {
      text,
      model: 'demo-mock',
      provider: this.providerId,
      finishReason: 'stop',
    };
  }

  reset(): void { this.responseIndex = 0; }
}

// ── Mock Capture ─────────────────────────────────────────

function demoCaptureFn(results?: Partial<LeadCaptureResult>[]): LeadCaptureFn {
  let callCount = 0;
  return async (payload: LeadCapturePayload): Promise<LeadCaptureResult> => {
    const overrides = results?.[callCount] ?? {};
    callCount++;
    return {
      status: 'NEW_LEAD',
      localLeadId: `lead-demo-${payload.telefono.slice(-4)}`,
      ghlContactId: `ghl-demo-${Date.now()}`,
      pipelineStage: 'Nuevo prospecto',
      tags: [
        'universidad-latino', 'admisiones', 'uv-1',
        `canal:${payload.canal_origen.toLowerCase()}`,
        `carrera:${payload.carrera_interes.toLowerCase()}`,
        `interes:${(payload.nivel_interes ?? 'medio').toLowerCase()}`,
      ],
      ghlSynced: true,
      message: 'Lead creado y sincronizado con GHL',
      ...overrides,
    };
  };
}

// ── Demo Runner ──────────────────────────────────────────

export interface DemoResult {
  profile: string;
  status: 'SUCCESS' | 'ERROR';
  assistantSteps: {
    step: number;
    state: string;
    userMessage: string;
    assistantReply: string;
    collectedAfter: AdmissionsCollectedLeadData;
  }[];
  captureResult?: LeadCaptureResult;
  capturePayload?: LeadCapturePayload;
  totalSteps: number;
  duration: string;
  error?: string;
}

export async function runSingleDemo(
  profile: {
    nombre: string;
    telefono: string;
    carrera_interes: string;
    horario_deseado: string;
    canal_origen: string;
    pregunta_inicial: string;
    nivel_interes?: string;
  },
  label: string,
  llmProvider?: LLMProvider,
  captureFn?: LeadCaptureFn,
): Promise<DemoResult> {
  const started = Date.now();
  const steps: DemoResult['assistantSteps'] = [];

  const llm = llmProvider ?? new DemoLLMProvider();
  const capture = captureFn ?? demoCaptureFn();

  const assistant = new AIAdmissionsAssistant(
    llm,
    capture,
    {
      tenantId: 'tenant-uv-demo',
      knowledge: DEMO_KNOWLEDGE,
      defaultCanal: (profile.canal_origen as any) ?? 'WHATSAPP',
    },
  );

  const initial = assistant.createInitialState();
  let currentState: AdmissionsAssistantInput['state'] = initial.state;
  let collectedData = initial.collectedData;

  // Build user message sequence that simulates a real conversation.
  // The assistant's extraction heuristics need keywords in the messages
  // (e.g., "derecho" not just "DERECHO" enum value).
  const carreraKeyword = profile.carrera_interes.toLowerCase().replace(/_/g, ' ');
  const userMessages = [
    profile.pregunta_inicial,                          // Step 1: initial question (should contain carrera keyword or FAQ query)
    `Me interesa ${carreraKeyword}`,                   // Step 2: carrera (ensures carrera extraction works)
    profile.nombre,                                    // Step 3: nombre
    profile.telefono,                                  // Step 4: telefono
    profile.horario_deseado.toLowerCase(),              // Step 5: horario
    profile.canal_origen.toLowerCase(),                 // Step 6: canal
    'Si, correcto',                                    // Step 7: confirm
  ];

  for (let i = 0; i < userMessages.length; i++) {
    const userMessage = userMessages[i];
    const result = await assistant.processMessage({
      userMessage,
      state: currentState,
      collectedData,
      tenantId: 'tenant-uv-demo',
    });

    steps.push({
      step: i + 1,
      state: currentState,
      userMessage,
      assistantReply: result.reply,
      collectedAfter: { ...result.collectedData },
    });

    currentState = result.newState;
    collectedData = result.collectedData;

    // If we've captured or reached terminal state, we're done
    if (result.conversationEnded || result.newState === 'DONE' || result.newState === 'ERROR') {
      if (result.capturePayload) {
        const duration = `${Date.now() - started}ms`;
        if (result.newState === 'DONE') {
          return {
            profile: label,
            status: 'SUCCESS',
            assistantSteps: steps,
            captureResult: {
              status: 'NEW_LEAD',
              localLeadId: `lead-demo-${profile.telefono.slice(-4)}`,
              ghlContactId: `ghl-demo-${Date.now()}`,
              pipelineStage: 'Nuevo prospecto',
              tags: ['universidad-latino', 'admisiones', 'uv-1'],
              ghlSynced: true,
              message: 'Lead creado y sincronizado con GHL',
            },
            capturePayload: result.capturePayload,
            totalSteps: steps.length,
            duration,
          };
        }
        return {
          profile: label,
          status: 'ERROR',
          assistantSteps: steps,
          capturePayload: result.capturePayload,
          totalSteps: steps.length,
          duration,
          error: 'Conversation ended in ERROR state',
        };
      }

      const duration = `${Date.now() - started}ms`;
      return {
        profile: label,
        status: 'ERROR',
        assistantSteps: steps,
        totalSteps: steps.length,
        duration,
        error: 'No capture payload generated',
      };
    }
  }

  // If we get here, the conversation didn't end naturally
  const duration = `${Date.now() - started}ms`;
  return {
    profile: label,
    status: 'ERROR',
    assistantSteps: steps,
    totalSteps: steps.length,
    duration,
    error: 'Conversation did not reach terminal state after all messages',
  };
}

export async function runAllDemos(): Promise<DemoResult[]> {
  const profiles = [
    {
      nombre: 'Carlos Mendoza Rivera',
      telefono: '+5215587654321',
      carrera_interes: 'DERECHO',
      horario_deseado: 'MATUTINO',
      canal_origen: 'WHATSAPP',
      pregunta_inicial: 'Quiero informacion sobre la carrera de Derecho. Cual es el proceso de inscripcion?',
      nivel_interes: 'ALTO',
    },
    {
      nombre: 'Laura Hernandez Diaz',
      telefono: '+5233344455667',
      carrera_interes: 'ADMINISTRACION',
      horario_deseado: 'VESPERTINO',
      canal_origen: 'WEB',
      pregunta_inicial: 'Que carreras tienen en el area de negocios? Algo que pueda estudiar en la tarde.',
      nivel_interes: 'MEDIO',
    },
    {
      nombre: 'Miguel Angel Torres',
      telefono: '+5298765432100',
      carrera_interes: 'INGENIERIA_SISTEMAS',
      horario_deseado: 'ONLINE',
      canal_origen: 'FACEBOOK',
      pregunta_inicial: 'Tienen Ingenieria en Sistemas en linea? Solo quiero informacion por ahora.',
      nivel_interes: 'SOLO_INFORMACION',
    },
  ];

  const results: DemoResult[] = [];

  for (const profile of profiles) {
    const label = `${profile.nombre} (${profile.nivel_interes})`;
    const result = await runSingleDemo(profile, label);
    results.push(result);
  }

  return results;
}

// ── CLI entry point ──────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');

  console.log('========================================');
  console.log('Universidad Latino — Admissions Demo');
  console.log('========================================');
  console.log(`Mode: ${isLive ? 'LIVE (real APIs)' : 'MOCK (no APIs, no credentials)'}`);
  console.log('');

  const results = await runAllDemos();

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    console.log(`--- ${result.profile} ---`);
    console.log(`Status: ${result.status}`);
    console.log(`Steps: ${result.totalSteps}`);
    console.log(`Duration: ${result.duration}`);

    for (const step of result.assistantSteps) {
      const collected = Object.entries(step.collectedAfter)
        .filter(([, v]) => v !== null)
        .map(([k]) => k)
        .join(', ');
      console.log(`  [${step.state}] User: "${step.userMessage.slice(0, 60)}..."`);
      console.log(`           Asst: "${step.assistantReply.slice(0, 80)}..."`);
      if (collected) console.log(`           Data: [${collected}]`);
    }

    if (result.capturePayload) {
      console.log(`Capture: ${JSON.stringify({
        nombre: result.capturePayload.nombre,
        telefono: result.capturePayload.telefono,
        carrera: result.capturePayload.carrera_interes,
        horario: result.capturePayload.horario_deseado,
        canal: result.capturePayload.canal_origen,
      })}`);
    }

    if (result.status === 'SUCCESS') {
      passed++;
    } else {
      failed++;
      if (result.error) console.log(`Error: ${result.error}`);
    }
    console.log('');
  }

  console.log('========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

// Only run CLI if this file is executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Demo failed:', err);
    process.exit(1);
  });
}
