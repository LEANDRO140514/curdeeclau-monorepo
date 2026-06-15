# UV-0 — UNIVERSIDAD LATINO AI ADMISSIONS DEMO SCOPE

> Tipo: projects/universidad-latino
> Version: 1.0.0 — Borrador inicial
> Creado: 2026-06-14
> Autoridad: CURDEECLAU / Pekin
> Fase: UV-0 (documental — cero codigo)
> Proximas fases: UV-1, UV-2, UV-DEMO

---

## 1. PROPOSITO DE LA DEMO

Demostrar que CURDEECLAU puede capturar, calificar y gestionar prospectos de admision de Universidad Latino usando un asistente conversacional de IA, con sincronizacion automatica a GHL para seguimiento comercial.

La demo prueba el caso de negocio real: convertir interesados en leads calificados dentro de un pipeline de ventas, usando IA como primer punto de contacto y GHL como sistema de gestion comercial.

---

## 2. PROBLEMA COMERCIAL

Universidad Latino recibe consultas de admision por multiples canales (WhatsApp, web, telefono, redes sociales). Cada consulta requiere atencion humana para:

- Responder preguntas frecuentes sobre carreras, horarios, costos y requisitos.
- Capturar datos del prospecto (nombre, telefono, carrera de interes).
- Clasificar el nivel de interes.
- Dar seguimiento comercial hasta la inscripcion.

**Problemas actuales:**

1. **Capacidad limitada.** El equipo de admisiones no puede atender todas las consultas en tiempo real.
2. **Consultas repetitivas.** El 80% de las preguntas son las mismas (carreras, horarios, costos, requisitos).
3. **Perdida de prospectos.** Sin seguimiento estructurado, muchos prospectos se enfrían y se pierden.
4. **Sin trazabilidad.** No hay registro unificado de qué prospecto preguntó qué, cuándo, ni en qué etapa del proceso está.
5. **Desconexion IA-CRM.** Si se usa un chatbot básico, los datos no fluyen automaticamente al CRM.

**La demo resuelve:** asistente IA que responde en tiempo real, captura datos del prospecto, y los sincroniza con GHL para que el equipo comercial haga seguimiento.

---

## 3. USUARIO OBJETIVO

**Primario:** Prospectos de Universidad Latino — personas interesadas en estudiar una carrera universitaria, que contactan por primera vez para obtener informacion.

**Secundario:** Equipo de admisiones de Universidad Latino — usan GHL para dar seguimiento a los leads capturados por el asistente IA.

**Terciario:** Direccion comercial — evalua la efectividad del asistente IA como canal de captacion.

---

## 4. FLUJO MVP

```
[Prospecto]
    |
    v
[WhatsApp / Web Chat]  ←  Canal de entrada
    |
    v
[Asistente IA de Admisiones]
    |  - Saluda y presenta Universidad Latino
    |  - Responde preguntas frecuentes (carreras, horarios, costos, requisitos)
    |  - Captura datos minimos del lead
    |  - Clasifica nivel de interes
    |
    v
[LeadStore / CRM Engine]  ←  Capa interna CURDEECLAU
    |  - Normaliza datos del lead
    |  - Asigna pipeline stage inicial
    |  - Prepara payload para GHL
    |
    v
[GHL Contact + Pipeline]
    |  - Crea/actualiza contacto en GHL
    |  - Asigna a pipeline de inscripcion
    |  - Dispara notificacion al equipo de admisiones
    |
    v
[Seguimiento Comercial]
       - Equipo de admisiones retoma en GHL
       - Llamada, WhatsApp, correo
       - Avance en pipeline hasta inscripcion o cierre
```

### Canales de entrada sugeridos para la demo

| Canal | Prioridad | Justificacion |
|-------|-----------|---------------|
| WhatsApp | Alta | Canal mas usado por prospectos en LATAM. CURDEECLAU ya tiene telegram-provider; WhatsApp requeriria YCloud (ya integrado en algorithmus). |
| Web Chat | Media | Embebible en landing page de Universidad Latino. Menor friccion. |
| Facebook/Instagram | Baja | Diferido post-demo. |

---

## 5. DATOS MINIMOS DEL LEAD

| Campo | Requerido | Tipo | Ejemplo |
|-------|-----------|------|---------|
| `nombre` | Si | string | "Maria Garcia" |
| `telefono` | Si | string (E.164) | "+521234567890" |
| `carrera_interes` | Si | enum | "DERECHO", "ADMINISTRACION", "PSICOLOGIA", etc. |
| `horario_deseado` | Recomendado | enum | "MATUTINO", "VESPERTINO", "SABATINO", "ONLINE" |
| `canal_origen` | Si | enum | "WHATSAPP", "WEB", "TELEFONO", "FACEBOOK", "INSTAGRAM" |
| `pregunta_inicial` | Recomendado | string (max 500) | "Quiero saber el costo de Derecho" |
| `nivel_interes` | Automatico | enum | "ALTO", "MEDIO", "BAJO", "SOLO_INFORMACION" |
| `email` | Opcional | string | "maria@email.com" |
| `fuente_utm` | Opcional | string | "fb_ad_carreras_2026" |

### Clasificacion automatica de nivel de interes

El asistente IA infiere el nivel de interes a partir de la conversacion:

| Nivel | Senales |
|-------|---------|
| ALTO | Pregunta por proceso de inscripcion, documentos, fechas limite, costos especificos. Quiere iniciar ya. |
| MEDIO | Pregunta por carreras, horarios, plan de estudios. Esta comparando opciones. |
| BAJO | Pregunta generica. "Que carreras tienen?" sin especificar area. |
| SOLO_INFORMACION | Pregunta por requisitos generales, ubicacion, validez oficial. No muestra intencion inmediata. |

---

## 6. PREGUNTAS FRECUENTES INICIALES

El asistente IA debe poder responder estas preguntas sin intervencion humana:

### Carreras y oferta academica

1. Que carreras ofrecen?
2. Cuanto dura la carrera de [X]?
3. Cual es el plan de estudios de [X]?
4. Tienen la carrera de [X]?
5. Cual es la carrera mas demandada?

### Costos y financiamiento

6. Cuanto cuesta la carrera de [X]?
7. Tienen becas?
8. Se puede pagar en parcialidades?
9. Cual es el costo de inscripcion?
10. Hay descuentos por pronto pago?

### Horarios y modalidad

11. Que horarios tienen?
12. Tienen modalidad en linea?
13. Hay clases los sabados?
14. Puedo estudiar y trabajar al mismo tiempo?

### Requisitos e inscripcion

15. Que documentos necesito para inscribirme?
16. Cual es el proceso de inscripcion?
17. Cuando empieza el proximo ciclo?
18. Hay examen de admision?
19. Tienen validez oficial?
20. Puedo revalidar materias de otra universidad?

### Ubicacion e instalaciones

21. Donde estan ubicados?
22. Tienen estacionamiento?
23. Las instalaciones son accesibles?

---

## 7. CARRERAS / OFERTA ACADEMICA MINIMA A USAR

Para la demo, usar un subconjunto representativo de la oferta real de Universidad Latino:

| Carrera | Area | Duracion | Modalidades sugeridas |
|---------|------|----------|----------------------|
| Derecho | Ciencias Sociales | 4 anos | Matutino, Vespertino, Sabatino |
| Administracion de Empresas | Negocios | 4 anos | Matutino, Vespertino, Online |
| Psicologia | Ciencias de la Salud | 4 anos | Matutino, Vespertino |
| Contaduria Publica | Negocios | 4 anos | Matutino, Vespertino, Sabatino |
| Ingenieria en Sistemas | Ingenieria | 4 anos | Matutino, Online |
| Mercadotecnia | Negocios | 3 anos | Matutino, Vespertino, Online |
| Ciencias de la Comunicacion | Humanidades | 4 anos | Matutino, Vespertino |
| Pedagogia | Educacion | 4 anos | Matutino, Sabatino |
| Gastronomia | Hospitalidad | 2 anos | Matutino, Vespertino |
| Enfermeria | Ciencias de la Salud | 4 anos | Matutino, Vespertino |

**Regla para la demo:** si el prospecto pregunta por una carrera que no esta en esta lista, el asistente responde con la lista completa y pregunta cual le interesa.

---

## 8. INTEGRACION ESPERADA CON GHL

### Flujo de datos CURDEECLAU → GHL

```
Lead capturado (LeadStore)
    |
    v
CRM Engine (normalizacion)
    |
    v
GHL Provider (ghl-engine existente)
    |
    +-- POST /contacts        →  Crear/actualizar contacto
    +-- POST /opportunities   →  Crear oportunidad en pipeline
    +-- POST /notes           →  Agregar nota con transcripcion resumida
    +-- PUT  /custom-fields   →  Campos personalizados (carrera, horario, nivel_interes)
```

### Campos personalizados sugeridos en GHL

| Campo GHL | Valor | Tipo |
|-----------|-------|------|
| `carrera_interes` | Texto libre o enum | Custom field |
| `horario_deseado` | MATUTINO / VESPERTINO / SABATINO / ONLINE | Custom field |
| `nivel_interes` | ALTO / MEDIO / BAJO / SOLO_INFORMACION | Custom field |
| `canal_origen` | WHATSAPP / WEB / TELEFONO / FACEBOOK / INSTAGRAM | Custom field |
| `pregunta_inicial` | Texto (max 500 chars) | Custom field |
| `fuente_demo` | "CURDEECLAU_UV_DEMO" | Tag |

### Nota en GHL

Al crear el contacto, agregar una nota con:

- Resumen de la conversacion (ultimas 3 preguntas/respuestas).
- Fecha y hora de la interaccion.
- Nivel de interes detectado.
- Enlace al log completo si existe.

---

## 9. PIPELINE SUGERIDO EN GHL

| Etapa | Orden | Descripcion | Accion esperada |
|-------|-------|-------------|-----------------|
| **Nuevo prospecto** | 1 | Lead capturado por el asistente IA. Sin contacto humano todavia. | Asignar al asesor de guardia. |
| **Informacion solicitada** | 2 | El prospecto pidio informacion adicional que el asistente no pudo resolver. | Asesor responde con la informacion especifica. |
| **Interesado** | 3 | Prospecto muestra interes real. Pregunta por costos, fechas, documentos. | Asesor agenda llamada o visita. |
| **Seguimiento activo** | 4 | El asesor esta en comunicacion activa con el prospecto. | Llamadas, WhatsApp, correos de seguimiento. |
| **Proceso de inscripcion** | 5 | Prospecto inicio el proceso formal de inscripcion. | Entrega de documentos, pago de inscripcion. |
| **Inscrito** | 6 | Prospecto completo la inscripcion. Es alumno. | Fin del pipeline comercial. Inicio del pipeline academico (fuera de alcance). |
| **No interesado / Perdido** | 7 | Prospecto descartado: no responde, elige otra universidad, no puede pagar. | Cierre con motivo documentado. |

---

## 10. CRITERIOS DE EXITO

### Criterios tecnicos (UV-1 + UV-2)

1. El asistente IA responde correctamente >= 80% de las preguntas frecuentes sin intervencion humana.
2. Los datos del lead se capturan en <= 3 turnos de conversacion.
3. El lead se sincroniza con GHL en <= 5 segundos desde la captura.
4. El contacto en GHL contiene todos los campos personalizados definidos.
5. La nota en GHL contiene un resumen util de la conversacion.
6. Cero perdida de datos entre CURDEECLAU y GHL.

### Criterios comerciales (UV-DEMO)

7. El equipo de admisiones de Universidad Latino puede ver y entender el lead en GHL sin capacitacion extensa.
8. El asistente IA es percibido como "util" o "muy util" por >= 70% de los prospectos (encuesta post-interaccion).
9. Tiempo medio de primera respuesta: <= 30 segundos.
10. Tasa de leads que avanzan a "Interesado" en el pipeline: >= 40%.

---

## 11. QUE QUEDA FUERA DEL MVP

### Fuera de UV-0 (documentacion)

Nada que implementar en esta fase.

### Fuera de UV-1 (captura + sync)

- Asistente conversacional completo (UV-2).
- Multi-canal avanzado (solo WhatsApp o Web Chat en MVP).
- Dashboard de metricas.
- Portal de alumnos.
- Sistema de pagos.
- Firma electronica de documentos.
- Integracion con sistema escolar.

### Fuera de UV-2 (asistente IA)

- Multi-idioma (solo espanol en MVP).
- Reconocimiento de voz.
- Llamadas telefonicas automatizadas.
- Programacion de citas directamente en GHL.
- Seguimiento proactivo (el asistente solo reacciona, no inicia conversaciones).
- Conexion con otras plataformas (Facebook, Instagram, TikTok).
- Analisis de sentimiento avanzado.

### Fuera de UV-DEMO (demo comercial)

- Operacion real con datos de prospectos reales (hasta que Universidad Latino apruebe).
- Entorno productivo (la demo corre en entorno controlado).
- SLA de disponibilidad.
- Backup y recuperacion de desastres.

---

## 12. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Universidad Latino no proporciona datos reales de carreras, costos, requisitos | Media | Alto — la demo no tendria contenido real | Usar datos publicos de la pagina web oficial como base. Validar con el cliente antes de la demo. |
| GHL no soporta los campos personalizados necesarios | Baja | Medio — habria que simplificar el modelo de datos | Verificar limites de custom fields en el plan de GHL del cliente antes de UV-1. |
| WhatsApp Business API requiere aprobacion y plantillas | Media | Medio — puede retrasar la demo | Usar Web Chat como alternativa inmediata. YCloud (ya integrado) puede acelerar WhatsApp. |
| El asistente IA alucina informacion de carreras o costos | Media | Alto — dano reputacional a Universidad Latino | Usar RAG con fuente de verdad curada (UV-2). Implementar grounding validation (fail-closed). |
| El equipo de admisiones no adopta GHL | Media | Alto — la demo no demuestra valor si no se usa | Incluir sesion de capacitacion basica de GHL como parte de la demo. |
| Alcance excede lo razonable para una demo | Media | Medio — la demo se vuelve un producto | UV-0 define limites claros. UV-1/UV-2 implementan solo lo definido aqui. UV-DEMO no agrega funcionalidad nueva. |

---

## 13. PROXIMAS FASES

### UV-1 — Lead Capture + GHL Sync

**Objetivo:** Implementar la captura de leads y sincronizacion con GHL.

**Alcance:**
- Endpoint de captura de lead (datos minimos definidos en seccion 5).
- Normalizacion del lead en CRM Engine.
- Sincronizacion con GHL (crear/actualizar contacto, pipeline stage inicial, nota).
- Campos personalizados en GHL.
- Tests unitarios y de integracion con mock GHL.
- Sin asistente IA todavia (los leads llegan con datos ya estructurados).

**No incluye:** asistente conversacional, multi-canal, metricas.

### UV-2 — AI Admissions Assistant

**Objetivo:** Implementar el asistente conversacional de IA para admisiones.

**Alcance:**
- Asistente IA usando LLMProvider/LMDRouter.
- Base de conocimiento de Universidad Latino (RAG con datos curados).
- Preguntas frecuentes (seccion 6).
- Deteccion de intencion y extraccion de slots (nombre, telefono, carrera).
- Clasificacion automatica de nivel de interes.
- Conexion con UV-1 para captura de lead al finalizar la conversacion.
- Grounding validation para evitar alucinaciones.

**No incluye:** multi-canal (solo texto), voz, multi-idioma, seguimiento proactivo.

### UV-DEMO — Demo Comercial

**Objetivo:** Integrar UV-1 + UV-2 en una demo funcional presentable a Universidad Latino.

**Alcance:**
- Flujo completo: conversacion → captura → GHL → pipeline.
- Interfaz de chat simple (Web Chat o WhatsApp sandbox).
- Datos de ejemplo de carreras, costos, requisitos.
- Demo script (recorrido guiado para la presentacion).
- Documentacion de la demo para el equipo comercial.

**No incluye:** entorno productivo, operacion real, SLA, multi-tenant.

---

## 14. NOTAS PARA IMPLEMENTACION

1. **Todos los datos de Universidad Latino deben ser configurables**, no hardcodeados. En UV-0 solo los listamos; en UV-1/UV-2 deben venir de una fuente de verdad (archivo JSON, base de datos, o CMS simple) que el cliente pueda actualizar.

2. **GHL ya esta integrado en CURDEECLAU** via `ghl-engine`. UV-1 debe usar el provider existente, no crear uno nuevo.

3. **YCloud ya esta integrado** en `algorithmus-core-engine` para WhatsApp. UV-2 puede usarlo como canal de entrada si se decide WhatsApp-first.

4. **LLMProvider/LLMRouter ya existen.** UV-2 debe usarlos para el asistente IA. No debe llamar APIs de OpenAI/Anthropic directamente.

5. **El CRM Engine debe ser agnostico de GHL.** Si en el futuro Universidad Latino usa otro CRM, el cambio debe ser transparente.

6. **Grounding validation (fail-closed):** si el asistente no encuentra informacion confiable, debe decir "No tengo esa informacion, un asesor te contactara" en vez de inventar.

---

## 15. VISTAZO CIVILIZACIONAL

Pekin ya tiene:

- Motores LLM multi-provider con router.
- GHL integrado y naturalizado.
- Whatsapp via YCloud integrado.
- CRM Engine para leads.
- Runtime de eventos y workflows.
- Observabilidad y metrica.

Esta demo valida la tesis fundacional de CURDEECLAU:

> Una civilizacion tecnologica que preserva, organiza y regenera conocimiento no es un ejercicio academico — es una ventaja competitiva real.

Universidad Latino no necesita construir un asistente IA desde cero.
Necesita una civilizacion que ya sabe hacerlo.

UV-0 define que. UV-1 y UV-2 definiran como.

---

*Fin del UV-0 Demo Scope v1.0.0*
