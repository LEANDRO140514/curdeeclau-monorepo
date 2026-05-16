/**
 * GENERACIÓN DIRECTA (MODELO 14)
 *
 * Expansión combinatoria completa de una configuración de signos.
 * Algoritmo: mixed-radix (base-3 para triples, base-2 para dobles).
 *
 * Complejidad: O(3^T × 2^D) — exponencial.
 * Para T=4, D=3: 81 × 8 = 648 columnas. Bien.
 * Para T=14: 3^14 = 4,782,969 columnas. ~1 GB en memoria. NO recomendado.
 *
 * Por eso existe el límite de 50,000 columnas por defecto.
 * Para más, usar generación por lotes (streaming).
 */

import type { ConfigUsuario, ResultadoDirecto, Columna } from '../types'
import { validarConfig, contarSignos, PRECIO_POR_COLUMNA } from './validate'

const LIMITE_COLUMNAS = 50_000

/**
 * Genera TODAS las columnas de una configuración directa.
 * Si hay más de 50k columnas, lanza error (usar generarPorLotes para streaming).
 */
export function generarDirecta(config: ConfigUsuario): ResultadoDirecto {
  validarConfig(config)
  const conteo = contarSignos(config)
  const { triples, dobles } = conteo
  const totalColumnas = 3 ** triples * 2 ** dobles

  if (totalColumnas > LIMITE_COLUMNAS) {
    throw new Error(
      `Demasiadas columnas: ${totalColumnas.toLocaleString('es-ES')}. ` +
      `Límite: ${LIMITE_COLUMNAS.toLocaleString('es-ES')}. ` +
      `Usa generarPorLotes() para conjuntos grandes o reduce triples/dobles.`
    )
  }

  return {
    config: [...config],
    conteo,
    columnasTotales: totalColumnas,
    costoTotal: totalColumnas * PRECIO_POR_COLUMNA,
    columnas: expandirColumnas(config, totalColumnas),
  }
}

/**
 * Expansión combinatorial exacta usando mixed-radix.
 *
 * Algoritmo:
 * 1. Identificar índices de triples (base-3) y dobles (base-2).
 * 2. Iterar n = 0..total-1.
 * 3. Para cada n, extraer "dígitos" en las bases correspondientes.
 * 4. Los fijos se mantienen igual en todas las columnas.
 */
function expandirColumnas(config: ConfigUsuario, total: number): Columna[] {
  const idxTriples: number[] = []
  const idxDobles: number[] = []
  const opcionesDobles: string[][] = []

  config.forEach((s, i) => {
    if (s === '1X2') idxTriples.push(i)
    else if (s.length === 2) {
      idxDobles.push(i)
      opcionesDobles.push(s.split(''))
    }
  })

  const columnas: Columna[] = []

  for (let n = 0; n < total; n++) {
    const col = [...config] as unknown as Columna
    let resto = n

    // Dígitos en base-3 para triples
    for (const i of idxTriples) {
      const v = resto % 3
      col[i] = (v === 0 ? '1' : v === 1 ? 'X' : '2') as Columna[number]
      resto = Math.floor(resto / 3)
    }

    // Dígitos en base-2 para dobles
    for (let d = 0; d < idxDobles.length; d++) {
      const v = resto % 2
      col[idxDobles[d]] = opcionesDobles[d][v] as Columna[number]
      resto = Math.floor(resto / 2)
    }

    columnas.push(col)
  }

  return columnas
}

/**
 * Generación por lotes (streaming) para conjuntos grandes.
 * Yield cada lote de `tamanoLote` columnas.
 * Permite procesar millones de columnas sin saturar memoria.
 */
export function* generarPorLotes(
  config: ConfigUsuario,
  tamanoLote = 10_000,
): Generator<Columna[]> {
  validarConfig(config)
  const { triples, dobles } = contarSignos(config)
  const total = 3 ** triples * 2 ** dobles

  const idxTriples: number[] = []
  const idxDobles: number[] = []
  const opcionesDobles: string[][] = []

  config.forEach((s, i) => {
    if (s === '1X2') idxTriples.push(i)
    else if (s.length === 2) {
      idxDobles.push(i)
      opcionesDobles.push(s.split(''))
    }
  })

  let lote: Columna[] = []

  for (let n = 0; n < total; n++) {
    const col = [...config] as unknown as Columna
    let resto = n

    for (const i of idxTriples) {
      const v = resto % 3
      col[i] = (v === 0 ? '1' : v === 1 ? 'X' : '2') as Columna[number]
      resto = Math.floor(resto / 3)
    }

    for (let d = 0; d < idxDobles.length; d++) {
      const v = resto % 2
      col[idxDobles[d]] = opcionesDobles[d][v] as Columna[number]
      resto = Math.floor(resto / 2)
    }

    lote.push(col)

    if (lote.length >= tamanoLote) {
      yield lote
      lote = []
    }
  }

  if (lote.length > 0) yield lote
}
