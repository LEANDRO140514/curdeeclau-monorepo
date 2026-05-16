/**
 * METADATA — Catálogo central de metadatos de matrices.
 *
 * Fuente única de verdad para nombre, parámetros, nivel y fuente
 * de cada una de las 12 reducciones oficiales.
 */

import type { PackedMatrizMeta } from './schema'
import { PATRONES_MATRICES } from './data'

/** Catálogo completo de metadatos para las 12 reducciones */
export const CATALOGO_METADATA: PackedMatrizMeta[] = [
  { id: 1,  nombre: 'Reducción 1  — 4 Triples',             triples: 4,  dobles: 0,  nivel: 13, columnasTotales: 9,   origen: 'codigo_perfecto', fuente: 'Ternary Hamming code length 4' },
  { id: 2,  nombre: 'Reducción 2  — 7 Dobles',               triples: 0,  dobles: 7,  nivel: 13, columnasTotales: 16,  origen: 'codigo_perfecto', fuente: 'Binary Hamming(7,4) code' },
  { id: 3,  nombre: 'Reducción 3  — 3 Triples + 3 Dobles',  triples: 3,  dobles: 3,  nivel: 13, columnasTotales: 24,  origen: 'tabla_oficial',   fuente: 'LAE official reduction table' },
  { id: 4,  nombre: 'Reducción 4  — 2 Triples + 6 Dobles',  triples: 2,  dobles: 6,  nivel: 13, columnasTotales: 64,  origen: 'tabla_oficial',   fuente: 'LAE official reduction table' },
  { id: 5,  nombre: 'Reducción 5  — 8 Triples',             triples: 8,  dobles: 0,  nivel: 13, columnasTotales: 81,  origen: 'tabla_oficial',   fuente: 'LAE official table for 8 triples' },
  { id: 6,  nombre: 'Reducción 6  — 11 Dobles',             triples: 0,  dobles: 11, nivel: 13, columnasTotales: 132, origen: 'tabla_oficial',   fuente: 'LAE official table for 11 dobles' },
  { id: 7,  nombre: 'Reducción 7  — 5 Triples + 4 Dobles',  triples: 5,  dobles: 4,  nivel: 12, columnasTotales: 192, origen: 'pendiente',       fuente: 'Requiere backend Python (OR-Tools CP-SAT)' },
  { id: 8,  nombre: 'Reducción 8  — 3 Triples + 8 Dobles',  triples: 3,  dobles: 8,  nivel: 12, columnasTotales: 216, origen: 'pendiente',       fuente: 'Requiere backend Python (OR-Tools CP-SAT)' },
  { id: 9,  nombre: 'Reducción 9  — 6 Triples + 2 Dobles',  triples: 6,  dobles: 2,  nivel: 12, columnasTotales: 288, origen: 'pendiente',       fuente: 'Requiere backend Python (OR-Tools CP-SAT)' },
  { id: 10, nombre: 'Reducción 10 — 4 Triples + 6 Dobles',  triples: 4,  dobles: 6,  nivel: 11, columnasTotales: 432, origen: 'pendiente',       fuente: 'Requiere backend Python (OR-Tools CP-SAT)' },
  { id: 11, nombre: 'Reducción 11 — 7 Triples + 3 Dobles',  triples: 7,  dobles: 3,  nivel: 11, columnasTotales: 648, origen: 'pendiente',       fuente: 'Requiere backend Python (OR-Tools CP-SAT)' },
  { id: 12, nombre: 'Reducción 12 — 10 Dobles + 1 Triple',  triples: 1,  dobles: 10, nivel: 11, columnasTotales: 512, origen: 'pendiente',       fuente: 'Requiere backend Python (OR-Tools CP-SAT)' },
]

/** Obtener metadatos por ID */
export function obtenerMeta(id: number): PackedMatrizMeta | undefined {
  return CATALOGO_METADATA.find((m) => m.id === id)
}

/** Filtrar por nivel de garantía */
export function porNivel(nivel: number): PackedMatrizMeta[] {
  return CATALOGO_METADATA.filter((m) => m.nivel === nivel)
}

/** Contar matrices por estado de integración */
export function resumenIntegracion(): {
  integradas: number
  pendientes: number
  total: number
  integradasIds: number[]
  pendientesIds: number[]
} {
  const integradasIds: number[] = []
  const pendientesIds: number[] = []

  for (const m of CATALOGO_METADATA) {
    if (m.origen === 'pendiente') {
      pendientesIds.push(m.id)
    } else {
      integradasIds.push(m.id)
    }
  }

  return {
    integradas: integradasIds.length,
    pendientes: pendientesIds.length,
    total: CATALOGO_METADATA.length,
    integradasIds,
    pendientesIds,
  }
}
