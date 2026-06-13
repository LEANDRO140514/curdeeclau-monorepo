# NATURALIZATION FILE TEMPLATE

> Tipo: procedural/naturalizacion/template
> Version: 1.0.0
> Proposito: Plantilla reutilizable para fichas de naturalizacion de activos externos

---

## 1. NOMBRE DEL ACTIVO

Nombre oficial del proveedor, plataforma, herramienta o servicio.

---

## 2. TIPO DE ACTIVO

Clasificar segun taxonomia de Governance Level 2, Seccion 4:

- External Platform
- External AI Provider
- External Channel
- External Vector Database
- External Persistence
- External Deployment
- External Monitoring
- External Framework
- External SDK
- Otro (especificar)

---

## 3. ESTADO INSTITUCIONAL

Estado segun Governance Level 2, Seccion 5:

- Proposed
- Naturalized
- Allied
- Referenced
- Deprecated

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo — Construido dentro de CURDEECLAU
- [ ] Naturalizado — Integrado con adapter + ficha completa
- [ ] Aliado — Utilizado, pero no completamente integrado
- [ ] Referenciado — Documentado como antecedente, sin integracion activa
- [ ] Archivado — Preservado historicamente

---

## 5. PROPOSITO

Que problema resuelve para CURDEECLAU.
Que principio constitucional encarna (segun Principio IV — Separacion de Principio y Herramienta).
Que pasaria si este activo no existiera.

---

## 6. CAPACIDADES PRINCIPALES

Listar las capacidades que este activo ofrece y que CURDEECLAU utiliza o planea utilizar:

1. Capacidad 1 — Estado: [En uso / Planeado / Candidato / No implementado]
2. Capacidad 2 — Estado: [En uso / Planeado / Candidato / No implementado]

---

## 7. CAPACIDADES NO ASUMIDAS

Listar capacidades que el activo ofrece pero CURDEECLAU NO utiliza ni planea utilizar.
Esto es importante para evitar acoplamiento innecesario.

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Nivel de sensibilidad | Almacenado en CURDEECLAU? | Almacenado en el proveedor? |
|--------------|----------------------|---------------------------|------------------------------|
| Dato 1 | Bajo / Medio / Alto / Critico | Si / No / Parcial | Si / No / Parcial |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

Si el proveedor desapareciera manana:
- Que se pierde:
- Como se reemplaza:
- Tiempo estimado de migracion:

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica del proveedor:
- Frecuencia de breaking changes:
- Costo actual:
- Sensibilidad al costo:

### 9.3 Riesgo de seguridad

- Datos sensibles que maneja:
- Cumplimiento normativo requerido:
- Historial de incidentes del proveedor:

### 9.4 Riesgo de acoplamiento

- Nivel de acoplamiento: Bajo / Medio / Alto
- Justificacion:

---

## 10. DEPENDENCIAS

Que otros activos de CURDEECLAU dependen de este.
Que otros activos externos requiere este para funcionar.

---

## 11. PATTERNS RELACIONADOS

Que patrones de Pekin implementa o requiere este activo:

- [ ] Provider Pattern
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern
- [ ] Otro:

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| modulo-ejemplo | Consume / Implementa / Envuelve | En uso / Planeado |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| producto-ejemplo | En uso / Planeado / Candidato |

---

## 14. REGLAS DE USO

Definir reglas vinculantes para el uso de este activo en CURDEECLAU:

1. Regla 1
2. Regla 2

---

## 15. REGLAS DE SEGURIDAD

1. No exponer credenciales en codigo.
2. Usar variables de entorno.
3. No loguear datos sensibles.
4. Regla adicional especifica del activo.

---

## 16. EVIDENCIA ACTUAL

- [ ] Ficha de naturalizacion (este documento): Completa / Parcial / Pendiente
- [ ] Adapter en `packages/`: Existe / Planeado / No implementado
- [ ] Implementacion InMemory: Existe / Planeado / No implementado
- [ ] Tests sin conexion al proveedor: Pasan / No implementados
- [ ] Principio extraido documentado: Si / No
- [ ] Plan de contingencia: Si / No

---

## 17. ESTADO DE IMPLEMENTACION

Estado actual de la integracion tecnica:

- [ ] No iniciado
- [ ] En progreso
- [ ] Funcional (requiere proveedor)
- [ ] Funcional (InMemory completo)
- [ ] Completo y verificado

---

## 18. DECISION

Estado final decidido para este activo:

- [ ] Proceder con naturalizacion completa
- [ ] Mantener como Aliado (usar, no naturalizar)
- [ ] Mantener como Referenciado (documentar, no integrar)
- [ ] Diferir decision
- [ ] Deprecar / Eliminar

---

## 19. PROXIMO PASO AUTORIZADO

Siguiente accion concreta autorizada:

(Describir o indicar "Ninguno — decision diferida")

---

*Fin del Template v1.0.0*
