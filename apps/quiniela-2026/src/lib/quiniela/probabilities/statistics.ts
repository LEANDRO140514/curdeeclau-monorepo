/**
 * STATISTICS — Análisis estadístico de frecuencias y distribuciones de signos.
 *
 * Operaciones:
 * - Conteo de frecuencias por posición
 * - Comparación observado vs esperado (chi-cuadrado)
 * - Estadísticas de diversidad
 * - Análisis de sesgo
 */

import type { PackedColumna, PackedMatriz } from '../matrices/schema'
import type { SignFrequencies, FrequencyComparison, MatchProbabilities } from './schema'
import { BASE_PROBABILITIES } from './schema'
import { TOTAL_POSICIONES, MASCARA_POSICION } from '../matrices/schema'

// ─── Frequency counting ───

/** Cuenta frecuencias de signos en columnas string[] */
export function countSignFrequencies(columnas: string[][]): SignFrequencies {
  const byPosition: SignFrequencies['byPosition'] = Array.from({ length: 14 }, () => ({
    home: 0,
    draw: 0,
    away: 0,
  }))

  for (const col of columnas) {
    for (let i = 0; i < 14; i++) {
      const pos = byPosition[i]
      if (col[i] === '1') pos.home++
      else if (col[i] === 'X') pos.draw++
      else pos.away++
    }
  }

  const n = columnas.length

  return {
    byPosition,
    global: aggregateGlobal(byPosition, n),
  }
}

/** Cuenta frecuencias en columnas packed */
export function countSignFrequenciesPacked(matriz: PackedMatriz): SignFrequencies {
  const byPosition: SignFrequencies['byPosition'] = Array.from({ length: 14 }, () => ({
    home: 0,
    draw: 0,
    away: 0,
  }))

  for (let c = 0; c < matriz.length; c++) {
    const packed = matriz[c]
    for (let i = 0; i < TOTAL_POSICIONES; i++) {
      const bits = (packed >> (i * 2)) & MASCARA_POSICION
      const pos = byPosition[i]
      if (bits === 0b00) pos.home++
      else if (bits === 0b01) pos.draw++
      else pos.away++
    }
  }

  return {
    byPosition,
    global: aggregateGlobal(byPosition, matriz.length),
  }
}

function aggregateGlobal(
  byPosition: SignFrequencies['byPosition'],
  n: number,
): SignFrequencies['global'] {
  let home = 0, draw = 0, away = 0
  for (const pos of byPosition) {
    home += pos.home
    draw += pos.draw
    away += pos.away
  }
  const total = home + draw + away
  return {
    home: total > 0 ? home / total : 0,
    draw: total > 0 ? draw / total : 0,
    away: total > 0 ? away / total : 0,
  }
}

// ─── Expected frequencies ───

/** Calcula frecuencias esperadas bajo un modelo de probabilidad */
export function expectedFrequencies(
  numColumns: number,
  matchProbs: MatchProbabilities[],
): SignFrequencies {
  const byPosition = matchProbs.map((p) => ({
    home: p.home * numColumns,
    draw: p.draw * numColumns,
    away: p.away * numColumns,
  }))
  const total = numColumns * 14

  return {
    byPosition,
    global: {
      home: byPosition.reduce((s, p) => s + p.home, 0) / total,
      draw: byPosition.reduce((s, p) => s + p.draw, 0) / total,
      away: byPosition.reduce((s, p) => s + p.away, 0) / total,
    },
  }
}

/** Frecuencias esperadas bajo el modelo base (~48/28/24) */
export function expectedBaseFrequencies(numColumns: number): SignFrequencies {
  return expectedFrequencies(numColumns, Array(14).fill(BASE_PROBABILITIES))
}

// ─── Chi-squared comparison ───

/**
 * Compara frecuencias observadas vs esperadas usando chi-cuadrado.
 *
 * χ² = Σ (O_i - E_i)² / E_i
 *
 * Grados de libertad: 2 por posición (3 categorías - 1) × 14 posiciones = 28
 * (asumiendo independencia entre posiciones)
 */
export function compareFrequencies(
  observed: SignFrequencies,
  expected: SignFrequencies,
): FrequencyComparison {
  const chiSquaredByPosition: number[] = []

  for (let i = 0; i < 14; i++) {
    const o = observed.byPosition[i]
    const e = expected.byPosition[i]
    let chi2 = 0
    if (e.home > 0) chi2 += (o.home - e.home) ** 2 / e.home
    if (e.draw > 0) chi2 += (o.draw - e.draw) ** 2 / e.draw
    if (e.away > 0) chi2 += (o.away - e.away) ** 2 / e.away
    chiSquaredByPosition.push(chi2)
  }

  const totalChi2 = chiSquaredByPosition.reduce((s, v) => s + v, 0)
  // Aproximación del p-valor para χ² con 28 grados de libertad
  // Usando la aproximación de Wilson-Hilferty
  const df = 28
  const pValueApprox = chiSquaredPValue(totalChi2, df)

  return {
    observed,
    expected,
    chiSquaredByPosition,
    pValueApprox,
  }
}

/**
 * Aproximación del p-valor para chi-cuadrado.
 * Usa la aproximación normal para df > 30, y Wilson-Hilferty para df menores.
 */
function chiSquaredPValue(chi2: number, df: number): number {
  // Wilson-Hilferty: (χ²/df)^(1/3) ~ N(1 - 2/(9df), 2/(9df))
  const z = ((chi2 / df) ** (1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df))
  return normalSurvivalFunction(z)
}

/** Aproximación de la función de supervivencia normal estándar */
function normalSurvivalFunction(z: number): number {
  // Abramowitz & Stegun 26.2.17
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const poly = t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  const prob = d * poly
  return z > 0 ? prob : 1 - prob
}

// ─── Diversity statistics ───

/** Calcula la diversidad de signos de una columna (0 = todo igual, 1 = perfectamente balanceada) */
export function columnDiversity(packed: PackedColumna): number {
  let home = 0, draw = 0, away = 0
  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    const bits = (packed >> (i * 2)) & MASCARA_POSICION
    if (bits === 0b00) home++
    else if (bits === 0b01) draw++
    else away++
  }
  const dispersion = Math.abs(home - draw) + Math.abs(draw - away) + Math.abs(away - home)
  return 1 - dispersion / 28
}

/** Diversidad media de una matriz */
export function averageDiversity(matriz: PackedMatriz): number {
  let sum = 0
  for (let i = 0; i < matriz.length; i++) {
    sum += columnDiversity(matriz[i])
  }
  return matriz.length > 0 ? sum / matriz.length : 0
}

// ─── Summary ───

/** Resumen estadístico de una matriz de columnas */
export function summarizeMatrix(matriz: PackedMatriz): {
  numColumns: number
  avgDiversity: number
  signDistribution: SignFrequencies
  comparesToBase: FrequencyComparison
} {
  const observed = countSignFrequenciesPacked(matriz)
  const expected = expectedBaseFrequencies(matriz.length)
  const comparison = compareFrequencies(observed, expected)

  return {
    numColumns: matriz.length,
    avgDiversity: averageDiversity(matriz),
    signDistribution: observed,
    comparesToBase: comparison,
  }
}
