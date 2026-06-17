# ESTADO DEL MONOREPO

> Tipo: governance/state — Nivel 7 (Jerarquía de Autoridad)
> Versión: 1.0.0 — GOV-0 Governance Baseline
> Creado: 2026-06-16
> Actualizado: 2026-06-16
> Autoridad: Senado de Pekín

---

## DECLARACIÓN DE ESTADO

### CURDEECLAU es Pekín

CURDEECLAU no es una app. CURDEECLAU no es un producto. CURDEECLAU no es Universidad Latino.

**CURDEECLAU es Pekín, la capital tecnológica del Imperio Algorithmus.**

Este monorepo contiene la civilización: su constitución, sus principios, sus instituciones, sus patrones, sus engines, sus providers, sus verticales y sus productos.

Universidad Latino es un vertical — un ciudadano comercial dentro de la civilización. No es la civilización misma.

---

## ESTADO DE VERTICALES Y PRODUCTOS

### Universidad Latino — Vertical Comercial Validado

| Fase | Commit | Estado |
|------|--------|--------|
| UV-0 | `82c1f36` | **CLOSED** — Alcance documental |
| UV-1 | `66fe18f` | **VALIDATED** — Lead Capture + GHL Sync (36 tests) |
| UV-2 | `2f69c00` | **VALIDATED** — AI Admissions Assistant (25 tests) |
| UV-DEMO | `6aeae4a` | **VALIDATED** — Demo comercial integrada (10 tests) |
| UV-CLOSE | `f2f965c` | **CLOSED** — Cierre documental |
| UV-TELEGRAM | `411bfce` | **VALIDATED** — Canal Telegram (18 tests) |
| UV-KB-1 | `5dbf238` | **CLOSED** — Knowledge base con datos reales del cliente |
| UV-LIVE mock | `111d79b` | **VALIDATED** — 5 casos mock OK, 216 tests |
| UV-LIVE real | — | **BLOCKED** — `TELEGRAM_BOT_TOKEN` no configurado |

### Canales

| Canal | Estado | Condición para activar |
|-------|--------|------------------------|
| **Telegram** | Canal de prueba activo (mock). Live bloqueado. | Configurar `TELEGRAM_BOT_TOKEN` |
| **WhatsApp** | **Diferido.** No abrir. | Requiere UV-LIVE real completado con evidencia |
| **GHL live** | **Pendiente de autorización.** | Requiere autorización explícita del fundador |

### Otros verticales y productos

| Entidad | Estado |
|---------|--------|
| Dental AI (Sarah) | Vertical registrado. DNA en institutional/dna/ |
| Quiniela | Producto registrado. DNA en institutional/dna/ |
| PORKYRIOS | Vertical/producto. Sin cambios pendientes. |
| Afropikal | Vertical/producto. Sin cambios pendientes. |

---

## RESTRICCIONES VIGENTES

Las siguientes restricciones están activas hasta nuevo aviso del Senado o la Asamblea:

1. **No abrir PWA / dashboard / app.** No existe autorización para construir frontends de usuario final.
2. **No reorganizar el monorepo.** La topología actual permanece. ORG-1 analizó pero no autorizó movimiento.
3. **No abrir WhatsApp.** El canal Telegram debe validarse primero.
4. **No activar GHL live.** Requiere autorización explícita.
5. **No mover carpetas funcionales.** packages/, apps/, verticals/ permanecen como están.
6. **No renombrar paquetes.**
7. **No crear nuevos repositorios** sin ADR que lo autorice.

---

## LÍNEA DE TIEMPO DE GOBERNANZA

| Fase | Fecha | Estado |
|------|-------|--------|
| Fundación de Pekín | 2026-06-07 | CLOSED |
| Absorción RT-1.5/OpenSpec | 2026-06-11 | CLOSED |
| ORG-1 (A/B/C) | 2026-06-13 | CLOSED |
| GOV-1 | 2026-06-13 | CLOSED |
| NAT-1 | 2026-06-13 | CLOSED |
| DNA-1 | 2026-06-13 | CLOSED |
| MAP-1 | 2026-06-13 | CLOSED |
| RUN-1 | 2026-06-13 | CLOSED |
| RISK-1 | 2026-06-13 | CLOSED |
| LLM Family (1-5, RTR-1) | 2026-06-14 | CLOSED |
| **GOV-0** | **2026-06-16** | **EN PROGRESO** |

---

## PRÓXIMA LÍNEA RECOMENDADA

1. **GOV-1 (próximo nivel de gobernanza)** — Refinar reglas, harnesses, y procedimientos operativos.
2. **UV-LIVE Real** — Cuando exista `TELEGRAM_BOT_TOKEN`, ejecutar validación real con los 5 casos de prueba.

---

## PRINCIPIO RECTOR

**No reorganizar el Imperio antes de escribir su Constitución.**

Primero gobierno.
Después arquitectura.
Después movimiento.

---

_Fin del STATE.md v1.0.0_
