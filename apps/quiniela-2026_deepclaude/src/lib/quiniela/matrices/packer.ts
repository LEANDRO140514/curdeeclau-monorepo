/**
 * PACKER — Conversión entre formatos de columna.
 *
 * string[] ↔ uint32 packed
 * number[][] ↔ Uint32Array
 *
 * Todas las operaciones son puras y zero-copy donde es posible.
 */

import {
  SIGNO_A_BITS,
  BITS_A_SIGNO,
  TOTAL_POSICIONES,
  MASCARA_POSICION,
  MASCARA_28BITS,
  POPCOUNT_PARES,
} from './schema'
import type { PackedColumna, PackedMatriz } from './schema'

// ─── Pack/Unpack individual ───

/** Convierte una columna string[] a uint32 packed */
export function packColumna(col: string[]): PackedColumna {
  let packed = 0
  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    packed |= SIGNO_A_BITS[col[i]] << (i * 2)
  }
  return packed >>> 0
}

/** Convierte uint32 packed a string[] */
export function unpackColumna(packed: PackedColumna): string[] {
  const col: string[] = []
  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    col.push(BITS_A_SIGNO[(packed >> (i * 2)) & MASCARA_POSICION])
  }
  return col
}

/** Extrae el valor (0='1', 1='X', 2='2') de una posición */
export function unpackPosicion(packed: PackedColumna, pos: number): number {
  return (packed >> (pos * 2)) & MASCARA_POSICION
}

/** Convierte un valor de posición a signo string */
export function bitsASigno(bits: number): string {
  return BITS_A_SIGNO[bits & MASCARA_POSICION]
}

// ─── Pack/Unpack arrays ───

/** Convierte string[][] a Uint32Array */
export function packMatriz(columnas: string[][]): PackedMatriz {
  const out = new Uint32Array(columnas.length)
  for (let i = 0; i < columnas.length; i++) {
    out[i] = packColumna(columnas[i])
  }
  return out
}

/** Convierte number[][] (valores 0/1/2 por posición) a Uint32Array.
 *  number[i] = [t0, t1, ..., d0, d1, ...] para T+D posiciones.
 *  Las posiciones no especificadas se rellenan con 0 ('1'). */
export function packDesdePatron(patron: number[][], offsetTriples = 0, offsetDobles = 0): PackedMatriz {
  const out = new Uint32Array(patron.length)
  for (let c = 0; c < patron.length; c++) {
    let packed = 0
    const col = patron[c]
    const totalVar = col.length
    for (let i = 0; i < totalVar; i++) {
      packed |= (col[i] & MASCARA_POSICION) << ((i + offsetTriples + offsetDobles) * 2)
    }
    out[c] = packed >>> 0
  }
  return out
}

/** Convierte Uint32Array a string[][] */
export function unpackMatriz(matriz: PackedMatriz): string[][] {
  const out: string[][] = []
  for (let i = 0; i < matriz.length; i++) {
    out.push(unpackColumna(matriz[i]))
  }
  return out
}

// ─── Comparación (bit-level) ───

/**
 * Distancia de Hamming entre dos columnas packed.
 * Cuenta en cuántas posiciones difieren.
 * Usa lookup table POPCOUNT_PARES para 4 accesos + XOR.
 */
export function hammingDistancia(a: PackedColumna, b: PackedColumna): number {
  const xor = ((a ^ b) & MASCARA_28BITS) >>> 0
  return (
    POPCOUNT_PARES[xor & 0xFF] +
    POPCOUNT_PARES[(xor >>> 8) & 0xFF] +
    POPCOUNT_PARES[(xor >>> 16) & 0xFF] +
    POPCOUNT_PARES[(xor >>> 24) & 0xFF]
  )
}

/** Número de aciertos entre dos columnas packed */
export function aciertos(a: PackedColumna, b: PackedColumna): number {
  return TOTAL_POSICIONES - hammingDistancia(a, b)
}

/**
 * Verifica si un conjunto de columnas cumple una garantía contra un resultado.
 * Itera sobre la matriz hasta encontrar una columna con suficientes aciertos.
 */
export function cumpleGarantia(
  matriz: PackedMatriz,
  resultado: PackedColumna,
  garantia: number,
): boolean {
  for (let i = 0; i < matriz.length; i++) {
    if (aciertos(matriz[i], resultado) >= garantia) return true
  }
  return false
}

/**
 * Aciertos de todas las columnas contra un resultado.
 * Retorna Uint8Array con el número de aciertos de cada columna.
 */
export function aciertosVector(
  matriz: PackedMatriz,
  resultado: PackedColumna,
): Uint8Array {
  const out = new Uint8Array(matriz.length)
  for (let i = 0; i < matriz.length; i++) {
    out[i] = aciertos(matriz[i], resultado)
  }
  return out
}

// ─── Conversión de formato UI (Signo[]) ───

/** Convierte Signo[] de UI a packed (para resultado real) */
export function packDesdeSignos(signos: string[]): PackedColumna {
  return packColumna(signos)
}

/** Convierte packed a Signo[] para UI */
export function unpackASignos(packed: PackedColumna): string[] {
  return unpackColumna(packed)
}

// ─── Utilidades ───

/** Verifica que un valor packed sea válido (sin bits inválidos en posiciones) */
export function esPackedValido(packed: PackedColumna): boolean {
  // Verificar que ningún par de 2 bits sea 0b11 (inválido)
  for (let i = 0; i < TOTAL_POSICIONES; i++) {
    if (((packed >> (i * 2)) & MASCARA_POSICION) === 0b11) return false
  }
  // Verificar que los bits altos sean 0
  return (packed & ~MASCARA_28BITS) === 0
}

/** Clona una matriz packed */
export function clonarMatriz(matriz: PackedMatriz): PackedMatriz {
  return new Uint32Array(matriz)
}
