/**
 * ORÁCULO — Probability-Assisted Reductions
 *
 * Capa que asiste al usuario en la selección de reducciones usando
 * modelos probabilísticos, NO predicciones mágicas.
 *
 * Principios:
 * - Todo es explicable matemáticamente
 * - Nada es "garantizado"
 * - Los porcentajes son estimaciones
 * - El usuario toma la decisión final
 */

import type { MatchProbabilities, CalibratedMatch } from '../probabilities/schema'
import type { ContestFormatId, ReductionSize } from '../contest/formats'
import type { Columna, ConfigUsuario, Signo } from '../types'
import { BASE_PROBABILITIES } from '../probabilities/schema'
import { baseRateAll } from '../probabilities/models'
import { columnProbability } from '../probabilities/column'
import { packColumna } from '../matrices/packer'
import { getCompatibleReductions } from '../reductions/compatibility'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

/** Resultado del análisis probabilístico para un partido */
export interface MatchAnalysis {
  index: number
  probabilities: MatchProbabilities
  /** Nivel de confianza en las probabilidades (0-1) */
  confidence: number
  /** ¿Es un partido "peligroso" (alta incertidumbre)? */
  isDangerous: boolean
  /** Recomendación: qué tipo de signo apostar */
  recommendation: 'fijo' | 'doble' | 'triple'
  /** Signo(s) recomendado(s) */
  recommendedSigns: Signo[]
  /** P(acertar) si se apuesta lo recomendado */
  hitProbability: number
}

/** Análisis completo para una quiniela */
export interface QuinielaAnalysis {
  format: ContestFormatId
  matches: MatchAnalysis[]
  /** Resumen global */
  summary: {
    dangerousMatches: number
    recommendedTriples: number
    recommendedDoubles: number
    recommendedFijos: number
    averageConfidence: number
    /** Volatilidad global de la jornada (0-1) */
    volatility: number
  }
}

/** Recomendación de reducción */
export interface ReductionRecommendation {
  size: ReductionSize
  label: string
  /** Score de adecuación (0-1) */
  score: number
  /** Razón de la recomendación */
  reason: string
  /** Config estimada de triples/dobles que cubre */
  estimatedTriples: number
  estimatedDoubles: number
  /** Precio */
  price: number
  /** Ahorro estimado vs directo */
  estimatedSavings: number
}

// ═══════════════════════════════════════════════════
// ANÁLISIS DE PARTIDOS
// ═══════════════════════════════════════════════════

/**
 * Analiza un partido y genera recomendaciones.
 *
 * Lógica:
 * - Si P(max) > 0.55 → fijo al signo más probable
 * - Si 0.40 < P(max) ≤ 0.55 → doble (dos más probables)
 * - Si P(max) ≤ 0.40 → triple (alta incertidumbre)
 */
export function analyzeMatch(
  index: number,
  probs: MatchProbabilities,
): MatchAnalysis {
  const { home, draw, away } = probs
  const max = Math.max(home, draw, away)

  // Determinar signos ordenados por probabilidad
  const sorted: Array<{ sign: string; prob: number }> = [
    { sign: '1', prob: home },
    { sign: 'X', prob: draw },
    { sign: '2', prob: away },
  ].sort((a, b) => b.prob - a.prob)

  let recommendation: MatchAnalysis['recommendation']
  let recommendedSigns: Signo[]
  let hitProbability: number

  if (max > 0.55) {
    recommendation = 'fijo'
    recommendedSigns = [sorted[0].sign as Signo]
    hitProbability = max
  } else if (max > 0.40) {
    recommendation = 'doble'
    recommendedSigns = [
      sorted[0].sign as Signo,
      sorted[1].sign as Signo,
    ].sort() as Signo[]
    hitProbability = sorted[0].prob + sorted[1].prob
  } else {
    recommendation = 'triple'
    recommendedSigns = ['1X2']
    hitProbability = 1
  }

  // Confianza: qué tan concentrada está la distribución
  const confidence = 1 - entropy(probs) / Math.log2(3)

  return {
    index,
    probabilities: probs,
    confidence,
    isDangerous: max <= 0.45,
    recommendation,
    recommendedSigns,
    hitProbability,
  }
}

function entropy(p: MatchProbabilities): number {
  let h = 0
  if (p.home > 0) h -= p.home * Math.log2(p.home)
  if (p.draw > 0) h -= p.draw * Math.log2(p.draw)
  if (p.away > 0) h -= p.away * Math.log2(p.away)
  return h
}

// ═══════════════════════════════════════════════════
// ANÁLISIS DE QUINIELA COMPLETA
// ═══════════════════════════════════════════════════

/**
 * Analiza una quiniela completa (14 partidos) usando probabilidades base
 * o probabilidades calibradas.
 */
export function analyzeQuiniela(
  format: ContestFormatId,
  matchProbs: MatchProbabilities[],
): QuinielaAnalysis {
  const n = format === 'revancha_7' ? 7 : format === 'media_semana_9' ? 9 : format === 'private_11' ? 11 : 14
  const probs = matchProbs.slice(0, n)

  const matches = probs.map((p, i) => analyzeMatch(i, p))

  const dangerousMatches = matches.filter((m) => m.isDangerous).length
  const recommendedTriples = matches.filter((m) => m.recommendation === 'triple').length
  const recommendedDoubles = matches.filter((m) => m.recommendation === 'doble').length
  const recommendedFijos = matches.filter((m) => m.recommendation === 'fijo').length

  const avgConfidence = matches.reduce((s, m) => s + m.confidence, 0) / matches.length

  // Volatilidad = proporción de partidos peligrosos + incertidumbre media
  const volatility = (dangerousMatches / n) * 0.6 + (1 - avgConfidence) * 0.4

  return {
    format,
    matches,
    summary: {
      dangerousMatches,
      recommendedTriples,
      recommendedDoubles,
      recommendedFijos,
      averageConfidence: avgConfidence,
      volatility,
    },
  }
}

/** Análisis rápido con probabilidades base (~48/28/24) */
export function quickAnalysis(format: ContestFormatId): QuinielaAnalysis {
  const n = format === 'revancha_7' ? 7 : format === 'media_semana_9' ? 9 : format === 'private_11' ? 11 : 14
  return analyzeQuiniela(format, Array(n).fill(BASE_PROBABILITIES))
}

// ═══════════════════════════════════════════════════
// RECOMENDACIÓN DE REDUCCIÓN
// ═══════════════════════════════════════════════════

/**
 * Recomienda reducciones para un formato basado en el análisis probabilístico.
 *
 * Lógica:
 * - Muchos partidos peligrosos → reducción más grande
 * - Pocos partidos peligrosos → reducción más pequeña (ahorro)
 * - Score = balance entre cobertura y ahorro
 */
export function recommendReductions(
  analysis: QuinielaAnalysis,
): ReductionRecommendation[] {
  const compatible = getCompatibleReductions(analysis.format)
  const { dangerousMatches, volatility } = analysis.summary

  return compatible.map((entry) => {
    // Score: balance entre cobertura y ahorro
    // Mayor reducción = más cobertura para jornadas volátiles
    // Menor reducción = más ahorro para jornadas predecibles

    const coverageScore = Math.min(1, entry.size / 132) // Normalizado al máximo
    const savingsScore = 1 - coverageScore // Ahorro = inverso de columnas

    // Peso de volatilidad: a más volatilidad, más peso a cobertura
    const score = volatility * coverageScore + (1 - volatility) * savingsScore

    // Estimar triples/dobles basado en recomendaciones
    const estimatedTriples = Math.min(
      analysis.summary.recommendedTriples,
      Math.floor(Math.log(entry.size) / Math.log(3)),
    )
    const estimatedDoubles = Math.min(
      analysis.summary.recommendedDoubles,
      Math.floor(Math.log(entry.size) / Math.log(2)),
    )

    const reason =
      volatility > 0.6
        ? 'Jornada volátil — considera mayor cobertura'
        : volatility > 0.3
          ? 'Jornada normal — balance cobertura/ahorro'
          : 'Jornada predecible — maximiza ahorro'

    return {
      size: entry.size,
      label: entry.label,
      score: Math.round(score * 100) / 100,
      reason,
      estimatedTriples,
      estimatedDoubles,
      price: entry.size * 0.75,
      estimatedSavings: Math.round((1 - entry.size / (3 ** estimatedTriples * 2 ** estimatedDoubles)) * 100),
    }
  }).sort((a, b) => b.score - a.score)
}

// ═══════════════════════════════════════════════════
// CONFIGURACIÓN ASISTIDA
// ═══════════════════════════════════════════════════

/**
 * Genera una configuración sugerida basada en análisis probabilístico.
 * Los triples/dobles se asignan a los partidos más inciertos.
 */
export function suggestConfig(
  analysis: QuinielaAnalysis,
  maxTriples: number,
  maxDoubles: number,
): ConfigUsuario {
  const n = analysis.matches.length
  const config: string[] = []

  // Ordenar partidos por incertidumbre (menor confianza primero)
  const sorted = [...analysis.matches].sort((a, b) => a.confidence - b.confidence)

  // Asignar triples a los más inciertos
  const tripleIndices = new Set(sorted.slice(0, maxTriples).map((m) => m.index))
  // Asignar dobles a los siguientes
  const doubleIndices = new Set(
    sorted.slice(maxTriples, maxTriples + maxDoubles).map((m) => m.index),
  )

  for (let i = 0; i < n; i++) {
    if (tripleIndices.has(i)) {
      config.push('1X2')
    } else if (doubleIndices.has(i)) {
      const m = analysis.matches[i]
      const sorted = [
        { sign: '1', prob: m.probabilities.home },
        { sign: 'X', prob: m.probabilities.draw },
        { sign: '2', prob: m.probabilities.away },
      ].sort((a, b) => b.prob - a.prob)
      config.push(`${sorted[0].sign}${sorted[1].sign}`)
    } else {
      const m = analysis.matches[i]
      const best = ['1', 'X', '2'].reduce((a, b) =>
        m.probabilities[a as keyof MatchProbabilities] > m.probabilities[b as keyof MatchProbabilities] ? a : b,
      )
      config.push(best)
    }
  }

  // Pad to 14 for Progol
  while (config.length < 14) {
    config.push('1')
  }

  return config as ConfigUsuario
}
