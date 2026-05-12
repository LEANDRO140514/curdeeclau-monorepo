/**
 * EXPECTED VALUE ENGINE
 *
 * EV = Σ (probabilidad_de_acertar_nivel × payout_estimado) - costo
 *
 * El EV (Expected Value) mide el valor esperado de una apuesta.
 * EV > 0 → apuesta con valor esperado positivo (teóricamente rentable)
 * EV < 0 → apuesta con valor esperado negativo (la casa gana en expectativa)
 *
 * Para La Quiniela, el EV es típicamente negativo (~-30% a -50%)
 * debido al margen de Loterías y Apuestas del Estado (~45%).
 */

import type {
  EVResult,
  MatrixEV,
  PayoutEstimate,
  MatchProbabilities,
} from './schema'
import type { PackedColumna, PackedMatriz } from '../matrices/schema'
import { COST_PER_COLUMN } from './schema'
import {
  estimateHitProbabilities,
  generatePayoutEstimates,
  expectedPayoutForColumn,
} from './payout'
import { columnProbability, buildLookup, columnProbabilityFast } from './column'
import { aciertos } from '../matrices/packer'

// ─── Single column EV ───

/**
 * Calcula el EV para una columna individual.
 *
 * EV = Σ_{n=10}^{14} P(acertar ≥ n) × payout(n) - costo
 */
export function calculateEV(
  packed: PackedColumna,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
  cost = COST_PER_COLUMN,
): EVResult {
  const colProb = columnProbability(packed, matchProbs)
  const payoutEstimates = generatePayoutEstimates(estimatedPool, matchProbs)

  // Para cada resultado posible, calculamos cuántos aciertos tendría esta columna
  // y acumulamos el payout esperado.
  // Simplificación: usamos la probabilidad base de acertar cada nivel
  // multiplicada por el payout estimado
  let expectedPayout = 0

  for (const est of payoutEstimates) {
    expectedPayout += est.probability * est.payout
  }

  const ev = expectedPayout - cost

  return {
    columna: colProb.columna,
    packed,
    probability: colProb.probability,
    expectedValue: ev,
    expectedPayout,
    cost,
    roi: cost > 0 ? ev / cost : 0,
    breakdown: payoutEstimates,
  }
}

/**
 * Calcula EV usando payout basado en la columna específica.
 *
 * Más preciso que calculateEV porque considera la probabilidad real
 * de que ESTA columna (no una columna aleatoria) acierte cada nivel.
 */
export function calculateEVPerColumn(
  packed: PackedColumna,
  matchProbs: MatchProbabilities[],
  resultSpace: PackedMatriz,
  estimatedPool: number,
  cost = COST_PER_COLUMN,
): EVResult {
  const colProb = columnProbability(packed, matchProbs)
  const payouts = generatePayoutEstimates(estimatedPool, matchProbs)

  // Para cada resultado en el espacio, calculamos aciertos y payout
  let expectedPayout = 0
  let totalProb = 0

  for (let r = 0; r < resultSpace.length; r++) {
    const resultado = resultSpace[r]
    const hits = aciertos(packed, resultado)
    const probResultado = columnProbability(resultado, matchProbs).probability

    // Encontrar payout para este nivel de acierto
    let payoutForHits = 0
    for (const est of payouts) {
      if (hits >= est.nivel) {
        payoutForHits = est.payout
        break
      }
    }

    expectedPayout += probResultado * payoutForHits
    totalProb += probResultado
  }

  // Normalizar si no cubrimos todo el espacio
  if (totalProb > 0 && totalProb < 1) {
    expectedPayout /= totalProb
  }

  const ev = expectedPayout - cost

  return {
    columna: colProb.columna,
    packed,
    probability: colProb.probability,
    expectedValue: ev,
    expectedPayout,
    cost,
    roi: cost > 0 ? ev / cost : 0,
    breakdown: payouts,
  }
}

// ─── Matrix EV ───

/**
 * Calcula EV para todas las columnas de una matriz.
 */
export function calculateMatrixEV(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
  cost = COST_PER_COLUMN,
): MatrixEV {
  const results: EVResult[] = []
  let bestEV: EVResult | null = null
  let worstEV: EVResult | null = null
  let sumEV = 0
  let positiveCount = 0

  // Precomputar lookup para velocidad
  const lookup = buildLookup(matchProbs)

  for (let i = 0; i < matriz.length; i++) {
    const packed = matriz[i]
    const r = calculateEV(packed, matchProbs, estimatedPool, cost)
    results.push(r)
    sumEV += r.expectedValue

    if (r.expectedValue > 0) positiveCount++

    if (!bestEV || r.expectedValue > bestEV.expectedValue) bestEV = r
    if (!worstEV || r.expectedValue < worstEV.expectedValue) worstEV = r
  }

  // Calcular mediana
  const sorted = [...results].sort((a, b) => a.expectedValue - b.expectedValue)
  const mid = Math.floor(sorted.length / 2)
  const medianEV =
    sorted.length % 2 === 0
      ? (sorted[mid - 1].expectedValue + sorted[mid].expectedValue) / 2
      : sorted[mid].expectedValue

  return {
    results,
    bestEV: bestEV!,
    worstEV: worstEV!,
    averageEV: matriz.length > 0 ? sumEV / matriz.length : 0,
    medianEV,
    positiveEVCount: positiveCount,
    totalColumns: matriz.length,
  }
}

// ─── Quick EV (lightweight, no full breakdown) ───

/**
 * EV rápido sin desglose completo.
 * Útil para ranking de muchas columnas.
 */
export function quickEV(
  packed: PackedColumna,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
  cost = COST_PER_COLUMN,
): number {
  const { probAtLeast } = estimateHitProbabilities(matchProbs)
  const expectedPayout = expectedPayoutForColumn(
    probAtLeast as Record<number, number>,
    estimatedPool,
  )
  return expectedPayout - cost
}

/**
 * EV rápido para una matriz completa.
 * Retorna Float64Array con los EVs en el mismo orden.
 */
export function quickEVMatrix(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
  cost = COST_PER_COLUMN,
): Float64Array {
  const evs = new Float64Array(matriz.length)
  for (let i = 0; i < matriz.length; i++) {
    evs[i] = quickEV(matriz[i], matchProbs, estimatedPool, cost)
  }
  return evs
}
