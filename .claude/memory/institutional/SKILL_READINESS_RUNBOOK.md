# SKILL READINESS RUNBOOK

> Tipo: procedural/runbook
> Versión: 1.0.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-16
> Propósito: Guía para revisar, crear, clasificar y mantener skills de la Élite Guerrera

---

## 1. CÓMO REVISAR SKILLS

### Verificación de existencia

1. Confirmar que la carpeta existe: `.claude/skills/<skill-name>/`
2. Confirmar que el archivo principal existe: `SKILL.md`
3. Confirmar que el archivo tiene contenido mínimo (no vacío, > 100 bytes).

### Verificación de estructura

Un SKILL.md mínimo debe contener:

```markdown
# <skill-name>

> Tipo: skill
> Versión: 1.0.0
> Estado: <ACTIVE_READY | ACTIVE_MINIMAL_READY | BROKEN>
> Categoría: <categoría>

## Propósito
...

## Cuándo usar
...

## Entradas esperadas
...

## Procedimiento
...

## Checklist
...

## Límites
...

## Reglas de seguridad
...

## Relación con LOOP Engineering
...
```

### Verificación de integridad

- [ ] Nombre correcto (sin typos, sin duplicados).
- [ ] Categoría correcta.
- [ ] Propósito claro (una frase).
- [ ] Sin secretos en el archivo.
- [ ] Sin referencias a producción sin advertencia.
- [ ] Límites explícitos.
- [ ] Relación con LOOP Engineering declarada.

---

## 2. CÓMO DETECTAR SKILL ROTA

Una skill está ROTA si:

1. La carpeta existe pero `SKILL.md` no existe.
2. `SKILL.md` existe pero está vacío o tiene < 50 bytes.
3. `SKILL.md` tiene sintaxis Markdown rota que impide su lectura.
4. `SKILL.md` referencia archivos o dependencias que no existen.
5. `SKILL.md` contiene secretos expuestos (marcar CRITICAL).
6. `SKILL.md` contradice principios constitucionales.
7. `SKILL.md` declara autoridad que no le corresponde.

### Acción correctiva
- Si es menor: reparar en el momento.
- Si es estructural: marcar BROKEN, documentar causa, escalar.
- Si tiene secretos: eliminar secretos inmediatamente, rotar keys comprometidas.

---

## 3. CÓMO CLASIFICAR SKILLS

### Estados

| Estado | Significado | Acción |
|--------|-------------|--------|
| ACTIVE_READY | Completa, verificada, lista para usar | Usar |
| ACTIVE_NEEDS_REVIEW | Funciona pero necesita revisión | Usar con precaución, reportar hallazgos |
| CREATED_MINIMAL_READY | Estructura mínima creada, sin verificación operativa | Completar antes de usar en producción |
| ACTIVE_MINIMAL_READY | Mínima funcional, lista para desarrollo | Usar en desarrollo, completar antes de producción |
| BROKEN | Rota, no usar | Reparar o reemplazar |
| MISSING | No existe | Crear o decidir no crear |

### Categorías

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| Product Build | Construcción de productos | add-emails, add-mobile, add-payments |
| Research / Quality | Investigación y calidad | autoresearch, web-quality, hallmark |
| Forge Doctrine | Doctrina de construcción | forge-reference, la-forja |
| Infrastructure / Data | Datos e infraestructura | supabase, memory-manager |
| Media / Creative | Media y creatividad | image-generation, video-visuals |
| Meta | Creación de skills | skill-creator |
| Harness / Verification | Verificación de agentes | verify-harness, review-workload |
| Memory / Governance | Memoria y gobierno | memory-harness, equipment-registry |
| Model / Routing | Enrutamiento de modelos | model-routing-harness |
| MCP / Equipment | Equipamiento MCP | mcp-readiness |
| Workflow Automation | Automatización (n8n) | n8n-official |

---

## 4. CÓMO CREAR SKILL MÍNIMA

### Plantilla

```markdown
# <skill-name>

> Tipo: skill
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: <categoría>
> Creado: <fecha>

## Propósito

<Una frase clara de qué hace esta skill.>

## Cuándo usar

- Cuando <condición 1>
- Cuando <condición 2>
- No usar cuando <contraindicación>

## Entradas esperadas

- <input 1>
- <input 2>

## Procedimiento

1. <paso 1>
2. <paso 2>
3. <paso 3>

## Checklist

- [ ] <check 1>
- [ ] <check 2>

## Límites

- No <acción prohibida 1>.
- No <acción prohibida 2>.

## Reglas de seguridad

- No exponer secretos.
- No operar en producción sin autorización.
- No ejecutar acciones destructivas.

## Relación con LOOP Engineering

Esta skill implementa la fase `<fase>` del ciclo LOOP (Plan/Execute/Verify/Correct/Document/Learn).
```

### Ubicación

```
.claude/skills/<skill-name>/SKILL.md
```

---

## 5. CÓMO ACTIVAR/USAR SKILL

1. Verificar que la skill está en Equipment Registry.
2. Confirmar estado (debe ser ACTIVE_READY, ACTIVE_MINIMAL_READY, o CREATED_MINIMAL_READY).
3. Invocar con `/<skill-name>` o mediante el sistema de skills de Claude Code.
4. Respetar límites declarados en SKILL.md.
5. Reportar cualquier anomalía detectada durante el uso.

---

## 6. CÓMO REGISTRAR MEJORAS

1. Documentar el cambio en el historial del SKILL.md.
2. Incrementar versión (semver).
3. Actualizar Equipment Registry si el estado cambia.
4. Reportar en `estado-actual.md` si la mejora es significativa.

---

## 7. CÓMO NO DUPLICAR SKILLS

1. Buscar en Equipment Registry antes de crear.
2. Verificar que no existe una skill con el mismo propósito en `.claude/skills/`.
3. Si existe skill similar, evaluar:
   - ¿Extender la existente?
   - ¿Renombrar para evitar confusión?
   - ¿Crear nueva con propósito claramente diferenciado?
4. Si se crea nueva, documentar en Equipment Registry por qué no es duplicado.

---

## 8. RELACIÓN CON LOOP ENGINEERING

Cada skill implementa una o más fases del ciclo LOOP:

| Skill | Fase LOOP |
|-------|-----------|
| verify-harness | Verify |
| review-workload-harness | Verify + Correct |
| memory-harness | Document + Learn |
| model-routing-harness | Execute |
| mcp-readiness | Verify (equipment) |
| equipment-registry | Document (inventory) |
| token-auditor | Verify (cost) |
| memory-manager | Document + Learn |
| autoresearch | Plan + Learn |
| web-quality | Verify |
| hallmark | Verify |
| impeccable | Verify |

---

## 9. n8n OFFICIAL SKILLS

### Origen

Repositorio oficial: `https://github.com/n8n-io/skills`

### Sincronización

1. Clonar repo temporalmente fuera del código funcional:
   ```bash
   git clone https://github.com/n8n-io/skills /tmp/n8n-skills
   ```

2. Copiar skills a carpeta institucional:
   ```bash
   mkdir -p .claude/skills/n8n-official/
   cp -r /tmp/n8n-skills/* .claude/skills/n8n-official/
   ```

3. Registrar número real de skills encontradas.

4. Limpiar:
   ```bash
   rm -rf /tmp/n8n-skills
   ```

### Actualización

Repetir el proceso de sincronización. No sobrescribir sin backup.

### Verificación

- Confirmar que cada skill tiene archivo principal.
- Verificar que no hay conflictos con skills existentes.
- Confirmar que no se inyectaron archivos maliciosos.

### Prevención de sobrescritura

Si ya existen skills n8n modificadas localmente:
1. Hacer backup antes de sincronizar.
2. Usar diff para identificar cambios locales.
3. Preservar personalizaciones locales.

---

_Fin del Skill Readiness Runbook v1.0.0_
