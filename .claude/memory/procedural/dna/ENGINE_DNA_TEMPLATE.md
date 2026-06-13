# ENGINE DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de un engine de dominio en CURDEECLAU.

---

## 1. NOMBRE DEL ENGINE

Nombre oficial. Debe coincidir con el nombre del package en `packages/engines/`.

---

## 2. UBICACION ACTUAL

Ruta completa dentro del monorepo. Ej: `packages/engines/calendar-engine/`.

---

## 3. ESTADO INSTITUCIONAL

Segun Governance Level 2, Seccion 5:

- [ ] Proposed — Propuesto, no implementado.
- [ ] Active — En uso, mantenido.
- [ ] Canonical — Active + 3+ verticales + 0 errores en produccion.
- [ ] Superseded — Reemplazado por autoridad superior.
- [ ] Deprecated — Sin mantenimiento activo.

---

## 4. PROPOSITO

Que problema resuelve este engine. Por que existe. Que pasaria si no existiera.

---

## 5. RESPONSABILIDAD PRINCIPAL

La funcion central del engine. Una sola oracion. Todo lo demas es secundario.

---

## 6. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

Lo que este engine NO hace, aunque alguien podria asumir que si:

1. No hace X. Eso es responsabilidad de Y.
2. No hace Z. Eso no existe en CURDEECLAU.

---

## 7. CONTRATOS QUE RESPETA

| Contrato | Ubicacion | Estado |
|----------|-----------|--------|
| Interfaz Engine | `packages/shared/src/runtime/EngineContract.ts` | Implementado / Parcial / No implementado |
| Otro contrato | Ubicacion | Estado |

---

## 8. EVENTOS QUE EMITE / CONSUME

### Emite

| Evento | Tipo | Payload | Frecuencia |
|--------|------|---------|------------|
| evento-ejemplo | DomainEvent | Tipo payload | Alta / Media / Baja |

### Consume

| Evento | Emisor | Accion |
|--------|--------|--------|
| evento-ejemplo | motor-emisor | Que hace al recibirlo |

---

## 9. PATTERNS USADOS

- [ ] Provider Pattern
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern
- [ ] FSM Pattern
- [ ] Otro:

---

## 10. DEPENDENCIAS

### Dependencias internas (CURDEECLAU)

| Modulo | Tipo de dependencia | Version minima |
|--------|---------------------|----------------|
| modulo-ejemplo | Runtime / Build / Opcional | 0.1.0 |

### Dependencias externas

| Proveedor | Tipo | Naturalizado? |
|-----------|------|---------------|
| proveedor-ejemplo | API / SDK / Platform | Si / No / En proceso |

---

## 11. CONSUMIDORES

| Consumidor | Tipo | Estado |
|------------|------|--------|
| consumidor-ejemplo | Engine / App / Workflow | En uso / Planeado |

---

## 12. INVARIANTES

1. MUST: Invariante obligatorio que el engine garantiza.
2. MUST NOT: Invariante que el engine garantiza que nunca ocurre.
3. SHALL: Comportamiento requerido en condiciones normales.

---

## 13. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Riesgo ejemplo | Baja / Media / Alta | Bajo / Medio / Alto | Que se hace |

---

## 14. EVIDENCIA DE TESTS

| Tipo de test | Cantidad | Archivos | Estado |
|-------------|----------|----------|--------|
| Unitarios | N | `ruta/test.ts` | Pasan / Fallan / No ejecutados |
| Integracion | N | `ruta/test.ts` | Pasan / Fallan / No ejecutados |
| System | N | `ruta/test.ts` | Pasan / Fallan / No ejecutados |

---

## 15. CRITERIOS DE ACEPTACION

Que debe ser verdad para considerar este engine "completo y correcto":

1. Criterio 1
2. Criterio 2

---

## 16. RELACION CON LEGOLAND

- Tipo en Legoland: Engine
- Nivel de reutilizacion: Alto / Medio / Bajo
- Certificacion: Certificado / Pendiente / No aplica
- Duplicacion detectada: Ninguna / Con X (especificar)

---

## 17. RELACION CON PEKIN

- Principios que implementa: (ej: Principio V — Flujo Gobernado)
- Instituciones relacionadas: (ej: El Cauce, La Armeria)
- Nivel en jerarquia: Nivel 5 — Legos

---

## 18. COMO REGENERARLO SI SE PIERDE

Instrucciones minimas para que un agente nuevo pueda reconstruir este engine a partir de su DNA, patrones y tests:

1. Paso 1: Leer este DNA.
2. Paso 2: Leer patrones aplicables en `pattern/`.
3. Paso 3: Leer contratos en `packages/shared/src/runtime/`.
4. Paso 4: Implementar interfaces declaradas en contratos.
5. Paso 5: Implementar invariantes declarados en seccion 12.
6. Paso 6: Hacer pasar los tests declarados en seccion 14.

---

## 19. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — el engine esta en mantenimiento normal.")

---

*Fin del Engine DNA Template v1.0.0*
