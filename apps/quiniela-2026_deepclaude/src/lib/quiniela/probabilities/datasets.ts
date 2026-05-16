/**
 * HISTORICAL DATASET ARCHITECTURE
 *
 * Contratos, loaders y validadores para datasets de La Quiniela.
 *
 * Tipos de datasets:
 * - historical/results: Resultados históricos (jornadas)
 * - historical/odds: Cuotas de apuestas históricas
 * - historical/frequencies: Frecuencias de signos agregadas
 *
 * NO descarga datos — solo define la arquitectura.
 * Los datos reales se cargarán de APIs/archivos cuando estén disponibles.
 */

import type {
  HistoricalResult,
  HistoricalDataset,
  MatchOdds,
  OddsDataset,
  DatasetLoader,
  MatchProbabilities,
} from './schema'
import type { Columna, Signo } from '../types'
import { validateMatchProbabilitiesArray } from './validation'

// ═══════════════════════════════════════════════════
// VALIDATORS
// ═══════════════════════════════════════════════════

const VALID_SIGNOS = new Set<Signo>(['1', 'X', '2'] as Signo[])

/** Valida que un objeto sea un HistoricalResult válido */
export function isValidHistoricalResult(data: unknown): data is HistoricalResult {
  if (!data || typeof data !== 'object') return false
  const r = data as Record<string, unknown>

  if (typeof r.date !== 'string') return false
  if (typeof r.season !== 'string') return false
  if (typeof r.matchday !== 'number') return false
  if (!Array.isArray(r.result) || r.result.length !== 14) return false
  if (!r.result.every((s: unknown) => typeof s === 'string' && VALID_SIGNOS.has(s as Signo))) return false
  if (typeof r.totalPool !== 'number') return false
  if (!r.prizes || typeof r.prizes !== 'object') return false

  const prizes = r.prizes as Record<string, unknown>
  for (const k of ['14', '13', '12', '11', '10']) {
    if (typeof prizes[k] !== 'number') return false
  }

  return true
}

/** Valida que un objeto sea un MatchOdds válido */
export function isValidMatchOdds(data: unknown): data is MatchOdds {
  if (!data || typeof data !== 'object') return false
  const o = data as Record<string, unknown>

  if (typeof o.date !== 'string') return false
  if (typeof o.matchIndex !== 'number') return false
  if (typeof o.home !== 'number' || o.home <= 1) return false
  if (typeof o.draw !== 'number' || o.draw <= 1) return false
  if (typeof o.away !== 'number' || o.away <= 1) return false
  if (typeof o.bookmaker !== 'string') return false

  return true
}

// ═══════════════════════════════════════════════════
// DATASET VALIDATORS
// ═══════════════════════════════════════════════════

/** Valida un dataset de resultados históricos */
export function validateHistoricalDataset(data: unknown): data is HistoricalDataset {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (!Array.isArray(d.results)) return false
  if (d.results.length === 0) return false
  if (!d.results.every(isValidHistoricalResult)) return false

  return true
}

/** Valida un dataset de cuotas */
export function validateOddsDataset(data: unknown): data is OddsDataset {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (!Array.isArray(d.odds)) return false
  if (!d.odds.every(isValidMatchOdds)) return false

  return true
}

// ═══════════════════════════════════════════════════
// AGGREGATORS
// ═══════════════════════════════════════════════════

/**
 * Agrega resultados históricos en frecuencias de signos por posición.
 * Útil para calibrar modelos empíricos.
 */
export function aggregateFrequencies(
  dataset: HistoricalDataset,
): Array<{ home: number; draw: number; away: number }> {
  const counts = Array.from({ length: 14 }, () => ({
    home: 0,
    draw: 0,
    away: 0,
  }))

  for (const record of dataset.results) {
    for (let i = 0; i < 14; i++) {
      const pos = counts[i]
      if (record.result[i] === '1') pos.home++
      else if (record.result[i] === 'X') pos.draw++
      else pos.away++
    }
  }

  return counts
}

/**
 * Convierte frecuencias agregadas a probabilidades empíricas.
 */
export function frequenciesToProbabilities(
  counts: Array<{ home: number; draw: number; away: number }>,
): MatchProbabilities[] {
  return counts.map((c) => {
    const total = c.home + c.draw + c.away
    if (total === 0) return { home: 1 / 3, draw: 1 / 3, away: 1 / 3 }
    return {
      home: c.home / total,
      draw: c.draw / total,
      away: c.away / total,
    }
  })
}

/**
 * Pipeline completo: dataset → probabilidades calibradas.
 */
export function calibrateFromDataset(dataset: HistoricalDataset): {
  probabilities: MatchProbabilities[]
  sampleSize: number
  valid: boolean
  errors: string[]
} {
  const counts = aggregateFrequencies(dataset)
  const probs = frequenciesToProbabilities(counts)
  const validation = validateMatchProbabilitiesArray(probs)

  return {
    probabilities: probs,
    sampleSize: dataset.results.length,
    valid: validation.valid,
    errors: validation.errors,
  }
}

// ═══════════════════════════════════════════════════
// LOADER CONTRACTS (implementaciones futuras)
// ═══════════════════════════════════════════════════

/**
 * Loader stub para dataset histórico.
 *
 * Uso futuro:
 *   const loader = createHistoricalLoader('https://api.example.com/quiniela/results')
 *   const dataset = await loader.load()
 */
export function createHistoricalLoader(_source: string): DatasetLoader<HistoricalDataset> {
  return {
    async load(): Promise<HistoricalDataset> {
      throw new Error(
        'Historical dataset loader not implemented. ' +
        'Connect to a real data source (API, CSV file, database).',
      )
    },
    validate: validateHistoricalDataset,
  }
}

/**
 * Loader stub para dataset de cuotas.
 */
export function createOddsLoader(_source: string): DatasetLoader<OddsDataset> {
  return {
    async load(): Promise<OddsDataset> {
      throw new Error(
        'Odds dataset loader not implemented. ' +
        'Connect to a real data source (bookmaker API, CSV file).',
      )
    },
    validate: validateOddsDataset,
  }
}

// ═══════════════════════════════════════════════════
// STATIC REFERENCE DATA
// ═══════════════════════════════════════════════════

/**
 * Frecuencias globales de La Quiniela por posición (~2003-2024).
 *
 * Datos de referencia basados en muestras históricas públicas.
 * Posición 0 = Partido 1, Posición 13 = Partido 14.
 *
 * Estos son valores de referencia para calibración cuando no hay
 * datos específicos disponibles.
 */
export const REFERENCE_FREQUENCIES: Array<{ home: number; draw: number; away: number }> = [
  { home: 0.48, draw: 0.27, away: 0.25 },
  { home: 0.47, draw: 0.28, away: 0.25 },
  { home: 0.49, draw: 0.27, away: 0.24 },
  { home: 0.46, draw: 0.29, away: 0.25 },
  { home: 0.48, draw: 0.28, away: 0.24 },
  { home: 0.47, draw: 0.28, away: 0.25 },
  { home: 0.49, draw: 0.26, away: 0.25 },
  { home: 0.48, draw: 0.28, away: 0.24 },
  { home: 0.47, draw: 0.29, away: 0.24 },
  { home: 0.48, draw: 0.27, away: 0.25 },
  { home: 0.49, draw: 0.27, away: 0.24 },
  { home: 0.46, draw: 0.29, away: 0.25 },
  { home: 0.48, draw: 0.27, away: 0.25 },
  { home: 0.47, draw: 0.28, away: 0.25 },
]
