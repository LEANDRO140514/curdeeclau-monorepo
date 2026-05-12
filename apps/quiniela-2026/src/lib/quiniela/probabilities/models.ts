/**
 * PROBABILITY MODELS — Modelos de calibración de probabilidades.
 *
 * Modelos implementados:
 * - Uniform: P(1)=P(X)=P(2)=1/3 (referencia)
 * - Empirical: Frecuencias históricas
 * - Laplace: Empirical + Laplace smoothing
 * - Odds-based: Derivadas de cuotas de apuestas
 * - Base rates: Probabilidades base de La Quiniela (~48/28/24)
 */

import type {
  MatchProbabilities,
  CalibratedMatch,
  ProbabilitySource,
  MatchOdds,
} from './schema'
import { BASE_PROBABILITIES, UNIFORM_PROBABILITIES } from './schema'
import { laplaceSmooth, oddsToProbabilities, normalizeProbabilities } from './validation'

// ─── Factory functions ───

/** Crea un CalibratedMatch con metadatos */
function calibrated(
  matchIndex: number,
  probabilities: MatchProbabilities,
  source: ProbabilitySource,
  extra: Partial<CalibratedMatch['meta']> = {},
): CalibratedMatch {
  return {
    probabilities,
    matchIndex,
    meta: {
      source,
      calibratedAt: Date.now(),
      ...extra,
    },
  }
}

// ─── Modelos ───

/** Modelo uniforme: todos los resultados igualmente probables */
export function uniformModel(matchIndex: number): CalibratedMatch {
  return calibrated(matchIndex, { ...UNIFORM_PROBABILITIES }, 'uniform')
}

/** Modelo de tasas base (~48/28/24 de datos históricos de La Quiniela) */
export function baseRateModel(matchIndex: number): CalibratedMatch {
  return calibrated(matchIndex, { ...BASE_PROBABILITIES }, 'empirical', {
    sampleSize: 5000,
  })
}

/** Modelo empírico basado en conteos observados */
export function empiricalModel(
  matchIndex: number,
  counts: { home: number; draw: number; away: number },
): CalibratedMatch {
  const total = counts.home + counts.draw + counts.away
  if (total === 0) return uniformModel(matchIndex)

  return calibrated(
    matchIndex,
    normalizeProbabilities({
      home: counts.home / total,
      draw: counts.draw / total,
      away: counts.away / total,
    }),
    'empirical',
    { sampleSize: total },
  )
}

/** Modelo Laplace: empirical + smoothing para evitar ceros */
export function laplaceModel(
  matchIndex: number,
  counts: { home: number; draw: number; away: number },
  alpha = 1,
): CalibratedMatch {
  const total = counts.home + counts.draw + counts.away
  return calibrated(
    matchIndex,
    laplaceSmooth(counts, alpha),
    'laplace',
    { sampleSize: total },
  )
}

/** Modelo basado en cuotas de apuestas */
export function oddsModel(
  matchIndex: number,
  odds: { home: number; draw: number; away: number },
  bookmaker = 'unknown',
): CalibratedMatch {
  const { calibrated: probs, overround } = oddsToProbabilities(
    odds.home,
    odds.draw,
    odds.away,
  )

  return calibrated(matchIndex, probs, 'odds', {
    overround,
  })
}

/**
 * Modelo bayesiano simple: beta-binomial conjugado.
 *
 * Prior: Dirichlet(alpha_home, alpha_draw, alpha_away)
 * Posterior: Dirichlet(alpha + counts)
 *
 * La media posterior es: (count_i + alpha_i) / (total + sum(alpha))
 */
export function bayesianModel(
  matchIndex: number,
  counts: { home: number; draw: number; away: number },
  prior: { home: number; draw: number; away: number } = { home: 48, draw: 28, away: 24 },
): CalibratedMatch {
  const posterior = {
    home: counts.home + prior.home,
    draw: counts.draw + prior.draw,
    away: counts.away + prior.away,
  }
  const total = posterior.home + posterior.draw + posterior.away

  return calibrated(
    matchIndex,
    {
      home: posterior.home / total,
      draw: posterior.draw / total,
      away: posterior.away / total,
    },
    'bayesian',
    {
      sampleSize: counts.home + counts.draw + counts.away,
      confidence: 0.95,
    },
  )
}

// ─── Batch models ───

/** Genera probabilidades uniformes para los 14 partidos */
export function uniformAll(): CalibratedMatch[] {
  return Array.from({ length: 14 }, (_, i) => uniformModel(i))
}

/** Genera probabilidades base (~48/28/24) para los 14 partidos */
export function baseRateAll(): CalibratedMatch[] {
  return Array.from({ length: 14 }, (_, i) => baseRateModel(i))
}

/** Aplica el mismo modelo a todos los partidos (útil para datasets) */
export function fromCountsMatrix(
  countsMatrix: Array<{ home: number; draw: number; away: number }>,
  model: 'empirical' | 'laplace' | 'bayesian' = 'laplace',
): CalibratedMatch[] {
  return countsMatrix.map((counts, i) => {
    switch (model) {
      case 'empirical':
        return empiricalModel(i, counts)
      case 'bayesian':
        return bayesianModel(i, counts)
      case 'laplace':
      default:
        return laplaceModel(i, counts)
    }
  })
}

/** Convierte array de cuotas a CalibratedMatch[] */
export function fromOddsMatrix(
  oddsMatrix: Array<{ home: number; draw: number; away: number }>,
  bookmaker = 'unknown',
): CalibratedMatch[] {
  return oddsMatrix.map((odds, i) => oddsModel(i, odds, bookmaker))
}
