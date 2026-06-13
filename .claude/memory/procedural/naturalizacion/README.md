# NATURALIZATION FRAMEWORK

> Tipo: procedural/naturalizacion
> Version: 1.0.0
> Creado: 2026-06-13
> Autoridad: Governance Level 2, Seccion 6

---

## 1. QUE ES LA NATURALIZACION

La naturalizacion es el proceso por el cual una herramienta, plataforma o servicio externo se integra formalmente en CURDEECLAU.

No es integracion tecnica. No es conexion de APIs. No es escribir codigo.

Es el acto institucional de declarar que un activo externo tiene una relacion definida, gobernada y documentada con la civilizacion.

La naturalizacion es ejecutada por **La Aduana** bajo el Principio I (Soberania de la Civilizacion) y el Principio IV (Separacion de Principio y Herramienta).

---

## 2. TIPOS DE RELACION CON CURDEECLAU

| Relacion | Definicion | Ejemplo |
|----------|-----------|---------|
| **Nativo** | Construido dentro de CURDEECLAU, gobernado por Pekin, codigo en el monorepo | `calendar-engine`, `shared` |
| **Naturalizado** | Externo, integrado con adapter + ficha completa. Pekin gobierna su uso. | GHL (via `ghl-engine`) |
| **Aliado** | Externo, utilizado pero no completamente integrado. Se evalua naturalizar. | Vercel, GitHub |
| **Referenciado** | Externo, documentado como antecedente o inspiracion. Sin integracion activa. | Paper academico, articulo |
| **Archivado** | Antes nativo o naturalizado, ahora preservado historicamente. | `quiniela-engine` (remote) |

---

## 3. RELACION CON EL SISTEMA PEKIN

| Componente Pekin | Rol en la naturalizacion |
|------------------|--------------------------|
| **Governance Level 2** | Define las reglas de naturalizacion (Seccion 6) |
| **Pekin** | Autoridad que gobierna el uso de activos naturalizados |
| **La Aduana** | Ejecuta el proceso de naturalizacion |
| **Legoland** | Cataloga los adapters resultantes de la naturalizacion |
| **La Academia** | Extrae principios de las herramientas naturalizadas |
| **La Forja** | Implementa harnesses sobre herramientas naturalizadas |
| **Productos/Verticales** | Consumen activos naturalizados a traves de adapters |
| **Agentes** | Pueden proponer naturalizaciones; no pueden ejecutarlas sin autorizacion |

---

## 4. PROCESO DE NATURALIZACION

El proceso completo tiene 8 pasos:

1. **Identificar el activo.** Nombre, proveedor, tipo, version, documentacion oficial.
2. **Definir la relacion con CURDEECLAU.** Nativo, Naturalizado, Aliado, Referenciado, Archivado.
3. **Documentar el proposito.** Que problema resuelve para CURDEECLAU. Que principio encarna.
4. **Documentar capacidades.** Que hace. Que ofrece. Que APIs expone.
5. **Documentar riesgos.** Que pasa si desaparece. Que pasa si cambia de pricing. Que datos maneja.
6. **Documentar relacion con patrones.** Que patrones de Pekin implementa o requiere.
7. **Decidir estado institucional.** Proposed, Naturalized, Allied, Deprecated.
8. **Registrar.** Crear ficha en este directorio. Actualizar MEMORY.md si es significativo.

---

## 5. CRITERIOS MINIMOS DE ACEPTACION

Para que un activo sea considerado **Naturalizado** (no solo Aliado), debe cumplir:

- [ ] Ficha de naturalizacion completa en `procedural/naturalizacion/`
- [ ] Adapter implementado en `packages/` que envuelve el SDK del proveedor
- [ ] Implementacion InMemory funcional para tests
- [ ] Tests que pasan sin conexion al proveedor real
- [ ] El provider no se importa directamente desde `src/core/` de ningun engine
- [ ] Principio extraido documentado (que aporta, independientemente del proveedor)
- [ ] Plan de contingencia documentado (que hacer si el proveedor desaparece)

Un activo que no cumple estos criterios es **Aliado** (se usa, pero no esta naturalizado) o **Referenciado** (se conoce, pero no se integra).

---

## 6. INVENTARIO DE FICHAS

| Activo | Tipo | Estado | Ficha |
|--------|------|--------|-------|
| GHL | External Platform / CRM | Allied (candidate) | `ghl.md` |
| Telegram | External Channel | Naturalized Candidate | `telegram.md` |
| Supabase | External Platform / Persistence | Naturalized Candidate | `supabase.md` |
| OpenAI | External AI Provider | Allied (candidate) | `openai.md` |
| Pinecone | External Vector Database | Referenced (candidate) | `pinecone.md` |

---

*Fin del Naturalization Framework README v1.0.0*
