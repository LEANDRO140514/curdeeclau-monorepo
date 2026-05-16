/**
 * PROBABILITY SCHEMA — Tipos e interfaces del motor probabilístico.
 *
 * Cero dependencias de UI/React/Zustand.
 * Compatible con packed format (Uint32Array).
 */

import type { PackedColumna, PackedMatriz } from '../matrices/schema'
import type { Columna, NivelGarantia } from '../types'

// ─── Match-level probabilities ───

/** Probabilidad de cada resultado para un partido */
export interface MatchProbabilities {
  /** P(1) — victoria local */
  home: number
  /** P(X) — empate */
  draw: number
  /** P(2) — victoria visitante */
  away: number
}

/** Fuente de las probabilidades */
export type ProbabilitySource =
  | 'empirical'       // Frecuencias históricas
  | 'odds'            // Derivadas de cuotas de apuestas
  | 'uniform'         // Distribución uniforme (1/3 cada una)
  | 'laplace'         // Laplace smoothing sobre frecuencias
  | 'bayesian'        // Actualización bayesiana
  | 'custom'          // Definidas por el usuario

/** Metadatos de calibración */
export interface CalibrationMeta {
  source: ProbabilitySource
  sampleSize?: number        // Número de observaciones (para empíricas)
  confidence?: number        // Nivel de confianza (para bayesianas)
  overround?: number         // Overround removido (para odds-based)
  calibratedAt?: number      // Timestamp de calibración
}

/** Probabilidades de un partido con metadatos */
export interface CalibratedMatch {
  probabilities: MatchProbabilities
  meta: CalibrationMeta
  matchIndex: number         // 0-13
}

// ─── Column-level probabilities ───

/** Probabilidad de una columna individual */
export interface ColumnProbability {
  /** P(columna) = ∏ P(resultado_i) asumiendo independencia */
  probability: number
  /** log(P) para evitar underflow numérico */
  logProbability: number
  /** Odds implícitas = 1/P */
  impliedOdds: number
  /** Columna en formato string */
  columna: Columna
  /** Columna en formato packed */
  packed: PackedColumna
}

/** Resultado de calcular probabilidades para una matriz completa */
export interface MatrixProbabilities {
  columns: ColumnProbability[]
  totalProbability: number   // Suma de P(columna) — debe ser ≈1 si el espacio es completo
  minProbability: number
  maxProbability: number
  entropy: number            // -Σ P log P — medida de incertidumbre
}

// ─── Expected Value ───

/** Estimación de payout para un nivel de aciertos */
export interface PayoutEstimate {
  nivel: NivelGarantia
  /** Probabilidad estimada de que este nivel pague */
  probability: number
  /** Payout estimado en euros */
  payout: number
}

/** Resultado del cálculo de EV para una columna */
export interface EVResult {
  columna: Columna
  packed: PackedColumna
  /** Probabilidad de la columna */
  probability: number
  /** EV = Σ(payout_nivel × P(acertar_nivel)) - costo */
  expectedValue: number
  /** Payout esperado total (sin restar costo) */
  expectedPayout: number
  /** Costo de la apuesta (0.75€) */
  cost: number
  /** ROI = EV / costo */
  roi: number
  /** Desglose por nivel de aciertos */
  breakdown: PayoutEstimate[]
}

/** Resultado del cálculo de EV para una matriz completa */
export interface MatrixEV {
  results: EVResult[]
  bestEV: EVResult
  worstEV: EVResult
  averageEV: number
  medianEV: number
  positiveEVCount: number    // Columnas con EV > 0
  totalColumns: number
}

// ─── Ranking ───

/** Criterios de ranking */
export type RankingCriterion =
  | 'probability'    // Mayor P(columna)
  | 'diversity'      // Mayor diversidad de signos
  | 'ev'             // Mayor expected value
  | 'coverage'       // Mayor cobertura del espacio de resultados
  | 'cost_efficiency'// Mejor EV por euro
  | 'composite'      // Score compuesto ponderado

/** Configuración del ranking compuesto */
export interface CompositeWeights {
  probability: number   // default 0.30
  diversity: number     // default 0.15
  ev: number            // default 0.35
  coverage: number      // default 0.20
}

/** Resultado de ranking para una columna */
export interface RankedColumn {
  columna: Columna
  packed: PackedColumna
  rank: number
  score: number
  probability: number
  ev: number
  diversity: number
  hammingToNearest: number  // Distancia a la columna más cercana rankeada
}

// ─── Monte Carlo Simulation ───

/** Configuración de simulación Monte Carlo */
export interface SimulationConfig {
  /** Número de sorteos a simular */
  numDraws: number
  /** Probabilidades por partido (14 elementos) */
  matchProbabilities: MatchProbabilities[]
  /** Columnas a evaluar (matriz de apuestas) */
  columns: PackedMatriz
  /** Costo por columna */
  costPerColumn: number
}

/** Resultado de un sorteo simulado */
export interface SimulatedDraw {
  result: PackedColumna
  maxAciertos: number
  columnHits: number[]      // Aciertos de cada columna
}

/** Estadísticas agregadas de la simulación */
export interface SimulationResult {
  config: SimulationConfig
  draws: number
  /** Probabilidad estimada de cada nivel de acierto */
  hitProbabilities: Record<number, number>  // nivel → probabilidad
  /** ROI estimado */
  estimatedROI: number
  /** EV medio de la simulación */
  meanEV: number
  /** Desviación estándar del EV */
  stdEV: number
  /** Percentiles de EV */
  evPercentiles: {
    p5: number
    p25: number
    p50: number
    p75: number
    p95: number
  }
  /** Mejor columna encontrada */
  bestColumn: {
    packed: PackedColumna
    meanAciertos: number
    maxAciertos: number
  }
  /** Tiempo de ejecución en ms */
  executionTimeMs: number
}

// ─── Statistics ───

/** Frecuencias de signos en un conjunto de columnas */
export interface SignFrequencies {
  /** Frecuencia de cada signo por posición (0-13) */
  byPosition: Array<{ home: number; draw: number; away: number }>
  /** Frecuencia global */
  global: { home: number; draw: number; away: number }
}

/** Comparación entre frecuencias observadas y esperadas */
export interface FrequencyComparison {
  observed: SignFrequencies
  expected: SignFrequencies
  /** Chi-cuadrado por posición */
  chiSquaredByPosition: number[]
  /** p-valor aproximado */
  pValueApprox: number
}

// ─── Historical Datasets ───

/** Un resultado histórico de La Quiniela */
export interface HistoricalResult {
  /** Fecha del sorteo (ISO 8601) */
  date: string
  /** Temporada (ej: "2025-2026") */
  season: string
  /** Jornada number */
  matchday: number
  /** Los 14 signos resultado */
  result: Columna
  /** Recaudación total en euros */
  totalPool: number
  /** Premios por categoría */
  prizes: {
    '14': number
    '13': number
    '12': number
    '11': number
    '10': number
  }
  /** Pleno al 15 (si aplica) — signo extra opcional */
  pleno15?: '1' | 'X' | '2'
}

/** Cuotas de apuestas para un partido */
export interface MatchOdds {
  date: string
  matchIndex: number
  home: number
  draw: number
  away: number
  bookmaker: string
}

/** Dataset de resultados históricos */
export interface HistoricalDataset {
  results: HistoricalResult[]
  minDate: string
  maxDate: string
  totalMatchdays: number
}

/** Dataset de cuotas */
export interface OddsDataset {
  odds: MatchOdds[]
  bookmakers: string[]
  dateRange: { from: string; to: string }
}

/** Contrato de loader de datasets */
export interface DatasetLoader<T> {
  load(): Promise<T>
  validate(data: unknown): data is T
}

// ─── Constantes del motor probabilístico ───

/** Probabilidades base de La Quiniela (frecuencias históricas ~2003-2024) */
export const BASE_PROBABILITIES: MatchProbabilities = {
  home: 0.48,   // ~48% victorias locales
  draw: 0.28,   // ~28% empates
  away: 0.24,   // ~24% victorias visitantes
}

/** Distribución uniforme de referencia */
export const UNIFORM_PROBABILITIES: MatchProbabilities = {
  home: 1 / 3,
  draw: 1 / 3,
  away: 1 / 3,
}

/** Distribución oficial de premios (% de la recaudación) */
export const PRIZE_DISTRIBUTION: Record<number, number> = {
  14: 0.16,   // 16% — Pleno (14 aciertos)
  13: 0.075,  // 7.5%
  12: 0.03,   // 3%
  11: 0.015,  // 1.5%
  10: 0.09,   // 9% — Reintegro
}

/** Precio por columna en euros */
export const COST_PER_COLUMN = 0.75

/** Tamaño total del universo de La Quiniela */
export const TOTAL_UNIVERSE = 3 ** 14 // 4,782,969
