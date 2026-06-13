# PATTERN DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de un patron en CURDEECLAU.

---

## 1. NOMBRE DEL PATTERN

Nombre oficial. Debe ser descriptivo y unico.

---

## 2. ESTADO INSTITUCIONAL

- [ ] Proposed — Propuesto, no validado en codigo.
- [ ] Active — Documentado y usado.
- [ ] Canonical — Active + 3+ modulos + 0 desviaciones + preservado como institucion Pekin.
- [ ] Superseded — Reemplazado por otro patron.
- [ ] Deprecated — No recomendado para nuevo codigo.

---

## 3. PROBLEMA QUE RESUELVE

Descripcion del problema recurrente que este patron aborda. Por que aparece una y otra vez.

---

## 4. SOLUCION PROPUESTA

Descripcion de la solucion abstracta. Como resuelve el patron el problema. Que estructura impone.

---

## 5. EVIDENCIA EN CODIGO

Lista de ubicaciones concretas donde este patron esta implementado:

| Modulo | Archivo(s) | Tipo de evidencia |
|--------|-----------|-------------------|
| modulo-ejemplo | `src/archivo.ts` | Implementacion completa / Parcial |

Se requiere un minimo de 3 ocurrencias en al menos 2 modulos distintos para que un patron sea considerado Active. Para Canonical se requieren 3+ modulos en 3+ contextos diferentes.

---

## 6. MODULOS QUE LO USAN

| Modulo | Tipo de modulo | Estado de adopcion |
|--------|---------------|-------------------|
| modulo-ejemplo | Engine / Provider / App | Completo / Parcial / Planeado |

---

## 7. NIVEL DE MADUREZ

- [ ] Experimental — Una sola ocurrencia, no validado.
- [ ] Parcial — 2 ocurrencias, validacion limitada.
- [ ] Estable — 3+ ocurrencias, tests, documentacion.
- [ ] Canonico — Estable + preservado como institucion Pekin.

---

## 8. INVARIANTES

Reglas que toda implementacion del patron debe cumplir:

1. MUST: Regla obligatoria.
2. MUST NOT: Prohibicion absoluta.
3. SHALL: Comportamiento esperado.

---

## 9. ANTI-PATTERNS RELACIONADOS

Que NO debe hacerse. Errores comunes al implementar este patron:

1. Anti-patron: Descripcion. Por que es incorrecto.
2. Anti-patron: Descripcion. Por que es incorrecto.

---

## 10. CUANDO USARLO

Condiciones bajo las cuales este patron debe aplicarse:

1. Condicion 1
2. Condicion 2

---

## 11. CUANDO NO USARLO

Condiciones bajo las cuales este patron NO debe aplicarse (aunque parezca aplicable):

1. Contraindicacion 1
2. Contraindicacion 2

---

## 12. RELACION CON PEKIN

- Principios que implementa: (ej: Principio IV — Separacion de Principio y Herramienta)
- Es una institucion de Pekin? Si / No / Candidato
- Si es institucion: Nombre de la institucion asociada
- Nivel en jerarquia: Nivel 4 — Patrones

---

## 13. RELACION CON LEGOLAND

- Tipo en Legoland: Pattern
- Los legos que implementan este patron estan catalogados en `reference/legoland-catalogo.md`
- Este patron debe referenciarse en el DNA de los modulos que lo implementan

---

## 14. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — el patron esta en uso normal.")

---

*Fin del Pattern DNA Template v1.0.0*
