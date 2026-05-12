# MVP Product Architecture — Quiniela 2026

## Visión General

La plataforma tiene DOS sistemas principales de concurso más capa de producto, entitlements, análisis probabilístico y comunicación.

## Arquitectura de Capas

```
┌──────────────────────────────────────────────────┐
│                    UI (React)                     │
├──────────────────────────────────────────────────┤
│                 Zustand Store                     │
├──────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Contest   │  │ Oráculo  │  │ Entitlements│  │
│  │   System    │  │ (Análisis)│  │  System    │  │
│  ├─────────────┤  ├──────────┤  ├────────────┤  │
│  │ formats.ts  │  │ analysis │  │ index.ts   │  │
│  │ products.ts │  │ probabilities│            │  │
│  │ addons.ts   │  └──────────┘  └────────────┘  │
│  │ pricing.ts  │                                │
│  │ rules.ts    │  ┌──────────────────────┐      │
│  └─────────────┘  │ Communication (IRIS) │      │
│                    │ telegram.ts          │      │
│  ┌─────────────┐  └──────────────────────┘      │
│  │ Reductions  │                                │
│  │  System     │  ┌──────────────────────┐      │
│  ├─────────────┤  │  Probability Layer   │      │
│  │ compatibility│ │  (Phase 2)           │      │
│  │ catalog.ts  │  └──────────────────────┘      │
│  └─────────────┘                                │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Math Engine (Phase 1)             │   │
│  │  engine/ | matrices/ | algorithms/        │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

## Sistemas de Concurso

### System 1 — Progol System

| Formato | Partidos | Tipo |
|---------|---------|------|
| Progol 14 | 14 | Weekend, primario |
| Revancha 7 | 7 | Weekend, addon |

**Reglas:**
- Progol 14 requiere compra
- Revancha 7 es addon opcional (R8+ en Progol)
- Reducciones compatibles: R9, R16, R24, R64, R81, R132

### System 2 — Private 11 Plus

| Formato | Partidos | Tipo |
|---------|---------|------|
| Private 11 | 11 | Social |

**Reglas:**
- Entrada gratis al comprar reducción Progol
- Entradas extra comprables
- Reducciones premium opcionales: R9-R81

### Media Semana

| Formato | Partidos | Tipo |
|---------|---------|------|
| Media Semana 9 | 9 | Midweek, primario |

## Matriz de Compatibilidad

### Progol 14
R9 → R16 → R24 → R64 → R81 → R132

### Revancha 7
R4 → R8 → R16 → R32

### Media Semana 9
R9 → R16 → R24 → R32 → R64

### Private 11
R9 → R16 → R24 → R32 → R64 → R81

## Sistema de Entitlements

```
Compra Reducción
    ↓
Desbloquea:
├── Private 11 entrada gratis
├── Entradas extra según R(X)
├── Revancha (R8+)
└── Análisis premium (R16+)
```

### Entradas Private 11 por Reducción
| R4 | R8 | R9 | R16 | R24 | R32 | R64 | R81 | R132 |
|----|----|----|-----|-----|-----|-----|-----|------|
| 1  | 1  | 1  | 2   | 3   | 3   | 5   | 5   | 10   |

## Oráculo — Probability-Assisted Reductions

NO vende predicciones. Asiste en la selección de reducciones.

### Análisis por partido
- P(max) > 0.55 → Fijo
- 0.40 < P(max) ≤ 0.55 → Doble
- P(max) ≤ 0.40 → Triple (alta incertidumbre)

### Recomendación de reducción
Score = volatilidad × cobertura + (1 - volatilidad) × ahorro

### Disclaimer legal
"Los porcentajes representan estimaciones probabilísticas generadas por nuestro modelo y NO garantizan resultados."

## Product Loop MVP

```
Análisis → Compra → Desbloqueo P11 → Competir → Telegram → Regresar
```

## Comunicación (IRIS)

Eventos del sistema:
- NEW_MATCHDAY: Nueva jornada
- RESULTS_PUBLISHED: Resultados
- BETTING_REMINDER: Recordatorio
- REDUCTION_PURCHASED: Confirmación
- PRIVATE11_UNLOCKED: Desbloqueo
- PRIZE_WON: Premio
- PROMOTION_AVAILABLE: Promo

## Pricing

Precios base configurables:

| R4 | R8 | R9 | R16 | R24 | R32 | R64 | R81 | R132 |
|----|----|----|-----|-----|-----|-----|-----|------|
| 3€ | 6€ | 6.75€ | 12€ | 18€ | 24€ | 48€ | 60.75€ | 99€ |

Estrategia: precios accesibles, bundles con descuento, primera compra con promo.

## Reglas MVP

NO implementar todavía:
- IA predictiva avanzada
- OCR
- Monte Carlo pesado
- Social feed / chat
- Achievements
- Marketplace
- Mobile nativo
- Crypto/tokens
