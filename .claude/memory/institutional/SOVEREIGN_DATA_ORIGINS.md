# SOVEREIGN DATA ORIGINS

> Tipo: institutional
> Versión: 1.0.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-16
> Ratificado por: Asamblea de Pekín mediante GOV-1
> Deriva de: Constitución de Pekín, Principio I (Soberanía), Principio IV (Separación Principio-Herramienta)

---

## I. LEY DE LOS DOS ORÍGENES

CURDEECLAU reconoce dos orígenes de datos soberanos. No compiten. Coexisten.

### 1. Supabase/PostgreSQL Institucional

| Atributo | Valor |
|----------|-------|
| **Estado** | ACTIVO / GOBERNADO |
| **Naturaleza** | Relacional, humana, consolidada |
| **Clientes** | Existentes, con datos vivos |
| **Esquemas** | Consolidados |
| **Uso** | Backend de productos existentes, datos de clientes, RLS, migraciones gobernadas |
| **Gobierno** | Pekín → Senado → ADR para cambios estructurales |

### 2. Insforge Agéntico

| Atributo | Valor |
|----------|-------|
| **Estado** | PRIORITY_ACTIVE_TARGET |
| **Naturaleza** | Backend agéntico, MCP-first, loops autónomos |
| **Clientes** | Nuevos desarrollos |
| **Esquemas** | A definir con ADR |
| **Uso** | Nuevos desarrollos de agentes, persistencia MCP, backend autónomo |
| **Gobierno** | Pekín → Senado → ADR para adopción estructural |

---

## II. PRINCIPIO DE COEXISTENCIA

1. **No hay sustitución automática.** Insforge no reemplaza a Supabase. Supabase no bloquea a Insforge.
2. **No hay guerra entre orígenes.** Ambos son equipamiento gobernado de Pekín.
3. **El origen se respeta.** Si un producto nació en Supabase, sigue en Supabase hasta que un ADR autorice migración.
4. **El uso se gobierna.** Cada origen se usa según contexto, no por dogma.

---

## III. CUÁNDO USAR CADA ORIGEN

### Usar Supabase/PostgreSQL cuando:

- El producto ya existe sobre Supabase.
- Se requiere base relacional con RLS.
- Los datos son de clientes existentes.
- La vertical ya nació con ese origen.
- Se necesita SQL, migraciones, esquemas consolidados.

### Usar Insforge cuando:

- Es un nuevo desarrollo agéntico.
- Forge lo requiere explícitamente.
- Una skill lo requiere.
- Un MCP lo requiere.
- El backend necesita loops autónomos y MCP-first.
- Se requiere escalabilidad agéntica nativa.

---

## IV. REGLAS DE USO

### Reglas para Supabase/PostgreSQL

1. **Permitido:** Leer esquemas, ejecutar SELECT, consultar datos de desarrollo.
2. **Permitido bajo gobernanza:** Crear migraciones, modificar esquemas (con ADR), RLS policies.
3. **Prohibido sin autorización:** SQL destructivo (DROP, TRUNCATE, DELETE masivo), alterar esquemas consolidados, tocar producción.
4. **Prohibido siempre:** Exponer connection strings, commitear `.env`, migrar bases vivas por estética.

### Reglas para Insforge

1. **Permitido:** Verificar health check, listar capacidades, probar en desarrollo.
2. **Permitido bajo gobernanza:** Configurar MCP, crear esquemas nuevos, desarrollar contra instancia de desarrollo.
3. **Prohibido sin autorización:** Operar contra datos vivos, modificar esquemas de producción, ejecutar operaciones masivas.
4. **Prohibido siempre:** Exponer API keys, commitear credenciales, asumir que Insforge reemplaza a Supabase.

---

## V. REGLAS COMUNES A AMBOS ORÍGENES

1. **No SQL destructivo sin autorización explícita.** DROP, TRUNCATE, DELETE sin WHERE — nunca sin permiso.
2. **No tocar producción sin autorización explícita.** Producción es tierra sagrada.
3. **No alterar esquemas consolidados sin ADR.** Todo cambio estructural requiere decisión documentada.
4. **No migrar bases vivas por estética.** Cambiar nombres de columnas, tipos, o estructura "para que quede mejor" sin necesidad funcional — prohibido.
5. **No exponer connection strings.** Secrets en `.env` local, nunca commiteados.
6. **No ejecutar operaciones masivas sin plan, respaldo y rollback.** Si afecta más de N filas, requiere plan documentado.

---

## VI. CORRECCIÓN DOCTRINAL

**Doctrina previa corregida:**

Antes de GOV-1, existía la percepción de que Supabase/PostgreSQL debía ser restringido y usado solo como respaldo. Esto era incorrecto.

**Doctrina actual (GOV-1):**

Supabase/PostgreSQL es equipamiento activo gobernado. Se usa cuando el contexto lo requiere. No se bloquea por dogma. Se gobierna por principios.

La restricción no es sobre Supabase. La restricción es sobre:
- No tocar producción sin autorización.
- No SQL destructivo sin autorización.
- No exponer secretos.
- No alterar esquemas consolidados sin ADR.

Estas restricciones aplican a **ambos orígenes por igual.**

---

## VII. RELACIÓN CON FORGE Y MCPs

- **Forge** puede requerir Supabase o Insforge según el proyecto. La elección es técnica, no dogmática.
- **MCPs** que requieren base de datos (supabase MCP, insforge MCP) deben ser configurados con credenciales de desarrollo, no de producción.
- **Skills** que necesitan persistencia deben declarar qué origen usan y por qué.

---

## VIII. CIERRE

Los datos son del Imperio. No del proveedor. No del ORM. No de la plataforma.

La soberanía de datos significa:
- Los datos se poseen (CURDEECLAU es dueño).
- Los datos se respaldan (PostgreSQL backups).
- Los datos se migran (si un proveedor desaparece, los datos se preservan).
- Los datos se gobiernan (con ADR, con Senado, con principios).

Ni Supabase ni Insforge son dueños de los datos.
Ambos son herramientas.
Pekín gobierna ambas.

---

_Fin de Sovereign Data Origins v1.0.0_
_Ratificada por GOV-1 el 16 de junio de 2026_
