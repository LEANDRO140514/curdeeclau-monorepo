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

### B.1 MCPs Core

| # | MCP | Estado | Key requerida | Key presente | Dependencia |
|---|-----|--------|---------------|--------------|-------------|
| 1 | playwright | MISSING_CONFIG | No | — | npm: @anthropic/mcp-playwright |
| 2 | next-devtools | MISSING_CONFIG | No | — | Next.js app en ejecución |
| 3 | supabase | MISSING_CONFIG | Sí (project ref, anon key) | No verificado | Supabase project |
| 4 | shadcn | MISSING_CONFIG | No | — | Next.js + shadcn/ui |

### B.2 MCPs Opcionales Activos

| # | MCP | Estado | Key requerida | Key presente |
|---|-----|--------|---------------|--------------|
| 5 | resend | MISSING_CONFIG | Sí (API key) | No verificado |

### B.3 MCPs Prioritarios (Top 5)

| # | MCP | Estado | Key requerida | Dependencia | Prioridad |
|---|-----|--------|---------------|-------------|-----------|
| 6 | insforge | PRIORITY_PENDING_CONFIG | Sí (API key) | insforge server | ALTA |
| 7 | sequential-thinking | PRIORITY_PENDING_CONFIG | No | npm: @anthropic/mcp-sequential-thinking | ALTA |
| 8 | chrome-devtools | PRIORITY_PENDING_CONFIG | No | Chrome/Chromium | ALTA |
| 9 | github | PRIORITY_PENDING_CONFIG | Sí (token) | GitHub account | ALTA |
| 10 | firecrawl-mcp | PRIORITY_PENDING_CONFIG | Sí (API key) | Firecrawl account | ALTA |

### B.4 MCPs Pendientes

| # | MCP | Estado | Bloqueante |
|---|-----|--------|------------|
| 11 | n8n-mcp | PRIORITY_PENDING_DOCKER | Docker disponible. Pendiente: instancia n8n + API key. |
| 12 | svgmaker | PENDING_CONFIG | Sin dependencias críticas |
| 13 | stripe | PENDING_KEY | API key de Stripe |
| 14 | sentry | PENDING_KEY | API key de Sentry |
| 15 | perplexity | PENDING_KEY | API key de Perplexity |
| 16 | brave-search | PENDING_KEY | API key de Brave Search |

### B.5 Configuración actual

- **`.mcp.json`:** NO EXISTE
- **`mcp.json`:** NO EXISTE
- **`example.mcp.json`:** NO EXISTE
- **MCPs configurados:** 0
- **MCPs funcionales:** 0

---

## C. READINESS MATRIX

| Equipment | Type | Category | Status | Ready Now | Requires Key | Requires Install | Requires Docker | Requires Human Auth | Safe Verify | Notes |
|-----------|------|----------|--------|-----------|--------------|-----------------|------------------|---------------------|-------------|-------|
| playwright | MCP | Testing/Debug | MISSING_CONFIG | No | No | Sí | No | No | Sí | npm install |
| next-devtools | MCP | Dev Tools | MISSING_CONFIG | No | No | Sí | No | No | Sí | Requires Next.js running |
| supabase | MCP | Database | MISSING_CONFIG | No | Sí | Sí | No | No | Sí | Project ref needed |
| shadcn | MCP | UI | MISSING_CONFIG | No | No | Sí | No | No | Sí | Requires shadcn/ui project |
| resend | MCP | Email | MISSING_CONFIG | No | Sí | Sí | No | No | Parcial | Verify config w/o send |
| insforge | MCP | Agentic Backend | PRIORITY_PENDING_CONFIG | No | Sí | Sí | No | Sí | — | Escudo relacional |
| sequential-thinking | MCP | Reasoning | PRIORITY_PENDING_CONFIG | No | No | Sí | No | No | Sí | npm install |
| chrome-devtools | MCP | Debug | PRIORITY_PENDING_CONFIG | No | No | Sí | No | No | Sí | Chrome needed |
| github | MCP | Version Control | PRIORITY_PENDING_CONFIG | No | Sí | Sí | No | Sí | Sí | GitHub token |
| firecrawl-mcp | MCP | Web Ingest | PRIORITY_PENDING_CONFIG | No | Sí | Sí | No | Sí | No | API key needed |
| n8n-mcp | MCP | Workflow Automation | PRIORITY_PENDING_DOCKER | No | Sí | Sí | Sí | Sí | — | Docker OK, n8n instance + key pending |
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

---

## D. n8n BATTLE PACK

### n8n MCP

- **Estado:** PRIORITY_PENDING_DOCKER
- **Docker:** Disponible (Docker 29.2.0)
- **Keys requeridas:** N8N_API_URL, N8N_API_KEY (o N8N_MCP_SERVER_URL, N8N_MCP_AUTH_TOKEN)
- **Keys presentes:** No verificado
- **Variables esperadas:** N8N_API_URL, N8N_API_KEY, N8N_MCP_SERVER_URL, N8N_MCP_AUTH_TOKEN, N8N_HOST, N8N_PORT
- **Próximo paso:** Instalar y configurar n8n local via Docker, luego activar MCP.

### n8n Official Skills

- **Origen:** `https://github.com/n8n-io/skills`
- **Estado:** PRIORITY_PENDING_NETWORK
- **Ruta objetivo:** `.claude/skills/n8n-official/`
- **Skills instaladas:** 0
- **Próximo paso:** Clonar repo, copiar skills a `.claude/skills/n8n-official/`, registrar número real.

### n8n Docker Command (referencia)

```bash
docker run -d --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_SECURE_COOKIE=false \
  n8nio/n8n
```

---

_Fin del Equipment Registry v1.0.0_
