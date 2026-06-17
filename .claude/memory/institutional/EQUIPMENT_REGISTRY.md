# EQUIPMENT REGISTRY

> Tipo: institutional/reference
> Versión: 1.0.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-16
> Actualizado: 2026-06-16
> Propósito: Registro central de skills, MCPs y equipamiento operativo de la Élite Guerrera

---

## A. SKILLS REGISTRY

### A.1 Skills de Producto (22 skills esperadas)

Todas residen en `.claude/skills/`. Estado real verificado: **carpeta `.claude/skills/` no existe. 0 de 22 skills existen físicamente.**

#### Grupo A — Product Build Skills

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| 1 | add-emails | `.claude/skills/add-emails/` | — | MISSING |
| 2 | add-mobile | `.claude/skills/add-mobile/` | — | MISSING |
| 3 | add-payments | `.claude/skills/add-payments/` | — | MISSING |
| 4 | add-ui-kit | `.claude/skills/add-ui-kit/` | — | MISSING |
| 5 | website-3d | `.claude/skills/website-3d/` | — | MISSING |

#### Grupo B — Research / Quality / Web Skills

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| 6 | autoresearch | `.claude/skills/autoresearch/` | — | MISSING |
| 7 | web-quality | `.claude/skills/web-quality/` | — | MISSING |
| 8 | hallmark | `.claude/skills/hallmark/` | — | MISSING |
| 9 | impeccable | `.claude/skills/impeccable/` | — | MISSING |
| 10 | karpathy-principles | `.claude/skills/karpathy-principles/` | — | MISSING |

#### Grupo C — Forge / Constructor Doctrine Skills

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| 11 | forge-reference | `.claude/skills/forge-reference/` | — | MISSING |
| 12 | forge-tips | `.claude/skills/forge-tips/` | — | MISSING |
| 13 | la-forja | `.claude/skills/la-forja/` | — | MISSING |
| 14 | la-herreria | `.claude/skills/la-herreria/` | — | MISSING |
| 15 | el-crisol | `.claude/skills/el-crisol/` | — | MISSING |

#### Grupo D — Infrastructure / Data Skills

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| 16 | insforge | `.claude/skills/insforge/` | — | MISSING |
| 17 | supabase | `.claude/skills/supabase/` | — | MISSING |
| 18 | memory-manager | `.claude/skills/memory-manager/` | — | MISSING |
| 19 | token-auditor | `.claude/skills/token-auditor/` | — | MISSING |

#### Grupo E — Media / Creative Skills

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| 20 | image-generation | `.claude/skills/image-generation/` | — | MISSING |
| 21 | video-visuals | `.claude/skills/video-visuals/` | — | MISSING |

#### Grupo F — Meta Skills

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| 22 | skill-creator | `.claude/skills/skill-creator/` | — | MISSING |

### A.2 Skills de Batalla Inmediatas (6 skills)

Creadas/verificadas en GOV-1:

| # | Skill | Carpeta | Archivo principal | Estado |
|---|-------|---------|-------------------|--------|
| B1 | verify-harness | `.claude/skills/verify-harness/` | SKILL.md | ACTIVE_MINIMAL_READY |
| B2 | review-workload-harness | `.claude/skills/review-workload-harness/` | SKILL.md | ACTIVE_MINIMAL_READY |
| B3 | memory-harness | `.claude/skills/memory-harness/` | SKILL.md | ACTIVE_MINIMAL_READY |
| B4 | model-routing-harness | `.claude/skills/model-routing-harness/` | SKILL.md | ACTIVE_MINIMAL_READY |
| B5 | mcp-readiness | `.claude/skills/mcp-readiness/` | SKILL.md | ACTIVE_MINIMAL_READY |
| B6 | equipment-registry | `.claude/skills/equipment-registry/` | SKILL.md | ACTIVE_MINIMAL_READY |

### A.3 Comandos (slash commands existentes)

Residen en `.claude/commands/`:

| Comando | Archivo | Estado |
|---------|---------|--------|
| arquitecto | `.claude/commands/arquitecto.md` | ACTIVE |
| avivar | `.claude/commands/avivar.md` | ACTIVE |
| cyberneo | `.claude/commands/cyberneo.md` | ACTIVE |
| simplificador | `.claude/commands/simplificador.md` | ACTIVE |

### A.4 n8n Official Skills Battle Pack

| Skill | Origen | Carpeta | Estado |
|-------|--------|---------|--------|
| n8n-official | `github.com/n8n-io/skills` | `.claude/skills/n8n-official/` | PRIORITY_PENDING_NETWORK |

---

## B. MCP REGISTRY

### B.1 MCPs Core — Fase 1 (Sin credenciales)

| # | MCP | Estado | Paquete | Verificado |
|---|-----|--------|---------|------------|
| 1 | playwright | **ACTIVE_CORE_READY** | `@playwright/mcp@latest` | Smoke-test OK |
| 2 | browser-tools | **ACTIVE_CORE_READY** | `@agentdeskai/browser-tools-mcp@latest` | Package exists |
| 3 | shadcn | **ACTIVE_CORE_READY** | `shadcn-mcp@latest` | Package exists |
| 4 | next-devtools | **ACTIVE_CORE_READY** | `next-devtools-mcp@latest` | Package exists |
| 5 | sequential-thinking | **ACTIVE_CORE_READY** | `@modelcontextprotocol/server-sequential-thinking` | Smoke-test OK |

### B.2 MCPs Fase 2 — Configurados con variables de entorno

| # | MCP | Estado | Key requerida | Key presente | Paquete |
|---|-----|--------|---------------|--------------|---------|
| 6 | resend | CONFIGURED_PENDING_KEY | RESEND_API_KEY | No verificado | `resend-mcp@latest` |
| 7 | github | CONFIGURED_PENDING_KEY | GITHUB_TOKEN | No verificado | `@anthropic/github-mcp@latest` |
| 8 | firecrawl | CONFIGURED_PENDING_KEY | FIRECRAWL_API_KEY | No verificado | `firecrawl-mcp@latest` |
| 9 | supabase | CONFIGURED_PENDING_KEY | SUPABASE_URL, SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF | No verificado | `supabase-mcp-server@latest` |
| 10 | insforge | CONFIGURED_PENDING_KEY | INSFORGE_API_URL, INSFORGE_API_KEY | No verificado | `insforge-mcp@latest` |
| 11 | n8n | CONFIGURED_PENDING_KEY | N8N_API_URL, N8N_API_KEY | No verificado | `@neterius/n8n-mcp@latest` |

### B.3 MCPs Prioritarios (Top 5)

| # | MCP | Estado | Key requerida | Dependencia | Prioridad |
|---|-----|--------|---------------|-------------|-----------|
| — | insforge | CONFIGURED_PENDING_KEY | INSFORGE_API_KEY | insforge server | ALTA |
| — | sequential-thinking | **ACTIVE_CORE_READY** | No | npm package | ALTA (cumplida) |
| — | chrome-devtools (browser-tools) | **ACTIVE_CORE_READY** | No | Chrome/Chromium | ALTA |
| — | github | CONFIGURED_PENDING_KEY | GITHUB_TOKEN | GitHub account | ALTA |
| — | firecrawl | CONFIGURED_PENDING_KEY | FIRECRAWL_API_KEY | Firecrawl account | ALTA |

### B.4 MCPs Pendientes

| # | MCP | Estado | Bloqueante |
|---|-----|--------|------------|
| 12 | svgmaker | PENDING_CONFIG | Sin dependencias críticas |
| 13 | stripe | PENDING_KEY | API key de Stripe |
| 14 | sentry | PENDING_KEY | API key de Sentry |
| 15 | perplexity | PENDING_KEY | API key de Perplexity |
| 16 | brave-search | PENDING_KEY | API key de Brave Search |

### B.5 Configuración actual (MCP-0)

- **`.mcp.json`:** CREADO — 11 MCPs configurados
- **MCPs Fase 1 (sin credenciales):** 5 configurados, 5 ACTIVE_CORE_READY
- **MCPs Fase 2 (con variables de entorno):** 6 configurados, 6 CONFIGURED_PENDING_KEY
- **MCPs verificados (smoke test):** 2 (sequential-thinking, playwright)
- **Configuración sin hardcoded secrets:** TODOS usan `${VAR_NAME}`

---

## C. READINESS MATRIX

| Equipment | Type | Category | Status | Ready Now | Requires Key | Requires Install | Requires Docker | Requires Human Auth | Safe Verify | Notes |
|-----------|------|----------|--------|-----------|--------------|-----------------|------------------|---------------------|-------------|-------|
| playwright | MCP | Testing/Debug | ACTIVE_CORE_READY | Sí | No | Sí (npx) | No | No | Sí | Smoke-test OK |
| browser-tools | MCP | Debug | ACTIVE_CORE_READY | Sí | No | Sí (npx) | No | No | Sí | Chrome needed |
| shadcn | MCP | UI | ACTIVE_CORE_READY | Sí | No | Sí (npx) | No | No | Sí | Requires shadcn/ui project |
| next-devtools | MCP | Dev Tools | ACTIVE_CORE_READY | Sí | No | Sí (npx) | No | No | Sí | Requires Next.js running |
| sequential-thinking | MCP | Reasoning | ACTIVE_CORE_READY | Sí | No | Sí (npx) | No | No | Sí | Smoke-test OK |
| supabase | MCP | Database | CONFIGURED_PENDING_KEY | No | Sí | Sí (npx) | No | No | Sí | Project ref needed |
| github | MCP | Version Control | CONFIGURED_PENDING_KEY | No | Sí | Sí (npx) | No | Sí | Sí | GitHub token needed |
| firecrawl | MCP | Web Ingest | CONFIGURED_PENDING_KEY | No | Sí | Sí (npx) | No | Sí | No | API key needed |
| insforge | MCP | Agentic Backend | CONFIGURED_PENDING_KEY | No | Sí | Sí (npx) | No | Sí | — | API key + URL needed |
| resend | MCP | Email | CONFIGURED_PENDING_KEY | No | Sí | Sí (npx) | No | No | Parcial | Verify config w/o send |
| n8n | MCP | Workflow Automation | CONFIGURED_PENDING_KEY | No | Sí | Sí (npx) | Sí | Sí | — | Docker OK, n8n instance + key pending |
| svgmaker | MCP | Graphics | PENDING_CONFIG | No | No | Sí | No | No | Sí | — |
| stripe | MCP | Payments | PENDING_KEY | No | Sí | Sí | No | Sí | No | Stripe key needed |
| sentry | MCP | Monitoring | PENDING_KEY | No | Sí | Sí | No | Sí | No | Sentry key needed |
| perplexity | MCP | AI Search | PENDING_KEY | No | Sí | Sí | No | Sí | No | Perplexity key needed |
| brave-search | MCP | Web Search | PENDING_KEY | No | Sí | Sí | No | Sí | No | Brave key needed |
| verify-harness | Skill | Harness/Verification | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Creado en GOV-1 |
| review-workload-harness | Skill | Harness/Verification | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Creado en GOV-1 |
| memory-harness | Skill | Memory/Governance | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Creado en GOV-1 |
| model-routing-harness | Skill | Model/Routing | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Creado en GOV-1 |
| mcp-readiness | Skill | MCP/Equipment | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Creado en GOV-1 |
| equipment-registry | Skill | Memory/Governance | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Creado en GOV-1 |
| n8n official skills (14) | Skill | Workflow Automation | ACTIVE_MINIMAL_READY | Sí | No | No | No | No | Sí | Sincronizadas en MCP-0 |

---

## D. n8n BATTLE PACK

### n8n MCP

- **Estado:** CONFIGURED_PENDING_KEY
- **Docker:** Disponible (Docker 29.2.0)
- **Paquete:** `@neterius/n8n-mcp@latest` (45 tools + 7 embedded skills)
- **Keys requeridas:** N8N_API_URL, N8N_API_KEY
- **Keys presentes:** No verificado (${N8N_API_URL}, ${N8N_API_KEY} en .mcp.json)
- **Próximo paso:** Configurar N8N_API_URL + N8N_API_KEY en .env

### n8n Official Skills

- **Origen:** `https://github.com/n8n-io/skills`
- **Estado:** **ACTIVE_MINIMAL_READY** (14 skills sincronizadas)
- **Ruta:** `.claude/skills/n8n-*/` y `.claude/skills/using-n8n-skills/`
- **Skills instaladas:** 14
- **Skills:** n8n-agents, n8n-binary-and-data, n8n-code-nodes, n8n-credentials-and-security, n8n-data-tables, n8n-debugging, n8n-error-handling, n8n-expressions, n8n-extending-mcp, n8n-loops, n8n-node-configuration, n8n-subworkflows, n8n-workflow-lifecycle, using-n8n-skills

### n8n Docker Command (referencia)

```bash
docker run -d --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_SECURE_COOKIE=false \
  n8nio/n8n
```

---

_Fin del Equipment Registry v1.0.0_
