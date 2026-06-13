# PINECONE — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-13

---

## 1. NOMBRE DEL ACTIVO

Pinecone — Base de datos vectorial administrada para busqueda semantica y retrieval.

---

## 2. TIPO DE ACTIVO

External Vector Database

---

## 3. ESTADO INSTITUCIONAL

Referenced (candidate for Naturalization)

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [ ] Naturalizado (candidato — existe integracion parcial)
- [ ] Aliado
- [x] Referenciado — Se conoce, se usa parcialmente. No completamente integrado.
- [ ] Archivado

---

## 5. PROPOSITO

Pinecone provee almacenamiento vectorial y busqueda semantica para CURDEECLAU. Es utilizado por el `knowledge-engine` para retrieval de conocimiento aumentado (RAG).

**Principio que encarna:** Pinecone implementa el concepto de "memoria vectorial externa". Pekin extrae el principio de "vector store provider agnostico" — el sistema debe poder cambiar de Pinecone a pgvector, Qdrant, o Weaviate sin reescribir la logica de retrieval.

**Si no existiera:** Se usaria pgvector (extension de PostgreSQL en Supabase), Qdrant, o Chroma. El `knowledge-engine` tiene una capa de abstraccion que podria adaptarse.

---

## 6. CAPACIDADES PRINCIPALES

1. Vector storage (embeddings) — Estado: En uso (via `knowledge-engine`)
2. Semantic search (k-NN) — Estado: En uso
3. Metadata filtering — Estado: Planeado / Candidato
4. Namespace isolation — Estado: Candidato
5. Serverless indexes — Estado: Candidato

---

## 7. CAPACIDADES NO ASUMIDAS

- Pinecone Assistant (no utilizado)
- Pinecone inference (no utilizado — embeddings los genera OpenAI)
- Pinecone collections (no utilizado)

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en Pinecone? |
|--------------|-------------|---------------------------|--------------------------|
| Embeddings de conocimiento | Bajo | No (solo en Pinecone) | Si |
| Metadatos de documentos | Medio | Parcial | Si |
| Texto original de documentos | Medio | Si (en Supabase o archivos) | No (solo vectors) |
| Consultas de usuarios | Alto | No | Si (para generar embeddings de busqueda) |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Indice vectorial. Capacidad de busqueda semantica.
- Como se reemplaza: pgvector (PostgreSQL), Qdrant (open source), o Chroma. Los embeddings pueden regenerarse desde los documentos originales.
- Tiempo estimado de migracion: 1-2 semanas (re-generar embeddings + cambiar adapter)

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Moderada. Pinecone ha cambiado su arquitectura (pod-based a serverless).
- Frecuencia de breaking changes: Baja-media
- Costo actual: No documentado en el repo
- Sensibilidad al costo: Media. Hay alternativas open source (pgvector, Qdrant)

### 9.3 Riesgo de seguridad

- Datos sensibles: Embeddings de conocimiento (no contienen texto plano directamente, pero pueden revelar patrones)
- Cumplimiento: Pinecone ofrece cumplimiento SOC 2
- Historial de incidentes: Bajo

### 9.4 Riesgo de acoplamiento

- Nivel: Medio
- Justificacion: El `knowledge-engine` tiene una capa de abstraccion parcial para Pinecone. Cambiar de vector store requiere modificar el adapter, pero la interfaz de retrieval (buscar por similitud) es generica.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependen de Pinecone:**
- `knowledge-engine` — cliente principal (embeddings, retrieval)
- `algorithmus-core-engine` — consume RAG via knowledge-engine

**Dependencias externas:**
- Pinecone API (https://api.pinecone.io)
- Pinecone SDK (`@pinecone-database/pinecone` npm package)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — Deberia implementarlo completamente
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `knowledge-engine` | Consumidor principal | En uso |
| `algorithmus-core-engine` | Consumidor indirecto (via knowledge-engine) | En uso |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | En uso (RAG de knowledge base dental) |

---

## 14. REGLAS DE USO

1. Toda interaccion con Pinecone debe pasar por el adapter en `knowledge-engine`.
2. Los embeddings deben poder regenerarse desde los documentos originales almacenados en Supabase.
3. No almacenar texto plano de documentos en Pinecone; solo vectores y metadatos minimos.

---

## 15. REGLAS DE SEGURIDAD

1. Pinecone API key en variable de entorno, nunca en codigo.
2. Usar namespaces para aislar verticales (dental, admission, etc.).
3. No exponer el indice vectorial publicamente.
4. Rotacion de API keys segun politica del proveedor.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: Existe (`knowledge-engine/src/`, `algorithmus-core-engine/src/infra/pinecone/`)
- [ ] Implementacion InMemory/Fake: No existe (posible con vector store en memoria para tests)
- [ ] Tests sin conexion al proveedor: No verificados
- [x] Principio extraido documentado: Si (vector store provider agnostico)
- [ ] Plan de contingencia: Parcial (migrar a pgvector es viable pero no esta documentado el procedimiento)

---

## 17. ESTADO DE IMPLEMENTACION

- [ ] No iniciado
- [ ] En progreso
- [x] Funcional (requiere proveedor)
- [ ] Funcional (InMemory para desarrollo)
- [ ] Completo y verificado

---

## 18. DECISION

Mantener como **Referenciado** por ahora. Pinecone se usa, pero:

- La integracion es parcial y podria migrarse a pgvector (ya que Supabase soporta pgvector)
- No hay urgencia en naturalizar porque el `knowledge-engine` tiene abstraccion parcial
- Evaluar si pgvector en Supabase puede reemplazar Pinecone completamente (simplificaria la infraestructura)

Si se decide mantener Pinecone a largo plazo, proceder con naturalizacion completa.

---

## 19. PROXIMO PASO AUTORIZADO

Evaluar viabilidad de migrar de Pinecone a pgvector (Supabase). Si no es viable, proceder con naturalizacion. Si es viable, archivar esta ficha y crear ficha de pgvector como Naturalized.

---

*Fin de la ficha Pinecone v1.0.0*
