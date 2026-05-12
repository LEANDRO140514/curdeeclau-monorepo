/**
 * CONTEST PRICING — Capa de pricing configurable.
 *
 * Precios base por reducción + addons + bundles + promociones.
 * NO hardcodeado. Preparado para A/B testing, promociones, descuentos.
 */

import type { ReductionSize } from './formats'
import type { ContestProduct } from './products'
import { getProductPrice } from '../reductions/catalog'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

export type DiscountType =
  | 'percentage'   // % de descuento
  | 'fixed'        // Descuento fijo en euros
  | 'bundle'       // Precio de bundle

export interface Discount {
  type: DiscountType
  value: number
  label: string
  /** Código de promoción (opcional) */
  code?: string
  /** Fechas de validez */
  validFrom?: string
  validUntil?: string
}

export interface PricingConfig {
  /** Override de precios base por tamaño */
  priceOverrides?: Partial<Record<ReductionSize, number>>
  /** Descuentos activos */
  discounts?: Discount[]
  /** Entradas gratis adicionales */
  bonusEntries?: number
}

// ═══════════════════════════════════════════════════
// CALCULADORA
// ═══════════════════════════════════════════════════

/** Calcula el precio final de un producto aplicando config */
export function calculatePrice(
  product: ContestProduct,
  config?: PricingConfig,
): {
  basePrice: number
  discountAmount: number
  finalPrice: number
  appliedDiscounts: Discount[]
} {
  let basePrice = product.basePrice

  // Override de precio base
  if (config?.priceOverrides?.[product.reductionSize]) {
    basePrice = config.priceOverrides[product.reductionSize]!
  }

  // Añadir addons
  for (const addon of product.addons) {
    basePrice += addon.price
  }

  // Aplicar descuentos
  let discountAmount = 0
  const appliedDiscounts: Discount[] = []

  for (const discount of config?.discounts ?? []) {
    if (discount.type === 'percentage') {
      const d = basePrice * (discount.value / 100)
      discountAmount += d
    } else if (discount.type === 'fixed') {
      discountAmount += discount.value
    } else if (discount.type === 'bundle') {
      discountAmount += basePrice - discount.value
    }
    appliedDiscounts.push(discount)
  }

  const finalPrice = Math.max(0, basePrice - discountAmount)

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    appliedDiscounts,
  }
}

/** Calcula ahorro vs directo */
export function calculateSavings(
  reductionSize: ReductionSize,
  directColumns: number,
): {
  reductionColumns: number
  directColumns: number
  savingsPercent: number
  savingsEuros: number
} {
  const reductionColumns = reductionSize
  const reductionCost = reductionColumns * 0.75
  const directCost = directColumns * 0.75

  return {
    reductionColumns,
    directColumns,
    savingsPercent: directColumns > 0
      ? Math.round((1 - reductionColumns / directColumns) * 100)
      : 0,
    savingsEuros: Math.round((directCost - reductionCost) * 100) / 100,
  }
}

// ═══════════════════════════════════════════════════
// BUNDLES
// ═══════════════════════════════════════════════════

export interface Bundle {
  id: string
  name: string
  products: ContestProduct[]
  bundlePrice: number
  savingsVsIndividual: number
  label: string
}

/** Crea un bundle Progol + Private 11 */
export function createProgolPrivate11Bundle(
  progolSize: ReductionSize,
  private11Size: ReductionSize,
): Bundle {
  const progolPrice = getProductPrice(progolSize)
  const private11Price = getProductPrice(private11Size)
  const individualTotal = progolPrice + private11Price
  const bundlePrice = Math.round(individualTotal * 0.85 * 100) / 100 // 15% descuento

  return {
    id: `bundle_progol_r${progolSize}_p11_r${private11Size}`,
    name: `Progol R${progolSize} + Private 11 R${private11Size}`,
    products: [],
    bundlePrice,
    savingsVsIndividual: Math.round((individualTotal - bundlePrice) * 100) / 100,
    label: 'Bundle Progol + Private 11',
  }
}

// ═══════════════════════════════════════════════════
// PROMOTIONS
// ═══════════════════════════════════════════════════

export interface Promotion {
  id: string
  name: string
  description: string
  discount: Discount
  minPurchase?: number
  maxUses?: number
}

/** Promociones predefinidas */
export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'first_reduction',
    name: 'Primera reducción',
    description: '10% descuento en tu primera reducción',
    discount: { type: 'percentage', value: 10, label: '10% off primera compra' },
    maxUses: 1,
  },
  {
    id: 'bundle_15',
    name: 'Bundle 15%',
    description: '15% descuento al comprar Progol + Private 11 juntos',
    discount: { type: 'percentage', value: 15, label: '15% bundle' },
  },
  {
    id: 'revancha_free',
    name: 'Revancha gratis',
    description: 'Revancha R4 gratis con R16+',
    discount: { type: 'fixed', value: 3.00, label: 'Revancha R4 gratis' },
    minPurchase: 12.00,
  },
]
