# CONSTRUCTOR ENVIRONMENT

> Tipo: institutional
> Versión: 1.0.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-16
> Ratificado por: Asamblea de Pekín mediante GOV-1
> Propósito: Definir el entorno operativo real de los constructores de CURDEECLAU

---

## I. ENTORNO LOCAL

### Host

- **Nombre:** vonde@ALGORITHMUS
- **Sistema:** Windows 11 Pro + WSL (Windows Subsystem for Linux)
- **Terminal primaria:** PowerShell 7 (pwsh)
- **Terminal secundaria:** Git Bash (POSIX sh)
- **Package manager:** pnpm (workspaces)

### Encoding

- **Código de página:** 65001 (UTF-8)
- **PowerShell fix obligatorio:**
  ```powershell
  [Console]::InputEncoding  = [System.Text.Encoding]::UTF8
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
  ```
- **Verificación:** `Write-Host "Pekín, Constitución, inmunológico"` debe renderizar sin corrupción.

### Filesystem

- **Raíz del monorepo:** `C:\Users\vonde\Proyectos\curdeeclau-monorepo`
- **Memoria institucional:** `.claude/memory/`
- **Skills:** `.claude/skills/`
- **Comandos:** `.claude/commands/`
- **Configuración:** `.claude/settings.json`, `.claude/settings.local.json`
- **MCP config:** `.mcp.json` (a crear si no existe)
- **Código funcional:** `packages/`, `apps/`, `verticals/`, `src/`
- **Workflows:** `workflows/`

---

## II. CONSTRUCTORES DISPONIBLES

### Cursor

- **Tipo:** IDE / Entorno de desarrollo
- **Estado:** ACTIVE
- **Uso:** Edición de código, typecheck, tests, lint
- **Reglas:** `.cursor/rules/` (project.mdc, frontend.mdc, backend.mdc, agents.mdc, tests.mdc)
- **Límites:** No gobierna arquitectura. No decide principios.

### Claude Code

- **Tipo:** Harness Runtime
- **Estado:** ACTIVE (este es el runtime actual)
- **Uso:** Ejecución de agentes, skills, MCPs, workflows, documentación
- **Config:** `.claude/settings.json`, `.claude/settings.local.json`
- **Límites:** No modifica `institutional/` sin autorización. No hace push sin autorización.

### DeepClaude

- **Tipo:** Estrategia de modelo / razonamiento
- **Estado:** ACTIVE (vía OpenRouter)
- **Uso:** Razonamiento profundo, análisis, planificación
- **Acceso:** OpenRouterAdapter → LLMRouter (estrategia: reasoning)
- **Límites:** Subordinado a LLMRouter. No decide por sí mismo.

### Kimchi.dev

- **Tipo:** Constructor / Agente externo
- **Estado:** ALLIED (no naturalizado)
- **Uso:** Asistencia en construcción. Aliado externo.
- **Límites:** No gobierna Pekín. No declara principios. No modifica institutional/.

### Forge / Grok Build

- **Tipo:** Constructor externo
- **Estado:** ALLIED (no naturalizado)
- **Uso:** Construcción externa. Puede asistir en tareas específicas.
- **Límites:** Reside fuera del monorepo. No dicta estructura. No gobierna.

---

## III. MCPs

### Estado actual (MCP-0)

- **Archivo de configuración:** `.mcp.json` — CREADO
- **MCPs configurados:** 11
- **MCPs Fase 1 (sin credenciales):** 5 ACTIVE_CORE_READY
- **MCPs Fase 2 (con variables de entorno):** 6 CONFIGURED_PENDING_KEY
- **MCPs verificados (smoke test):** 2 (sequential-thinking, playwright)

### MCPs configurados

| MCP | Estado | Paquete |
|-----|--------|---------|
| playwright | ACTIVE_CORE_READY | `@playwright/mcp@latest` |
| browser-tools | ACTIVE_CORE_READY | `@agentdeskai/browser-tools-mcp@latest` |
| shadcn | ACTIVE_CORE_READY | `shadcn-mcp@latest` |
| next-devtools | ACTIVE_CORE_READY | `next-devtools-mcp@latest` |
| sequential-thinking | ACTIVE_CORE_READY | `@modelcontextprotocol/server-sequential-thinking` |
| supabase | CONFIGURED_PENDING_KEY | `supabase-mcp-server@latest` |
| github | CONFIGURED_PENDING_KEY | `@anthropic/github-mcp@latest` |
| firecrawl | CONFIGURED_PENDING_KEY | `firecrawl-mcp@latest` |
| insforge | CONFIGURED_PENDING_KEY | `insforge-mcp@latest` |
| resend | CONFIGURED_PENDING_KEY | `resend-mcp@latest` |
| n8n | CONFIGURED_PENDING_KEY | `@neterius/n8n-mcp@latest` |

### Docker

- **Estado:** DISPONIBLE (Docker version 29.2.0)
- **Uso:** Requerido para n8n-mcp. Opcional para otros MCPs.
- **Restricción:** No exponer puertos de producción sin autorización.

---

## IV. SKILLS

### Estado actual

- **Carpeta `.claude/skills/`:** NO EXISTE
- **Skills instaladas:** 0
- **Comandos existentes:** 4 (arquitecto, avivar, cyberneo, simplificador) en `.claude/commands/`

### Skills esperadas

- **22 skills de producto:** listadas en Equipment Registry. Ninguna existe físicamente.
- **6 skills de batalla:** a crear en GOV-1 (verify-harness, review-workload-harness, memory-harness, model-routing-harness, mcp-readiness, equipment-registry)

---

## V. FILESYSTEM BOUNDARIES

### Zonas de escritura permitidas (agentes)

| Zona | Permiso | Condición |
|------|---------|-----------|
| `.claude/memory/operational/` | Escritura | Reportes, decisiones, estado-actual |
| `.claude/memory/procedural/` | Escritura | Runbooks, guías |
| `.claude/memory/reference/` | Escritura | Catálogos, mapas |
| `.claude/skills/` | Escritura | Skills y sus archivos |
| `.claude/settings.local.json` | Escritura | Permisos locales |
| `CLAUDE.md` | Escritura | Con autorización del Senado |
| `STATE.md` | Escritura | Con autorización del Senado |
| `docs/archive/` | Solo recibe | Archivado de documentos supersedidos |

### Zonas de solo lectura (agentes)

| Zona | Regla |
|------|-------|
| `.claude/memory/institutional/` | Solo Asamblea o fases autorizadas (GOV, ORG) |
| `packages/` | Solo con tarea autorizada |
| `apps/` | Solo con tarea autorizada |
| `verticals/` | Solo con tarea autorizada |
| `.env` | Nunca. No leer, no commitear. |

---

## VI. EJECUCIÓN AUTÓNOMA

Los agentes constructores pueden ejecutar autónomamente dentro de estos límites:

**Siempre permitido:**
- Leer archivos
- Buscar código (Grep, Glob)
- Ejecutar tests
- Ejecutar typecheck
- Escribir en `operational/`
- Crear skills en `.claude/skills/`
- Documentar en `reference/`

**Requiere autorización:**
- Modificar `institutional/`
- Modificar código en `packages/`, `apps/`, `verticals/`
- Crear nuevos packages
- Ejecutar comandos destructivos
- Hacer push

**Nunca permitido sin autorización explícita:**
- Tocar producción
- Usar credenciales reales
- Enviar emails, mensajes, cobros
- Ejecutar SQL destructivo
- Exponer secretos

---

## VII. SEGURIDAD

### Secretos

- **Ubicación:** Variables de entorno (`.env` local, nunca commiteado)
- **En logs:** Enmascarados (teléfonos, emails, tokens)
- **En commits:** Nunca
- **En respuestas de agente:** Nunca

### CORS y Headers

- Production backends: CORS restrictivo, security headers (X-Content-Type-Options, X-Frame-Options, CSP)
- Development: flexible pero nunca `Access-Control-Allow-Origin: *` en producción

### Verificación pre-push

1. `git status` limpio o con residuales justificados
2. Tests pasan
3. Typecheck limpio
4. No secrets en diff
5. No `.env` en staging

---

## VIII. CRITERIOS DE ESCALAMIENTO HUMANO

El agente constructor debe escalar a humano cuando:

1. Se requiere una credencial que no está configurada.
2. Se requiere acceso a producción.
3. Se requiere modificar la Constitución o Principios.
4. Se requiere una decisión arquitectónica que afecta múltiples verticales.
5. Se detecta un riesgo de seguridad no documentado.
6. Se requiere crear un nuevo repositorio.
7. Se requiere cambiar el remote de git.
8. Se requiere push a main/master.

---

_Fin del Constructor Environment v1.0.0_
