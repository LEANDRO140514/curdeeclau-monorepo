# GHL — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-13

---

## 1. NOMBRE DEL ACTIVO

GoHighLevel (GHL) — CRM y plataforma de automatizacion comercial.

---

## 2. TIPO DE ACTIVO

External Platform / CRM

---

## 3. ESTADO INSTITUCIONAL

Allied (candidate for Naturalization)

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [ ] Naturalizado (candidato — existe `ghl-engine` como adapter inicial)
- [x] Aliado — Se utiliza via adapter. Falta completar ficha y verificaciones.
- [ ] Referenciado
- [ ] Archivado

---

## 5. PROPOSITO

GHL provee CRM operativo externo: gestion de contactos, pipelines, oportunidades, campanas y automatizaciones comerciales.

**Principio que encarna:** GHL implementa el concepto de "CRM como servicio externo". Pekin extrae el principio de "CRM provider-agnostico" (implementado por `crm-engine`) y trata a GHL como un provider intercambiable.

**Si no existiera:** Se necesitaria otro CRM externo o construir uno nativo. El `crm-engine` esta disenado para aceptar cualquier provider que implemente la interfaz `CRMProvider`.

---

## 6. CAPACIDADES PRINCIPALES

1. Contact CRUD — Estado: En uso (via `ghl-engine` GHLClient)
2. Pipeline management — Estado: En uso
3. Opportunity tracking — Estado: En uso
4. Appointment sync — Estado: Planeado
5. Campaign management — Estado: Candidato
6. Webhook verification — Estado: En uso

---

## 7. CAPACIDADES NO ASUMIDAS

- GHL email marketing (no utilizado por CURDEECLAU)
- GHL funnel builder (no utilizado)
- GHL website builder (no utilizado)
- GHL reputation management (no utilizado)
- GHL membership/courses (no utilizado)

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en GHL? |
|--------------|-------------|---------------------------|---------------------|
| Contactos (nombre, telefono, email) | Alto | Si (via CRM sync) | Si |
| Pipelines y oportunidades | Medio | Si (via CRM sync) | Si |
| Citas y reservas | Medio | Si (via calendar-engine) | Si |
| Metadatos de conversacion | Medio | Parcial | Si |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: CRM operativo, historial de pipelines, automatizaciones
- Como se reemplaza: `crm-engine` acepta otro provider. Se implementaria un nuevo adapter.
- Tiempo estimado de migracion: 2-4 semanas (dependiendo del provider destino)

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Moderada. GHL cambia APIs periodicamente.
- Frecuencia de breaking changes: Baja-media (anuales)
- Costo actual: No documentado en el repo
- Sensibilidad al costo: Alta para operaciones comerciales

### 9.3 Riesgo de seguridad

- Datos sensibles: Contactos, conversaciones, datos comerciales
- Cumplimiento: Depende de la jurisdiccion del vertical
- Historial de incidentes: No evaluado

### 9.4 Riesgo de acoplamiento

- Nivel: Medio
- Justificacion: `crm-engine` tiene interfaz `CRMProvider`. GHL esta detras de esa interfaz. Cambiar de provider no requiere reescribir engines consumidores.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependen de GHL:**
- `crm-engine` — consume GHL como provider (via `CRMProvider` interface)
- `telegram-provider` — realiza sync GHL de leads

**Dependencias externas de GHL:**
- GHL API v2 (https://rest.gohighlevel.com)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — GHLClient implementa el patron
- [ ] Event Pattern
- [x] Engine Pattern — `crm-engine` consume GHL como provider
- [ ] Ownership Pattern

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `ghl-engine` | Adapter principal | En uso |
| `crm-engine` | Consumidor del provider | En uso |
| `telegram-provider` | Sync de leads hacia GHL | En uso |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | En uso (CRM de pacientes) |
| AdmissionFlow | Candidato (gestion de leads) |

---

## 14. REGLAS DE USO

1. Toda interaccion con GHL debe pasar por `ghl-engine`, nunca por SDK directo desde engines.
2. Los IDs canonicos de CURDEECLAU nunca deben ser IDs de GHL. Usar `metadata.providerId`.
3. No exponer API keys de GHL en logs, errores ni codigo fuente.

---

## 15. REGLAS DE SEGURIDAD

1. API key de GHL en variable de entorno, nunca en codigo.
2. Webhook signature verification obligatoria.
3. No loguear payloads completos de contactos.
4. Rotacion de API keys segun politica del proveedor.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: Existe (`ghl-engine/src/GHLClient.ts`)
- [ ] Implementacion InMemory: Existe en `crm-engine` (InMemoryCRMProvider)
- [ ] Tests sin conexion al proveedor: No verificados
- [ ] Principio extraido documentado: Si (CRM provider-agnostico)
- [x] Plan de contingencia: Si (cambiar provider via interfaz CRMProvider)

---

## 17. ESTADO DE IMPLEMENTACION

- [ ] No iniciado
- [ ] En progreso
- [x] Funcional (requiere proveedor)
- [ ] Funcional (InMemory completo)
- [ ] Completo y verificado

---

## 18. DECISION

Mantener como **Aliado** por ahora. La integracion tecnica existe (`ghl-engine`) pero falta:
- Verificar que los tests pasan sin conexion a GHL real (usando InMemoryCRMProvider)
- Completar la implementacion InMemory para todos los metodos del provider
- Documentar el plan de contingencia con un provider alternativo concreto

Proceder con naturalizacion completa cuando los criterios de aceptacion (Seccion 5 del README) se cumplan.

---

## 19. PROXIMO PASO AUTORIZADO

Ninguno. La decision de naturalizar completamente requiere verificacion de tests y ADR del Senado.

---

*Fin de la ficha GHL v1.0.0*
