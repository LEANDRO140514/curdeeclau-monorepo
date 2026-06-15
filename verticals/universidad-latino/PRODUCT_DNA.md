# Universidad Latino — Product DNA

> Tipo: vertical/dna
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: UV-0, UV-1, UV-2

---

## 1. NOMBRE

**Universidad Latino AI Admissions** — Asistente conversacional de admisiones + captura de leads + sincronizacion GHL.

---

## 2. VERTICAL

Universidad Latino (educacion superior)

---

## 3. PROPOSITO

Convertir prospectos interesados en carreras universitarias en leads calificados dentro de GHL, usando un asistente IA como primer punto de contacto y sincronizando automaticamente con el CRM para seguimiento comercial.

---

## 4. USUARIO OBJETIVO

Prospectos de Universidad Latino — personas interesadas en estudiar una carrera universitaria.

---

## 5. COMPONENTES

| Componente | Fase | Estado |
|-----------|------|--------|
| UV-0 Demo Scope | UV-0 | CLOSED |
| LeadCaptureService | UV-1 | IMPLEMENTED |
| AIAdmissionsAssistant | UV-2 | En progreso |
| Demo integrada | UV-DEMO | Pendiente |

---

## 6. FLUJO

Prospecto → AI Assistant → LeadCaptureService → GHL → Pipeline → Seguimiento comercial

---

## 7. CANALES

WhatsApp (YCloud existente), Web Chat (futuro)

---

## 8. DEPENDENCIAS CURDEECLAU

- LLMProvider / LLMRouter
- LeadCaptureService
- GHLClient (ghl-engine)
- LeadsRepository (Postgres)

---

## 9. NO DEPENDE DE

- OpenAI, Anthropic, DeepSeek, OpenRouter directamente
- CRM Engine (LeadCaptureService es independiente)
- PWA / apps/

---

*Fin del Product DNA v1.0.0*
