# PRINCIPIOS CONSTITUCIONALES DE PEKÍN

> Tipo: institutional
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-07
> Revisado: 2026-06-07

---

Estos diez principios son las leyes fundacionales de CURDEECLAU.

No son guías. No son recomendaciones. No son mejores prácticas.

Son leyes. No se negocian. No se suspenden. No se ignoran.

Todo agente, todo vertical, todo producto, todo lego, todo skill, todo workflow debe operar dentro de estos principios.

---

## I. SOBERANÍA DE LA CIVILIZACIÓN

### Declaración
Pekín no depende de ningún proveedor, modelo, herramienta o plataforma externa. Cualquier dependencia externa debe ser naturalizada o permanece en la frontera de la civilización.

### Interpretación
La civilización no puede ser rehén de decisiones externas. Si OpenAI cambia su API, CURDEECLAU se adapta — no colapsa. Si Supabase desaparece, la memoria migra — no se pierde. Si un modelo deja de existir, otro ocupa su lugar — los principios permanecen.

### Consecuencias prácticas
1. Toda integración externa debe pasar por La Aduana antes de ser adoptada en el núcleo.
2. Ningún componente central (`shared/`, engines, instituciones) puede importar directamente un SDK de proveedor.
3. Todo proveedor debe tener un adapter que implemente una interfaz definida por Pekín.
4. El principio extraído de una herramienta debe documentarse independientemente de la herramienta.
5. La pregunta "¿qué hacemos si X desaparece?" debe tener respuesta documentada para cada dependencia externa.

---

## II. PRIMACÍA DE LA MEMORIA

### Declaración
Nada se construye sin registrar. Nada se decide sin consultar. El Archivo es la primera y última fuente de verdad institucional.

### Interpretación
La memoria no es un subproducto del desarrollo. Es un prerrequisito. Antes de escribir código, se consulta qué se sabe. Después de tomar una decisión, se registra por qué. La civilización que no recuerda está condenada a repetir sus errores — y a olvidar sus aciertos.

### Consecuencias prácticas
1. MEMORY.md es el primer archivo que todo agente debe leer al inicializarse.
2. Toda decisión de arquitectura debe registrarse en el Archivo con contexto, alternativas consideradas y consecuencias.
3. Ningún vertical o producto puede declararse "terminado" sin haber registrado su ADN en `institutional/dna/`.
4. Las decisiones no documentadas se consideran provisionales y reversibles sin consulta.
5. El Archivo se consulta antes de construir; se actualiza después de decidir.

---

## III. IDENTIDAD ANTES QUE EXISTENCIA

### Declaración
Nada existe en Pekín sin ADN declarado. Todo producto, vertical, lego, skill o workflow debe declarar su identidad antes de operar.

### Interpretación
La existencia sin identidad es caos. Un componente sin ADN es un componente que nadie sabe para qué sirve, quién lo creó, qué principios lo rigen, qué dependencias tiene. La identidad no es burocracia — es la condición mínima para que algo forme parte de la civilización.

### Consecuencias prácticas
1. Todo nuevo vertical debe registrar su DNA antes de escribir código de dominio.
2. Todo nuevo producto debe declarar su propósito, usuario objetivo, vertical y perfiles (memory, flow, control, agent, support, observability).
3. Todo lego en `packages/` debe tener un propósito documentado, exports claros y tests.
4. Todo skill debe declarar qué resuelve, cuándo usarlo y cuándo no.
5. Los componentes sin ADN se consideran experimentales y no reciben garantía de preservación.

---

## IV. SEPARACIÓN DE PRINCIPIO Y HERRAMIENTA

### Declaración
Ninguna herramienta externa dicta la arquitectura de Pekín. El principio se extrae; la herramienta se envuelve; la implementación se aísla.

### Interpretación
Toda herramienta — un SDK, una API, un framework, un modelo — contiene un principio útil y una implementación contingente. El principio pertenece a la civilización. La implementación pertenece al proveedor. Pekín extrae el principio, envuelve la herramienta en una interfaz propia, y aísla la implementación detrás de esa interfaz.

### Consecuencias prácticas
1. Todo provider externo debe tener una interfaz definida en `shared/` o en el engine correspondiente.
2. Toda integración debe tener al menos dos implementaciones: una real (contra el proveedor) y una InMemory (para tests y desarrollo).
3. El patrón Provider Pattern es obligatorio para toda integración externa.
4. Nunca se importa un SDK de proveedor directamente desde `src/core/` de ningún engine.
5. La pregunta "¿qué principio nos da esta herramienta?" debe responderse en la ficha de naturalización.

---

## V. FLUJO GOBERNADO

### Declaración
Todo lo que se mueve en Pekín debe tener: canal definido, evento catalogado, estado conocido, compuerta explícita, responsable asignado y nivel de autonomía declarado.

### Interpretación
El flujo sin gobierno es accidente esperando ocurrir. Cada dato, cada decisión, cada lead, cada alerta que se mueve entre sistemas debe hacerlo bajo reglas explícitas. Nadie debe preguntarse "¿cómo llegó esto aquí?" o "¿quién decidió esto?". La trazabilidad no es opcional.

### Consecuencias prácticas
1. Todo flujo entre engines debe declararse en `procedural/` con canales, eventos, estados y compuertas.
2. Todo evento debe estar registrado en el EventCatalog (`packages/shared/src/runtime/EventCatalog.ts`).
3. Toda compuerta (FSM, validación, HardGate) debe ser explícita y trazable.
4. Todo flujo debe declarar su nivel de autonomía: manual, semi-automático, automático-con-supervisión, autónomo.
5. Ningún flujo puede cruzar sistemas sin un evento documentado que lo respalde.

---

## VI. DECISIÓN INFORMADA

### Declaración
No se mide por visualizar. Se mide para decidir. Toda métrica debe responder una pregunta operativa concreta. Lo que no se mide, no existe.

### Interpretación
Los dashboards bonitos son ruido si no responden preguntas. Las métricas sin propósito son gasto de recursos. Cada número que la civilización produce debe estar conectado a una decisión que alguien necesita tomar. Medir por medir es la forma más elegante de no saber nada.

### Consecuencias prácticas
1. Toda métrica debe declarar: qué pregunta responde, quién la necesita, con qué frecuencia se consulta, qué acción dispara.
2. Las métricas sin pregunta asociada deben ser eliminadas o justificadas.
3. El pipeline canónico es: Evento → Signal → Metric → Insight → Decision → Action → Outcome → Memory.
4. El Senado consume métricas; no las produce. Las métricas las produce el Observatorio.
5. Un dashboard sin capacidad de decisión es un adorno.

---

## VII. FALLO VISIBLE

### Declaración
Todo error, incidente o anomalía debe ser: detectado, registrado, analizado, aprendido. El silencio operativo es el enemigo.

### Interpretación
Un sistema que falla en silencio es más peligroso que un sistema que falla ruidosamente. El error oculto se acumula. El error visible se corrige. La civilización debe diseñarse para que los fallos sean imposibles de ignorar — y para que cada fallo deje una lección permanente.

### Consecuencias prácticas
1. Todo error debe generar un log estructurado con contexto suficiente para diagnóstico.
2. Todo incidente debe generar un postmortem en `procedural/runbooks/`.
3. Todo postmortem debe generar al menos una acción correctiva o un nuevo chequeo.
4. Los errores silenciados (`catch {}` vacío, `.catch(() => {})` sin log) están prohibidos en producción.
5. El Observatorio es responsable de garantizar que ningún fallo pase desapercibido.

---

## VIII. AUTONOMÍA CONTROLADA

### Declaración
Los agentes actúan dentro de harnesses. Los harnesses definen permisos, límites y verificaciones. Ningún agente opera sin harness.

### Interpretación
La autonomía sin control es peligro. El control sin autonomía es parálisis. Los harnesses son el equilibrio: permiten que los agentes actúen con libertad dentro de límites claros, verificando cada acción contra reglas explícitas. Un agente sin harness es un riesgo. Un harness sin agente es una abstracción vacía.

### Consecuencias prácticas
1. Todo agente debe declarar su harness: qué permisos tiene, qué límites, qué verificaciones.
2. La Forja es responsable de diseñar, mantener y hacer cumplir los harnesses.
3. Ningún agente puede modificar `institutional/`.
4. Todo agente debe poder ser auditado: sus acciones deben dejar traza.
5. La autonomía se gana con evidencia; no se otorga por defecto.

---

## IX. REGENERABILIDAD

### Declaración
Pekín debe poder regenerar cualquier componente — código, workflow, skill, agente, producto — a partir de: Filosofía, ADN, Principios, Patrones, Memoria y Gobernanza.

### Interpretación
La civilización no depende de implementaciones específicas. Si todo el código se pierde, los principios, patrones, ADN y memoria deben contener suficiente información para reconstruir lo esencial. No idéntico — pero sí coherente. La regenerabilidad es el ultimate test de que la civilización entendió lo que construyó.

### Consecuencias prácticas
1. Todo componente crítico debe tener su ADN documentado en `institutional/dna/`.
2. Todo patrón debe estar documentado en `pattern/` con criterios de aplicación.
3. Ningún conocimiento esencial debe residir exclusivamente en el código.
4. La prueba de regenerabilidad es: ¿puede un agente nuevo, leyendo solo el Archivo, reconstruir este componente?
5. Los componentes que no pasan la prueba de regenerabilidad son deuda institucional.

---

## X. UNIVERSALIDAD DE ENTRADA

### Declaración
Cualquier agente o LLM debe poder integrarse a Pekín sin memoria conversacional previa. La Constitución, el ADN y los Patrones son el único contexto necesario.

### Interpretación
La civilización no puede depender de que un agente "recuerde" conversaciones anteriores. Cada sesión es un nuevo comienzo. Pekín debe ser legible para cualquier agente que llegue por primera vez, sin requerir contexto externo, sin asumir conocimiento tácito, sin depender de la memoria de un modelo específico.

### Consecuencias prácticas
1. MEMORY.md debe ser suficiente para que un agente nuevo entienda cómo navegar la civilización.
2. La Constitución debe ser autocontenida y no requerir conocimiento previo.
3. Todo documento del Archivo debe declarar su tipo, versión, fecha y propósito.
4. El contexto conversacional es efímero; el conocimiento institucional es permanente.
5. Ningún agente debe necesitar "que le cuenten" qué es CURDEECLAU — debe poder leerlo.

---

*Fin de los Principios Constitucionales v1.0.0*
