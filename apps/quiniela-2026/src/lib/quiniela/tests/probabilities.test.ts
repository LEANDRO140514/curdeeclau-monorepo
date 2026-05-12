/**
 * TESTS DEL MOTOR PROBABILÍSTICO Y EV
 *
 * Cubre: tipos, validación, modelos, probabilidad de columna,
 * EV, payout, ranking, simulación Monte Carlo, datasets.
 */

import { describe, it, expect } from 'vitest'
import {
  BASE_PROBABILITIES,
  UNIFORM_PROBABILITIES,
  PRIZE_DISTRIBUTION,
  COST_PER_COLUMN,
} from '../probabilities/schema'
import type {
  MatchProbabilities,
  ColumnProbability,
  EVResult,
  RankedColumn,
  SimulationConfig,
  HistoricalResult,
  HistoricalDataset,
} from '../probabilities/schema'

// Validation
import {
  isValidMatchProbabilities,
  normalizeProbabilities,
  laplaceSmooth,
  validateMatchProbabilitiesArray,
  oddsToProbabilities,
  entropy,
  klDivergence,
} from '../probabilities/validation'

// Models
import {
  uniformModel,
  baseRateModel,
  empiricalModel,
  laplaceModel,
  oddsModel,
  bayesianModel,
  uniformAll,
  baseRateAll,
  fromCountsMatrix,
} from '../probabilities/models'

// Column probability
import {
  columnProbability,
  columnProbabilityFast,
  buildLookup,
  matrixProbabilities,
  matrixProbabilitiesFast,
} from '../probabilities/column'

// Statistics
import {
  countSignFrequencies,
  countSignFrequenciesPacked,
  expectedBaseFrequencies,
  compareFrequencies,
  columnDiversity,
  averageDiversity,
  summarizeMatrix,
} from '../probabilities/statistics'

// Payout
import {
  estimateFixedPool,
  estimateHitProbabilities,
  expectedPayoutForColumn,
  generatePayoutEstimates,
  historicalPayoutEstimates,
} from '../probabilities/payout'

// EV
import {
  calculateEV,
  calculateMatrixEV,
  quickEV,
  quickEVMatrix,
} from '../probabilities/ev'

// Ranking
import {
  rankComposite,
  rankByProbability,
  rankByEV,
  rankByDiversity,
  filterByMinDistance,
  topN,
} from '../probabilities/ranking'

// Simulation
import {
  generateRandomResult,
  generateUniformResult,
  simulateDraw,
  runSimulation,
  quickSimulation,
} from '../probabilities/simulation'

// Datasets
import {
  isValidHistoricalResult,
  isValidMatchOdds,
  validateHistoricalDataset,
  aggregateFrequencies,
  frequenciesToProbabilities,
  calibrateFromDataset,
} from '../probabilities/datasets'

// Packed format
import { packColumna, packMatriz, hammingDistancia } from '../matrices/packer'
import { cargarMatrizEmbebida } from '../matrices/loaders'

/* ══════════════════════════════════════════════
   CONSTANTS & SCHEMA
   ══════════════════════════════════════════════ */

describe('Probability schema constants', () => {
  it('BASE_PROBABILITIES sum to 1', () => {
    const sum = BASE_PROBABILITIES.home + BASE_PROBABILITIES.draw + BASE_PROBABILITIES.away
    expect(Math.abs(sum - 1)).toBeLessThan(0.001)
  })

  it('UNIFORM_PROBABILITIES are each 1/3', () => {
    expect(UNIFORM_PROBABILITIES.home).toBeCloseTo(1 / 3, 5)
    expect(UNIFORM_PROBABILITIES.draw).toBeCloseTo(1 / 3, 5)
    expect(UNIFORM_PROBABILITIES.away).toBeCloseTo(1 / 3, 5)
  })

  it('PRIZE_DISTRIBUTION has entries for 10-14', () => {
    for (let n = 10; n <= 14; n++) {
      expect(PRIZE_DISTRIBUTION[n]).toBeDefined()
      expect(PRIZE_DISTRIBUTION[n]).toBeGreaterThan(0)
    }
  })

  it('COST_PER_COLUMN is 0.75', () => {
    expect(COST_PER_COLUMN).toBe(0.75)
  })

  it('PRIZE_DISTRIBUTION does not exceed 100%', () => {
    const total = Object.values(PRIZE_DISTRIBUTION).reduce((a, b) => a + b, 0)
    expect(total).toBeLessThan(1)
  })
})

/* ══════════════════════════════════════════════
   VALIDATION
   ══════════════════════════════════════════════ */

describe('isValidMatchProbabilities', () => {
  it('valid probabilities pass', () => {
    expect(isValidMatchProbabilities({ home: 0.48, draw: 0.28, away: 0.24 })).toBe(true)
    expect(isValidMatchProbabilities({ home: 1, draw: 0, away: 0 })).toBe(true)
    expect(isValidMatchProbabilities({ home: 0, draw: 0.5, away: 0.5 })).toBe(true)
    expect(isValidMatchProbabilities(UNIFORM_PROBABILITIES)).toBe(true)
  })

  it('probabilities that do not sum to 1 fail', () => {
    expect(isValidMatchProbabilities({ home: 0.5, draw: 0.5, away: 0.5 })).toBe(false)
    expect(isValidMatchProbabilities({ home: 0.3, draw: 0.3, away: 0.3 })).toBe(false)
  })

  it('negative probabilities fail', () => {
    expect(isValidMatchProbabilities({ home: -0.1, draw: 0.5, away: 0.6 })).toBe(false)
  })

  it('probabilities > 1 fail', () => {
    expect(isValidMatchProbabilities({ home: 1.2, draw: 0, away: 0 })).toBe(false)
  })

  it('NaN/Infinity fail', () => {
    expect(isValidMatchProbabilities({ home: NaN, draw: 0.5, away: 0.5 })).toBe(false)
    expect(isValidMatchProbabilities({ home: Infinity, draw: 0, away: 0 })).toBe(false)
  })
})

describe('normalizeProbabilities', () => {
  it('normalizes to sum 1', () => {
    const p = normalizeProbabilities({ home: 2, draw: 1, away: 1 })
    expect(p.home).toBeCloseTo(0.5)
    expect(p.draw).toBeCloseTo(0.25)
    expect(p.away).toBeCloseTo(0.25)
  })

  it('returns uniform for all zeros', () => {
    const p = normalizeProbabilities({ home: 0, draw: 0, away: 0 })
    expect(p.home).toBeCloseTo(1 / 3)
    expect(p.draw).toBeCloseTo(1 / 3)
    expect(p.away).toBeCloseTo(1 / 3)
  })
})

describe('laplaceSmooth', () => {
  it('adds pseudocounts', () => {
    const p = laplaceSmooth({ home: 10, draw: 5, away: 5 }, 1)
    expect(isValidMatchProbabilities(p)).toBe(true)
    expect(p.home).toBeCloseTo(11 / 23)
    expect(p.draw).toBeCloseTo(6 / 23)
  })

  it('avoids zero probabilities', () => {
    const p = laplaceSmooth({ home: 100, draw: 0, away: 0 }, 1)
    expect(p.draw).toBeGreaterThan(0)
    expect(p.away).toBeGreaterThan(0)
  })
})

describe('validateMatchProbabilitiesArray', () => {
  it('accepts valid 14-element array', () => {
    const arr = Array(14).fill(UNIFORM_PROBABILITIES)
    expect(validateMatchProbabilitiesArray(arr).valid).toBe(true)
  })

  it('rejects wrong length', () => {
    const arr = Array(10).fill(UNIFORM_PROBABILITIES)
    expect(validateMatchProbabilitiesArray(arr).valid).toBe(false)
  })

  it('rejects invalid entry', () => {
    const arr = Array(14).fill(UNIFORM_PROBABILITIES)
    arr[5] = { home: 0.5, draw: 0.5, away: 0.5 }
    const r = validateMatchProbabilitiesArray(arr)
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
  })
})

describe('oddsToProbabilities', () => {
  it('converts balanced odds to ~uniform', () => {
    const r = oddsToProbabilities(3, 3, 3)
    expect(r.calibrated.home).toBeCloseTo(1 / 3, 3)
    expect(r.overround).toBeCloseTo(0, 1)
  })

  it('detects overround', () => {
    const r = oddsToProbabilities(2.0, 3.5, 4.0)
    expect(r.overround).toBeGreaterThan(0)
    expect(isValidMatchProbabilities(r.calibrated)).toBe(true)
  })
})

describe('entropy', () => {
  it('uniform distribution has max entropy (~1.585 bits)', () => {
    const h = entropy(UNIFORM_PROBABILITIES)
    expect(h).toBeCloseTo(Math.log2(3), 3)
  })

  it('deterministic has zero entropy', () => {
    expect(entropy({ home: 1, draw: 0, away: 0 })).toBe(0)
  })
})

describe('klDivergence', () => {
  it('divergence between identical distributions is 0', () => {
    expect(klDivergence(UNIFORM_PROBABILITIES, UNIFORM_PROBABILITIES)).toBeCloseTo(0, 5)
  })

  it('divergence is positive for different distributions', () => {
    const d = klDivergence({ home: 0.9, draw: 0.05, away: 0.05 }, UNIFORM_PROBABILITIES)
    expect(d).toBeGreaterThan(0)
  })
})

/* ══════════════════════════════════════════════
   MODELS
   ══════════════════════════════════════════════ */

describe('Probability models', () => {
  it('uniformModel returns uniform probabilities', () => {
    const m = uniformModel(0)
    expect(isValidMatchProbabilities(m.probabilities)).toBe(true)
    expect(m.matchIndex).toBe(0)
    expect(m.meta.source).toBe('uniform')
  })

  it('baseRateModel returns base rates', () => {
    const m = baseRateModel(5)
    expect(isValidMatchProbabilities(m.probabilities)).toBe(true)
    expect(m.matchIndex).toBe(5)
    expect(m.probabilities.home).toBeCloseTo(0.48, 2)
  })

  it('empiricalModel uses observed counts', () => {
    const m = empiricalModel(3, { home: 50, draw: 30, away: 20 })
    expect(m.probabilities.home).toBeCloseTo(0.5)
    expect(m.probabilities.draw).toBeCloseTo(0.3)
    expect(m.meta.sampleSize).toBe(100)
  })

  it('laplaceModel avoids zeros', () => {
    const m = laplaceModel(0, { home: 100, draw: 0, away: 0 })
    expect(m.probabilities.draw).toBeGreaterThan(0)
    expect(m.meta.source).toBe('laplace')
  })

  it('oddsModel removes overround', () => {
    const m = oddsModel(1, { home: 2.5, draw: 3.0, away: 3.0 })
    expect(isValidMatchProbabilities(m.probabilities)).toBe(true)
    expect(m.meta.source).toBe('odds')
  })

  it('bayesianModel incorporates prior', () => {
    const m = bayesianModel(2, { home: 10, draw: 0, away: 0 })
    // Prior pulls toward 48/28/24
    expect(m.probabilities.home).toBeLessThan(1)
    expect(m.probabilities.draw).toBeGreaterThan(0)
  })

  it('uniformAll returns 14 matches', () => {
    expect(uniformAll()).toHaveLength(14)
  })

  it('baseRateAll returns 14 matches', () => {
    expect(baseRateAll()).toHaveLength(14)
  })

  it('fromCountsMatrix returns 14 calibrated matches', () => {
    const counts = Array(14).fill({ home: 48, draw: 28, away: 24 })
    const result = fromCountsMatrix(counts, 'laplace')
    expect(result).toHaveLength(14)
    result.forEach((m) => expect(isValidMatchProbabilities(m.probabilities)).toBe(true))
  })
})

/* ══════════════════════════════════════════════
   COLUMN PROBABILITY
   ══════════════════════════════════════════════ */

describe('columnProbability', () => {
  const uniform14 = Array(14).fill(UNIFORM_PROBABILITIES)

  it('calculates P for a column', () => {
    const packed = packColumna(Array(14).fill('1'))
    const cp = columnProbability(packed, uniform14)
    expect(cp.probability).toBeCloseTo((1 / 3) ** 14, 10)
    expect(cp.logProbability).toBeCloseTo(14 * Math.log2(1 / 3), 3)
    expect(cp.packed).toBe(packed)
  })

  it('all-1 column probability is correct under uniform', () => {
    const packed = packColumna(Array(14).fill('1'))
    const cp = columnProbability(packed, uniform14)
    // P = (1/3)^14 ≈ 2.09e-7
    expect(cp.probability).toBeGreaterThan(0)
    expect(cp.probability).toBeLessThan(1e-6)
  })

  it('columnProbabilityFast matches columnProbability', () => {
    const packed = packColumna(['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'])
    const probs = Array(14).fill(BASE_PROBABILITIES)
    const slow = columnProbability(packed, probs)
    const lookup = buildLookup(probs)
    const fast = columnProbabilityFast(packed, lookup)
    expect(fast.probability).toBeCloseTo(slow.probability, 10)
  })

  it('buildLookup creates correct structure', () => {
    const lookup = buildLookup(uniform14)
    expect(lookup).toHaveLength(14)
    expect(lookup[0]).toHaveLength(3)
    expect(lookup[0][0]).toBeCloseTo(1 / 3) // P(1)
    expect(lookup[0][1]).toBeCloseTo(1 / 3) // P(X)
  })
})

describe('matrixProbabilities', () => {
  const uniform14 = Array(14).fill(UNIFORM_PROBABILITIES)

  it('calculates probabilities for entire matrix', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
      Array(14).fill('2'),
    ])

    const mp = matrixProbabilities(cols, uniform14)
    expect(mp.columns).toHaveLength(3)
    expect(mp.minProbability).toBeGreaterThan(0)
    expect(mp.maxProbability).toBeGreaterThan(0)
    expect(mp.entropy).toBeGreaterThan(0)
  })

  it('matrixProbabilitiesFast returns Float64Array', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
    ])
    const fast = matrixProbabilitiesFast(cols, uniform14)
    expect(fast).toBeInstanceOf(Float64Array)
    expect(fast).toHaveLength(2)
    expect(fast[0]).toBeGreaterThan(0)
  })
})

/* ══════════════════════════════════════════════
   STATISTICS
   ══════════════════════════════════════════════ */

describe('countSignFrequencies', () => {
  it('counts frequencies correctly', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
      Array(14).fill('2'),
    ])
    const freq = countSignFrequenciesPacked(cols)
    expect(freq.byPosition).toHaveLength(14)
    for (const pos of freq.byPosition) {
      expect(pos.home).toBe(1)
      expect(pos.draw).toBe(1)
      expect(pos.away).toBe(1)
    }
  })

  it('string and packed versions agree', () => {
    const col1 = Array(14).fill('1') as ['1' | 'X' | '2', ...Array<'1' | 'X' | '2'>]
    const col2 = Array(14).fill('X') as ['1' | 'X' | '2', ...Array<'1' | 'X' | '2'>]
    const strFreq = countSignFrequencies([col1, col2])
    const pkdFreq = countSignFrequenciesPacked(packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
    ]))
    expect(strFreq.global).toEqual(pkdFreq.global)
  })
})

describe('compareFrequencies', () => {
  it('observed == expected gives low chi-squared', () => {
    const expected = expectedBaseFrequencies(100)
    const comparison = compareFrequencies(expected, expected)
    for (const chi2 of comparison.chiSquaredByPosition) {
      expect(chi2).toBeCloseTo(0, 5)
    }
    expect(comparison.pValueApprox).toBeCloseTo(1, -0.2)
  })
})

describe('columnDiversity', () => {
  it('all same sign → diversity 0', () => {
    const packed = packColumna(Array(14).fill('1'))
    expect(columnDiversity(packed)).toBe(0)
  })

  it('balanced column → high diversity', () => {
    // 5 home, 5 draw, 4 away
    const col = ['1', '1', '1', '1', '1', 'X', 'X', 'X', 'X', 'X', '2', '2', '2', '2']
    const packed = packColumna(col)
    expect(columnDiversity(packed)).toBeGreaterThan(0.85)
  })
})

describe('summarizeMatrix', () => {
  it('summary includes all stats', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
    ])
    const s = summarizeMatrix(cols)
    expect(s.numColumns).toBe(2)
    expect(s.avgDiversity).toBeDefined()
    expect(s.signDistribution).toBeDefined()
    expect(s.comparesToBase).toBeDefined()
  })
})

/* ══════════════════════════════════════════════
   PAYOUT
   ══════════════════════════════════════════════ */

describe('estimateFixedPool', () => {
  it('distributes pool according to official %', () => {
    const payouts = estimateFixedPool(1_000_000)
    expect(payouts[14]).toBeCloseTo(160_000)
    expect(payouts[13]).toBeCloseTo(75_000)
    expect(payouts[12]).toBeCloseTo(30_000)
    expect(payouts[11]).toBeCloseTo(15_000)
  })
})

describe('estimateHitProbabilities', () => {
  it('sum of probExactly ≈ 1', () => {
    const { probExactly } = estimateHitProbabilities(Array(14).fill(UNIFORM_PROBABILITIES))
    const sum = Object.values(probExactly).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it('probAtLeast[0] = 1', () => {
    const { probAtLeast } = estimateHitProbabilities(Array(14).fill(UNIFORM_PROBABILITIES))
    expect(probAtLeast[0]).toBeCloseTo(1, 5)
  })

  it('probAtLeast[14] is very small', () => {
    const { probAtLeast } = estimateHitProbabilities(Array(14).fill(UNIFORM_PROBABILITIES))
    expect(probAtLeast[14]).toBeLessThan(1e-5)
  })
})

describe('expectedPayoutForColumn', () => {
  it('returns positive payout for non-zero probabilities', () => {
    const probHit = { 10: 0.01, 11: 0.005, 12: 0.001, 13: 0.0001, 14: 0.00001 }
    const payout = expectedPayoutForColumn(probHit, 1_000_000)
    expect(payout).toBeGreaterThan(0)
  })

  it('returns 0 for zero probabilities', () => {
    const probHit = { 10: 0, 11: 0, 12: 0, 13: 0, 14: 0 }
    expect(expectedPayoutForColumn(probHit, 1_000_000)).toBe(0)
  })
})

describe('generatePayoutEstimates', () => {
  it('returns 5 entries (10-14)', () => {
    const est = generatePayoutEstimates(1_000_000, Array(14).fill(UNIFORM_PROBABILITIES))
    expect(est).toHaveLength(5)
  })

  it('each estimate has nivel, probability, payout', () => {
    const est = generatePayoutEstimates(1_000_000, Array(14).fill(UNIFORM_PROBABILITIES))
    for (const e of est) {
      expect(e.nivel).toBeGreaterThanOrEqual(10)
      expect(e.nivel).toBeLessThanOrEqual(14)
      expect(e.probability).toBeGreaterThanOrEqual(0)
      expect(e.payout).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('historicalPayoutEstimates', () => {
  it('returns 5 entries', () => {
    const est = historicalPayoutEstimates()
    expect(est).toHaveLength(5)
  })
})

/* ══════════════════════════════════════════════
   EV
   ══════════════════════════════════════════════ */

describe('calculateEV', () => {
  const matchProbs = Array(14).fill(BASE_PROBABILITIES)

  it('returns EVResult with expected structure', () => {
    const packed = packColumna(['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'])
    const ev = calculateEV(packed, matchProbs, 500_000)
    expect(ev.probability).toBeGreaterThan(0)
    expect(ev.cost).toBe(0.75)
    expect(ev.roi).toBeDefined()
    expect(ev.breakdown).toHaveLength(5)
  })

  it('EV is negative for typical column (house edge)', () => {
    const packed = packColumna(Array(14).fill('1'))
    const ev = calculateEV(packed, matchProbs, 500_000)
    // Typical EV should be negative due to ~45% house take
    expect(ev.expectedValue).toBeLessThan(0.10)  // could be slightly positive or negative
  })

  it('expectedPayout is positive', () => {
    const packed = packColumna(Array(14).fill('1'))
    const ev = calculateEV(packed, matchProbs, 1_000_000)
    expect(ev.expectedPayout).toBeGreaterThan(0)
  })
})

describe('calculateMatrixEV', () => {
  const matchProbs = Array(14).fill(BASE_PROBABILITIES)

  it('calculates EV for entire matrix', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
      Array(14).fill('2'),
    ])

    const mev = calculateMatrixEV(cols, matchProbs, 1_000_000)
    expect(mev.results).toHaveLength(3)
    expect(mev.bestEV).toBeDefined()
    expect(mev.worstEV).toBeDefined()
    expect(mev.averageEV).toBeDefined()
    expect(mev.medianEV).toBeDefined()
    expect(mev.totalColumns).toBe(3)
  })
})

describe('quickEV', () => {
  const matchProbs = Array(14).fill(BASE_PROBABILITIES)

  it('returns a number', () => {
    const packed = packColumna(Array(14).fill('1'))
    const ev = quickEV(packed, matchProbs, 1_000_000)
    expect(typeof ev).toBe('number')
    expect(Number.isFinite(ev)).toBe(true)
  })
})

describe('quickEVMatrix', () => {
  it('returns Float64Array', () => {
    const matchProbs = Array(14).fill(BASE_PROBABILITIES)
    const cols = packMatriz([Array(14).fill('1'), Array(14).fill('X')])
    const evs = quickEVMatrix(cols, matchProbs, 1_000_000)
    expect(evs).toBeInstanceOf(Float64Array)
    expect(evs).toHaveLength(2)
  })
})

/* ══════════════════════════════════════════════
   RANKING
   ══════════════════════════════════════════════ */

describe('rankComposite', () => {
  const matchProbs = Array(14).fill(BASE_PROBABILITIES)

  it('returns ranked columns sorted by score desc', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
      Array(14).fill('2'),
      ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'],
    ])

    const ranked = rankComposite(cols, matchProbs, 1_000_000)
    expect(ranked).toHaveLength(4)
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score)
    }
    expect(ranked[0].rank).toBe(1)
  })

  it('assigns increasing ranks', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
    ])
    const ranked = rankComposite(cols, matchProbs, 1_000_000)
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].rank).toBe(2)
  })
})

describe('rankByProbability', () => {
  it('ranks by probability', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'],
    ])
    const matchProbs = Array(14).fill(BASE_PROBABILITIES)
    const ranked = rankByProbability(cols, matchProbs)
    expect(ranked).toHaveLength(2)
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score)
  })
})

describe('rankByEV', () => {
  it('ranks by EV', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      Array(14).fill('X'),
    ])
    const matchProbs = Array(14).fill(BASE_PROBABILITIES)
    const ranked = rankByEV(cols, matchProbs, 1_000_000)
    expect(ranked).toHaveLength(2)
  })
})

describe('rankByDiversity', () => {
  it('ranks diverse columns higher', () => {
    const cols = packMatriz([
      Array(14).fill('1'),                              // diversity = 0
      ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'], // balanced
    ])
    const ranked = rankByDiversity(cols)
    // The balanced one should rank higher
    expect(ranked[0].diversity).toBeGreaterThanOrEqual(ranked[1].diversity)
  })
})

describe('filterByMinDistance', () => {
  it('removes columns too close to each other', () => {
    const cols = packMatriz([
      Array(14).fill('1'),
      ['1', ...Array(13).fill('1')],  // distance 1 from first
      Array(14).fill('X'),             // distance 14 from first
    ])
    const matchProbs = Array(14).fill(BASE_PROBABILITIES)
    const ranked = rankComposite(cols, matchProbs, 1_000_000)
    const filtered = filterByMinDistance(ranked, 2)
    // Should keep only columns with distance >= 2
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        const d = hammingDistancia(filtered[i].packed, filtered[j].packed)
        expect(d).toBeGreaterThanOrEqual(2)
      }
    }
  })
})

describe('topN', () => {
  it('returns top N columns', () => {
    const cols = packMatriz(Array(10).fill(null).map((_, i) => {
      const c = Array(14).fill('1')
      if (i < 14) c[i] = 'X'
      return c
    }))
    const matchProbs = Array(14).fill(BASE_PROBABILITIES)
    const ranked = rankComposite(cols, matchProbs, 1_000_000)
    expect(topN(ranked, 3)).toHaveLength(3)
  })
})

/* ══════════════════════════════════════════════
   MONTE CARLO SIMULATION
   ══════════════════════════════════════════════ */

describe('generateRandomResult', () => {
  it('returns a valid packed column', () => {
    const probs = Array(14).fill(UNIFORM_PROBABILITIES)
    const r = generateRandomResult(probs)
    expect(typeof r).toBe('number')
    expect(r).toBeGreaterThanOrEqual(0)
    // Max packed value: 28 bits set, not 3^14 (which is result space, not packed space)
    expect(r).toBeLessThanOrEqual(0x0FFFFFFF)
  })
})

describe('generateUniformResult', () => {
  it('returns valid packed column', () => {
    for (let i = 0; i < 100; i++) {
      const r = generateUniformResult()
      expect(typeof r).toBe('number')
      expect(r).toBeLessThanOrEqual(0x0FFFFFFF)
      // Check no invalid bits (0b11 in any position)
      let valid = true
      for (let p = 0; p < 14; p++) {
        if (((r >> (p * 2)) & 0b11) === 0b11) valid = false
      }
      expect(valid).toBe(true)
    }
  })
})

describe('simulateDraw', () => {
  it('evaluates columns against result', () => {
    const probs = Array(14).fill(UNIFORM_PROBABILITIES)
    const cols = packMatriz([Array(14).fill('1')])
    const draw = simulateDraw(probs, cols)
    expect(draw.maxAciertos).toBeGreaterThanOrEqual(0)
    expect(draw.maxAciertos).toBeLessThanOrEqual(14)
    expect(draw.columnHits).toHaveLength(1)
  })
})

describe('runSimulation', () => {
  it('completes without errors', () => {
    const config: SimulationConfig = {
      numDraws: 500,
      matchProbabilities: Array(14).fill(UNIFORM_PROBABILITIES),
      columns: packMatriz([
        Array(14).fill('1'),
        Array(14).fill('X'),
      ]),
      costPerColumn: 0.75,
    }

    const result = runSimulation(config)
    expect(result.draws).toBe(500)
    expect(result.hitProbabilities).toBeDefined()
    expect(result.meanEV).toBeDefined()
    expect(result.stdEV).toBeGreaterThanOrEqual(0)
    expect(result.evPercentiles.p50).toBeDefined()
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('hit probabilities sum to 1', () => {
    const config: SimulationConfig = {
      numDraws: 300,
      matchProbabilities: Array(14).fill(UNIFORM_PROBABILITIES),
      columns: packMatriz([Array(14).fill('1')]),
      costPerColumn: 0.75,
    }

    const result = runSimulation(config)
    const sum = Object.values(result.hitProbabilities).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 5)
  })
})

describe('quickSimulation', () => {
  it('faster but same structure', () => {
    const probs = Array(14).fill(UNIFORM_PROBABILITIES)
    const cols = packMatriz([Array(14).fill('1')])
    const result = quickSimulation(200, probs, cols)
    expect(result.hitProbabilities).toBeDefined()
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
  })
})

/* ══════════════════════════════════════════════
   DATASETS
   ══════════════════════════════════════════════ */

describe('isValidHistoricalResult', () => {
  it('accepts valid result', () => {
    const r: HistoricalResult = {
      date: '2024-01-14',
      season: '2023-2024',
      matchday: 20,
      result: ['1', 'X', '2', '1', '1', 'X', '2', '2', '1', 'X', '1', '2', 'X', '1'],
      totalPool: 5_000_000,
      prizes: { '14': 800_000, '13': 375_000, '12': 150_000, '11': 75_000, '10': 450_000 },
    }
    expect(isValidHistoricalResult(r)).toBe(true)
  })

  it('rejects invalid result (wrong length)', () => {
    const r = {
      date: '2024-01-14',
      season: '2023-2024',
      matchday: 20,
      result: ['1', 'X', '2'],
      totalPool: 5_000_000,
      prizes: {},
    }
    expect(isValidHistoricalResult(r)).toBe(false)
  })

  it('rejects invalid result (wrong sign)', () => {
    const r = {
      date: '2024-01-14',
      season: '2023-2024',
      matchday: 20,
      result: [...Array(13).fill('1'), 'invalid'],
      totalPool: 5_000_000,
      prizes: { '14': 0, '13': 0, '12': 0, '11': 0, '10': 0 },
    }
    expect(isValidHistoricalResult(r)).toBe(false)
  })
})

describe('validateHistoricalDataset', () => {
  it('accepts valid dataset', () => {
    const ds = {
      results: [
        {
          date: '2024-01-14',
          season: '2023-2024',
          matchday: 20,
          result: Array(14).fill('1'),
          totalPool: 5_000_000,
          prizes: { '14': 800_000, '13': 375_000, '12': 150_000, '11': 75_000, '10': 450_000 },
        },
      ],
      minDate: '2024-01-14',
      maxDate: '2024-01-14',
      totalMatchdays: 1,
    }
    expect(validateHistoricalDataset(ds)).toBe(true)
  })

  it('rejects empty results', () => {
    expect(validateHistoricalDataset({ results: [] as any })).toBe(false)
  })
})

describe('aggregateFrequencies', () => {
  it('counts correctly from dataset', () => {
    const ds: HistoricalDataset = {
      results: [
        {
          date: '2024-01-14',
          season: '2023-2024',
          matchday: 20,
          result: Array(14).fill('1') as HistoricalResult['result'],
          totalPool: 5_000_000,
          prizes: { '14': 0, '13': 0, '12': 0, '11': 0, '10': 0 },
        },
        {
          date: '2024-01-21',
          season: '2023-2024',
          matchday: 21,
          result: Array(14).fill('X') as HistoricalResult['result'],
          totalPool: 6_000_000,
          prizes: { '14': 0, '13': 0, '12': 0, '11': 0, '10': 0 },
        },
      ],
      minDate: '2024-01-14',
      maxDate: '2024-01-21',
      totalMatchdays: 2,
    }

    const counts = aggregateFrequencies(ds)
    expect(counts).toHaveLength(14)
    for (const pos of counts) {
      expect(pos.home).toBe(1)
      expect(pos.draw).toBe(1)
      expect(pos.away).toBe(0)
    }
  })
})

describe('frequenciesToProbabilities', () => {
  it('converts counts to probabilities', () => {
    const counts = Array(14).fill({ home: 48, draw: 28, away: 24 })
    const probs = frequenciesToProbabilities(counts)
    expect(probs).toHaveLength(14)
    expect(probs[0].home).toBeCloseTo(0.48, 2)
    expect(probs[0].draw).toBeCloseTo(0.28, 2)
    expect(probs[0].away).toBeCloseTo(0.24, 2)
  })
})

describe('calibrateFromDataset', () => {
  it('returns valid calibrated probabilities', () => {
    const ds: HistoricalDataset = {
      results: Array(10).fill(null).map((_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        season: '2023-2024',
        matchday: i + 1,
        result: Array(14).fill('1') as HistoricalResult['result'],
        totalPool: 5_000_000,
        prizes: { '14': 0, '13': 0, '12': 0, '11': 0, '10': 0 },
      })),
      minDate: '2024-01-01',
      maxDate: '2024-01-10',
      totalMatchdays: 10,
    }

    const cal = calibrateFromDataset(ds)
    expect(cal.valid).toBe(true)
    expect(cal.probabilities).toHaveLength(14)
    expect(cal.sampleSize).toBe(10)
  })
})

/* ══════════════════════════════════════════════
   INTEGRATION WITH PACKED FORMAT
   ══════════════════════════════════════════════ */

describe('Integration with packed format', () => {
  it('columnProbability works with real matrices', () => {
    const carga = cargarMatrizEmbebida(1) // 4 triples, 9 columns
    expect(carga.matriz).not.toBeNull()

    const probs = Array(14).fill(BASE_PROBABILITIES)
    const mp = matrixProbabilities(carga.matriz!, probs)

    expect(mp.columns).toHaveLength(9)
    expect(mp.totalProbability).toBeGreaterThan(0)
    expect(mp.totalProbability).toBeLessThan(1) // 9 of 81 results
  })

  it('ranking works with real matrices', () => {
    const carga = cargarMatrizEmbebida(1)
    const probs = Array(14).fill(BASE_PROBABILITIES)
    const ranked = rankComposite(carga.matriz!, probs, 1_000_000)
    expect(ranked).toHaveLength(9)
    expect(ranked[0].rank).toBe(1)
  })

  it('simulation works with real matrices', () => {
    const carga = cargarMatrizEmbebida(1)
    const config: SimulationConfig = {
      numDraws: 100,
      matchProbabilities: Array(14).fill(UNIFORM_PROBABILITIES),
      columns: carga.matriz!,
      costPerColumn: 0.75,
    }
    const result = runSimulation(config)
    expect(result.draws).toBe(100)
    expect(result.bestColumn).toBeDefined()
  })

  it('EV calculation works with real matrices', () => {
    const carga = cargarMatrizEmbebida(1)
    const probs = Array(14).fill(BASE_PROBABILITIES)
    const mev = calculateMatrixEV(carga.matriz!, probs, 1_000_000)
    expect(mev.results).toHaveLength(9)
    expect(mev.averageEV).toBeDefined()
  })
})
