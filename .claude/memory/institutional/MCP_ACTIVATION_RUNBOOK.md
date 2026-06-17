# MCP ACTIVATION RUNBOOK

> Tipo: procedural/runbook
> Versión: 1.0.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-16
> Propósito: Guía de activación y verificación segura de todos los MCPs del Imperio

---

## REGLA DE ORO

**Nunca actives un MCP contra producción sin autorización explícita.**

Toda verificación debe ser no destructiva. Sin envíos reales. Sin escritura. Sin exposición de secretos.

---

## 1. PLAYWRIGHT

**Estado:** MISSING_CONFIG → objetivo: ACTIVE_CORE_READY

### Activación

```bash
npm install @anthropic/mcp-playwright
```

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-playwright"]
    }
  }
}
```

### Verificación segura
- Navegar a URL local (localhost) — no producción.
- Tomar screenshot de página estática.
- No interactuar con formularios reales.
- No enviar datos.

### Nunca hacer
- No navegar a URLs de producción sin autorización.
- No hacer login en cuentas reales.
- No interactuar con pasarelas de pago.
- No extraer datos de clientes.

---

## 2. NEXT-DEVTOOLS

**Estado:** MISSING_CONFIG → objetivo: ACTIVE_CORE_READY

### Activación
Requiere Next.js app en ejecución. El MCP se conecta al runtime de Next.js.

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "@anthropic/next-devtools-mcp"]
    }
  }
}
```

### Verificación segura
- Ejecutar app Next.js en desarrollo local.
- Verificar conexión del MCP.
- Leer estructura de rutas (no modificar).

### Nunca hacer
- No modificar rutas de producción.
- No tocar builds de producción.
- No alterar middleware en producción.

---

## 3. SUPABASE

**Estado:** MISSING_CONFIG → objetivo: ACTIVE_CORE_READY

### Activación

Requiere:
- Supabase project URL
- Supabase anon key (pública, no secreta)
- Service role key SOLO para operaciones autorizadas

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@anthropic/supabase-mcp"],
      "env": {
        "SUPABASE_URL": "<project-url>",
        "SUPABASE_ANON_KEY": "<anon-key>"
      }
    }
  }
}
```

### Verificación segura
- Leer esquemas (no modificar).
- Ejecutar SELECT con LIMIT 1 en tabla de desarrollo.
- Verificar RLS policies (no alterar).

### Nunca hacer
- No ejecutar DROP, TRUNCATE, DELETE sin autorización.
- No alterar esquemas consolidados sin ADR.
- No migrar datos vivos por estética.
- No exponer service_role key.
- No ejecutar operaciones masivas sin plan, respaldo y rollback.

---

## 4. SHADCN

**Estado:** MISSING_CONFIG → objetivo: ACTIVE_CORE_READY

### Activación
Requiere proyecto con shadcn/ui instalado.

### Verificación segura
- Listar componentes disponibles.
- Leer configuración de tema.
- No modificar componentes sin autorización.

---

## 5. RESEND (Verificación segura sin envío)

**Estado:** MISSING_CONFIG → objetivo: CONFIGURED_PENDING_KEY

### Verificación de configuración
- Confirmar que la key existe en `.env` (no imprimirla).
- Verificar que el MCP puede cargarse sin crash.
- NO enviar email de prueba.

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "resend": {
      "command": "npx",
      "args": ["-y", "resend-mcp"],
      "env": {
        "RESEND_API_KEY": "<key>"
      }
    }
  }
}
```

### Nunca hacer
- No enviar emails reales sin autorización.
- No usar direcciones de clientes reales.
- No exponer RESEND_API_KEY.

---

## 6. INSFORGE (Prioridad #1)

**Estado:** PRIORITY_PENDING_CONFIG → objetivo: PRIORITY_ACTIVE_READY

### Activación

Requiere:
- Insforge server URL
- Insforge API key
- Endpoint verification

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "insforge": {
      "command": "npx",
      "args": ["-y", "insforge-mcp"],
      "env": {
        "INSFORGE_API_URL": "<url>",
        "INSFORGE_API_KEY": "<key>"
      }
    }
  }
}
```

### Verificación segura
- Verificar conexión al servidor.
- Listar capacidades disponibles (no ejecutar).
- Verificar health check.

### Nunca hacer
- No ejecutar operaciones contra datos vivos.
- No modificar esquemas sin autorización.
- No exponer INSFORGE_API_KEY.

### Rol estratégico
Backend agéntico. Escudo relacional. MCP-first. Nuevos desarrollos.

---

## 7. SEQUENTIAL-THINKING (Prioridad #2)

**Estado:** PRIORITY_PENDING_CONFIG → objetivo: PRIORITY_ACTIVE_READY

### Activación

```bash
npm install @anthropic/mcp-sequential-thinking
```

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-sequential-thinking"]
    }
  }
}
```

### Verificación segura
- Invocar pensamiento secuencial sobre problema hipotético.
- Verificar que el MCP responde sin errores.
- No involucrar datos reales.

### Rol estratégico
Razonamiento estructurado. Decisiones complejas. LOOP Engineering.

---

## 8. CHROME-DEVTOOLS (Prioridad #3)

**Estado:** PRIORITY_PENDING_CONFIG → objetivo: PRIORITY_ACTIVE_READY

### Activación

Requiere Chrome/Chromium instalado.

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@anthropic/chrome-devtools-mcp"]
    }
  }
}
```

### Verificación segura
- Abrir Chrome con página local.
- Inspeccionar DOM (solo lectura).
- No interactuar con producción.

### Nunca hacer
- No debuggear sitios de producción con datos de clientes.
- No modificar DOM de sitios vivos.
- No interceptar tráfico real.

### Rol estratégico
Debug real de navegador. Frontend runtime.

---

## 9. GITHUB (Prioridad #4)

**Estado:** PRIORITY_PENDING_CONFIG → objetivo: PRIORITY_ACTIVE_READY

### Activación

Requiere GitHub personal access token (classic o fine-grained).

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp"],
      "env": {
        "GITHUB_TOKEN": "<token>"
      }
    }
  }
}
```

### Verificación segura
- Listar repos (lectura).
- Verificar rate limit.
- NO crear issues/PRs sin autorización.

### Nunca hacer
- No hacer push automático sin autorización.
- No modificar branches protegidos.
- No exponer GITHUB_TOKEN.

### Rol estratégico
Trazabilidad. Branches. PRs. Issues. Soberanía de código.

---

## 10. FIRECRAWL-MCP (Prioridad #5)

**Estado:** PRIORITY_PENDING_CONFIG → objetivo: PRIORITY_ACTIVE_READY

### Activación

Requiere Firecrawl API key.

### Configuración (.mcp.json)

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "<key>"
      }
    }
  }
}
```

### Verificación segura
- Crawlear página de prueba pública (ej: example.com).
- Verificar que los resultados son correctos.
- No crawlear sitios con datos sensibles.

### Nunca hacer
- No crawlear sitios de clientes sin autorización.
- No exceder rate limits.
- No exponer FIRECRAWL_API_KEY.

### Rol estratégico
Ingesta de conocimiento externo. Knowledge District. Research verificable.

---

## 11. n8n MCP

**Estado:** PRIORITY_PENDING_DOCKER

### Requisitos

- Docker (DISPONIBLE — Docker 29.2.0)
- Instancia n8n corriendo
- API key de n8n (si aplica)
- Variables: N8N_API_URL, N8N_API_KEY, N8N_HOST, N8N_PORT

### Activación segura

1. Levantar n8n localmente con Docker (desarrollo, no producción):
   ```bash
   docker run -d --name n8n-dev -p 5678:5678 \
     -v n8n_data:/home/node/.n8n \
     -e N8N_SECURE_COOKIE=false \
     n8nio/n8n
   ```

2. Verificar que la instancia responde en `http://localhost:5678`.

3. Configurar MCP en `.mcp.json` con las variables apropiadas.

4. Verificar conexión MCP → n8n sin ejecutar workflows reales.

### Verificación segura
- Listar workflows (lectura).
- Verificar health check de n8n.
- NO ejecutar workflows.
- NO modificar workflows existentes.

### Nunca hacer
- No ejecutar workflows contra producción.
- No usar credenciales reales sin autorización.
- No modificar workflows de clientes.
- No crear automatizaciones que envíen emails, mensajes, cobros, webhooks.
- No exponer API keys.

---

## 12-16. MCPs RESTANTES (svgmaker, stripe, sentry, perplexity, brave-search)

**Estado:** PENDING_KEY o PENDING_CONFIG

### Acción
Preparar configuración cuando se obtengan las keys correspondientes.
No usar APIs reales sin key y autorización.

---

## QUÉ NUNCA HACER (TODOS LOS MCPs)

1. No activar MCPs contra producción sin autorización explícita.
2. No usar credenciales reales sin autorización.
3. No exponer secretos en logs, commits, o configuraciones commiteadas.
4. No ejecutar operaciones destructivas (DELETE, DROP, TRUNCATE).
5. No enviar emails, mensajes, cobros reales.
6. No modificar datos de clientes.
7. No commitear `.mcp.json` con keys reales (usar `.mcp.json.example` o variables de entorno).
8. No asumir que un MCP "debería funcionar" sin verificación.
9. No ignorar errores de conexión — documentar y escalar.
10. No activar MCPs no listados en Equipment Registry sin registro previo.

---

_Fin del MCP Activation Runbook v1.0.0_
