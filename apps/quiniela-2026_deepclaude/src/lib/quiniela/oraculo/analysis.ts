/**
 * PUBLIC ANALYSIS LAYER
 *
 * Sistema gratuito de análisis para engagement y conversión.
 *
 * Objetivos:
 * - Mostrar análisis probabilístico gratuito
 * - Ayudar al usuario a entender qué reducción necesita
 * - Comparar picks
 * - Generar percepción de inteligencia matemática
 * - Conducir a la compra de reducción
 *
 * NO vender predicciones.
 * NO garantizar resultados.
 * TODO incluye disclaimer legal.
 */

import type { MatchProbabilities } from '../probabilities/schema'
import type { ContestFormatId, ReductionSize } from '../contest/formats'
import type { Signo } from '../types'
import { BASE_PROBABILITIES } from '../probabilities/schema'
import type { MatchAnalysis, QuinielaAnalysis, ReductionRecommendation } from './probabilities'
import { analyzeQuiniela, recommendReductions } from './probabilities'
import { getCompatibleReductions, findEntry } from '../reductions/compatibility'
import { getProduct, getIntensity } from '../reductions/catalog'
import { calculateSavings } from '../contest/pricing'

// ═══════════════════════════════════════════════════
// TIPOS PÚBLICOS
// ═══════════════════════════════════════════════════

/** Análisis público para un partido — orientado al usuario final */
export interface PublicMatchCard {
  matchNumber: number
  /** Porcentajes redondeados y legibles */
  percentages: {
    home: string   // "48%"
    draw: string   // "28%"
    away: string   // "24%"
  }
  /** Etiqueta de peligrosidad */
  dangerLabel: 'Tranquilo' | 'Normal' | 'Peligroso' | 'Muy peligroso'
  /** Recomendación visual */
  recommendation: {
    type: 'fijo' | 'doble' | 'triple'
    signs: string   // "1", "1X", "1X2"
    confidence: string // "Alta", "Media", "Baja"
  }
  /** Probabilidad de acierto con la recomendación */
  coveragePercent: string // "72%"
}

/** Resumen público de la jornada */
export interface PublicJornadaAnalysis {
  format: ContestFormatId
  formatName: string
  matches: PublicMatchCard[]
  summary: {
    dangerLevel: 'baja' | 'media' | 'alta' | 'extrema'
    recommendedTriples: number
    recommendedDoubles: number
    recommendedFijos: number
    volatilityPercent: string
    headline: string
  }
  /** Reducciones recomendadas (ordenadas por score) */
  recommendedReductions: PublicReductionCard[]
  /** Disclaimer legal (SIEMPRE presente) */
  disclaimer: string
}

/** Tarjeta de reducción para el usuario */
export interface PublicReductionCard {
  size: ReductionSize
  label: string
  intensity: string
  price: string
  savingsExample: string
  coverageLevel: string
  bestFor: string
  score: number
}

// ═══════════════════════════════════════════════════
// GENERADOR DE ANÁLISIS PÚBLICO
// ═══════════════════════════════════════════════════

const FORMAT_NAMES: Record<ContestFormatId, string> = {
  progol_14: 'Progol 14',
  revancha_7: 'Revancha 7',
  media_semana_9: 'Media Semana 9',
  private_11: 'Private 11 Plus',
}

/**
 * Genera el análisis público completo para una jornada.
 * Esta es la función principal que alimenta la UI de análisis gratuito.
 */
export function generatePublicAnalysis(
  format: ContestFormatId,
  matchProbs?: MatchProbabilities[],
): PublicJornadaAnalysis {
  const n = format === 'revancha_7' ? 7 : format === 'media_semana_9' ? 9 : format === 'private_11' ? 11 : 14
  const probs = matchProbs ?? Array(n).fill(BASE_PROBABILITIES)

  const analysis = analyzeQuiniela(format, probs)
  const recommendations = recommendReductions(analysis)

  // Tarjetas de partido
  const matches = analysis.matches.map((m) => toPublicCard(m))

  // Nivel de peligro
  const dangerLevel = getDangerLevel(analysis.summary.volatility)

  // Headline
  const headline = generateHeadline(analysis, dangerLevel)

  // Tarjetas de reducción
  const reductionCards = recommendations.slice(0, 4).map((r) => toReductionCard(r))

  return {
    format,
    formatName: FORMAT_NAMES[format],
    matches,
    summary: {
      dangerLevel,
      recommendedTriples: analysis.summary.recommendedTriples,
      recommendedDoubles: analysis.summary.recommendedDoubles,
      recommendedFijos: analysis.summary.recommendedFijos,
      volatilityPercent: `${Math.round(analysis.summary.volatility * 100)}%`,
      headline,
    },
    recommendedReductions: reductionCards,
    disclaimer: 'Los porcentajes representan estimaciones probabilísticas generadas por nuestro modelo y NO garantizan resultados.',
  }
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function toPublicCard(m: MatchAnalysis): PublicMatchCard {
  const p = m.probabilities

  return {
    matchNumber: m.index + 1,
    percentages: {
      home: `${Math.round(p.home * 100)}%`,
      draw: `${Math.round(p.draw * 100)}%`,
      away: `${Math.round(p.away * 100)}%`,
    },
    dangerLabel: getDangerLabel(m),
    recommendation: {
      type: m.recommendation,
      signs: m.recommendedSigns.join(''),
      confidence: m.confidence > 0.7 ? 'Alta' : m.confidence > 0.4 ? 'Media' : 'Baja',
    },
    coveragePercent: `${Math.round(m.hitProbability * 100)}%`,
  }
}

function getDangerLabel(m: MatchAnalysis): PublicMatchCard['dangerLabel'] {
  const max = Math.max(m.probabilities.home, m.probabilities.draw, m.probabilities.away)
  if (max > 0.60) return 'Tranquilo'
  if (max > 0.48) return 'Normal'
  if (max > 0.38) return 'Peligroso'
  return 'Muy peligroso'
}

function getDangerLevel(volatility: number): PublicJornadaAnalysis['summary']['dangerLevel'] {
  if (volatility > 0.7) return 'extrema'
  if (volatility > 0.5) return 'alta'
  if (volatility > 0.3) return 'media'
  return 'baja'
}

function generateHeadline(
  analysis: QuinielaAnalysis,
  dangerLevel: string,
): string {
  const { dangerousMatches, recommendedTriples } = analysis.summary

  if (dangerLevel === 'extrema') {
    return `Jornada muy impredecible: ${dangerousMatches} partidos peligrosos. Una reducción grande es recomendable.`
  }
  if (dangerLevel === 'alta') {
    return `Jornada con ${dangerousMatches} partidos peligrosos. Considera ${recommendedTriples} triples.`
  }
  if (dangerLevel === 'media') {
    return `Jornada equilibrada. Una reducción media ofrece buen balance cobertura/ahorro.`
  }
  return `Jornada predecible. Puedes maximizar ahorro con una reducción ligera.`
}

function toReductionCard(r: ReductionRecommendation): PublicReductionCard {
  const product = getProduct(r.size)
  const directColumns = 3 ** r.estimatedTriples * 2 ** r.estimatedDoubles
  const savings = calculateSavings(r.size, directColumns)

  const intensityLabels: Record<string, string> = {
    light: 'Ligera',
    medium: 'Media',
    heavy: 'Potente',
    extreme: 'Máxima',
  }

  const bestForLabels: Record<string, string> = {
    light: 'Jornadas predecibles',
    medium: 'Balance cobertura/ahorro',
    heavy: 'Jornadas competitivas',
    extreme: 'Máxima seguridad',
  }

  return {
    size: r.size,
    label: r.label,
    intensity: intensityLabels[product?.intensity ?? 'medium'] ?? 'Media',
    price: `${r.price.toFixed(2)}€`,
    savingsExample: `Ahorras ${savings.savingsPercent}% vs directo`,
    coverageLevel: r.score > 0.7 ? 'Excelente' : r.score > 0.4 ? 'Buena' : 'Básica',
    bestFor: bestForLabels[product?.intensity ?? 'medium'] ?? 'Uso general',
    score: r.score,
  }
}

// ═══════════════════════════════════════════════════
// COMPARACIÓN
// ═══════════════════════════════════════════════════

/** Compara dos tamaños de reducción lado a lado */
export function compareReductions(
  format: ContestFormatId,
  a: ReductionSize,
  b: ReductionSize,
): {
  a: PublicReductionCard
  b: PublicReductionCard
  recommendation: 'a' | 'b' | 'either'
} {
  const analysis = analyzeQuiniela(format, Array(format === 'revancha_7' ? 7 : 14).fill(BASE_PROBABILITIES))
  const recs = recommendReductions(analysis)

  const cardA = recs.find((r) => r.size === a)
  const cardB = recs.find((r) => r.size === b)

  if (!cardA || !cardB) {
    throw new Error('Invalid reduction size for format')
  }

  return {
    a: toReductionCard(cardA),
    b: toReductionCard(cardB),
    recommendation: cardA.score > cardB.score ? 'a' : cardB.score > cardA.score ? 'b' : 'either',
  }
}
