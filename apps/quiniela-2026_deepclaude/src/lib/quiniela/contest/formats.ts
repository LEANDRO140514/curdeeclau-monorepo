/**
 * CONTEST FORMATS — Definiciones oficiales de tipos de quiniela.
 *
 * Define los 4 formatos de concurso soportados:
 * - PROGOL_14: Quiniela clásica de 14 partidos (Modelo 14 directo o reducido)
 * - REVANCHA_7: Addon opcional de 7 partidos
 * - MEDIA_SEMANA_9: Media semana de 9 partidos
 * - PRIVATE_11: Sistema social de 11 partidos
 *
 * Estos tipos son la base del product system.
 * NO están hardcodeados en UI — son definiciones de dominio puras.
 */

import type { NivelGarantia } from '../types'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

/** Identificador único de formato de concurso */
export type ContestFormatId =
  | 'progol_14'
  | 'revancha_7'
  | 'media_semana_9'
  | 'private_11'

/** Categoría de concurso */
export type ContestCategory =
  | 'weekend'      // Fin de semana (Progol + Revancha)
  | 'midweek'      // Entre semana (Media Semana)
  | 'social'       // Social (Private 11)

/** Nivel de un formato: principal o addon */
export type FormatTier =
  | 'primary'      // Concurso principal
  | 'addon'        // Addon opcional (Revancha)

/** Un formato de concurso */
export interface ContestFormat {
  id: ContestFormatId
  name: string
  category: ContestCategory
  tier: FormatTier
  /** Número de partidos */
  matches: number
  /** Niveles de garantía soportados */
  supportedLevels: NivelGarantia[]
  /** Requiere compra de reducción para acceder */
  requiresPurchase: boolean
  /** Soporta generación directa (Modelo 14 completo) */
  supportsDirect: boolean
  /** Soporta reducciones */
  supportsReductions: boolean
  /** Soporta addons */
  supportsAddons: boolean
  /** Formatos padre (para addons) */
  parentFormats?: ContestFormatId[]
}

/** Niveles de reducción disponibles (R4-R132) */
export type ReductionSize =
  | 4 | 8 | 9 | 16 | 24 | 32 | 64 | 81 | 132

// ═══════════════════════════════════════════════════
// FORMATOS OFICIALES
// ═══════════════════════════════════════════════════

export const PROGOL_14: ContestFormat = {
  id: 'progol_14',
  name: 'Progol 14',
  category: 'weekend',
  tier: 'primary',
  matches: 14,
  supportedLevels: [11, 12, 13, 14],
  requiresPurchase: true,
  supportsDirect: true,
  supportsReductions: true,
  supportsAddons: true,
}

export const REVANCHA_7: ContestFormat = {
  id: 'revancha_7',
  name: 'Revancha 7',
  category: 'weekend',
  tier: 'addon',
  matches: 7,
  supportedLevels: [11, 12, 13],
  requiresPurchase: true,
  supportsDirect: true,
  supportsReductions: true,
  supportsAddons: false,
  parentFormats: ['progol_14'],
}

export const MEDIA_SEMANA_9: ContestFormat = {
  id: 'media_semana_9',
  name: 'Media Semana 9',
  category: 'midweek',
  tier: 'primary',
  matches: 9,
  supportedLevels: [11, 12, 13],
  requiresPurchase: true,
  supportsDirect: true,
  supportsReductions: true,
  supportsAddons: false,
}

export const PRIVATE_11: ContestFormat = {
  id: 'private_11',
  name: 'Private 11 Plus',
  category: 'social',
  tier: 'primary',
  matches: 11,
  supportedLevels: [11, 12, 13],
  requiresPurchase: false, // Entrada gratis al comprar reducción Progol
  supportsDirect: false,   // Solo reducciones
  supportsReductions: true,
  supportsAddons: false,
}

// ═══════════════════════════════════════════════════
// CATÁLOGO
// ═══════════════════════════════════════════════════

export const CONTEST_FORMATS: Record<ContestFormatId, ContestFormat> = {
  progol_14: PROGOL_14,
  revancha_7: REVANCHA_7,
  media_semana_9: MEDIA_SEMANA_9,
  private_11: PRIVATE_11,
}

/** Formatos primarios (excluye addons) */
export const PRIMARY_FORMATS: ContestFormat[] = [
  PROGOL_14,
  MEDIA_SEMANA_9,
  PRIVATE_11,
]

/** Formatos de fin de semana */
export const WEEKEND_FORMATS: ContestFormat[] = [
  PROGOL_14,
  REVANCHA_7,
]

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

export function getFormat(id: ContestFormatId): ContestFormat | undefined {
  return CONTEST_FORMATS[id]
}

export function isAddon(format: ContestFormat): boolean {
  return format.tier === 'addon'
}

export function getParentFormats(format: ContestFormat): ContestFormat[] {
  if (!format.parentFormats) return []
  return format.parentFormats
    .map((id) => CONTEST_FORMATS[id])
    .filter((f): f is ContestFormat => f !== undefined)
}

export function formatSupportsLevel(
  format: ContestFormat,
  level: NivelGarantia,
): boolean {
  return format.supportedLevels.includes(level)
}
