# AGENT DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de un agente en CURDEECLAU.

---

## 1. NOMBRE DEL AGENTE

Nombre oficial del agente. Debe ser unico dentro de CURDEECLAU.

---

## 2. TIPO DE AGENTE

- [ ] Agente conversacional (interactua con usuarios)
- [ ] Agente operacional (ejecuta tareas automatizadas)
- [ ] Agente de soporte (asiste a humanos)
- [ ] Agente de desarrollo (opera en el monorepo)
- [ ] Agente de monitoreo (observa y alerta)
- [ ] Otro:

---

## 3. ESTADO INSTITUCIONAL

- [ ] Proposed
- [ ] Active
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated

---

## 4. PROPOSITO

Que problema resuelve. Por que existe este agente y no otro.

---

## 5. ROL

Descripcion del rol en una oracion. Ej: "Recepcionista virtual para clinicas dentales."

---

## 6. LIMITES

Que puede y que NO puede hacer este agente:

### Puede

1. Accion permitida 1
2. Accion permitida 2

### No puede

1. Accion prohibida 1
2. Accion prohibida 2

---

## 7. HERRAMIENTAS PERMITIDAS

| Herramienta | Proposito | Restricciones |
|-------------|-----------|---------------|
| herramienta-1 | Que hace | Cuando usarla / no usarla |

---

## 8. HERRAMIENTAS PROHIBIDAS

Herramientas que este agente explicitamente NO debe usar, aunque esten disponibles:

1. Herramienta X — Razon
2. Herramienta Y — Razon

---

## 9. CONTEXTO REQUERIDO

Que informacion necesita el agente para operar:

- Conocimiento de dominio: (vertical dental, legal, etc.)
- Datos de usuario: (nombre, historial, preferencias)
- Estado de conversacion: (historico, sesion actual)
- Configuracion: (politicas, reglas de negocio)

---

## 10. ENTRADAS

| Entrada | Origen | Formato |
|---------|--------|---------|
| Mensaje de usuario | Canal (Telegram, WhatsApp, Web) | Texto / Voz / Imagen |
| Evento del sistema | Engine / Orchestrator | DomainEvent |

---

## 11. SALIDAS

| Salida | Destino | Formato |
|--------|---------|---------|
| Respuesta al usuario | Canal de salida | Texto / Voz / Imagen |
| Accion del sistema | Engine / Orchestrator | Comando o DomainEvent |

---

## 12. CRITERIOS DE DELEGACION

Cuando este agente debe transferir el control a otro agente o a un humano:

1. Condicion 1: (ej: "El usuario pide hablar con un humano")
2. Condicion 2: (ej: "El agente no entiende despues de 3 intentos")
3. Condicion 3: (ej: "Se detecta una emergencia")

---

## 13. CRITERIOS DE DETENCION

Cuando este agente debe detenerse inmediatamente:

1. Condicion 1: (ej: "El usuario expresa intencion de dano")
2. Condicion 2: (ej: "Se detecta un bucle de conversacion")

---

## 14. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Alucinacion | Media / Alta | Alto | Grounding con knowledge base |
| Bucle conversacional | Baja / Media | Medio | Deteccion de bucle + handoff |
| Fuga de datos | Baja | Alto | No incluir PII en prompts |

---

## 15. EVIDENCIA REQUERIDA

- [ ] Comportamiento documentado (prompts, reglas, flujos)
- [ ] Tests de dialogo (casos felices, casos limite, casos de error)
- [ ] Registro de decisiones de handoff
- [ ] Registro de detenciones
- [ ] Evaluacion de calidad de respuestas

---

## 16. RELACION CON HARNESSES

- Harness asignado: (nombre del harness)
- Permisos en el harness: (que puede ejecutar)
- Limites en el harness: (que no puede exceder)
- Verificaciones: (que chequea el harness antes/durante/despues)

---

## 17. RELACION CON PEKIN

- Principios que implementa: (ej: Principio VIII — Autonomia Controlada)
- Instituciones relacionadas: La Forja (harness), El Cauce (flujo), La Academia (conocimiento)
- Nivel en jerarquia: Nivel 6 — Skills/Agents

---

## 18. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — el agente esta en operacion normal.")

---

*Fin del Agent DNA Template v1.0.0*
