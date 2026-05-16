/**
 * CONTEST PRODUCTS — Productos comprables por el usuario.
 *
 * Define productos de concurso (combinaciones de concurso + reducción + addons).
 * Estos son los "SKUs" del sistema.
 */

import type { ContestFormatId, ReductionSize } from './formats'
import type { NivelGarantia } from '../types'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

/** Un addon seleccionable */
export interface ContestAddon {
  type: 'revancha'
  reductionSize: ReductionSize
  price: number
}

/** Un producto de concurso (lo que el usuario compra) */
export interface ContestProduct {
  /** Identificador único del producto */
  id: string
  /** Formato base */
  format: ContestFormatId
  /** Tamaño de reducción principal */
  reductionSize: ReductionSize
  /** Nivel de garantía */
  level: NivelGarantia
  /** Precio base (reducción principal) */
  basePrice: number
  /** Addons incluidos */
  addons: ContestAddon[]
  /** Precio total */
  totalPrice: number
  /** Entradas a Private 11 incluidas */
  private11Entries: number
  /** ¿Incluye análisis premium? */
  premiumAnalysis: boolean
}

/** Builder de producto */
export interface ProductConfig {
  format: ContestFormatId
  reductionSize: ReductionSize
  level: NivelGarantia
  addons?: ContestAddon[]
}

// ═══════════════════════════════════════════════════
// PRICING BASE
// ═══════════════════════════════════════════════════

import { getProductPrice, getBenefits } from '../reductions/catalog'

const ADDON_PRICES: Record<string, Record<number, number>> = {
  revancha: {
    4: 3.00,
    8: 6.00,
    16: 12.00,
    32: 24.00,
  },
}

// ═══════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════

let productCounter = 0

export function createProduct(config: ProductConfig): ContestProduct {
  const basePrice = getProductPrice(config.reductionSize)
  const benefits = getBenefits(config.reductionSize)
  const addons = config.addons ?? []

  const addonTotal = addons.reduce((sum, a) => {
    const prices = ADDON_PRICES[a.type]
    return sum + (prices?.[a.reductionSize] ?? 0)
  }, 0)

  productCounter++

  return {
    id: `${config.format}_r${config.reductionSize}_${productCounter}`,
    format: config.format,
    reductionSize: config.reductionSize,
    level: config.level,
    basePrice,
    addons,
    totalPrice: basePrice + addonTotal,
    private11Entries: benefits.private11Entries,
    premiumAnalysis: benefits.premiumAnalysis,
  }
}

/** Producto Progol 14 con Revancha opcional */
export function createProgolProduct(
  reductionSize: ReductionSize,
  includeRevancha = false,
  revanchaSize: ReductionSize = 8,
): ContestProduct {
  const addons: ContestAddon[] = []
  if (includeRevancha) {
    addons.push({
      type: 'revancha',
      reductionSize: revanchaSize,
      price: ADDON_PRICES.revancha[revanchaSize] ?? 0,
    })
  }

  return createProduct({
    format: 'progol_14',
    reductionSize,
    level: 13,
    addons,
  })
}

/** Producto Private 11 standalone */
export function createPrivate11Product(reductionSize: ReductionSize): ContestProduct {
  return createProduct({
    format: 'private_11',
    reductionSize,
    level: 13,
  })
}

/** Producto Media Semana */
export function createMediaSemanaProduct(reductionSize: ReductionSize): ContestProduct {
  return createProduct({
    format: 'media_semana_9',
    reductionSize,
    level: 13,
  })
}

// ═══════════════════════════════════════════════════
// VALIDACIÓN
// ═══════════════════════════════════════════════════

import { isReductionCompatible } from '../reductions/compatibility'

export function isValidProduct(config: ProductConfig): boolean {
  return isReductionCompatible(config.format, config.reductionSize)
}

export function validateProduct(config: ProductConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isReductionCompatible(config.format, config.reductionSize)) {
    errors.push(
      `R${config.reductionSize} is not compatible with ${config.format}`,
    )
  }

  for (const addon of config.addons ?? []) {
    if (addon.type === 'revancha' && config.format !== 'progol_14') {
      errors.push('Revancha addon only available for Progol 14')
    }
    if (addon.type === 'revancha') {
      if (!isReductionCompatible('revancha_7', addon.reductionSize)) {
        errors.push(`R${addon.reductionSize} not compatible with Revancha 7`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
