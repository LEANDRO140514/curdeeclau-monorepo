# Universidad Latino — Admissions Demo

> Tipo: vertical/demo
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: UV-0, UV-1, UV-2

---

## Que es esta demo

Demostracion comercial integrada del flujo completo de admisiones de Universidad Latino:

Prospecto → AI Assistant → Lead Capture → GHL Sync → Pipeline

---

## Que demuestra

1. Asistente IA conversacional que recolecta datos de prospectos (UV-2).
2. Captura y sincronizacion automatica con GHL (UV-1).
3. Flujo completo sin intervencion humana hasta el seguimiento comercial.
4. Arquitectura provider-agnostic: LLM, CRM, GHL intercambiables sin reescribir logica.

---

## Que NO demuestra todavia

- Canal WhatsApp real (requiere YCloud + Meta Business approval).
- Multi-idioma.
- Dashboard de metricas.
- Portal de alumnos.
- Pagos o inscripcion completa.

---

## Como ejecutar la demo

### Modo controlado (recomendado — sin APIs reales)

```bash
cd packages/algorithmus/algorithmus-core-engine
npx tsx src/demo/universidad-latino/runAdmissionsDemo.ts
```

**No requiere:**
- API keys de LLM
- API keys de GHL
- Postgres
- Redis

**Usa:**
- MockLLMProvider (respuestas predefinidas)
- Mock LeadCaptureFn (simula persistencia y GHL)

### Modo real (requiere autorizacion explicita)

```bash
# Requiere variables de entorno:
#   LLM_PROVIDER_API_KEY
#   GHL_API_KEY
#   GHL_LOCATION_ID
#   DATABASE_URL (Postgres)

npx tsx src/demo/universidad-latino/runAdmissionsDemo.ts --live
```

---

## Perfiles de prueba

Ver `sample-leads.json` para 3 perfiles de prospectos.

---

## Checklist de validacion

Ver `demo-validation-checklist.md`.

---

## Script comercial

Ver `demo-script.md` para el guion de presentacion.

---

*Fin del README v1.0.0*
