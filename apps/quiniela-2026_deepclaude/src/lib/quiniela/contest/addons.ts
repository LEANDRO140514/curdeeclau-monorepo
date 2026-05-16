/**
 * CONTEST ADDONS — Sistema de addons para concursos.
 *
 * Addon principal: Revancha 7 (opcional para Progol 14).
 *
 * Reglas:
 * - Solo disponible con Progol 14
 * - Requiere R8+ en Progol para desbloquear
 * - El usuario elige reducción independiente para Revancha
 * - Pricing separado
 */

import type { ReductionSize, ContestFormatId } from './formats'
import { isReductionCompatible, getCompatibleReductions } from '../reductions/compatibility'
import type { CompatibilityEntry } from '../reductions/compatibility'
import { PRECIO_POR_COLUMNA } from '../engine/validate'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

export type AddonType = 'revancha'

export interface AddonDefinition {
  type: AddonType
  name: string
  parentFormat: ContestFormatId
  /** Reducciones disponibles para este addon */
  availableReductions: CompatibilityEntry[]
  /** Requiere tamaño mínimo de reducción en el formato padre */
  minParentReduction: ReductionSize
  /** Precio base (sin reducción) */
  basePrice: number
}

// ═══════════════════════════════════════════════════
// DEFINICIONES
// ═══════════════════════════════════════════════════

export const REVANCHA_ADDON: AddonDefinition = {
  type: 'revancha',
  name: 'Revancha 7',
  parentFormat: 'progol_14',
  availableReductions: getCompatibleReductions('revancha_7'),
  minParentReduction: 8,
  basePrice: 0, // El precio viene de la reducción elegida
}

export const ADDONS: Record<AddonType, AddonDefinition> = {
  revancha: REVANCHA_ADDON,
}

// ═══════════════════════════════════════════════════
// CONSULTAS
// ═══════════════════════════════════════════════════

/** ¿Está disponible este addon para este formato? */
export function isAddonAvailable(
  addonType: AddonType,
  parentFormat: ContestFormatId,
): boolean {
  const addon = ADDONS[addonType]
  if (!addon) return false
  return addon.parentFormat === parentFormat
}

/** ¿El usuario cumple los requisitos para el addon? */
export function canPurchaseAddon(
  addonType: AddonType,
  parentReductionSize: ReductionSize,
): boolean {
  const addon = ADDONS[addonType]
  if (!addon) return false
  return parentReductionSize >= addon.minParentReduction
}

/** Reducciones disponibles para un addon */
export function getAddonReductions(addonType: AddonType): CompatibilityEntry[] {
  return ADDONS[addonType]?.availableReductions ?? []
}

/** Verifica si un tamaño de reducción es válido para el addon */
export function isValidAddonReduction(
  addonType: AddonType,
  size: ReductionSize,
): boolean {
  const addon = ADDONS[addonType]
  if (!addon) return false
  return isReductionCompatible(addon.parentFormat === 'progol_14' ? 'revancha_7' : addon.parentFormat, size)
}

/** Calcula precio total del addon */
export function addonPrice(addonType: AddonType, reductionSize: ReductionSize): number {
  const addon = ADDONS[addonType]
  if (!addon) return 0
  return reductionSize * PRECIO_POR_COLUMNA
}
