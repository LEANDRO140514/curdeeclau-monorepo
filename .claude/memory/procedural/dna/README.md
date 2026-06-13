# PEKIN DNA TEMPLATES

> Tipo: procedural/dna
> Version: 1.0.0
> Creado: 2026-06-13
> Autoridad: Governance Level 2, Secciones 4 y 5. Registro Civil (Institucion 9).

---

## 1. QUE ES EL DNA EN PEKIN

El DNA (ADN) es la declaracion de identidad de un activo tecnologico dentro de CURDEECLAU.

Asi como el ADN biologico contiene la informacion necesaria para construir un organismo, el DNA de Pekin contiene la informacion necesaria para entender, gobernar y —si fuera necesario— regenerar un componente de la civilizacion.

El DNA no es el codigo. El DNA es la declaracion de:
- Que es el componente
- Por que existe
- Que principios lo gobiernan
- Que patrones implementa
- Que dependencias tiene
- Que riesgos conlleva
- Como se regenera si se pierde

---

## 2. POR QUE EL DNA ES MAS IMPORTANTE QUE LA IMPLEMENTACION

La implementacion cambia. El codigo se refactoriza. Las dependencias se actualizan. Los providers se reemplazan.

El DNA permanece.

Si todo el codigo de `calendar-engine` desapareciera manana, su DNA deberia contener suficiente informacion para que un agente nuevo pueda reconstruirlo — no identico, pero si coherente con los principios que lo originaron.

Esta es la **Regenerabilidad** (Principio IX). El DNA es su condicion necesaria.

---

## 3. RELACION CON EL SISTEMA PEKIN

| Componente Pekin | Rol del DNA |
|------------------|-------------|
| **Acuerdo Fundacional** | El DNA deriva su autoridad del Acuerdo |
| **Governance Level 2** | Define tipos de activos y estados institucionales que el DNA declara |
| **Naturalization Framework** | El DNA de providers se complementa con la ficha de naturalizacion |
| **Legoland (La Armeria)** | Cataloga los componentes cuyo DNA esta registrado |
| **Patterns** | El DNA referencia los patrones que el componente implementa |
| **Harnesses** | El DNA de agentes declara el harness que los gobierna |
| **Workflows** | El DNA de workflows declara canales, eventos, estados y compuertas |
| **Codigo regenerable** | El DNA es el plano para la regeneracion |

---

## 4. TIPOS DE DNA

| Tipo de DNA | Template | Describe | Ejemplo |
|-------------|----------|----------|---------|
| **Engine DNA** | `ENGINE_DNA_TEMPLATE.md` | Motor de dominio con contrato, eventos, invariantes | `calendar-engine` |
| **Provider DNA** | `PROVIDER_DNA_TEMPLATE.md` | Adapter de servicio externo con riesgos y contingencia | `telegram-provider` |
| **Agent DNA** | `AGENT_DNA_TEMPLATE.md` | Agente con rol, limites, herramientas, criterios | Sarah (receptionist dental) |
| **App DNA** | `APP_DNA_TEMPLATE.md` | Producto, app o vertical con usuarios, datos, dependencias | `dental-ai-receptionist` |
| **Workflow DNA** | `WORKFLOW_DNA_TEMPLATE.md` | Flujo gobernado con trigger, pasos, eventos, fallbacks | `reservar-cita` |
| **Pattern DNA** | `PATTERN_DNA_TEMPLATE.md` | Abstraccion recurrente con evidencia, madurez, anti-patrones | Provider Pattern |
| **Integration DNA** | `INTEGRATION_DNA_TEMPLATE.md` | Conexion entre sistemas con auth, datos, riesgos | WhatsApp webhook |

---

## 5. CUANDO DEBE CREARSE UNA FICHA DNA

Una ficha DNA debe crearse cuando:

1. Un nuevo engine, provider, app, workflow o integracion alcanza estado **Active**.
2. Un activo existente se promueve de **Proposed** a **Active**.
3. Un activo externo completa el proceso de **Naturalization**.
4. Un patron alcanza el nivel de madurez **Estable** y se propone como institucion.
5. La Asamblea o el Senado lo requiere como paso previo a una migracion o archival.

No se requiere DNA para:
- Activos en estado **Proposed** (experimentales).
- Activos en estado **Archived** (ya estan preservados, no activos).
- Documentacion operativa (eso va en `operational/`).

---

## 6. QUIEN PUEDE CREAR UNA FICHA DNA

| Rol | Puede crear DNA? | Condiciones |
|-----|------------------|-------------|
| Agente autorizado | Si | Debe leer estado-actual.md y seguir el template |
| Senado | Si | Puede requerir DNA como paso previo a una decision |
| Asamblea | Si | Puede ordenar la creacion de DNA para componentes criticos |
| Fundador | Si | Autoridad maxima |

---

## 7. EVIDENCIA MINIMA REQUERIDA

Toda ficha DNA debe estar respaldada por evidencia verificable:

- **Engines:** Tests que pasan. Contrato documentado. Al menos un consumidor.
- **Providers:** Adapter funcional. Tests con InMemory. Ficha de naturalizacion.
- **Agents:** Harness declarado. Comportamiento documentado. Limites claros.
- **Apps:** Build funcional. Dependencias declaradas. Usuario objetivo.
- **Workflows:** Blueprint o codigo. Eventos definidos. Pasos documentados.
- **Patterns:** 3+ ocurrencias en codigo. Evidencia cross-modulo.
- **Integrations:** Conexion funcional. Auth documentada. Datos clasificados.

---

## 8. CUANDO UNA FICHA DNA REQUIERE ADR

Una ficha DNA requiere un ADR cuando:

1. El activo cambia de estado institucional (ej: Active -> Canonical).
2. El activo se mueve de ubicacion en el monorepo.
3. El activo se extrae del monorepo a su propio repositorio.
4. El activo se decommissiona o archiva.
5. El DNA revela un riesgo que requiere decision de la Asamblea.

Crear una ficha DNA para un activo nuevo en estado Proposed **no** requiere ADR.

---

## 9. COMO SE ACTUALIZA UNA FICHA DNA

1. El DNA se revisa cuando el activo cambia de estado institucional.
2. El DNA se actualiza cuando cambian las dependencias, consumidores o riesgos.
3. La actualizacion debe reflejarse en el historial de commits.
4. Una ficha DNA obsoleta es peor que ninguna ficha DNA.

---

## 10. COMO SE ARCHIVA O SUPERSEDE UNA FICHA DNA

1. Si el activo se archiva, su DNA se mueve a `docs/archive/` con prefijo `DNA-`.
2. Si el activo es reemplazado, su DNA se marca `[SUPERSEDIDO]` y referencia al reemplazo.
3. Si el DNA contiene errores factuales, se corrige con commit documentado.
4. Nunca se borra un DNA. Se supersede o se archiva.

---

## 11. INVENTARIO DE TEMPLATES

| Template | Archivo | Secciones |
|----------|---------|-----------|
| Engine | `ENGINE_DNA_TEMPLATE.md` | 19 |
| Provider | `PROVIDER_DNA_TEMPLATE.md` | 18 |
| Agent | `AGENT_DNA_TEMPLATE.md` | 18 |
| App | `APP_DNA_TEMPLATE.md` | 17 |
| Workflow | `WORKFLOW_DNA_TEMPLATE.md` | 16 |
| Pattern | `PATTERN_DNA_TEMPLATE.md` | 14 |
| Integration | `INTEGRATION_DNA_TEMPLATE.md` | 14 |

---

*Fin del DNA Templates README v1.0.0*
