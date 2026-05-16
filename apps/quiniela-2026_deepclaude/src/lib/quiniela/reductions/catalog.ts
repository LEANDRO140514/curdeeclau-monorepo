/**
 * REDUCTION PRODUCT CATALOG
 *
 * Catálogo completo de productos de reducción (R4-R132).
 * Cada producto tiene pricing, garantía, beneficios, y compatibilidad.
 *
 * NO precios hardcodeados en UI.
 */

import type { ReductionSize, ContestFormatId } from '../contest/formats'
import type { NivelGarantia } from '../types'
import { isReductionCompatible } from './compatibility'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

/** Intensidad de una reducción */
export type ReductionIntensity =
  | 'light'     // R4-R9: pocas columnas, ahorro alto, riesgo alto
  | 'medium'    // R16-R32: balance medio
  | 'heavy'     // R64-R81: buena cobertura
  | 'extreme'   // R132: máxima cobertura

/** Beneficios incluidos con una reducción */
export interface ReductionBenefits {
  /** Entradas gratis a Private 11 */
  private11Entries: number
  /** ¿Desbloquea Revancha como addon? */
  unlocksRevancha: boolean
  /** ¿Incluye análisis probabilístico premium? */
  premiumAnalysis: boolean
}

/** Un producto de reducción en el catálogo */
export interface ReductionProduct {
  size: ReductionSize
  label: string
  intensity: ReductionIntensity
  /** Precio base en euros (configurable) */
  basePrice: number
  /** Niveles de garantía soportados */
  levels: NivelGarantia[]
  /** Beneficios incluidos */
  benefits: ReductionBenefits
  /** Formatos donde está disponible */
  availableIn: ContestFormatId[]
}

// ═══════════════════════════════════════════════════
// CATÁLOGO
// ═══════════════════════════════════════════════════

export const REDUCTION_CATALOG: ReductionProduct[] = [
  {
    size: 4,
    label: 'R4',
    intensity: 'light',
    basePrice: 3.00,
    levels: [13],
    benefits: {
      private11Entries: 1,
      unlocksRevancha: false,
      premiumAnalysis: false,
    },
    availableIn: ['revancha_7'],
  },
  {
    size: 8,
    label: 'R8',
    intensity: 'light',
    basePrice: 6.00,
    levels: [13],
    benefits: {
      private11Entries: 1,
      unlocksRevancha: true,
      premiumAnalysis: false,
    },
    availableIn: ['revancha_7'],
  },
  {
    size: 9,
    label: 'R9',
    intensity: 'light',
    basePrice: 6.75,
    levels: [13],
    benefits: {
      private11Entries: 1,
      unlocksRevancha: true,
      premiumAnalysis: false,
    },
    availableIn: ['progol_14', 'media_semana_9', 'private_11'],
  },
  {
    size: 16,
    label: 'R16',
    intensity: 'medium',
    basePrice: 12.00,
    levels: [13],
    benefits: {
      private11Entries: 2,
      unlocksRevancha: true,
      premiumAnalysis: true,
    },
    availableIn: ['progol_14', 'revancha_7', 'media_semana_9', 'private_11'],
  },
  {
    size: 24,
    label: 'R24',
    intensity: 'medium',
    basePrice: 18.00,
    levels: [13],
    benefits: {
      private11Entries: 3,
      unlocksRevancha: true,
      premiumAnalysis: true,
    },
    availableIn: ['progol_14', 'media_semana_9', 'private_11'],
  },
  {
    size: 32,
    label: 'R32',
    intensity: 'medium',
    basePrice: 24.00,
    levels: [13],
    benefits: {
      private11Entries: 3,
      unlocksRevancha: true,
      premiumAnalysis: true,
    },
    availableIn: ['revancha_7', 'media_semana_9', 'private_11'],
  },
  {
    size: 64,
    label: 'R64',
    intensity: 'heavy',
    basePrice: 48.00,
    levels: [13],
    benefits: {
      private11Entries: 5,
      unlocksRevancha: true,
      premiumAnalysis: true,
    },
    availableIn: ['progol_14', 'media_semana_9', 'private_11'],
  },
  {
    size: 81,
    label: 'R81',
    intensity: 'heavy',
    basePrice: 60.75,
    levels: [13],
    benefits: {
      private11Entries: 5,
      unlocksRevancha: true,
      premiumAnalysis: true,
    },
    availableIn: ['progol_14', 'private_11'],
  },
  {
    size: 132,
    label: 'R132',
    intensity: 'extreme',
    basePrice: 99.00,
    levels: [13],
    benefits: {
      private11Entries: 10,
      unlocksRevancha: true,
      premiumAnalysis: true,
    },
    availableIn: ['progol_14'],
  },
]

// ═══════════════════════════════════════════════════
// CONSULTAS
// ═══════════════════════════════════════════════════

export function getProduct(size: ReductionSize): ReductionProduct | undefined {
  return REDUCTION_CATALOG.find((p) => p.size === size)
}

export function getProductsForFormat(formatId: ContestFormatId): ReductionProduct[] {
  return REDUCTION_CATALOG.filter((p) => p.availableIn.includes(formatId))
}

export function getProductsByIntensity(intensity: ReductionIntensity): ReductionProduct[] {
  return REDUCTION_CATALOG.filter((p) => p.intensity === intensity)
}

export function getProductPrice(size: ReductionSize): number {
  return getProduct(size)?.basePrice ?? 0
}

export function getIntensity(size: ReductionSize): ReductionIntensity {
  return getProduct(size)?.intensity ?? 'medium'
}

export function getBenefits(size: ReductionSize): ReductionBenefits {
  return getProduct(size)?.benefits ?? {
    private11Entries: 0,
    unlocksRevancha: false,
    premiumAnalysis: false,
  }
}
