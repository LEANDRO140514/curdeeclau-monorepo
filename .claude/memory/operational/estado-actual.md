# ESTADO ACTUAL

> Tipo: operational
> Versión: 1.0.0
> Creado: 2026-06-11
> Autoridad vigente: Constitución de Pekín

---

## CHECKPOINT POST-ABSORCIÓN LEGACY

### Fundación de Pekín: CERRADA ✅

- Constitución, Principios, Instituciones ratificados (2026-06-07)
- ADN de Pekín registrado
- MEMORY.md como puerta de entrada universal
- DNA de 3 verticales + 2 productos registrados

### Absorción RT-1.5/OpenSpec: COMPLETADA ✅

| Fase | Alcance | Estado |
|------|---------|--------|
| Phase A | 7 documentos legacy marcados SUPERSEDIDO | ✅ Commiteado |
| Phase B | 5 patrones + catálogos absorbidos | ✅ Commiteado |
| Phase C | 4 auditorías + drift catalog absorbidos | ✅ Commiteado |
| Phase D | 6 referencias + convenciones absorbidas | ✅ Commiteado |
| Phase F | ADR-000 ratificado | ✅ Commiteado |

### Doble gobernanza: RESUELTA ✅

- Pekín es la única autoridad constitucional activa
- RT-1.5/OpenSpec supersedido como autoridad
- OpenSpec preservado como proceso técnico

---

## PHASE E — ARCHIVAL: COMPLETADA ✅

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Autoridad | ADR-000 |
| Commit | 4d8daa5 |
| Archivos movidos | 4 |
| Archivos creados | 1 (docs/archive/README.md) |
| Conocimiento eliminado | Cero |

---

## ORG-1A — REPOSITORY AUDIT: CLOSED ✅

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Reporte | `.claude/memory/operational/reports/org1a-synthesis-report.md` |
| Conclusión | CURDEECLAU-MONOREPO es el nombre correcto. Pekin es la autoridad. Legoland es el catalogo. No se autoriza mover codigo todavia. |

---

## ORG-1B — DOCUMENTATION CLEANUP: CLOSED ✅

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivos archivados | 3 |
| Archivos actualizados | MEMORY.md, estado-actual.md |
| Codigo modificado | Cero |

Detalle de archival:

| Origen | Destino |
|--------|---------|
| `STATE.md` | `docs/archive/STATE.superseded.md` |
| `docs/governance/README.md` | `docs/archive/governance-README.superseded.md` |
| `docs/governance/canonical-definitions.md` | `docs/archive/canonical-definitions.superseded.md` |

Preservado en ubicacion original:

| Archivo | Razon |
|---------|-------|
| `docs/governance/uv1-directive.md` | No tiene header de supersedencia. Contenido tecnico activo como referencia UV-1. |

---

## ORG-1C — OPERATIONAL REPORTS: CLOSED ✅

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Commit | 681d101 |
| Reportes preservados | 2 (adr-triage-report.md, org1a-synthesis-report.md) |
| Working tree | Limpio |

---

## GOV-1 — GOVERNANCE LEVEL 2: CLOSED ✅

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivo creado | `institutional/governance.md` |
| Contenido | 14 secciones: jerarquia, autoridades, tipos de activos, estados, naturalizacion, reglas de modificacion, movimiento de codigo, reglas para agentes, Legoland, Forge-Pro, productos, criterios de cierre, prohibiciones |
| Commit | Pendiente de commit |

---

## RESTRICCIONES ACTIVAS

- No mover codigo, packages, engines ni providers
- No renombrar paquetes ni carpetas
- No ejecutar topologia propuesta en ORG-1A sin ADR que la ratifique
- No crear nuevas capas de gobernanza fuera de `.claude/memory/`
- No cambiar remote sin autorizacion explicita
- UV-1 y AdmissionFlow sin cambios
- No iniciar PWA sin autorizacion

---

## ARCHIVO DE PEKIN — INVENTARIO

| Capa | Archivos |
|------|----------|
| `institutional/` | 5 (constitucion, principios, instituciones, governance, ADN pekin) |
| `institutional/dna/` | 6 (pekin + 3 verticales + 2 productos) |
| `institutional/adr/` | 1 (ADR-000) |
| `reference/` | 6 (catalogo-eventos, rt4-closure, legoland, uv1-directive, rt-1.6-drift) |
| `pattern/` | 6 (ownership, runtime, engine, orchestration, fsm-authority, +1) |
| `operational/` | 4 (estado-actual, drift-catalog, 2 auditorias) |
| `operational/reports/` | 2 (adr-triage-report, org1a-synthesis-report) |
| `procedural/` | 2 (invariant-conventions, openspec-process) |

---

## PENDIENTES DESTACADOS

- `procedural/naturalizacion/` (GHL, Telegram, Supabase, OpenAI, Pinecone)
- `procedural/runbooks/`
- `reference/mapa-sistemas.md`
- Templates de DNA para engines, providers, agentes

---

## SIGUIENTE LINEA RECOMENDADA

**NAT-1 — Naturalization Framework.** Poblar `procedural/naturalizacion/` con fichas de los providers activos (GHL, Telegram, Supabase, OpenAI, Pinecone), aplicando las reglas de naturalizacion definidas en Governance Level 2, Seccion 6.
- `procedural/runbooks/`
- `reference/mapa-sistemas.md`
- Templates de DNA para engines, providers, agentes
- Drifts D-001..D-004 activos requieren remediación (backlog de La Forja)
- 9 items diferidos RT-4 (E-1..E-9)
- Extracción de providers críticos (YCloud PL-1, Pinecone PL-2/PL-3)
- Math engine atrapado en quiniela app (AP-1)

---

*Fin del Estado Actual v1.0.0*
