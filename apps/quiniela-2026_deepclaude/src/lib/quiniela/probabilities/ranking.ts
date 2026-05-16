/**
 * RANKING SYSTEM — Sistema de ranking multi-criterio para columnas.
 *
 * Criterios:
 * - probability: Mayor P(columna) bajo el modelo probabilístico
 * - diversity: Mayor diversidad de signos (balance 1/X/2)
 * - ev: Mayor expected value
 * - coverage: Mayor cobertura del espacio de resultados
 * - cost_efficiency: Mejor EV por euro apostado
 * - composite: Score compuesto ponderado (configurable)
 *
 * Todos los criterios son matemáticamente explicables.
 * Sin heurísticas inventadas.
 */

import type {
  RankedColumn,
  CompositeWeights,
  MatchProbabilities,
} from './schema'
import type { PackedColumna, PackedMatriz } from '../matrices/schema'
import { hammingDistancia } from '../matrices/packer'
import { columnProbability } from './column'
import { quickEV } from './ev'
import { columnDiversity } from './statistics'

// ─── Default weights ───

const DEFAULT_WEIGHTS: CompositeWeights = {
  probability: 0.30,
  diversity: 0.15,
  ev: 0.35,
  coverage: 0.20,
}

// ─── Individual scorers ───

/** Score por probabilidad: normalizado al rango [0, 1] dentro de la matriz */
function scoreProbability(
  packed: PackedColumna,
  _matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
): number {
  const cp = columnProbability(packed, matchProbs)
  return cp.probability
}

/** Score por diversidad: 0 (todo igual) a 1 (perfectamente balanceado) */
function scoreDiversity(packed: PackedColumna): number {
  return columnDiversity(packed)
}

/** Score por EV: quick EV normalizado */
function scoreEV(
  packed: PackedColumna,
  _matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
): number {
  return quickEV(packed, matchProbs, estimatedPool)
}

/** Score por cobertura: suma de distancias a otras columnas (mayor = más diverso) */
function scoreCoverage(
  packed: PackedColumna,
  matriz: PackedMatriz,
): number {
  let sumDist = 0
  for (let i = 0; i < matriz.length; i++) {
    sumDist += hammingDistancia(packed, matriz[i])
  }
  return matriz.length > 1 ? sumDist / (matriz.length - 1) : 0
}

// ─── Normalization ───

/** Normaliza un array de scores a [0, 1] usando min-max */
function normalizeScores(scores: number[]): number[] {
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min
  if (range === 0) return scores.map(() => 0.5)
  return scores.map((s) => (s - min) / range)
}

// ─── Composite ranking ───

/**
 * Rankea columnas usando score compuesto ponderado.
 *
 * Score = w_prob × P̂(col) + w_div × div(col) + w_ev × EV̂(col) + w_cov × cov̂(col)
 *
 * donde X̂ denota el score normalizado al rango [0,1] dentro de la matriz.
 */
export function rankComposite(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
  weights: Partial<CompositeWeights> = {},
): RankedColumn[] {
  const w = { ...DEFAULT_WEIGHTS, ...weights }

  // Calcular scores brutos
  const n = matriz.length
  const rawProb: number[] = new Array(n)
  const rawDiv: number[] = new Array(n)
  const rawEV: number[] = new Array(n)
  const rawCov: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const c = matriz[i]
    rawProb[i] = scoreProbability(c, matriz, matchProbs)
    rawDiv[i] = scoreDiversity(c)
    rawEV[i] = scoreEV(c, matriz, matchProbs, estimatedPool)
    rawCov[i] = scoreCoverage(c, matriz)
  }

  // Normalizar
  const nProb = normalizeScores(rawProb)
  const nDiv = normalizeScores(rawDiv)
  const nEV = normalizeScores(rawEV)
  const nCov = normalizeScores(rawCov)

  // Calcular score compuesto
  const ranked: RankedColumn[] = new Array(n)
  for (let i = 0; i < n; i++) {
    ranked[i] = {
      packed: matriz[i],
      columna: undefined as unknown as RankedColumn['columna'],
      rank: 0,
      score:
        w.probability * nProb[i] +
        w.diversity * nDiv[i] +
        w.ev * nEV[i] +
        w.coverage * nCov[i],
      probability: rawProb[i],
      ev: rawEV[i],
      diversity: rawDiv[i],
      hammingToNearest: 0,
    }
  }

  // Ordenar por score descendente
  ranked.sort((a, b) => b.score - a.score)

  // Asignar ranks
  for (let i = 0; i < ranked.length; i++) {
    ranked[i].rank = i + 1
  }

  // Calcular distancia al vecino más cercano (entre los ya rankeados)
  for (let i = 0; i < ranked.length; i++) {
    let minDist = 14
    for (let j = 0; j < i; j++) {
      const d = hammingDistancia(ranked[i].packed, ranked[j].packed)
      if (d < minDist) minDist = d
    }
    ranked[i].hammingToNearest = i === 0 ? 14 : minDist
  }

  return ranked
}

/** Rankea por probabilidad (mayor a menor) */
export function rankByProbability(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
): RankedColumn[] {
  return rankComposite(matriz, matchProbs, 0, {
    probability: 1,
    diversity: 0,
    ev: 0,
    coverage: 0,
  })
}

/** Rankea por EV (mayor a menor) */
export function rankByEV(
  matriz: PackedMatriz,
  matchProbs: MatchProbabilities[],
  estimatedPool: number,
): RankedColumn[] {
  return rankComposite(matriz, matchProbs, estimatedPool, {
    probability: 0,
    diversity: 0,
    ev: 1,
    coverage: 0,
  })
}

/** Rankea por diversidad (mayor a menor) */
export function rankByDiversity(matriz: PackedMatriz): RankedColumn[] {
  const n = matriz.length
  const rawDiv: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    rawDiv[i] = scoreDiversity(matriz[i])
  }
  const nDiv = normalizeScores(rawDiv)

  const ranked: RankedColumn[] = new Array(n)
  for (let i = 0; i < n; i++) {
    ranked[i] = {
      packed: matriz[i],
      columna: undefined as unknown as RankedColumn['columna'],
      rank: 0,
      score: nDiv[i],
      probability: 0,
      ev: 0,
      diversity: rawDiv[i],
      hammingToNearest: 0,
    }
  }

  ranked.sort((a, b) => b.score - a.score)
  for (let i = 0; i < n; i++) ranked[i].rank = i + 1

  for (let i = 0; i < n; i++) {
    let minDist = 14
    for (let j = 0; j < i; j++) {
      const d = hammingDistancia(ranked[i].packed, ranked[j].packed)
      if (d < minDist) minDist = d
    }
    ranked[i].hammingToNearest = i === 0 ? 14 : minDist
  }

  return ranked
}

/** Top-N columnas por score compuesto */
export function topN(
  ranked: RankedColumn[],
  n: number,
): RankedColumn[] {
  return ranked.slice(0, n)
}

/** Filtra columnas rankeadas manteniendo distancia mínima de Hamming */
export function filterByMinDistance(
  ranked: RankedColumn[],
  minDistance: number,
): RankedColumn[] {
  const selected: RankedColumn[] = []

  for (const col of ranked) {
    let tooClose = false
    for (const sel of selected) {
      if (hammingDistancia(col.packed, sel.packed) < minDistance) {
        tooClose = true
        break
      }
    }
    if (!tooClose) selected.push(col)
  }

  return selected
}
