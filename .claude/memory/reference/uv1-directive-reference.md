# UV-1 DIRECTIVE — REFERENCIA HISTÓRICA

> Tipo: reference
> Versión: 1.0.0 — Absorción Phase D
> Creado: 2026-06-11
> Fuente legacy absorbida: `docs/governance/uv1-directive.md` (PRE-UV1, ratificado 2026-05-30, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, DNA de UV-1 (`institutional/dna/vertical-uv1.md`), DNA de AdmissionFlow (`institutional/dna/producto-admissionflow.md`)

---

## PROPÓSITO

Preservar el contexto histórico y las restricciones operativas que gobernaron la creación de UV-1 — el experimento de validación comercial que dio origen al vertical AdmissionFlow. Este documento es referencia histórica; no es autoridad activa.

---

## RESUMEN EJECUTIVO

UV-1 fue concebido como un **experimento de validación comercial** — no como un ejercicio de arquitectura, ingeniería o perfección técnica. Su único propósito era validar la adquisición y gestión de leads reales mediante un flujo conversacional en Telegram.

La directiva PRE-UV1 (ratificada 2026-05-30) estableció restricciones estrictas para mantener el foco:
- No abrir nuevos frentes de arquitectura
- No asumir necesidades no demostradas
- La carga de la prueba recae sobre quien propone complejidad adicional
- El éxito se mide en leads reales, no en elegancia técnica

---

## CONOCIMIENTO ABSORBIDO

### UV-1 es un experimento de validación comercial

No es un ejercicio de arquitectura. No es un ejercicio de ingeniería. No es un ejercicio de perfección técnica. Su propósito es validar adquisición y gestión de leads reales.

### Toda propuesta debe responder una pregunta

**¿Esto ayuda directamente a capturar, persistir, sincronizar o convertir leads reales?**

Si la respuesta es NO: **posponer.**

### El sistema actual es suficiente hasta demostrar lo contrario

No asumir que hacen falta: nuevos paquetes, nuevos motores, nuevos providers, nuevas capas, nuevos patrones, nuevos workflows. La carga de la prueba recae sobre quien propone complejidad adicional.

### Registrar fricción, no resolver con arquitectura

Cuando aparezca un problema:
- NO resolverlo inmediatamente con arquitectura
- Primero documentar: qué ocurrió, cuándo ocurrió, frecuencia, impacto
- Las futuras mejoras deben emerger de evidencia, no de anticipación

### Capturar conocimiento de cada conversación real

Cada conversación genera activos: preguntas frecuentes, objeciones, errores, datos faltantes, campos innecesarios, necesidades operativas. Esto alimenta posteriormente al Knowledge Manager.

### No abrir nuevos frentes

Hasta que UV-1 produzca evidencia real, no abrir: RT-5, Dynamic Workflows, Harness Engineering, rediseño de gobernanza, rediseño del monorepo.

### Definición de éxito

Éxito NO significa arquitectura elegante. Éxito significa:

```
10 conversaciones reales
       ↓
10 leads reales
       ↓
Persistencia correcta
       ↓
Sincronización correcta
       ↓
Pipeline funcionando
```

Si esto ocurre, UV-1 está validado. Todo lo demás es secundario.

---

## QUÉ CONSTRUYÓ UV-1

Bajo estas restricciones, UV-1 produjo:

- **AdmissionFlow FSM** (`packages/engines/telegram-provider/src/AdmissionFlow.ts`) — máquina de estados conversacional de 6 pasos
- **TelegramProvider** — polling de Telegram + integración con AdmissionFlow + LeadStore + GHL
- **LeadStore** — resolución de identidad multicanal
- **GHLSyncService** — sincronización idempotente con GoHighLevel CRM
- **PostgresCRMProvider** — persistencia PostgreSQL con fallback InMemory

El DNA completo está documentado en `institutional/dna/vertical-uv1.md` y `institutional/dna/producto-admissionflow.md`.

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Senado** | UV-1 fue un experimento de decisión informada (Principio VI). Midió antes de construir más |
| **La Academia** | UV-1 generó patrones observables: FSM conversacional, lead capture pipeline |
| **El Registro Civil** | AdmissionFlow tiene ADN registrado gracias a UV-1 |
| **La Aduana** | GHL y Telegram fueron naturalizados como providers durante UV-1 |

---

## RELACIÓN CON PATRONES ABSORBIDOS

| Patrón Pekín | UV-1 contribuyó |
|--------------|-----------------|
| `pattern/fsm-authority.md` | AdmissionFlow FSM como ejemplo canónico de FSM determinista |
| `pattern/ownership-propagation.md` | UV-1 no implementa ownership — opera en modo AI-only |
| `pattern/engine-governance.md` | AdmissionFlow es puro — no sabe de persistencia, canales ni CRMs |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] ¿Alcanzó UV-1 las 10 conversaciones reales → 10 leads → pipeline funcionando?
- [ ] ¿Qué fricción se documentó durante la operación real?
- [ ] ¿Qué conocimiento de conversaciones reales se capturó para el Knowledge Manager?
- [ ] ¿Se abrieron RT-5, Dynamic Workflows o Harness Engineering post-UV1 o siguen cerrados?

---

*Fin de UV-1 Directive Reference v1.0.0*
*Absorbido de docs/governance/uv1-directive.md (PRE-UV1) bajo autoridad de la Constitución de Pekín*
