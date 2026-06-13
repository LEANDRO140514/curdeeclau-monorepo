# TELEGRAM — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-13

---

## 1. NOMBRE DEL ACTIVO

Telegram Bot API — Plataforma de mensajeria y canal conversacional.

---

## 2. TIPO DE ACTIVO

External Channel

---

## 3. ESTADO INSTITUCIONAL

Naturalized Candidate

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [x] Naturalizado (candidato — existe `telegram-provider` como adapter funcional)
- [ ] Aliado
- [ ] Referenciado
- [ ] Archivado

---

## 5. PROPOSITO

Telegram provee el canal de entrada conversacional para usuarios que interactuan con agentes de CURDEECLAU. Es el medio de transporte de mensajes, no el destino de los datos.

**Principio que encarna:** Telegram implementa el concepto de "canal de mensajeria externo". Pekin extrae el principio de "channel provider agnostico" — el motor conversacional no debe saber si el mensaje llego por Telegram, WhatsApp o web.

**Si no existiera:** Se usaria otro canal (WhatsApp, web chat, SMS). El `telegram-provider` emite `DomainEvent` canonicos que el `workflow-orchestrator` consume. Cambiar de canal requiere un nuevo adapter, no reescribir engines.

---

## 6. CAPACIDADES PRINCIPALES

1. Inbound message polling — Estado: En uso (via `TelegramProvider.ts`)
2. DomainEvent emission on message receipt — Estado: En uso
3. AdmissionFlow integration — Estado: En uso (via `AdmissionFlow.ts`)
4. GHL lead sync from Telegram — Estado: En uso (via `GHLSyncService.ts`)
5. Postgres CRM persistence — Estado: En uso (via `PostgresCRMProvider.ts`)
6. Outbound message sending — Estado: Planeado / No verificado

---

## 7. CAPACIDADES NO ASUMIDAS

- Telegram inline queries (no utilizado)
- Telegram payments API (no utilizado)
- Telegram games API (no utilizado)
- Telegram group/channel management (no utilizado como admin)
- Telegram voice/video calls (no utilizado)

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en Telegram? |
|--------------|-------------|---------------------------|--------------------------|
| Mensajes de usuario | Alto | Si (Postgres CRM) | Si (servidores Telegram) |
| IDs de usuario de Telegram | Medio | Si | Si |
| Metadatos de chat | Bajo | Si | Si |
| Leads capturados | Alto | Si | No |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Canal de mensajeria Telegram
- Como se reemplaza: WhatsApp (via `algorithmus-platform`), web chat, u otro canal. El `telegram-provider` emite eventos canonicos; otro adapter los emitiria igual.
- Tiempo estimado de migracion: 1-2 semanas para adapter de canal alternativo

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Alta. Telegram Bot API es estable y gratuita.
- Frecuencia de breaking changes: Muy baja
- Costo actual: Gratuito (Telegram Bot API)
- Sensibilidad al costo: Baja

### 9.3 Riesgo de seguridad

- Datos sensibles: Mensajes de usuarios, leads, datos personales compartidos en chat
- Cumplimiento: Depende del vertical y la jurisdiccion
- Historial de incidentes: Bajo. Telegram tiene historial de seguridad aceptable para Bots.

### 9.4 Riesgo de acoplamiento

- Nivel: Bajo
- Justificacion: `telegram-provider` emite `DomainEvent` canonicos. El orchestrator no sabe que el mensaje vino de Telegram. Cambiar de canal no afecta la logica de negocio.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependen de Telegram:**
- `telegram-provider` — adapter principal
- `workflow-orchestrator` — consume eventos emitidos por el provider
- `crm-engine` — recibe leads capturados via Telegram

**Dependencias externas:**
- Telegram Bot API (https://core.telegram.org/bots/api)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — `telegram-provider` es un provider de canal
- [x] Event Pattern — Emite `DomainEvent` en cada mensaje recibido
- [x] Engine Pattern — Consumido por engines via orchestrator
- [ ] Ownership Pattern

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `telegram-provider` | Adapter principal | En uso |
| `workflow-orchestrator` | Consumidor de eventos | En uso |
| `ghl-engine` | Sync de leads hacia GHL | En uso |
| `crm-engine` | Persistencia de leads | En uso |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | En uso (canal de entrada de pacientes) |
| AdmissionFlow | Candidato (canal de admision) |

---

## 14. REGLAS DE USO

1. Toda interaccion con Telegram Bot API debe pasar por `telegram-provider`.
2. Los mensajes deben convertirse a `DomainEvent` canonicos antes de entrar al orchestrator.
3. No exponer el Bot Token en logs, errores ni codigo fuente.

---

## 15. REGLAS DE SEGURIDAD

1. Bot Token en variable de entorno, nunca en codigo.
2. Validar que los updates vienen de Telegram (no suplantacion).
3. No loguear contenido de mensajes de usuarios.
4. Limpiar datos de usuario bajo solicitud (compliance con GDPR si aplica).

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: Existe (`telegram-provider/src/TelegramProvider.ts`)
- [ ] Implementacion InMemory: No existe (el canal es inherentemente externo)
- [ ] Tests sin conexion al proveedor: No verificados
- [x] Principio extraido documentado: Si (channel provider agnostico)
- [x] Plan de contingencia: Si (cambiar a WhatsApp u otro canal)

---

## 17. ESTADO DE IMPLEMENTACION

- [ ] No iniciado
- [ ] En progreso
- [x] Funcional (requiere proveedor)
- [ ] Funcional (InMemory — no aplica para canal)
- [ ] Completo y verificado

---

## 18. DECISION

Proceder con naturalizacion como **Naturalized**. El adapter existe, funciona, emite eventos canonicos, y el plan de contingencia es claro. El unico criterio pendiente es verificacion de tests.

---

## 19. PROXIMO PASO AUTORIZADO

Verificar tests del `telegram-provider`. Si pasan, declarar Naturalized formalmente en `estado-actual.md`.

---

*Fin de la ficha Telegram v1.0.0*
