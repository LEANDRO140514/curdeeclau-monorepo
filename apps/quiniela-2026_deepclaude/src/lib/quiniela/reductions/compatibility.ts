/**
 * REDUCTION COMPATIBILITY MATRIX
 *
 * Define qué reducciones R(X) soporta cada tipo de quiniela.
 * Esta es LA fuente de verdad para la compatibilidad concurso×reducción.
 *
 * NO hardcodeada en UI.
 * NO inferida de datos.
 * Especificación explícita y validable.
 */

import type { ContestFormatId, ReductionSize } from '../contest/formats'
import type { NivelGarantia } from '../types'

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

/** Una entrada en la matriz de compatibilidad */
export interface CompatibilityEntry {
  /** Tamaño de reducción (R9, R16, etc.) */
  size: ReductionSize
  /** Nivel de garantía que ofrece */
  level: NivelGarantia
  /** Columnas en la matriz de reducción */
  columns: number
  /** ID de la reducción en CATALOGO_REDUCCIONES (0 si no mapea a reducción exacta) */
  reductionId: number
  /** Descripción legible */
  label: string
}

/** Matriz completa: formato → tamaños disponibles */
export type CompatibilityMatrix = Record<ContestFormatId, CompatibilityEntry[]>

// ═══════════════════════════════════════════════════
// MATRIZ OFICIAL
// ═══════════════════════════════════════════════════

/**
 * MATRIZ DE COMPATIBILIDAD OFICIAL
 *
 * Progol 14 (Modelo 14): R9, R16, R24, R64, R81, R132
 * Progol 14 (Modelo 13): R9, R16, R24, R64, R81, R132
 * Revancha 7:            R4, R8, R16, R32
 * Media Semana 9:        R9, R16, R24, R32, R64
 * Private 11:            R9, R16, R24, R32, R64, R81
 */
export const COMPATIBILITY_MATRIX: CompatibilityMatrix = {
  progol_14: [
    { size: 9,   level: 13, columns: 9,   reductionId: 1,  label: 'R9  — 4 Triples al 13' },
    { size: 16,  level: 13, columns: 16,  reductionId: 2,  label: 'R16 — 7 Dobles al 13' },
    { size: 24,  level: 13, columns: 24,  reductionId: 3,  label: 'R24 — 3T+3D al 13' },
    { size: 64,  level: 13, columns: 64,  reductionId: 4,  label: 'R64 — 2T+6D al 13' },
    { size: 81,  level: 13, columns: 81,  reductionId: 5,  label: 'R81 — 8 Triples al 13' },
    { size: 132, level: 13, columns: 132, reductionId: 6,  label: 'R132 — 11 Dobles al 13' },
  ],

  revancha_7: [
    { size: 4,  level: 13, columns: 4,  reductionId: 0, label: 'R4  — 2 Dobles' },
    { size: 8,  level: 13, columns: 8,  reductionId: 0, label: 'R8  — 3 Dobles' },
    { size: 16, level: 13, columns: 16, reductionId: 0, label: 'R16 — 4 Dobles' },
    { size: 32, level: 13, columns: 32, reductionId: 0, label: 'R32 — 5 Dobles' },
  ],

  media_semana_9: [
    { size: 9,  level: 13, columns: 9,  reductionId: 0, label: 'R9  — 2 Triples' },
    { size: 16, level: 13, columns: 16, reductionId: 0, label: 'R16 — 4 Dobles' },
    { size: 24, level: 13, columns: 24, reductionId: 0, label: 'R24 — 1T+3D' },
    { size: 32, level: 13, columns: 32, reductionId: 0, label: 'R32 — 5 Dobles' },
    { size: 64, level: 13, columns: 64, reductionId: 0, label: 'R64 — 2T+3D' },
  ],

  private_11: [
    { size: 9,   level: 13, columns: 9,  reductionId: 0, label: 'R9  — 2 Triples' },
    { size: 16,  level: 13, columns: 16, reductionId: 0, label: 'R16 — 4 Dobles' },
    { size: 24,  level: 13, columns: 24, reductionId: 0, label: 'R24 — 1T+3D' },
    { size: 32,  level: 13, columns: 32, reductionId: 0, label: 'R32 — 5 Dobles' },
    { size: 64,  level: 13, columns: 64, reductionId: 0, label: 'R64 — 2T+3D' },
    { size: 81,  level: 13, columns: 81, reductionId: 0, label: 'R81 — 4 Triples' },
  ],
}

// ═══════════════════════════════════════════════════
// CONSULTAS
// ═══════════════════════════════════════════════════

/** Obtiene las reducciones compatibles con un formato */
export function getCompatibleReductions(formatId: ContestFormatId): CompatibilityEntry[] {
  return COMPATIBILITY_MATRIX[formatId] ?? []
}

/** Verifica si un tamaño de reducción es compatible con un formato */
export function isReductionCompatible(
  formatId: ContestFormatId,
  size: ReductionSize,
): boolean {
  const entries = COMPATIBILITY_MATRIX[formatId]
  if (!entries) return false
  return entries.some((e) => e.size === size)
}

/** Obtiene los tamaños disponibles para un formato */
export function getAvailableSizes(formatId: ContestFormatId): ReductionSize[] {
  const entries = COMPATIBILITY_MATRIX[formatId]
  if (!entries) return []
  return [...new Set(entries.map((e) => e.size))].sort((a, b) => a - b)
}

/** Encuentra una entrada específica */
export function findEntry(
  formatId: ContestFormatId,
  size: ReductionSize,
): CompatibilityEntry | undefined {
  return COMPATIBILITY_MATRIX[formatId]?.find((e) => e.size === size)
}

/** Todos los tamaños únicos disponibles en el sistema */
export function allReductionSizes(): ReductionSize[] {
  const sizes = new Set<ReductionSize>()
  for (const entries of Object.values(COMPATIBILITY_MATRIX)) {
    for (const e of entries) {
      sizes.add(e.size)
    }
  }
  return [...sizes].sort((a, b) => a - b)
}
