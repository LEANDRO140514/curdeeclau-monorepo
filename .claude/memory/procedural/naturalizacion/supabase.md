# SUPABASE — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-13

---

## 1. NOMBRE DEL ACTIVO

Supabase — Plataforma de backend como servicio (BaaS): base de datos PostgreSQL, autenticacion, storage, edge functions.

---

## 2. TIPO DE ACTIVO

External Platform / Persistence

---

## 3. ESTADO INSTITUCIONAL

Naturalized Candidate

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [x] Naturalizado (candidato — Supabase es usado directamente como backend)
- [ ] Aliado
- [ ] Referenciado
- [ ] Archivado

---

## 5. PROPOSITO

Supabase provee la capa de persistencia principal de CURDEECLAU: base de datos PostgreSQL, autenticacion de usuarios, y potencialmente edge functions y storage.

**Principio que encarna:** Supabase implementa el concepto de "persistencia administrada". Pekin extrae el principio de "persistence provider agnostico" — los engines deben poder operar contra cualquier PostgreSQL, no solo Supabase.

**Si no existiera:** CURDEECLAU usaria PostgreSQL auto-administrado, Railway, Neon, o cualquier otro provider Postgres. La capa de datos usa SQL estandar y migraciones; el acoplamiento es bajo.

---

## 6. CAPACIDADES PRINCIPALES

1. PostgreSQL database — Estado: En uso (schema en `algorithmus-core-engine/src/infra/postgres/`)
2. Row Level Security — Estado: Candidato
3. Auth (Supabase Auth) — Estado: Planeado / No verificado
4. Storage (Supabase Storage) — Estado: Candidato
5. Edge Functions — Estado: Candidato
6. Realtime subscriptions — Estado: Candidato

---

## 7. CAPACIDADES NO ASUMIDAS

- Supabase Studio UI (utilizado para administracion, no como producto)
- Supabase Vector (Pinecone es el proveedor vectorial actual)
- Supabase GraphQL (no utilizado)

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en Supabase? |
|--------------|-------------|---------------------------|--------------------------|
| Leads y contactos | Alto | Si (es el almacen principal) | Si |
| Mensajes de usuarios | Alto | Si | Si |
| Estado de conversaciones | Medio | Si | Si |
| Knowledge base / FAQs | Bajo | Si | Si |
| Credenciales de auth | Critico | No (gestionado por Supabase Auth si se usa) | Si |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Base de datos principal. Historial completo de datos operativos.
- Como se reemplaza: Migracion a PostgreSQL auto-administrado, Railway, Neon, o RDS. Backups regulares requeridos.
- Tiempo estimado de migracion: 1-2 semanas (dependiendo del volumen de datos)

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Alta. Supabase es estable y open source.
- Frecuencia de breaking changes: Baja. La API de PostgreSQL es estandar.
- Costo actual: No documentado en el repo
- Sensibilidad al costo: Media (hay alternativas open source y auto-administradas)

### 9.3 Riesgo de seguridad

- Datos sensibles: Datos personales de leads, mensajes, conversaciones
- Cumplimiento: Depende de la jurisdiccion. Supabase ofrece cumplimiento SOC 2.
- Historial de incidentes: Bajo. Supabase tiene historial de seguridad aceptable.

### 9.4 Riesgo de acoplamiento

- Nivel: Bajo-Medio
- Justificacion: Se usa PostgreSQL estandar con migraciones SQL. La capa de datos (`supabase_client.ts`) es un punto unico que podria adaptarse a otro provider Postgres. Sin embargo, si se usan features propietarias de Supabase (Auth, Realtime, Edge Functions), el acoplamiento sube.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependen de Supabase:**
- `algorithmus-core-engine` — cliente Supabase, migraciones, schema
- `semantic-memory` — almacenamiento de memoria semantica
- `telegram-provider` — persistencia de leads via PostgresCRMProvider

**Dependencias externas:**
- Supabase project (URL + anon key + service_role key)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — `supabase_client.ts` actua como punto de acceso
- [ ] Event Pattern (no directamente)
- [ ] Engine Pattern (no directamente)
- [ ] Ownership Pattern (no directamente)

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `algorithmus-core-engine` | Consumidor principal | En uso |
| `semantic-memory` | Consumidor (persistencia) | En uso |
| `telegram-provider` | Consumidor (PostgresCRMProvider) | En uso |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | En uso (datos de pacientes, knowledge base) |
| AdmissionFlow | Candidato |

---

## 14. REGLAS DE USO

1. Toda conexion a Supabase debe pasar por el cliente centralizado (`supabase_client.ts` o equivalente).
2. Usar migraciones SQL para cambios de schema; no modificar la base manualmente.
3. No usar features propietarias de Supabase sin evaluar el impacto en el plan de contingencia.
4. Backups regulares. Verificar restauracion periodicamente.

---

## 15. REGLAS DE SEGURIDAD

1. Supabase URL y keys en variables de entorno, nunca en codigo.
2. Service role key solo en backend; nunca exponer al frontend.
3. Row Level Security para datos multitenant.
4. No loguear queries con datos sensibles.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: Existe (`algorithmus-core-engine/src/infra/postgres/`, `supabase_client.ts`)
- [ ] Implementacion InMemory: No existe (la persistencia no se reemplaza con InMemory en produccion)
- [ ] Tests sin conexion al proveedor: Parcial (algunos tests usan base local)
- [x] Principio extraido documentado: Si (persistence provider agnostico)
- [x] Plan de contingencia: Si (migrar a otro PostgreSQL)

---

## 17. ESTADO DE IMPLEMENTACION

- [ ] No iniciado
- [ ] En progreso
- [x] Funcional (requiere proveedor)
- [ ] Funcional (alternativa local para desarrollo)
- [ ] Completo y verificado

---

## 18. DECISION

Proceder con naturalizacion como **Naturalized**. Supabase es el backend principal. El acoplamiento es bajo porque se usa PostgreSQL estandar con migraciones. El plan de contingencia es claro (migrar a otro provider Postgres). Pendiente: auditoria de features propietarias en uso (Auth, Realtime, Edge Functions).

---

## 19. PROXIMO PASO AUTORIZADO

Auditar uso de features propietarias de Supabase. Si solo se usa PostgreSQL estandar, declarar Naturalized. Si se usan features propietarias, evaluar extraer abstracciones.

---

*Fin de la ficha Supabase v1.0.0*
