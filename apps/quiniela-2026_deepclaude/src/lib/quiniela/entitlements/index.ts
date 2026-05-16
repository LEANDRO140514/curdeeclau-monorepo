/**
 * ENTITLEMENT SYSTEM
 *
 * Lógica de desbloqueo: compra reducción → derechos adquiridos.
 *
 * Reglas:
 * 1. Comprar cualquier reducción Progol → desbloquea Private 11 entrada gratis
 * 2. R16+ → desbloquea Revancha como addon
 * 3. R16+ → incluye análisis premium
 * 4. Entradas extra de Private 11 según tamaño de reducción
 * 5. Los addons heredan entitlements del producto padre
 *
 * NO lógica de UI. Puramente funcional.
 */

import type { ReductionSize, ContestFormatId } from '../contest/formats'
import type { ContestProduct } from '../contest/products'
import { getBenefits, getIntensity } from '../reductions/catalog'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

/** Derechos adquiridos por un usuario */
export interface UserEntitlements {
  /** ¿Tiene acceso a Private 11? */
  canAccessPrivate11: boolean
  /** Entradas gratuitas a Private 11 */
  private11FreeEntries: number
  /** Entradas extra compradas */
  private11ExtraEntries: number
  /** ¿Puede añadir Revancha? */
  canAddRevancha: boolean
  /** ¿Tiene análisis premium? */
  hasPremiumAnalysis: boolean
  /** Formatos desbloqueados */
  unlockedFormats: ContestFormatId[]
  /** Compras realizadas */
  purchases: PurchaseRecord[]
}

/** Registro de una compra */
export interface PurchaseRecord {
  productId: string
  format: ContestFormatId
  reductionSize: ReductionSize
  price: number
  purchasedAt: number // timestamp
  includesRevancha: boolean
  revanchaSize?: ReductionSize
}

// ═══════════════════════════════════════════════════
// ESTADO INICIAL
// ═══════════════════════════════════════════════════

export function createEntitlements(): UserEntitlements {
  return {
    canAccessPrivate11: false,
    private11FreeEntries: 0,
    private11ExtraEntries: 0,
    canAddRevancha: false,
    hasPremiumAnalysis: false,
    unlockedFormats: [],
    purchases: [],
  }
}

// ═══════════════════════════════════════════════════
// MOTOR DE ENTITLEMENTS
// ═══════════════════════════════════════════════════

/**
 * Procesa una compra y actualiza los entitlements del usuario.
 * Pura: retorna nuevo estado, no modifica el anterior.
 */
export function processPurchase(
  current: UserEntitlements,
  product: ContestProduct,
): UserEntitlements {
  const benefits = getBenefits(product.reductionSize)

  const purchase: PurchaseRecord = {
    productId: product.id,
    format: product.format,
    reductionSize: product.reductionSize,
    price: product.totalPrice,
    purchasedAt: Date.now(),
    includesRevancha: product.addons.some((a) => a.type === 'revancha'),
    revanchaSize: product.addons.find((a) => a.type === 'revancha')?.reductionSize,
  }

  const next: UserEntitlements = {
    canAccessPrivate11:
      current.canAccessPrivate11 ||
      benefits.private11Entries > 0 ||
      product.format === 'private_11',
    private11FreeEntries:
      current.private11FreeEntries + benefits.private11Entries,
    private11ExtraEntries: current.private11ExtraEntries,
    canAddRevancha:
      current.canAddRevancha || benefits.unlocksRevancha,
    hasPremiumAnalysis:
      current.hasPremiumAnalysis || benefits.premiumAnalysis,
    unlockedFormats: [
      ...new Set([...current.unlockedFormats, product.format]),
    ],
    purchases: [...current.purchases, purchase],
  }

  // Si compró Revancha, añadir al unlocked
  if (purchase.includesRevancha) {
    if (!next.unlockedFormats.includes('revancha_7')) {
      next.unlockedFormats = [...next.unlockedFormats, 'revancha_7']
    }
  }

  // Si desbloqueó Private 11, añadir
  if (next.canAccessPrivate11 && !next.unlockedFormats.includes('private_11')) {
    next.unlockedFormats = [...next.unlockedFormats, 'private_11']
  }

  return next
}

/** Añade entradas extra de Private 11 */
export function addPrivate11Entries(
  current: UserEntitlements,
  count: number,
): UserEntitlements {
  return {
    ...current,
    private11ExtraEntries: current.private11ExtraEntries + count,
  }
}

/** Total de entradas a Private 11 disponibles */
export function totalPrivate11Entries(e: UserEntitlements): number {
  return e.private11FreeEntries + e.private11ExtraEntries
}

// ═══════════════════════════════════════════════════
// CONSULTAS
// ═══════════════════════════════════════════════════

/** ¿El usuario puede acceder a un formato? */
export function canAccess(e: UserEntitlements, format: ContestFormatId): boolean {
  // Progol 14 y Media Semana siempre accesibles (requieren compra)
  if (format === 'progol_14' || format === 'media_semana_9') {
    return e.unlockedFormats.includes(format)
  }
  // Private 11 requiere desbloqueo
  if (format === 'private_11') {
    return e.canAccessPrivate11
  }
  // Revancha solo como addon
  if (format === 'revancha_7') {
    return e.canAddRevancha
  }
  return false
}

/** ¿Ya compró una reducción específica? */
export function hasPurchased(e: UserEntitlements, size: ReductionSize): boolean {
  return e.purchases.some((p) => p.reductionSize === size)
}

/** Total gastado */
export function totalSpent(e: UserEntitlements): number {
  return e.purchases.reduce((sum, p) => sum + p.price, 0)
}

/** Intensidad máxima de reducción comprada */
export function maxIntensity(e: UserEntitlements): string {
  if (e.purchases.length === 0) return 'none'
  const sizes = e.purchases.map((p) => p.reductionSize)
  const maxSize = Math.max(...sizes)
  return getIntensity(maxSize as ReductionSize)
}
