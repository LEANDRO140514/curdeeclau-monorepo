# @curdeeclau/semantic-memory

Persistent cross-session memory for AI chat apps.

Extracts structured facts from conversations, scores them by trust, and retrieves them across sessions — so your AI assistant remembers what matters without you repeating yourself.

Inspired by the memory patterns of Hermes Agent (FTS, trust scoring, cross-session retrieval), implemented natively in TypeScript + Supabase PostgreSQL.

---

## Core Concepts

- **Facts** — structured claims extracted from each conversation turn (`preference`, `decision`, `constraint`, `objective`, `task`, `observation`, `relationship`)
- **Trust Score** — starts at 1, increments each time the same fact is mentioned again (cap 10). Deduplication is atomic via PostgreSQL upsert.
- **Cross-Session Retrieval** — on each new turn, relevant facts from previous sessions are injected into the system prompt automatically
- **FTS** — PostgreSQL `tsvector` + GIN indexes. No embeddings, no extra cost.

---

## Schema (V1)

Every fact is scoped by three optional dimensions:

| Field | Required | Description |
|-------|----------|-------------|
| `userId` | ✅ | The authenticated user |
| `contextId` | optional | Vertical-defined second dimension: org, workspace, subaccount, team, project… |
| `sessionId` | optional | The chat session this fact was extracted from |

> `scopeId` is reserved for a future V2 when a real multi-scope use case emerges.

---

## Migrations

Run in order. Only `001` is required.

| File | Required | Description |
|------|----------|-------------|
| `001_semantic_memory.sql` | ✅ Core | `sm_memory_facts` table + FTS indexes + `sm_upsert_memory_fact` + `sm_search_memory_facts` RPCs |
| `002_chat_messages_adapter.sql` | Optional | `sm_chat_messages` table + FTS trigger + `sm_search_chat_messages` RPC. Use only if your vertical has no existing messages table. |

Apply via Supabase SQL Editor or migration runner:

```sql
-- Required
\i migrations/001_semantic_memory.sql

-- Optional — only if you need built-in message storage
\i migrations/002_chat_messages_adapter.sql
```

---

## Installation

```json
// package.json of any app in the monorepo
{
  "dependencies": {
    "@curdeeclau/semantic-memory": "workspace:*"
  }
}
```

Peer dependencies required in the consuming app:

```
@ai-sdk/openai >= 1.0.0
@supabase/supabase-js >= 2.0.0
ai >= 4.0.0
zod >= 3.0.0
```

---

## Usage

### 1. Initialize

```typescript
import { createSemanticMemory } from '@curdeeclau/semantic-memory'

const memory = createSemanticMemory({
  supabase,           // your SupabaseClient
  ai: {
    apiKey: process.env.AI_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1', // any OpenAI-compatible endpoint
    model: 'openai/gpt-4o-mini',             // lightweight model for extraction
  },
  // Optional overrides:
  factTypes: ['preference', 'decision', 'constraint', 'objective', 'task', 'observation', 'relationship'],
  ftsLanguage: 'spanish',         // PostgreSQL text search language
  extractionPrompt: undefined,    // use custom prompt template (see below)
})
```

### 2. Extract facts after each response (fire-and-forget)

```typescript
// In your chat route, after streaming the AI response:
memory.extractAndSave({
  userId: user.id,
  contextId: orgId,       // optional — pass your vertical's second dimension
  sessionId: session.id,  // optional
  userMessage,
  aiResponse,
})
// Never throws. Runs async after response has started streaming.
```

### 3. Inject cross-session context before generating

```typescript
// In your chat route, before building the system prompt:
const memoryContext = await memory.getCrossSessionContext({
  userId: user.id,
  contextId: orgId,
  sessionId: session.id,
  userQuery: lastUserMessage, // used for FTS on specific queries
})

// memoryContext is a formatted string or '' if no facts found.
// Append to your system prompt:
const systemPrompt = buildSystemPrompt() + memoryContext
```

### 4. Custom fact types per vertical

```typescript
// Dental AI vertical
const memory = createSemanticMemory({
  ...baseConfig,
  factTypes: ['preference', 'treatment_history', 'allergy', 'appointment', 'constraint'],
  extractionPrompt: `You are extracting facts for a dental clinic AI assistant...
  
  Fact types:
  - preference: patient communication preferences
  - treatment_history: past treatments or procedures
  - allergy: allergies or contraindications
  - appointment: scheduling facts and preferences
  - constraint: hard restrictions (e.g., "cannot open wide")
  
  Conversation:
  User: {{userMessage}}
  Assistant: {{aiResponse}}
  
  Respond with: { "facts": [{ "factText": string, "factType": string, "confidence": number }] }`,
})
```

### 5. Custom ftsLanguage

```typescript
// English vertical
const memory = createSemanticMemory({
  ...baseConfig,
  ftsLanguage: 'english',
})
```

### 6. Optional chat messages adapter (requires migration 002)

```typescript
import { createChatMessagesAdapter } from '@curdeeclau/semantic-memory'

const chatAdapter = createChatMessagesAdapter({ supabase, ai })

// Full-text search across all stored messages:
const results = await chatAdapter.searchConversations({
  userId: user.id,
  contextId: orgId,
  query: 'workflow configuración leads',
  limit: 10,
})
```

---

## Default Fact Types

```typescript
import { DEFAULT_FACT_TYPES } from '@curdeeclau/semantic-memory'
// ['preference', 'decision', 'constraint', 'objective', 'task', 'observation', 'relationship']
```

Extend for your vertical by passing `factTypes` in config. Unknown types from the LLM fall back to the last type in the array (`'relationship'` by default).

---

## Verticals using this package

- Jewel GHL (planned migration)
- Universidad Latino (planned)
- Algorithmus (planned)
- Dental AI (planned)
- PORKYRIOS (planned)

---

## Architecture

```
createSemanticMemory(config)
  ├── buildExtractor(config)   — LLM fact extraction (fire-and-forget)
  ├── buildStore(config)       — Supabase upsert + FTS search
  └── getCrossSessionContext() — system prompt injection

createChatMessagesAdapter(config)  [optional, requires migration 002]
  └── searchConversations()   — FTS across sm_chat_messages
```

---

*Part of the CURDEECLAU monorepo. Vertical-agnostic infrastructure — no GHL, no app-specific logic.*
