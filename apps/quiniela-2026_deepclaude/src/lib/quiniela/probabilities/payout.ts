/**
 * PAYOUT ESTIMATION — Estimación de premios esperados por nivel de acierto.
 *
 * Modelos implementados:
 * - Fixed pool: distribución fija del bote (% oficial de La Quiniela)
 * - Proportional: proporcional al número de acertantes esperados
 * - Historical average: basado en medias históricas
 *
 * La distribución oficial de La Quiniela:
 *   14 aciertos: 16% de la recaudación (Pleno)
 *   13 aciertos: 7.5%
 *   12 aciertos: 3%
 *   11 aciertos: 1.5%
 *   10 aciertos: 9% (reintegro, ~15€ fijos)
 */

import type { PayoutEstimate, MatchProbabilities } from './schema'
import { PRIZE_DISTRIBUTION } from './schema'
import type { NivelGarantia } from '../types'

// ─── Fixed pool model ───

/**
 * Estima payouts usando la distribución oficial fija.
 *
 * Asume que el bote total se distribuye según los % oficiales.
 * No modela el número de acertantes — solo el payout bruto por nivel.
 */
export function estimateFixedPool(
  estimatedPool: number,
): Record<number, number> {
  const payouts: Record<number, number> = {}
  for (const [nivel, pct] of Object.entries(PRIZE_DISTRIBUTION)) {
    payouts[Number(nivel)] = estimatedPool * pct
  }
  return payouts
}

/**
 * Estima el payout esperado para una columna específica,
 * ponderando cada nivel de acierto por su probabilidad.
 */
export function expectedPayoutForColumn(
  probHitExactly: Record<number, number>, // P(acertar exactamente N)
  estimatedPool: number,
): number {
  const payouts = estimateFixedPool(estimatedPool)
  let total = 0

  for (let aciertos = 10; aciertos <= 14; aciertos++) {
    total += (probHitExactly[aciertos] ?? 0) * (payouts[aciertos] ?? 0)
  }

  return total
}

// ─── Acertantes model ───

/**
 * Estima el número de acertantes para cada nivel,
 * asumiendo independencia y probabilidades base.
 *
 * N_acertantes(nivel) = Total_columnas_jugadas × P(acertar ≥ nivel)
 *
 * Total_columnas_jugadas ≈ recaudación / 0.75
 */
export function estimateWinners(
  estimatedPool: number,
  matchProbs: MatchProbabilities[],
): Record<number, number> {
  const totalColumns = Math.round(estimatedPool / 0.75)

  // Probabilidad de acertar exactamente k partidos
  // bajo independencia es compleja; usamos simulación simplificada
  // o fórmula de Poisson-binomial.

  // Simplificación: usamos la distribución de aciertos esperada
  // para una columna aleatoria con las probabilidades dadas.
  const { probAtLeast } = estimateHitProbabilities(matchProbs)

  const winners: Record<number, number> = {}
  for (let nivel = 10; nivel <= 14; nivel++) {
    winners[nivel] = Math.max(1, Math.round(totalColumns * (probAtLeast[nivel] ?? 0)))
  }

  return winners
}

/**
 * Estima payout por acertante (sin modelar acumulación de botes).
 */
export function estimatePayoutPerWinner(
  estimatedPool: number,
  winners: Record<number, number>,
): Record<number, number> {
  const payouts = estimateFixedPool(estimatedPool)
  const perWinner: Record<number, number> = {}

  for (let nivel = 10; nivel <= 14; nivel++) {
    perWinner[nivel] = (payouts[nivel] ?? 0) / (winners[nivel] ?? 1)
  }

  return perWinner
}

// ─── Hit probability estimation ───

/**
 * Estima P(acertar ≥ N) y P(acertar = N) para una columna aleatoria
 * dadas las probabilidades de cada partido.
 *
 * Usa la distribución Poisson-binomial (suma de Bernoullis independientes
 * con diferentes probabilidades).
 *
 * Calculado vía Dynamic Programming (complejidad O(14 × 14) = O(196)).
 */
export function estimateHitProbabilities(matchProbs: MatchProbabilities[]): {
  probExactly: Record<number, number>
  probAtLeast: Record<number, number>
} {
  const n = matchProbs.length

  // dp[k] = P(acertar exactamente k después de procesar i partidos)
  let dp = new Float64Array(n + 1)
  dp[0] = 1

  for (let i = 0; i < n; i++) {
    // Probabilidad de acertar este partido con una apuesta aleatoria
    // = (1/3) para cada signo si no hay información.
    // Con información de probabilidades, es la probabilidad del signo
    // que apostamos. Como no sabemos qué apostamos, usamos la
    // probabilidad media de acertar = P(1)² + P(X)² + P(2)²
    // (asumiendo que apostamos proporcionalmente a las probabilidades reales)
    const p = matchProbs[i]
    const pHit = p.home * p.home + p.draw * p.draw + p.away * p.away

    const next = new Float64Array(n + 1)
    for (let k = 0; k <= i; k++) {
      next[k] += dp[k] * (1 - pHit)
      next[k + 1] += dp[k] * pHit
    }
    dp = next
  }

  const probExactly: Record<number, number> = {}
  const probAtLeast: Record<number, number> = {}

  for (let k = 0; k <= n; k++) {
    probExactly[k] = dp[k]
  }

  // Acumulado desde arriba
  let cumulative = 0
  for (let k = n; k >= 0; k--) {
    cumulative += dp[k]
    probAtLeast[k] = cumulative
  }

  return { probExactly, probAtLeast }
}

// ─── Full payout estimates ───

/**
 * Genera PayoutEstimate[] para todos los niveles de premio.
 */
export function generatePayoutEstimates(
  estimatedPool: number,
  matchProbs: MatchProbabilities[],
): PayoutEstimate[] {
  const { probAtLeast } = estimateHitProbabilities(matchProbs)
  const winners = estimateWinners(estimatedPool, matchProbs)
  const perWinner = estimatePayoutPerWinner(estimatedPool, winners)
  const payouts = estimateFixedPool(estimatedPool)

  const estimates: PayoutEstimate[] = []

  for (let nivel = 10; nivel <= 14; nivel++) {
    const n = nivel as NivelGarantia
    // Probabilidad de acertar exactamente este nivel (no ≥)
    const probExactlyN =
      nivel < 14
        ? (probAtLeast[nivel] ?? 0) - (probAtLeast[nivel + 1] ?? 0)
        : (probAtLeast[14] ?? 0)

    estimates.push({
      nivel: n,
      probability: probExactlyN,
      payout: perWinner[nivel] ?? payouts[nivel] ?? 0,
    })
  }

  return estimates
}

// ─── Historical averages ───

/**
 * Premios medios históricos por categoría (La Quiniela, ~2015-2024).
 * Estos son valores observados, no teóricos.
 */
export const HISTORICAL_AVERAGE_PRIZES: Record<number, number> = {
  14: 500_000,  // Pleno medio ~500k€ (muy variable, depende de botes)
  13: 800,      // ~800€ medio
  12: 40,       // ~40€ medio
  11: 6,        // ~6€ medio
  10: 1.5,      // ~1.5€ medio (reintegro)
}

/**
 * Modelo de payout basado en medias históricas.
 * Simple pero útil como baseline cuando no hay estimación de bote.
 */
export function historicalPayoutEstimates(): PayoutEstimate[] {
  return Object.entries(HISTORICAL_AVERAGE_PRIZES).map(([nivel, payout]) => ({
    nivel: Number(nivel) as NivelGarantia,
    probability: 0, // Sin estimación de probabilidad en este modelo
    payout,
  }))
}
