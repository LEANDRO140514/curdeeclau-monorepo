# DNA DE QUINIELA 2026

> Tipo: institutional/dna
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-11
> Revisado: 2026-06-11

---

## IDENTIDAD

**Nombre:** Quiniela 2026
**Tipo:** Producto — Aplicación web de La Quiniela para el Mundial 2026
**Versión:** 1.0.0 (production)
**Ubicación:** `apps/quiniela-2026_deepclaude/`
**Usuario objetivo:** Jugadores de La Quiniela en México

Quiniela 2026 es la aplicación que ayuda a los jugadores de La Quiniela a crear, optimizar y gestionar sus apuestas para el Mundial 2026. No es un sitio de apuestas. No es una casa de pronósticos. Es una herramienta matemática que maximiza la cobertura y minimiza el costo de cada apuesta.

La Quiniela existe desde 1929 en España y es el juego de pronósticos deportivos más longevo del mundo. Quiniela 2026 lleva ese legado al formato digital con algoritmos de optimización combinatoria de última generación.

---

## MISIÓN

Empoderar al jugador de La Quiniela con inteligencia matemática:

1. **Seleccionar signos** (1/X/2) con asistencia estadística del Oráculo.
2. **Generar reducciones** que minimicen el costo manteniendo la garantía de premio.
3. **Exportar boletos** en formatos compatibles con puntos de venta oficiales.
4. **Visualizar resultados** y calcular ganancias automáticamente.
5. **Sobrevivir** en modo Survivor con apuestas condicionadas por etapa del torneo.

---

## VISIÓN

Una plataforma donde:

- El jugador entiende exactamente qué garantía tiene y cuánto le cuesta.
- Las reducciones se calculan en milisegundos usando columnas empacadas en bits.
- Los modelos probabilísticos (frecuentistas, Bayesianos, EV) informan cada decisión.
- El Oráculo recomienda configuraciones basadas en datos históricos y odds en vivo.
- El producto funciona offline-first, sin servidor, sin cuenta — puro navegador.

---

## PRINCIPIOS OPERATIVOS

| Principio Constitucional | Manifestación en Quiniela |
|--------------------------|---------------------------|
| VI. Decisión Informada | Toda recomendación del Oráculo cita su fuente (frecuencia histórica, odds, modelo). |
| VII. Fallo Visible | Toda validación de producto rechaza configuraciones inválidas con mensaje específico. |
| IX. Regenerabilidad | Las matrices de reducción están documentadas con metadatos; el motor puede recalcular todo. |
| I. Soberanía | La app es 100% cliente. Sin servidor, sin base de datos externa, sin dependencia de API. |

---

## ARQUITECTURA

### Loop de Producto (4 Momentos)

```
MOMENTO 0 — ORÁCULO (Selección de Signos)
  ├── Análisis estadístico por partido
  ├── Recomendaciones de reducción
  └── Sugerencia de configuración inicial
       ↓
MOMENTO 1 — ARQUITECTO (Generación de Reducciones)
  ├── Algoritmos de cobertura (Set Cover, Schönheim)
  ├── Matrices empacadas (28 bits por columna)
  ├── Catálogo de reducciones oficiales
  └── Validación de compatibilidad
       ↓
MOMENTO 2 — NOTARIO (Exportación de Boleto)
  ├── Renderizado de columnas
  ├── Exportación HTML / impresión
  └── Validación final pre-entrega
       ↓
MOMENTO 3 — ESTADIO (Resultados)
  ├── Carga de resultados oficiales
  ├── Cálculo de aciertos por columna
  └── Estimación de premios
```

### Motor Matemático (`src/lib/quiniela/`)

| Módulo | Capacidad |
|--------|-----------|
| `engine/` | Validación, pricing, generación directa, reducciones |
| `matrices/` | Columnas empacadas (PackedColumna, 28 bits), serialización, validación, benchmark |
| `algorithms/` | Set Cover, Schönheim, cobertura, heurísticas de diversidad |
| `probabilities/` | Modelos (uniforme, empírico, Laplaciano, Bayesiano, odds), EV, ranking, simulación Monte Carlo |
| `contest/` | Formatos (Progol 14, Revancha 7, Media Semana 9, Private 11), productos, addons, pricing, reglas |
| `reductions/` | Catálogo de productos, compatibilidad, intensidad |
| `oraculo/` | Análisis de partidos y jornadas, recomendaciones, análisis público |
| `survivor/` | Motor de Survivor con fases de torneo y ventanas de apuesta |
| `communication/` | Agentes (ATLAS, ORÁCULO, HERMES, IRIS), templates de Telegram, event bus |
| `orchestrator/` | Loop de producto con transiciones validadas |

### Stack Técnico

| Tecnología | Uso |
|------------|-----|
| React 19 | UI components (Momento 0-3) |
| Vite 5 | Build tool + dev server |
| TypeScript 5.6 | Type safety en motor y UI |
| Zustand | State management (store por momento) |
| TailwindCSS 3 | Estilos utilitarios |
| Vitest | Test runner (engine, probabilidades, matrices) |

---

## FORMATOS DE CONCURSO

| Formato | Partidos | Tipo |
|---------|----------|------|
| Progol 14 | 14 | Principal (fin de semana) |
| Revancha 7 | 7 | Addon (posterior a Progol 14) |
| Media Semana 9 | 9 | Principal (entre semana) |
| Private 11 | 11 | Principal (personalizado) |

---

## MATRICES EMPACADAS

Innovación arquitectónica clave: cada columna de 14 signos se representa en 28 bits.

| Operación | Complejidad | Descripción |
|-----------|-------------|-------------|
| `packColumna` | O(1) | 14 signos → 28 bits |
| `unpackColumna` | O(1) | 28 bits → 14 signos |
| `hammingDistancia` | O(1) | XOR + popcount nativo |
| `aciertos` | O(1) | AND + popcount contra resultado |
| `cumpleGarantia` | O(n) | Verifica cobertura N-1, N-2 sobre packed |

Esto permite procesar millones de columnas en milisegundos sin decodificar.

---

## ESTADO ACTUAL

- **Fase:** v1.0.0 producción
- **Tests:** Suite completa para engine, probabilidades y matrices ✅
- **UI:** 4 momentos implementados con Zustand store ✅
- **Pendiente:** Integración con APIs de odds en vivo
- **Pendiente:** Modo multijugador / ligas privadas (Survivor engine ya tiene tipos)
- **Pendiente:** Canal de Telegram para notificaciones de resultados (templates ya definidos)

---

## AGENTES DEL ECOSISTEMA QUINIELA

| Agente | Rol |
|--------|-----|
| ATLAS | Carga, valida y versiona datasets de resultados históricos y odds |
| ORÁCULO | Calcula probabilidades, EV, simulaciones y recomienda configuraciones |
| HERMES | Gestiona memoria de usuario: preferencias, history, configuraciones guardadas |
| IRIS | Despacha notificaciones por Telegram: resultados, premios, recordatorios |

---

## MÉTRICAS CLAVE

- Cobertura garantizada vs. costo (ratio eficiencia)
- Tiempo de generación de reducciones para N columnas
- Precisión del modelo probabilístico (backtesting contra resultados reales)
- Tasa de conversión: visita → boleto generado → boleto exportado

---

## NO NEGOCIABLE

- La app es 100% cliente. Sin servidor, sin cuentas obligatorias, sin tracking.
- Toda recomendación del Oráculo cita fuente y modelo.
- Las garantías de reducción son matemáticas — no aspiracionales.
- El motor de quiniela es puro TypeScript, sin dependencias externas de runtime.
- Las matrices de reducción son datos, no código — pueden actualizarse sin redeploy.

---

## RELACIÓN CON SURVIVOR

El Survivor Engine está integrado en el motor de quiniela (`src/lib/quiniela/survivor/`) con tipos completos para fases de torneo, ventanas de apuesta, entradas de jugador, picks, ligas y leaderboards. El producto Survivor World Cup es una extensión natural que usará este engine.

---

*Fin del DNA de Quiniela 2026 v1.0.0*
