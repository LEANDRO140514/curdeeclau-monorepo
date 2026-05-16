/**
 * MONTE CARLO SIMULATION ENGINE
 *
 * Simula miles de sorteos de La Quiniela para estimar:
 * - Probabilidad de cada nivel de acierto
 * - ROI esperado
 * - EV y su varianza
 * - Distribución de premios
 *
 * Opera sobre packed format para máximo throughput.
 * Cada sorteo genera un resultado aleatorio según las probabilidades
 * por partido, y evalúa todas las columnas contra ese resultado.
 */

import type {
  SimulationConfig,
  SimulationResult,
  SimulatedDraw,
  MatchProbabilities,
} from './schema'
import type { PackedColumna, PackedMatriz } from '../matrices/schema'
import { TOTAL_POSICIONES, MASCARA_POSICION } from '../matrices/schema'
import { aciertos } from '../matrices/packer'
import { PRIZE_DISTRIBUTION, COST_PER_COLUMN } from './schema'

// ─── Random result generation ───

/**
 * Genera un resultado aleatorio (packed) según probabilidades por partido.
 *
 * Usa Math.random() — suficiente para simulación.
 * Para aplicaciones criptográficas, usar crypto.getRandomValues().
 */
export function generateRandomResult(matchProbs: MatchProbabilities[]): PackedColumna {
  let result = 0

  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    const p = matchProbs[i]
    const r = Math.random()
    let bits: number
    if (r < p.home) bits = 0b00        // '1'
    else if (r < p.home + p.draw) bits = 0b01  // 'X'
    else bits = 0b10                          // '2'

    result |= bits << (i * 2)
  }

  return result >>> 0
}

/**
 * Genera un resultado con distribución uniforme (1/3 cada signo).
 */
export function generateUniformResult(): PackedColumna {
  let result = 0
  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    const r = Math.floor(Math.random() * 3)
    result |= r << (i * 2)
  }
  return result >>> 0
}

// ─── Single draw ───

/** Simula un sorteo: genera resultado y evalúa columnas */
export function simulateDraw(
  matchProbs: MatchProbabilities[],
  columns: PackedMatriz,
): SimulatedDraw {
  const result = generateRandomResult(matchProbs)
  const columnHits: number[] = []

  let maxAciertos = 0
  for (let i = 0; i < columns.length; i++) {
    const hits = aciertos(columns[i], result)
    columnHits.push(hits)
    if (hits > maxAciertos) maxAciertos = hits
  }

  return { result, maxAciertos, columnHits }
}

// ─── Full simulation ───

/** Política de payout para la simulación */
export type PayoutPolicy =
  | { type: 'fixed_pool'; totalPool: number }
  | { type: 'historical_average' }
  | { type: 'per_winner'; totalPool: number }

/**
 * Ejecuta simulación Monte Carlo completa.
 *
 * Para cada sorteo:
 * 1. Genera resultado aleatorio
 * 2. Evalúa cada columna contra el resultado
 * 3. Registra aciertos máximos y distribución
 * 4. Acumula estadísticas para EV y ROI
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const t0 = performance.now()

  const n = config.numDraws
  const hitCounts: Record<number, number> = {}
  const evs: number[] = []
  let bestPacked = 0
  let bestMeanAciertos = -1
  let bestMaxAciertos = -1
  const columnAccAciertos = new Float64Array(config.columns.length)

  // Inicializar contadores de hits
  for (let h = 0; h <= 14; h++) hitCounts[h] = 0

  // Bote estimado por sorteo
  const totalPool = config.costPerColumn * config.columns.length * 2 // rough estimate

  for (let draw = 0; draw < n; draw++) {
    const d = simulateDraw(config.matchProbabilities, config.columns)

    // Registrar aciertos
    hitCounts[d.maxAciertos]++

    // Acumular para estadísticas por columna
    for (let c = 0; c < config.columns.length; c++) {
      columnAccAciertos[c] += d.columnHits[c]
    }

    // Estimar EV para este sorteo
    let payout = 0
    for (let nivel = 10; nivel <= 14; nivel++) {
      if (d.maxAciertos >= nivel) {
        payout += totalPool * (PRIZE_DISTRIBUTION[nivel] ?? 0)
      }
    }
    const ev = payout - config.columns.length * config.costPerColumn
    evs.push(ev)
  }

  // Encontrar mejor columna
  for (let c = 0; c < config.columns.length; c++) {
    const meanAciertos = columnAccAciertos[c] / n
    if (meanAciertos > bestMeanAciertos) {
      bestMeanAciertos = meanAciertos
      bestPacked = config.columns[c]
    }
  }

  // Convertir hitCounts a probabilidades
  const hitProbabilities: Record<number, number> = {}
  for (let h = 0; h <= 14; h++) {
    hitProbabilities[h] = hitCounts[h] / n
  }

  // Estadísticas de EV
  const meanEV = evs.reduce((s, v) => s + v, 0) / evs.length
  const variance = evs.reduce((s, v) => s + (v - meanEV) ** 2, 0) / evs.length
  const stdEV = Math.sqrt(variance)
  const sortedEVs = [...evs].sort((a, b) => a - b)

  const percentiles = {
    p5: percentile(sortedEVs, 5),
    p25: percentile(sortedEVs, 25),
    p50: percentile(sortedEVs, 50),
    p75: percentile(sortedEVs, 75),
    p95: percentile(sortedEVs, 95),
  }

  const t1 = performance.now()

  return {
    config,
    draws: n,
    hitProbabilities,
    estimatedROI: meanEV / (config.columns.length * config.costPerColumn),
    meanEV,
    stdEV,
    evPercentiles: percentiles,
    bestColumn: {
      packed: bestPacked,
      meanAciertos: bestMeanAciertos,
      maxAciertos: bestMaxAciertos,
    },
    executionTimeMs: t1 - t0,
  }
}

/** Corre simulación rápida solo con contadores de aciertos */
export function quickSimulation(
  numDraws: number,
  matchProbs: MatchProbabilities[],
  columns: PackedMatriz,
): { hitProbabilities: Record<number, number>; executionTimeMs: number } {
  const t0 = performance.now()
  const hitCounts: Record<number, number> = {}
  for (let h = 0; h <= 14; h++) hitCounts[h] = 0

  for (let draw = 0; draw < numDraws; draw++) {
    const d = simulateDraw(matchProbs, columns)
    hitCounts[d.maxAciertos]++
  }

  const hitProbabilities: Record<number, number> = {}
  for (let h = 0; h <= 14; h++) {
    hitProbabilities[h] = hitCounts[h] / numDraws
  }

  const t1 = performance.now()

  return { hitProbabilities, executionTimeMs: t1 - t0 }
}

// ─── ROI analysis ───

/** Estima ROI mediante Monte Carlo con intervalos de confianza */
export function estimateROI(
  config: SimulationConfig,
): { roi: number; ci95Low: number; ci95High: number } {
  const result = runSimulation(config)
  const roi = result.estimatedROI
  const se = result.stdEV / Math.sqrt(config.numDraws)
  const ci95Low = roi - 1.96 * se
  const ci95High = roi + 1.96 * se

  return { roi, ci95Low, ci95High }
}

// ─── Helpers ───

function percentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const fraction = index - lower
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction
}
