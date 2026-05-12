/**
 * BENCHMARK — Medición de rendimiento del packed format vs string.
 *
 * Ejecutar: npx vitest run src/lib/quiniela/tests/benchmark.test.ts
 */

import { describe, it } from 'vitest'
import {
  packColumna,
  unpackColumna,
  hammingDistancia as hammingPacked,
  cumpleGarantiaPacked,
  cargarMatrizEmbebida,
  serializarMatriz,
} from '../index'

// String-based implementations for comparison
function hammingString(a: string[], b: string[]): number {
  let d = 0
  for (let i = 0; i < 14; i++) if (a[i] !== b[i]) d++
  return d
}

function cumpleGarantiaString(cols: string[][], res: string[], g: number): boolean {
  for (const c of cols) {
    let a = 0
    for (let i = 0; i < 14; i++) if (c[i] === res[i]) a++
    if (a >= g) return true
  }
  return false
}

describe('Matrix Engine Benchmark', () => {
  it('Pack/Unpack roundtrip', () => {
    const col = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
    const ITER = 50_000

    const t0 = performance.now()
    for (let i = 0; i < ITER; i++) {
      const p = packColumna(col)
      unpackColumna(p)
    }
    const t1 = performance.now()
    const totalOps = ITER * 2
    const ms = t1 - t0
    console.log(`  Pack+Unpack: ${ms.toFixed(1)}ms for ${totalOps.toLocaleString()} ops = ${Math.round(totalOps / (ms / 1000)).toLocaleString()} ops/s`)
  })

  it('Hamming: packed vs string', () => {
    const a = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
    const b = ['X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2']
    const pa = packColumna(a)
    const pb = packColumna(b)
    const ITER = 200_000

    const t0 = performance.now()
    for (let i = 0; i < ITER; i++) hammingString(a, b)
    const t1 = performance.now()
    const msStr = t1 - t0
    console.log(`  Hamming (string): ${msStr.toFixed(1)}ms = ${Math.round(ITER / (msStr / 1000)).toLocaleString()} ops/s`)

    const t2 = performance.now()
    for (let i = 0; i < ITER; i++) hammingPacked(pa, pb)
    const t3 = performance.now()
    const msPkd = t3 - t2
    const speedup = msStr / msPkd
    console.log(`  Hamming (packed): ${msPkd.toFixed(1)}ms = ${Math.round(ITER / (msPkd / 1000)).toLocaleString()} ops/s`)
    console.log(`  Speedup: ${speedup.toFixed(1)}x`)
  })

  it('Coverage verification: packed vs string', () => {
    const carga = cargarMatrizEmbebida(1) // 4 triples, 9 columnas
    const m = carga.matriz!
    const cols = m.length
    const RESULTADOS = 3 ** 4 // 81 resultados

    // Reconstruir string columns
    const colsStr: string[][] = []
    for (let i = 0; i < m.length; i++) {
      const s: string[] = []
      for (let j = 0; j < 14; j++) {
        s.push(['1', 'X', '2'][(m[i] >> (j * 2)) & 0b11])
      }
      colsStr.push(s)
    }

    const runs = 10

    // String coverage
    const t0 = performance.now()
    for (let run = 0; run < runs; run++) {
      for (let n = 0; n < RESULTADOS; n++) {
        const r: string[] = [
          ['1', 'X', '2'][Math.floor(n / 27) % 3],
          ['1', 'X', '2'][Math.floor(n / 9) % 3],
          ['1', 'X', '2'][Math.floor(n / 3) % 3],
          ['1', 'X', '2'][n % 3],
          ...Array(10).fill('1'),
        ]
        cumpleGarantiaString(colsStr, r, 13)
      }
    }
    const t1 = performance.now()
    const msStr = t1 - t0
    console.log(`  Cobertura 81 res × ${cols} cols × ${runs} runs (string): ${msStr.toFixed(1)}ms`)

    // Packed coverage
    const t2 = performance.now()
    for (let run = 0; run < runs; run++) {
      for (let n = 0; n < RESULTADOS; n++) {
        let r = 0
        r |= (n % 3) << 0
        r |= (Math.floor(n / 3) % 3) << 2
        r |= (Math.floor(n / 9) % 3) << 4
        r |= (Math.floor(n / 27) % 3) << 6
        cumpleGarantiaPacked(m, r, 13)
      }
    }
    const t3 = performance.now()
    const msPkd = t3 - t2
    const speedup = msStr / msPkd
    console.log(`  Cobertura 81 res × ${cols} cols × ${runs} runs (packed): ${msPkd.toFixed(1)}ms`)
    console.log(`  Speedup: ${speedup.toFixed(1)}x`)
  })

  it('Memory comparison', () => {
    const carga = cargarMatrizEmbebida(6) // 132 columnas
    const m = carga.matriz!

    // Packed memory
    const packedBytes = m.byteLength

    // String memory (estimate)
    let stringBytes = 0
    for (let i = 0; i < m.length; i++) {
      // Each string: ~32B object overhead + 2B per char + 14 chars + 14 pointers
      stringBytes += 32 + 14 * 2 + 14 * 8 // ~180B per column
    }

    console.log(`  Matriz 6 (11 Dobles, ${m.length} columnas):`)
    console.log(`    Packed (Uint32Array): ${packedBytes} bytes (${(packedBytes / 1024).toFixed(1)} KB)`)
    console.log(`    String[] (estimado): ~${stringBytes.toLocaleString()} bytes (~${(stringBytes / 1024).toFixed(0)} KB)`)
    console.log(`    Factor compresión: ${(stringBytes / packedBytes).toFixed(0)}x`)
  })

  it('Serialization size', () => {
    const carga = cargarMatrizEmbebida(6)
    const buf = serializarMatriz(carga.matriz!, carga.meta!)

    // JSON equivalent
    const jsonStr = JSON.stringify(Array.from(carga.matriz!))
    const jsonBytes = new TextEncoder().encode(jsonStr).length

    console.log(`  Matriz 6 serializada:`)
    console.log(`    .qmat binario: ${buf.byteLength} bytes`)
    console.log(`    JSON number[]: ${jsonBytes.toLocaleString()} bytes`)
    console.log(`    Factor: ${(jsonBytes / buf.byteLength).toFixed(1)}x`)
  })
})
