/**
 * BENCHMARK — Medición de rendimiento del motor de matrices.
 *
 * Mide:
 *   - Tiempo de pack/unpack
 *   - Velocidad de Hamming distance (string vs packed)
 *   - Velocidad de cobertura (string vs packed)
 *   - Memoria usada
 *
 * Ejecutar: npx vitest run src/lib/quiniela/matrices/benchmark.test.ts
 */

import type { PackedMatriz, BenchmarkResultado } from './schema'
import { packColumna, unpackColumna, hammingDistancia, aciertos, cumpleGarantia } from './packer'
import { packDesdePatron } from './packer'
import { cargarMatrizEmbebida } from './loaders'

// ─── Columnas string de referencia ───

function hammingString(a: string[], b: string[]): number {
  let d = 0
  for (let i = 0; i < 14; i++) if (a[i] !== b[i]) d++
  return d
}

function cumpleGarantiaString(columnas: string[][], resultado: string[], garantia: number): boolean {
  for (const col of columnas) {
    let a = 0
    for (let i = 0; i < 14; i++) if (col[i] === resultado[i]) a++
    if (a >= garantia) return true
  }
  return false
}

// ─── Benchmark runners ───

/** Mide tiempo de ejecución de una función */
function medir(fn: () => void, iteraciones: number): number {
  const inicio = performance.now()
  for (let i = 0; i < iteraciones; i++) fn()
  return performance.now() - inicio
}

/** Estima memoria de un objeto */
function estimarMemoria(obj: unknown): number {
  // Estimación grupal basada en tipos
  if (obj instanceof Uint32Array) return obj.byteLength
  if (obj instanceof Uint8Array) return obj.byteLength
  if (Array.isArray(obj)) {
    let total = 56 // Array overhead
    for (const item of obj) {
      if (typeof item === 'string') total += 32 + item.length * 2
      else if (Array.isArray(item)) total += estimarMemoria(item)
      else total += 8
    }
    return total
  }
  return 64 // Objeto genérico
}

// ─── Benchmark principal ───

export interface ResultadosBenchmark {
  packUnpack: BenchmarkResultado
  hamming: BenchmarkResultado
  cobertura: BenchmarkResultado
  memoria: BenchmarkResultado
}

export function ejecutarBenchmark(): ResultadosBenchmark {
  const carga = cargarMatrizEmbebida(1) // 4 triples, 9 columnas
  if (!carga.matriz) throw new Error('No se pudo cargar matriz para benchmark')

  const matrizPacked = carga.matriz
  const columnasString = carga.meta ? [] : []
  // Reconstruir string columns para comparación
  const colsStr: string[][] = []
  for (let i = 0; i < matrizPacked.length; i++) {
    colsStr.push(unpackColumna(matrizPacked[i]))
  }

  const resultadoStr = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
  const resultadoPacked = packColumna(resultadoStr)
  const ITER = 100_000

  // 1. Pack/Unpack
  const tiempoPack = medir(() => packColumna(resultadoStr), ITER)
  const tiempoUnpack = medir(() => unpackColumna(resultadoPacked), ITER)
  const packUnpack: BenchmarkResultado = {
    nombre: 'Pack+Unpack',
    columnas: 1,
    operaciones: ITER * 2,
    tiempoMs: tiempoPack + tiempoUnpack,
    opsPorSegundo: Math.round((ITER * 2) / ((tiempoPack + tiempoUnpack) / 1000)),
    memoriaBytes: 4,
  }

  // 2. Hamming distance
  const tiempoHammingStr = medir(() => hammingString(colsStr[0], resultadoStr), ITER)
  const tiempoHammingPacked = medir(() => hammingDistancia(matrizPacked[0], resultadoPacked), ITER)

  const hamming: BenchmarkResultado = {
    nombre: 'Hamming Distance',
    columnas: matrizPacked.length,
    operaciones: ITER,
    tiempoMs: tiempoHammingPacked,
    opsPorSegundo: Math.round(ITER / (tiempoHammingPacked / 1000)),
    memoriaBytes: 0,
  }

  // 3. Cobertura (todos los resultados)
  const totalResultados = 81 // 3^4
  const tiempoCobStr = medir(() => {
    for (let n = 0; n < totalResultados; n++) {
      const r: string[] = [
        (['1', 'X', '2'] as const)[Math.floor(n / 27) % 3],
        (['1', 'X', '2'] as const)[Math.floor(n / 9) % 3],
        (['1', 'X', '2'] as const)[Math.floor(n / 3) % 3],
        (['1', 'X', '2'] as const)[n % 3],
        ...Array(10).fill('1'),
      ]
      cumpleGarantiaString(colsStr, r, 13)
    }
  }, 50)

  const tiempoCobPacked = medir(() => {
    for (let n = 0; n < totalResultados; n++) {
      let r = 0
      r |= (n % 3) << 0
      r |= (Math.floor(n / 3) % 3) << 2
      r |= (Math.floor(n / 9) % 3) << 4
      r |= (Math.floor(n / 27) % 3) << 6
      cumpleGarantia(matrizPacked, r, 13)
    }
  }, 50)

  const cobertura: BenchmarkResultado = {
    nombre: 'Cobertura (81 resultados)',
    columnas: matrizPacked.length,
    operaciones: totalResultados * 50,
    tiempoMs: tiempoCobPacked,
    opsPorSegundo: Math.round((totalResultados * 50) / (tiempoCobPacked / 1000)),
    memoriaBytes: 0,
  }

  // 4. Memoria
  const memStr = estimarMemoria(colsStr)
  const memPacked = matrizPacked.byteLength
  const memoria: BenchmarkResultado = {
    nombre: 'Memoria',
    columnas: matrizPacked.length,
    operaciones: 1,
    tiempoMs: 0,
    opsPorSegundo: 0,
    memoriaBytes: memPacked,
  }

  return { packUnpack, hamming, cobertura, memoria }
}

/** Imprime resultados de benchmark en consola */
export function imprimirBenchmark(r: ResultadosBenchmark): string {
  const lines: string[] = []
  lines.push('═'.repeat(60))
  lines.push('  MATRIX ENGINE BENCHMARK')
  lines.push('═'.repeat(60))

  for (const [key, b] of Object.entries(r)) {
    lines.push(`  ${b.nombre}:`)
    if (b.tiempoMs > 0) {
      lines.push(`    Tiempo: ${b.tiempoMs.toFixed(2)} ms (${b.operaciones.toLocaleString('es-ES')} ops)`)
      lines.push(`    Velocidad: ${b.opsPorSegundo.toLocaleString('es-ES')} ops/s`)
    }
    lines.push(`    Memoria: ${(b.memoriaBytes / 1024).toFixed(2)} KB`)
    lines.push('')
  }

  return lines.join('\n')
}
