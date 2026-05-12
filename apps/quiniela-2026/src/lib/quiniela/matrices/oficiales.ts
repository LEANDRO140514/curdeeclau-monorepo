/**
 * MATRICES DE REDUCCIÓN OFICIALES — REGISTRO
 *
 * Estado: 6 matrices integradas (códigos perfectos + tablas LAE).
 * Las 6 restantes se generan vía greedy (TypeScript) o backend Python.
 */

import type { MatrizReduccion } from '../types'
import { PATRONES_MATRICES } from './data'

function buildRegistro(): MatrizReduccion[] {
  return [
    { meta: { id: 1,  nombre: 'Reducción 1  — 4 Triples',             triples: 4,  dobles: 0,  columnasRequeridas: 9,    nivel: 13 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 2,  nombre: 'Reducción 2  — 7 Dobles',               triples: 0,  dobles: 7,  columnasRequeridas: 16,   nivel: 13 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 3,  nombre: 'Reducción 3  — 3 Triples + 3 Dobles',  triples: 3,  dobles: 3,  columnasRequeridas: 24,   nivel: 13 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 4,  nombre: 'Reducción 4  — 2 Triples + 6 Dobles',  triples: 2,  dobles: 6,  columnasRequeridas: 64,   nivel: 13 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 5,  nombre: 'Reducción 5  — 8 Triples',             triples: 8,  dobles: 0,  columnasRequeridas: 81,   nivel: 13 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 6,  nombre: 'Reducción 6  — 11 Dobles',             triples: 0,  dobles: 11, columnasRequeridas: 132,  nivel: 13 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 7,  nombre: 'Reducción 7  — 5 Triples + 4 Dobles',  triples: 5,  dobles: 4,  columnasRequeridas: 192,  nivel: 12 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 8,  nombre: 'Reducción 8  — 3 Triples + 8 Dobles',  triples: 3,  dobles: 8,  columnasRequeridas: 216,  nivel: 12 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 9,  nombre: 'Reducción 9  — 6 Triples + 2 Dobles',  triples: 6,  dobles: 2,  columnasRequeridas: 288,  nivel: 12 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 10, nombre: 'Reducción 10 — 4 Triples + 6 Dobles',  triples: 4,  dobles: 6,  columnasRequeridas: 432,  nivel: 11 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 11, nombre: 'Reducción 11 — 7 Triples + 3 Dobles',  triples: 7,  dobles: 3,  columnasRequeridas: 648,  nivel: 11 as const }, columnas: undefined, fuente: undefined },
    { meta: { id: 12, nombre: 'Reducción 12 — 10 Dobles + 1 Triple',  triples: 1,  dobles: 10, columnasRequeridas: 512,  nivel: 11 as const }, columnas: undefined, fuente: undefined },
  ].map((entry) => {
    const patron = PATRONES_MATRICES[entry.meta.id]
    const integrada = patron && patron.origen !== 'pendiente' && patron.columnas.length > 0
    return {
      meta: entry.meta,
      columnas: integrada ? (patron.columnas as unknown as MatrizReduccion['columnas']) : undefined,
      fuente: patron?.fuente ?? undefined,
    }
  })
}

export const REGISTRO_MATRICES: MatrizReduccion[] = buildRegistro()

/** Cuántas matrices están integradas (tienen datos de columnas) */
export function matricesIntegradas(): number {
  return REGISTRO_MATRICES.filter((m) => m.columnas !== undefined).length
}

/** Cuántas matrices están pendientes de integración */
export function matricesPendientes(): number {
  return REGISTRO_MATRICES.filter((m) => m.columnas === undefined).length
}
