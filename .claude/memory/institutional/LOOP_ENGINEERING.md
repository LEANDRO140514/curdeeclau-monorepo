# LOOP ENGINEERING

> Tipo: institutional
> Versión: 1.0.0 — GOV-0 Governance Baseline
> Creado: 2026-06-16
> Ratificado por: Asamblea de Pekín mediante GOV-0
> Deriva de: Constitución de Pekín, Principios II, VII, VIII, IX, X

---

## I. QUÉ ES LOOP ENGINEERING

LOOP Engineering es el sistema inmunológico de Pekín.

No es una herramienta. No es un workflow. No es un skill. No es un harness.

Es una **institución transversal** que atraviesa Governance, Harness District y Runtime. Su función es garantizar que cada acción, cada decisión y cada producto dentro de CURDEECLAU sea planificado, ejecutado, verificado, corregido, documentado y aprendido.

Sin LOOP Engineering, los agentes construyen sin verificar. Sin verificar, los errores se acumulan. Sin documentar, el conocimiento se pierde. Sin aprender, los errores se repiten.

LOOP Engineering es la vacuna contra la entropía institucional.

---

## II. UBICACIÓN INSTITUCIONAL

LOOP Engineering no pertenece a un solo distrito. Atraviesa tres capas:

```
Governance (Senado)
    │
    ├── Define qué se construye y con qué límites
    │
Harness District (La Forja)
    │
    ├── Define cómo se verifica y con qué reglas
    │
Runtime (Sistema Nervioso)
    │
    └── Ejecuta el ciclo en cada tarea, fase y producto
```

| Capa | Rol de LOOP Engineering |
|------|------------------------|
| **Governance** | Establece que todo trabajo debe seguir el ciclo. Define criterios de salida. |
| **Harness District** | Implementa verificaciones, compuertas y límites. Provee harnesses que fuerzan el ciclo. |
| **Runtime** | Ejecuta el ciclo en tiempo real: planifica, ejecuta, verifica, corrige, documenta, aprende. |

---

## III. EL CICLO

```
Plan → Execute → Verify → Correct → Document → Learn
   ↑                                                      ↓
   └──────────────────── (loop) ──────────────────────────┘
```

### 1. Plan (Planificación)

**Qué:** Definir alcance, restricciones, criterios de salida, archivos autorizados.

**Preguntas obligatorias:**
- ¿Qué se va a construir o modificar?
- ¿Qué restricciones aplican?
- ¿Qué archivos están autorizados para modificación?
- ¿Cómo se sabrá que está terminado?
- ¿Qué NO se debe tocar?

**Evidencia:** Plan escrito (en issue, en estado-actual.md, o en respuesta del agente).

### 2. Execute (Ejecución)

**Qué:** Implementar dentro del alcance autorizado. Ni más, ni menos.

**Reglas:**
- Solo tocar archivos autorizados en el plan.
- No aprovechar para "arreglar de paso" cosas no relacionadas.
- Si se descubre algo fuera del alcance, documentarlo — no arreglarlo.

**Evidencia:** Código escrito, documentos creados, configuraciones aplicadas.

### 3. Verify (Testeo / Verificación)

**Qué:** Comprobar que lo ejecutado cumple el plan y no rompe nada.

**Niveles de verificación:**
- Typecheck (TypeScript)
- Tests unitarios
- Tests de integración
- Validación manual (cuando aplica)
- Verificación documental (cuando es fase sin código)

**Regla:** Ningún cambio funcional sin verificación.

**Evidencia:** Tests pasan, typecheck limpio, output de validación.

### 4. Correct (Corrección)

**Qué:** Arreglar lo que falla. Iterar hasta que verificación pase.

**Reglas:**
- No bajar la barra de verificación para "pasar".
- Si algo no pasa, se corrige — no se silencia.
- Si la corrección excede el alcance, se registra como hallazgo y se propone nueva fase.

**Evidencia:** Tests pasan post-corrección. Errores resueltos documentados.

### 5. Document (Documentación)

**Qué:** Registrar decisión, hallazgo, patrón, restricción en el Archivo.

**Obligatorio documentar:**
- Decisiones de arquitectura o diseño
- Hallazgos inesperados
- Restricciones descubiertas
- Cambios en estado de fases
- Conocimiento extraído del trabajo

**Ubicación:** `operational/` para decisiones y hallazgos. `pattern/` para patrones. `estado-actual.md` para cambios de fase.

**Evidencia:** Archivos actualizados en `.claude/memory/`.

### 6. Learn (Aprendizaje)

**Qué:** Extraer principio, actualizar memoria institucional, enriquecer el conocimiento de Pekín.

**Preguntas obligatorias:**
- ¿Qué aprendió Pekín de este ciclo?
- ¿Qué principio se extrajo?
- ¿Qué memoria se actualizó?
- ¿Qué patrón emergió?
- ¿Qué conocimiento queda para el próximo agente?

**Evidencia:** Principio documentado, patrón registrado, MEMORY.md actualizado, DNA creado.

---

## IV. REGLAS DE LOOP ENGINEERING

### Reglas vinculantes

1. **Ningún cambio funcional sin verificación.** Execute sin Verify es construcción a ciegas.
2. **Ningún producto sin aprendizaje devuelto a memoria.** Si Pekín no aprendió, el ciclo no cerró.
3. **Ningún agente sin límites.** Todo agente opera dentro de un harness. Los límites son explícitos.
4. **Ningún canal nuevo sin validar el anterior.** Telegram antes que WhatsApp. Mock antes que live.
5. **Ningún movimiento estructural sin ADR.** Mover carpetas, renombrar paquetes, reorganizar — todo requiere ADR ratificado.

### Reglas operativas

6. **Alcance explícito.** El plan declara qué sí y qué no se toca.
7. **Verificación proporcional.** Cambio documental → verificación documental. Cambio funcional → tests + typecheck.
8. **Corrección visible.** Lo que falla se documenta y se corrige. No se silencia.
9. **Documentación inmediata.** Se documenta en el mismo ciclo, no "después".
10. **Aprendizaje institucional.** El conocimiento extraído se deposita en el Archivo. No se queda en la conversación.

---

## V. RELACIÓN CON HARNESSES

LOOP Engineering se implementa a través de harnesses. Cada harness es una materialización del ciclo para un contexto específico.

| Harness | Fase del ciclo que refuerza |
|---------|---------------------------|
| **Verify Harness** | Verify — Tests, typecheck, lint |
| **Review Workload Harness** | Verify + Correct — Revisión de cambios por pares |
| **Memory Harness** | Document + Learn — Escritura en el Archivo |
| **Model Routing Harness** | Execute — Selección del modelo correcto para cada tarea |
| **MCP Readiness** | Verify (equipment) — Verificar que MCPs están activos antes de usarlos |
| **Equipment Registry** | Document (inventory) — Mantener registro de equipamiento actualizado |
| **Runtime Lifecycle** | Plan + Execute + Correct — Scope, execution, error recovery |

### Herramientas de verificación del ciclo

| Herramienta | Fase LOOP | Función |
|-------------|-----------|---------|
| Playwright | Verify | Testing end-to-end de navegador |
| Chrome DevTools | Verify + Correct | Debug de frontend en runtime real |
| next-devtools | Verify | Inspección de Next.js en desarrollo |
| token-auditor | Verify | Auditoría de uso de tokens y costos |
| web-quality | Verify | Calidad web (accesibilidad, SEO, performance) |
| impeccable | Verify | Revisión de código (estilo, lint, convenciones) |
| hallmark | Verify | Verificación de diseño y consistencia visual |

Cada harness responde a una pregunta del ciclo:

- Verify Harness: ¿Lo que construí funciona?
- Review Harness: ¿Lo que construí es correcto y seguro?
- Memory Harness: ¿Lo que aprendí quedó registrado?
- Model Routing: ¿Estoy usando la capacidad correcta para esta tarea?
- MCP Readiness: ¿Mis herramientas están listas?
- Equipment Registry: ¿Sé con qué herramientas cuento?
- Runtime Lifecycle: ¿Estoy operando dentro de mis límites?

---

## VI. LOOP ENGINEERING EN FASES SIN CÓDIGO

LOOP Engineering aplica incluso cuando no se modifica código.

| Fase del ciclo | En fase documental |
|---------------|-------------------|
| Plan | Declarar archivos autorizados, restricciones, criterios de salida |
| Execute | Escribir documentos dentro del alcance |
| Verify | Revisar que los documentos son correctos, no hay inconsistencias, git status limpio de código |
| Correct | Corregir errores detectados en revisión |
| Document | Actualizar estado-actual.md con cierre de fase |
| Learn | Extraer principios, registrar en memoria institucional |

---

## VII. EVIDENCIA DE CUMPLIMIENTO

Todo ciclo LOOP Engineering completado debe dejar:

1. **Plan documentado** — Alcance, restricciones, archivos autorizados.
2. **Cambios realizados** — Lista de archivos creados/modificados.
3. **Verificación ejecutada** — Tests, typecheck, git status.
4. **Correcciones aplicadas** — Si algo falló, qué se corrigió.
5. **Documentación actualizada** — Archivo de memoria actualizado.
6. **Aprendizaje registrado** — Principio, patrón o conocimiento extraído.

---

## VIII. CIERRE

LOOP Engineering no es opcional. No es una "buena práctica". Es el sistema inmunológico de Pekín.

Sin él, los agentes construyen sin verificar. Sin verificar, el código se degrada. Sin documentar, el conocimiento se evapora. Sin aprender, los errores se vuelven crónicos.

Cada agente, en cada tarea, en cada fase, ejecuta el ciclo completo.

No porque sea fácil.
No porque sea rápido.
Sino porque es la única forma en que una civilización tecnológica sobrevive a sus constructores.

---

_Fin de LOOP Engineering v1.0.0_
_Ratificado por GOV-0 el 16 de junio de 2026_
