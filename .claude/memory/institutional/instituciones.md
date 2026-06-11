# INSTITUCIONES FUNDACIONALES DE PEKÍN

> Tipo: institutional
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-07
> Revisado: 2026-06-07

---

Las instituciones son los sistemas que garantizan la operación, evolución y supervivencia de CURDEECLAU. No son features. No son carpetas. No son paquetes npm.

Son entidades vivas de la civilización. Cada una tiene propósito, responsabilidades, relaciones con otras instituciones, algo que protege y algo que produce.

---

## 1. EL ARCHIVO (Memory System)

### Propósito
Preservar todo lo que la civilización ha aprendido. Garantizar que ninguna decisión, patrón, principio o conocimiento se pierda.

### Responsabilidades
- Almacenar la memoria institucional, operacional, procedimental, de patrones y referencial.
- Proveer la estructura física y lógica del Archivo (`.claude/memory/`).
- Garantizar que todo documento tenga tipo, versión, fecha y propósito declarados.
- Gobernar el ciclo de vida del conocimiento (creación → consolidación → promoción → archivo).
- Ser la primera fuente consultada y la última actualizada en toda operación.

### Relación con otras instituciones
- **La Academia:** consume el Archivo para extraer conocimiento; escribe en él cuando institucionaliza.
- **El Senado:** consulta el Archivo antes de decidir; escribe decisiones en él.
- **Todas las demás:** leen del Archivo. Solo La Academia y El Senado escriben en `institutional/`.

### Qué protege
La continuidad del conocimiento a través de generaciones de agentes, modelos y tecnologías.

### Qué produce
- Documentos institucionales (`institutional/`)
- Registros operacionales (`operational/`)
- Procedimientos (`procedural/`)
- Patrones documentados (`pattern/`)
- Mapas y catálogos (`reference/`)
- MEMORY.md (índice central)

---

## 2. LA ACADEMIA (Knowledge System)

### Propósito
Convertir experiencia cruda en conocimiento estructurado, reusable y transmisible.

### Responsabilidades
- Operar el pipeline Experiencia → Observación → Decisión → Procedimiento → Skill → Patrón → Institución.
- Consolidar observaciones dispersas en decisiones.
- Extraer patrones de implementaciones múltiples.
- Proponer promociones a la Asamblea (Patrón → Institución).
- Realizar "Jardinería del Archivo": revisar, consolidar, limpiar.
- Garantizar que el conocimiento no se duplique ni se fragmente.

### Relación con otras instituciones
- **El Archivo:** es su fuente primaria de lectura y su destino de escritura.
- **La Forja:** colabora en la promoción Procedimiento → Skill → Patrón.
- **La Aduana:** recibe de La Academia el análisis de principios extraíbles de herramientas externas.
- **El Registro Civil:** recibe de La Academia el ADN validado para registrar.

### Qué protege
La calidad y coherencia del conocimiento institucional. Previene la dispersión y la duplicación.

### Qué produce
- Decisiones consolidadas
- Procedimientos validados
- Skills codificados
- Patrones extraídos
- Propuestas de institución para la Asamblea

---

## 3. EL CAUCE (Flow System)

### Propósito
Gobernar cómo se mueven datos, decisiones, eventos, leads y conocimiento a través de la civilización.

### Responsabilidades
- Definir canales, eventos, estados, compuertas y reglas de avance para todo flujo.
- Mantener el EventCatalog como fuente canónica de tipos de eventos.
- Garantizar trazabilidad extremo a extremo.
- Declarar niveles de autonomía para cada flujo (manual, semi-automático, automático, autónomo).
- Documentar cada flujo en `procedural/` con su especificación completa.

### Relación con otras instituciones
- **El Archivo:** todos los flujos están documentados en él.
- **El Observatorio:** monitorea los flujos; El Cauce define qué eventos emitir.
- **El Senado:** interpreta desviaciones de flujo y decide acciones correctivas.
- **La Forja:** implementa los harnesses que ejecutan los flujos.

### Qué protege
La previsibilidad y auditabilidad de cada movimiento de información en CURDEECLAU.

### Qué produce
- Especificaciones de flujo
- Catálogo de eventos (EventCatalog)
- Reglas de compuerta y avance
- Niveles de autonomía declarados

---

## 4. EL SENADO (Control System)

### Propósito
Interpretar la realidad operativa y decidir.

### Responsabilidades
- Responder: qué está pasando, qué significa, qué requiere atención, qué debe decidirse, qué debe escalarse, qué debe automatizarse.
- Consumir métricas e insights del Observatorio.
- Tomar decisiones operativas y tácticas.
- Escalar decisiones estratégicas a la Asamblea.
- Consultar el Archivo antes de decidir; escribir en él después de decidir.

### Relación con otras instituciones
- **El Observatorio:** provee las señales que El Senado interpreta.
- **El Archivo:** es consultado antes de decidir y actualizado después.
- **La Asamblea:** recibe escalaciones del Senado para decisiones que afectan principios o instituciones.
- **El Cauce:** recibe directivas del Senado sobre cambios en flujos.

### Qué protege
La calidad de las decisiones operativas. Evita decisiones sin contexto, sin datos, sin memoria.

### Qué produce
- Decisiones operativas documentadas
- Escalaciones a la Asamblea
- Directivas de flujo
- Interpretaciones de métricas

---

## 5. EL OBSERVATORIO (Observability System)

### Propósito
Detectar fallas, anomalías y patrones en la operación de la civilización.

### Responsabilidades
- Monitorear errores, incidentes, logs, trazas, health checks.
- Emitir alertas basadas en condiciones definidas.
- Mantener el pipeline de métricas: Evento → Signal → Metric → Insight.
- Generar postmortems para todo incidente.
- Mantener runbooks actualizados de respuesta a incidentes.
- Operar la infraestructura de observabilidad (Prometheus, Sentry, pino, Alertmanager).

### Relación con otras instituciones
- **El Senado:** recibe insights y alertas para decidir.
- **El Archivo:** recibe postmortems y runbooks actualizados.
- **La Academia:** recibe patrones de falla para análisis.
- **La Cancillería:** recibe alertas que requieren intervención humana.

### Qué protege
La integridad operativa. Garantiza que nada falle en silencio.

### Qué produce
- Métricas e insights
- Alertas
- Postmortems
- Runbooks
- Dashboards de decisión (no de visualización)

---

## 6. LA ADUANA (Naturalization)

### Propósito
Evaluar, adaptar e integrar toda herramienta, conocimiento o patrón externo a la civilización.

### Responsabilidades
- Aplicar el proceso de naturalización a toda dependencia externa.
- Mantener fichas de naturalización para cada proveedor (`procedural/naturalizacion/`).
- Extraer el principio de cada herramienta; separar principio de implementación.
- Determinar el nivel de acoplamiento aceptable para cada dependencia.
- Recomendar abstracciones (interfaces, adapters, wrappers) para aislar proveedores.

### Relación con otras instituciones
- **La Academia:** colabora en la extracción de principios.
- **La Armería:** recibe los adapters y wrappers resultantes de la naturalización.
- **La Forja:** implementa los harnesses que envuelven herramientas naturalizadas.

### Qué protege
La Soberanía de la Civilización (Principio I). Garantiza que CURDEECLAU no se vuelva dependiente de ningún proveedor.

### Qué produce
- Fichas de naturalización
- Abstracciones de proveedor (interfaces)
- Evaluaciones de riesgo de acoplamiento
- Recomendaciones de reemplazo

### Proceso de naturalización (inmutable)
1. Entender la herramienta.
2. Extraer su ADN (qué principio resuelve).
3. Identificar patrones que implementa.
4. Separar herramienta de principio.
5. Adaptar el principio a Pekín.
6. Institucionalizar lo útil.
7. Archivar lo accesorio.

---

## 7. LA ARMERÍA (Legoland)

### Propósito
Catalogar, versionar, certificar y garantizar la reutilización de todo componente técnico.

### Responsabilidades
- Mantener el catálogo completo de legos (`reference/legoland-catalogo.md`).
- Clasificar cada lego: Engine, Provider, Shared, Util, Framework, Producto-disfrazado-de-package.
- Verificar que cada lego tenga: propósito, contrato, dependencias, tests, estado de madurez.
- Detectar y eliminar duplicación entre legos.
- Certificar legos como "maduros" (3+ verticales, 0 errores en producción, tests completos).

### Relación con otras instituciones
- **La Aduana:** recibe los adapters naturalizados para catalogar.
- **La Forja:** consume legos certificados para construir harnesses.
- **El Archivo:** su catálogo vive en `reference/`.
- **El Registro Civil:** cada lego tiene una identidad registrada.

### Qué protege
La reutilización efectiva. Previene duplicación, abandono y entropía en `packages/`.

### Qué produce
- Catálogo de legos
- Clasificación por tipo y madurez
- Certificaciones de madurez
- Alertas de duplicación

---

## 8. LA FORJA (Harness Engineering)

### Propósito
Convertir autonomía en trabajo controlado mediante contratos entre agentes y la civilización.

### Responsabilidades
- Diseñar, implementar y mantener los harnesses: Orchestration, Delegation, Verification, Skill Registry, Memory, Permission, Delivery, Review, Recovery.
- Garantizar que todo agente opere dentro de un harness.
- Definir permisos, límites y verificaciones para cada tipo de agente.
- Proveer la infraestructura para que los agentes actúen sin violar principios.

### Relación con otras instituciones
- **La Armería:** consume legos certificados para construir harnesses.
- **La Academia:** colabora en la promoción Skill → Patrón.
- **El Cauce:** sus harnesses ejecutan los flujos definidos por El Cauce.
- **El Registro Civil:** cada harness tiene identidad registrada.

### Qué protege
La Autonomía Controlada (Principio VIII). Garantiza que los agentes actúen dentro de límites seguros.

### Qué produce
- Harnesses operativos (9 tipos)
- Contratos agente-civilización
- Permisos y límites por tipo de agente
- Infraestructura de verificación

---

## 9. EL REGISTRO CIVIL (Identity & DNA)

### Propósito
Garantizar que todo lo que existe en Pekín tenga identidad declarada.

### Responsabilidades
- Mantener el registro de ADN de verticales, productos, agentes y workflows.
- Validar que todo nuevo componente declare su ADN antes de operar.
- Definir las plantillas de DNA para cada tipo de entidad.
- Detectar componentes sin identidad y requerir su registro.

### Relación con otras instituciones
- **El Archivo:** el ADN se almacena en `institutional/dna/`.
- **La Academia:** valida el ADN antes de registrarlo.
- **La Armería:** cada lego tiene identidad registrada.
- **Todas las demás:** todo componente debe pasar por el Registro Civil.

### Qué protege
La Identidad antes que Existencia (Principio III). Garantiza que nada opere sin declarar qué es.

### Qué produce
- DNA de verticales
- DNA de productos
- DNA de agentes
- DNA de workflows
- Plantillas de DNA

### Componentes del DNA
- **Vertical DNA:** dominio, entidades, procesos, métricas, agentes necesarios, flujos principales, riesgos, diferenciadores.
- **Product DNA:** propósito, usuario objetivo, vertical al que pertenece, memory/flow/control/agent/support/observability profiles.
- **Agent DNA:** capacidades, permisos, harness asignado, disparadores, límites.
- **Workflow DNA:** canales, eventos, estados, compuertas, reglas de avance, nivel de autonomía, responsables.

---

## 10. LA CANCILLERÍA (Support System)

### Propósito
Atender problemas humanos y operativos con memoria institucional.

### Responsabilidades
- Gestionar tickets, incidentes y escalaciones.
- Mantener la base de conocimiento de soporte.
- Registrar respuestas aprendidas.
- Alimentar a La Academia con patrones de incidencia.
- Mantener y ejecutar runbooks de respuesta.

### Relación con otras instituciones
- **El Observatorio:** recibe alertas que requieren intervención.
- **El Archivo:** lee `procedural/runbooks/`; escribe incidentes en `operational/`.
- **La Academia:** recibe patrones de incidencia para análisis.
- **El Senado:** escala decisiones que requieren autoridad superior.

### Qué protege
La capacidad de respuesta. Garantiza que los problemas no se acumulen sin atender.

### Qué produce
- Tickets resueltos
- Base de conocimiento de soporte
- Respuestas aprendidas
- Escalaciones al Senado
- Patrones de incidencia para La Academia

---

*Fin de las Instituciones Fundacionales v1.0.0*
