/**
 * PROBABILITY VALIDATION — Validación y normalización de probabilidades.
 *
 * Garantiza que las probabilidades sean matemáticamente válidas:
 * - Cada partido: home + draw + away = 1
 * - Valores en [0, 1]
 * - Sin NaN, Infinity, o negativos
 */

import type { MatchProbabilities, CalibratedMatch } from './schema'

const EPSILON = 1e-10

/** Verifica que las probabilidades de un partido sumen 1 */
export function isValidMatchProbabilities(p: MatchProbabilities): boolean {
  if (!isFinite(p.home) || !isFinite(p.draw) || !isFinite(p.away)) return false
  if (p.home < 0 || p.draw < 0 || p.away < 0) return false
  if (p.home > 1 || p.draw > 1 || p.away > 1) return false
  return Math.abs(p.home + p.draw + p.away - 1) < EPSILON
}

/** Verifica que un número sea finito y válido como probabilidad */
function isFinite(n: number): boolean {
  return Number.isFinite(n) && !Number.isNaN(n)
}

/** Normaliza probabilidades para que sumen exactamente 1 */
export function normalizeProbabilities(p: MatchProbabilities): MatchProbabilities {
  const sum = p.home + p.draw + p.away
  if (sum === 0) {
    return { home: 1 / 3, draw: 1 / 3, away: 1 / 3 }
  }
  return {
    home: p.home / sum,
    draw: p.draw / sum,
    away: p.away / sum,
  }
}

/** Aplica Laplace smoothing para evitar probabilidades 0 */
export function laplaceSmooth(
  counts: { home: number; draw: number; away: number },
  alpha = 1,
): MatchProbabilities {
  const total = counts.home + counts.draw + counts.away + alpha * 3
  return {
    home: (counts.home + alpha) / total,
    draw: (counts.draw + alpha) / total,
    away: (counts.away + alpha) / total,
  }
}

/** Valida que un array de 14 probabilidades sea consistente */
export function validateMatchProbabilitiesArray(
  probs: MatchProbabilities[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (probs.length !== 14) {
    errors.push(`Expected 14 match probability sets, got ${probs.length}`)
  }

  for (let i = 0; i < probs.length && i < 14; i++) {
    if (!isValidMatchProbabilities(probs[i])) {
      const p = probs[i]
      const sum = p.home + p.draw + p.away
      errors.push(
        `Match ${i}: invalid probabilities (${p.home.toFixed(3)}, ${p.draw.toFixed(3)}, ${p.away.toFixed(3)}) sum=${sum.toFixed(3)}`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

/** Convierte cuotas de apuestas a probabilidades implícitas */
export function oddsToProbabilities(homeOdds: number, drawOdds: number, awayOdds: number): {
  raw: MatchProbabilities
  calibrated: MatchProbabilities
  overround: number
} {
  // Probabilidades implícitas brutas = 1/odds
  const rawHome = 1 / homeOdds
  const rawDraw = 1 / drawOdds
  const rawAway = 1 / awayOdds

  // Overround = margen de la casa de apuestas
  const overround = rawHome + rawDraw + rawAway - 1

  // Normalizar para remover overround
  const calibrated = normalizeProbabilities({
    home: rawHome,
    draw: rawDraw,
    away: rawAway,
  })

  return {
    raw: { home: rawHome, draw: rawDraw, away: rawAway },
    calibrated,
    overround,
  }
}

/** Calcula la entropía de una distribución de probabilidad */
export function entropy(p: MatchProbabilities): number {
  let h = 0
  if (p.home > 0) h -= p.home * Math.log2(p.home)
  if (p.draw > 0) h -= p.draw * Math.log2(p.draw)
  if (p.away > 0) h -= p.away * Math.log2(p.away)
  return h
}

/** Compara dos distribuciones con divergencia KL: D_KL(P || Q) */
export function klDivergence(p: MatchProbabilities, q: MatchProbabilities): number {
  let d = 0
  if (p.home > 0 && q.home > 0) d += p.home * Math.log2(p.home / q.home)
  if (p.draw > 0 && q.draw > 0) d += p.draw * Math.log2(p.draw / q.draw)
  if (p.away > 0 && q.away > 0) d += p.away * Math.log2(p.away / q.away)
  return d
}
