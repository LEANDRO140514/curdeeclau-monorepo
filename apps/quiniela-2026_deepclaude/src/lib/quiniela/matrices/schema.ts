/**
 * SCHEMA — Tipos y constantes del formato binario de matrices.
 *
 * Formato packed: cada columna de 14 posiciones se codifica en 28 bits
 * dentro de un uint32. Cada posición ocupa 2 bits:
 *   00 = '1'    01 = 'X'    10 = '2'    11 = inválido
 *
 * Bit layout (little-endian):
 *   bits 0-1   = posición 0
 *   bits 2-3   = posición 1
 *   ...
 *   bits 26-27 = posición 13
 *   bits 28-31 = reservados (siempre 0)
 *
 * Este formato permite:
 *   - 4 bytes por columna (vs ~500 en string[])
 *   - Hamming distance vía XOR + lookup table (~20x más rápido)
 *   - Serialización directa a ArrayBuffer (compatible Python/numpy)
 */

// ─── Constantes de codificación ───

/** Mapeo signo → valor 2-bit */
export const SIGNO_A_BITS: Record<string, number> = {
  '1': 0b00,
  'X': 0b01,
  '2': 0b10,
}

/** Mapeo valor 2-bit → signo */
export const BITS_A_SIGNO = ['1', 'X', '2', '?'] as const

/** Bits usados por posición */
export const BITS_POR_POSICION = 2

/** Total de posiciones en una columna de quiniela */
export const TOTAL_POSICIONES = 14

/** Máscara para aislar una posición */
export const MASCARA_POSICION = 0b11

/** Máscara para los 28 bits usados */
export const MASCARA_28BITS = 0x0FFFFFFF

/** Valor máximo de columna (todas posiciones = '2' = 0b10) */
export const MAX_VALOR_COLUMNA = 0b10101010_10101010_10101010_10101010 >>> 0

// ─── Hamming lookup table ───

/**
 * Tabla precomputada: para cada byte (0-255), cuántos pares de 2 bits
 * son no-cero. Esto cuenta posiciones DIFERENTES en un XOR.
 *
 * POPCOUNT_PARES[xor_byte] = número de posiciones donde los pares de 2 bits difieren.
 */
export const POPCOUNT_PARES = new Uint8Array(256)

;(function init() {
  for (let i = 0; i < 256; i++) {
    let d = 0
    if (i & 0b00000011) d++
    if (i & 0b00001100) d++
    if (i & 0b00110000) d++
    if (i & 0b11000000) d++
    POPCOUNT_PARES[i] = d
  }
})()

// ─── Tipos ───

/** Una columna packed: 28 bits en uint32 */
export type PackedColumna = number

/** Una matriz packed: array tipado de columnas */
export type PackedMatriz = Uint32Array

/** Metadatos de una matriz packed */
export interface PackedMatrizMeta {
  /** ID de la reducción (1-12) */
  id: number
  /** Nombre descriptivo */
  nombre: string
  /** Número de posiciones triples cubiertas */
  triples: number
  /** Número de posiciones dobles cubiertas */
  dobles: number
  /** Nivel de garantía (11, 12, 13, 14) */
  nivel: number
  /** Número de columnas en la matriz */
  columnasTotales: number
  /** Origen de los datos */
  origen: 'codigo_perfecto' | 'tabla_oficial' | 'greedy' | 'pendiente'
  /** Referencia/fuente */
  fuente: string
}

/** Resultado de una validación de matriz */
export interface ValidacionMatriz {
  valida: boolean
  errores: string[]
  advertencias: string[]
  stats: {
    columnas: number
    duplicadas: number
    unicas: number
    valoresInvalidos: number
    rangoMin: number
    rangoMax: number
  }
}

/** Resultado de benchmark */
export interface BenchmarkResultado {
  nombre: string
  columnas: number
  operaciones: number
  tiempoMs: number
  opsPorSegundo: number
  memoriaBytes: number
}
