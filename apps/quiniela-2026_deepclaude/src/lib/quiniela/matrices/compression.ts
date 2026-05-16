/**
 * COMPRESSION — Serialización compacta para almacenamiento y transferencia.
 *
 * Formato binario .qmat (Quiniela Matrix):
 *   Offset 0:  magic 4B  "QMAT"
 *   Offset 4:  version u8  (1)
 *   Offset 5:  flags u8    (bit 0: comprimido)
 *   Offset 6:  triples u8
 *   Offset 7:  dobles u8
 *   Offset 8:  nivel u8
 *   Offset 9:  columnas u32 (N)
 *   Offset 13: padding 3B (alineación a 4)
 *   Offset 16: data N×4B (uint32 little-endian)
 *
 * Tamaño total: 16 + N*4 bytes.
 * Para la matriz más grande (648 cols): 13 + 2592 = 2605 bytes.
 */

import type { PackedMatriz, PackedMatrizMeta } from './schema'
import { MASCARA_28BITS, TOTAL_POSICIONES } from './schema'

const MAGIC = new Uint8Array([0x51, 0x4D, 0x41, 0x54]) // "QMAT"
const VERSION = 1

/** Serializa una matriz + meta a ArrayBuffer */
export function serializarMatriz(matriz: PackedMatriz, meta: PackedMatrizMeta): ArrayBuffer {
  const n = matriz.length
  const HEADER_SIZE = 16
  const buf = new ArrayBuffer(HEADER_SIZE + n * 4)
  const header = new Uint8Array(buf, 0, HEADER_SIZE)
  const data = new Uint32Array(buf, HEADER_SIZE, n)

  header.set(MAGIC, 0)
  header[4] = VERSION
  header[5] = 0 // flags (sin compresión)
  header[6] = meta.triples
  header[7] = meta.dobles
  header[8] = meta.nivel
  new DataView(buf).setUint32(9, n, true) // little-endian
  // Bytes 13-15: padding (alineación)

  data.set(matriz)
  return buf
}

/** Deserializa ArrayBuffer a {matriz, meta} */
export function deserializarMatriz(buf: ArrayBuffer): {
  matriz: PackedMatriz
  meta: PackedMatrizMeta
} | null {
  if (buf.byteLength < 16) return null

  const header = new Uint8Array(buf, 0, 16)
  if (
    header[0] !== MAGIC[0] || header[1] !== MAGIC[1] ||
    header[2] !== MAGIC[2] || header[3] !== MAGIC[3]
  ) {
    return null
  }

  const version = header[4]
  if (version !== 1) return null

  const flags = header[5]
  const triples = header[6]
  const dobles = header[7]
  const nivel = header[8]
  const n = new DataView(buf).getUint32(9, true)
  const data = new Uint32Array(buf, 16, n)

  // Crear copia para que el buffer original pueda ser GC'd
  const matriz = new Uint32Array(data)

  return {
    matriz,
    meta: {
      id: 0,
      nombre: 'Deserializado',
      triples,
      dobles,
      nivel: nivel as PackedMatrizMeta['nivel'],
      columnasTotales: n,
      origen: 'tabla_oficial',
      fuente: 'Archivo .qmat',
    },
  }
}

/** Convierte ArrayBuffer a base64 (para storage/transfer) */
export function aBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** Convierte base64 a ArrayBuffer */
export function desdeBase64(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const buf = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return buf
}

// ─── Estadísticas de compresión ───

/** Calcula el tamaño en bytes de una matriz en distintos formatos */
export function estadisticasTamaño(matriz: PackedMatriz): {
  packedBinario: number
  jsonString: number
  factorCompresion: number
} {
  const packed = 13 + matriz.length * 4

  // Simular JSON: cada columna como string de 14 chars + comillas + coma
  const jsonStr = matriz.length * (14 + 3) + 2
  const jsonNum = matriz.length * 14 * 4 + 2 // Como number[][]

  return {
    packedBinario: packed,
    jsonString: jsonStr,
    factorCompresion: jsonStr / packed,
  }
}
