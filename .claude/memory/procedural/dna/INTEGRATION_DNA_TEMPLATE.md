# INTEGRATION DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de una integracion entre sistemas en CURDEECLAU.

---

## 1. NOMBRE DE LA INTEGRACION

Nombre oficial. Debe describir los sistemas que conecta.

---

## 2. PLATAFORMA EXTERNA

Servicio o plataforma externa involucrada. Si es una integracion interna (engine a engine), indicarlo.

---

## 3. ESTADO INSTITUCIONAL

- [ ] Proposed
- [ ] Active
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated

---

## 4. RELACION CON NATURALIZATION FRAMEWORK

- [ ] Naturalizado — Tiene ficha de naturalizacion completa.
- [ ] Allied — Se usa, ficha pendiente o parcial.
- [ ] Referenciado — Documentado, sin integracion activa.
- [ ] No aplica — Es integracion interna (engine a engine).

Ficha de naturalizacion asociada: `procedural/naturalizacion/proveedor.md` (si aplica).

---

## 5. PROPOSITO

Que conecta esta integracion. Por que es necesaria. Que flujo de datos habilita.

---

## 6. DATOS ENVIADOS

| Dato | Origen (CURDEECLAU) | Destino (externo) | Sensibilidad | Frecuencia |
|------|----------------------|-------------------|-------------|------------|
| dato-ejemplo | Engine / App | API externa | Bajo / Medio / Alto / Critico | Tiempo real / Batch / Diario |

---

## 7. DATOS RECIBIDOS

| Dato | Origen (externo) | Destino (CURDEECLAU) | Sensibilidad | Frecuencia |
|------|-----------------|----------------------|-------------|------------|
| dato-ejemplo | API externa / Webhook | Engine / App | Bajo / Medio / Alto / Critico | Tiempo real / Batch / Diario |

---

## 8. AUTENTICACION

| Metodo | Tipo de credencial | Rotacion | Responsable |
|--------|-------------------|----------|-------------|
| API Key / OAuth2 / Webhook Signature | Variable de entorno | Periodicidad | Quien gestiona |

---

## 9. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Servicio externo caido | Baja / Media / Alta | Bajo / Medio / Alto | Retry / Circuit breaker / Fallback |
| Datos inconsistentes | Baja / Media / Alta | Bajo / Medio / Alto | Validacion / Reconciliation job |
| Fuga de credenciales | Baja | Alto | Rotacion automatica / Secrets manager |

---

## 10. FALLBACK

Si la integracion falla:

- Comportamiento esperado:
- Datos en cola o perdidos?:
- Procedimiento de recuperacion:

---

## 11. DEPENDENCIAS

### Dependencias internas

| Modulo CURDEECLAU | Rol en la integracion |
|-------------------|----------------------|
| modulo-ejemplo | Producer / Consumer / Adapter |

### Dependencias externas

| Servicio | Proveedor | Criticidad |
|----------|-----------|------------|
| API externa | Proveedor | Alta / Media / Baja |

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| modulo-ejemplo | Producer / Consumer / Adapter | En uso / Planeado |

---

## 13. EVIDENCIA

- [ ] Codigo funcional
- [ ] Tests de integracion
- [ ] Monitoreo de salud (health check)
- [ ] Alertas configuradas
- [ ] Runbook de recuperacion
- [ ] Ficha de naturalizacion (si es externa)

---

## 14. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — la integracion esta en operacion normal.")

---

*Fin del Integration DNA Template v1.0.0*
