/**
 * COLUMN PROBABILITY ENGINE
 *
 * Calcula P(columna) = ∏ P(resultado_i) asumiendo independencia entre partidos.
 *
 * La arquitectura está preparada para correlaciones futuras (matriz de covarianza,
 * cópulas, modelos gráficos) pero la implementación base es independiente.
 *
 * Todas las funciones operan sobre formato packed para máximo rendimiento.
 */

import type {
  MatchProbabilities,
  ColumnProbability,
  MatrixProbabilities,
  CalibratedMatch,
} from './schema'
import type { PackedColumna, PackedMatriz } from '../matrices/schema'
import { TOTAL_POSICIONES, MASCARA_POSICION, BITS_A_SIGNO } from '../matrices/schema'

// ─── Single column ───

/** Mapa rápido: índice de bit (0,1,2) → probabilidad en el array */
type ProbLookup = [number, number, number] // [P(1), P(X), P(2)]

/**
 * Calcula P(columna) dado un array de probabilidades por partido.
 *
 * P(C) = ∏_{i=0}^{13} P(resultado_i en posición i)
 *
 * Opera directamente sobre packed column para evitar unpack.
 */
export function columnProbability(
  packed: PackedColumna,
  matchProbs: MatchProbabilities[],
): ColumnProbability {
  let probability = 1
  let logProbability = 0

  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    const bits = (packed >> (i * 2)) & MASCARA_POSICION
    const p = matchProbs[i]

    let prob: number
    if (bits === 0b00) prob = p.home
    else if (bits === 0b01) prob = p.draw
    else prob = p.away

    probability *= prob
    logProbability += Math.log2(prob)
  }

  return {
    probability,
    logProbability,
    impliedOdds: probability > 0 ? 1 / probability : Infinity,
    columna: unpackPackedToStrings(packed) as ColumnProbability['columna'],
    packed,
  }
}

/**
 * Calcula P(columna) usando lookup tables precomputadas.
 * Más rápido que columnProbability para evaluar muchas columnas
 * contra las mismas probabilidades.
 */
export function columnProbabilityFast(
  packed: PackedColumna,
  lookup: ProbLookup[],
): { probability: number; logProbability: number } {
  let probability = 1
  let logProbability = 0

  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    const bits = (packed >> (i * 2)) & MASCARA_POSICION
    const prob = lookup[i][bits]
    probability *= prob
    logProbability += Math.log2(prob)
  }

  return { probability, logProbability }
}

/** Construye lookup table para evaluación rápida */
export function buildLookup(matchProbs: MatchProbabilities[]): ProbLookup[] {
  return matchProbs.map((p) => [p.home, p.draw, p.away])
}

// ─── Matrix ───

/**
 * Calcula probabilidades para todas las columnas de una matriz.
 * Retorna estadísticas agregadas incluyendo entropía total.
 */
export function matrixProbabilities(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
): MatrixProbabilities {
  const lookup = buildLookup(matchProbs)
  const columns: ColumnProbability[] = []
  let totalProbability = 0
  let minProbability = Infinity
  let maxProbability = -Infinity
  let entropy = 0

  for (let i = 0; i < matriz.length; i++) {
    const cp = columnProbability(matriz[i], matchProbs)
    columns.push(cp)
    totalProbability += cp.probability
    if (cp.probability < minProbability) minProbability = cp.probability
    if (cp.probability > maxProbability) maxProbability = cp.probability
    if (cp.probability > 0) {
      entropy -= cp.probability * Math.log2(cp.probability)
    }
  }

  return {
    columns,
    totalProbability,
    minProbability: minProbability === Infinity ? 0 : minProbability,
    maxProbability: maxProbability === -Infinity ? 0 : maxProbability,
    entropy,
  }
}

/**
 * Calcula P para todas las columnas usando la versión rápida (lookup precomputado).
 */
export function matrixProbabilitiesFast(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
): Float64Array {
  const lookup = buildLookup(matchProbs)
  const probs = new Float64Array(matriz.length)

  for (let i = 0; i < matriz.length; i++) {
    const r = columnProbabilityFast(matriz[i], lookup)
    probs[i] = r.probability
  }

  return probs
}

// ─── Helpers ───

/** Unpack rápido de packed a string[] */
function unpackPackedToStrings(packed: PackedColumna): string[] {
  const col: string[] = []
  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    const bits = (packed >> (i * 2)) & MASCARA_POSICION
    col.push(BITS_A_SIGNO[bits])
  }
  return col
}

// ─── Independence assumption documentation ───

/**
 * CORRELATION-READY ARCHITECTURE
 *
 * Actualmente: P(C) = ∏ P(resultado_i)  [independencia]
 *
 * Para incorporar correlaciones en el futuro:
 * 1. Reemplazar `matchProbs: MatchProbabilities[]` por `jointDistribution`
 * 2. Usar cópulas (Gaussian, t, Clayton) para modelar dependencias
 * 3. Modelos gráficos (Markov networks) para dependencias condicionales
 * 4. La interfaz ColumnProbability no cambia — solo la implementación interna
 *
 * La lookup table `ProbLookup[]` puede extenderse a `ProbLookup2D[][]`
 * para capturar P(result_i | result_j) sin cambiar las APIs públicas.
 */
