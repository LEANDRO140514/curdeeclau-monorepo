/**
 * TESTS MATEMÁTICOS DEL MOTOR DE QUINIELA
 *
 * Verifican la corrección de la expansión combinatoria,
 * conteo de signos, validación y cobertura.
 *
 * Ejecutar: npx vitest run
 */

import { describe, it, expect } from 'vitest'
import {
  validarConfig,
  contarSignos,
  TOTAL_PARTIDOS,
  PRECIO_POR_COLUMNA,
  TOTAL_COLUMNAS_UNIVERSO,
} from '../engine/validate'

import {
  calcularPresupuestoDirecto,
  esViable,
} from '../engine/pricing'

import {
  generarDirecta,
  generarPorLotes,
} from '../engine/direct'

import {
  CATALOGO_REDUCCIONES,
  esCompatible,
  reduccionesCompatibles,
  calcularAhorroReduccion,
  estadoMotor,
  obtenerColumnasReduccion,
} from '../engine/reductions'

import {
  aciertosColumna,
  aciertosPorColumna,
  cumpleGarantia,
  configCubreResultado,
} from '../algorithms/coverage'
import type { ResultadoReal } from '../algorithms/coverage'

import type { ConfigUsuario, Columna } from '../types'
import { matricesIntegradas, matricesPendientes } from '../matrices/oficiales'

/* ══════════════════════════════════════════════
   VALIDACIÓN Y CONTEO
   ══════════════════════════════════════════════ */

describe('validarConfig', () => {
  it('acepta configuración válida de 14 fijos', () => {
    const config: ConfigUsuario = Array(14).fill('1')
    expect(() => validarConfig(config)).not.toThrow()
  })

  it('rechaza config con menos de 14 elementos', () => {
    const config: ConfigUsuario = Array(13).fill('1')
    expect(() => validarConfig(config)).toThrow(/13/)
  })

  it('rechaza config con signo inválido', () => {
    const config: ConfigUsuario = [...Array(13).fill('1'), 'INVALIDO' as any]
    expect(() => validarConfig(config)).toThrow(/INVALIDO/)
  })

  it('acepta config con triples y dobles', () => {
    const config: ConfigUsuario = ['1X2', '1X', '12', 'X2', ...Array(10).fill('1')]
    expect(() => validarConfig(config)).not.toThrow()
  })
})

describe('contarSignos', () => {
  it('14 fijos → 0 triples, 0 dobles, 14 fijos', () => {
    const config: ConfigUsuario = Array(14).fill('1')
    expect(contarSignos(config)).toEqual({ triples: 0, dobles: 0, fijos: 14 })
  })

  it('4 triples → 4 triples, 0 dobles, 10 fijos', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    expect(contarSignos(config)).toEqual({ triples: 4, dobles: 0, fijos: 10 })
  })

  it('7 dobles → 0 triples, 7 dobles, 7 fijos', () => {
    const config: ConfigUsuario = ['1X', '12', 'X2', '1X', '12', 'X2', '1X', ...Array(7).fill('1')]
    expect(contarSignos(config)).toEqual({ triples: 0, dobles: 7, fijos: 7 })
  })

  it('3 triples + 3 dobles', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X', '12', 'X2', ...Array(8).fill('1')]
    const c = contarSignos(config)
    expect(c.triples).toBe(3)
    expect(c.dobles).toBe(3)
    expect(c.fijos).toBe(8)
  })
})

/* ══════════════════════════════════════════════
   PRESUPUESTO Y VIABILIDAD
   ══════════════════════════════════════════════ */

describe('calcularPresupuestoDirecto', () => {
  it('config todo fijos: 1 columna, 0.75€', () => {
    const config: ConfigUsuario = Array(14).fill('1')
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(1)
    expect(p.costo).toBe(PRECIO_POR_COLUMNA)
  })

  it('1 doble: 2 columnas, 1.50€', () => {
    const config: ConfigUsuario = ['1X', ...Array(13).fill('1')]
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(2)
    expect(p.costo).toBe(2 * PRECIO_POR_COLUMNA)
  })

  it('2 dobles: 4 columnas, 3.00€', () => {
    const config: ConfigUsuario = ['1X', '12', ...Array(12).fill('1')]
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(4)
    expect(p.costo).toBe(4 * PRECIO_POR_COLUMNA)
  })

  it('1 triple: 3 columnas, 2.25€', () => {
    const config: ConfigUsuario = ['1X2', ...Array(13).fill('1')]
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(3)
    expect(p.costo).toBe(3 * PRECIO_POR_COLUMNA)
  })

  it('2 triples: 9 columnas, 6.75€', () => {
    const config: ConfigUsuario = ['1X2', '1X2', ...Array(12).fill('1')]
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(9)
    expect(p.costo).toBe(9 * PRECIO_POR_COLUMNA)
  })

  it('1 triple + 1 doble: 6 columnas, 4.50€', () => {
    const config: ConfigUsuario = ['1X2', '1X', ...Array(12).fill('1')]
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(6)
    expect(p.costo).toBe(6 * PRECIO_POR_COLUMNA)
  })

  it('3 triples + 3 dobles: 216 columnas', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X', '12', 'X2', ...Array(8).fill('1')]
    const p = calcularPresupuestoDirecto(config)
    expect(p.columnas).toBe(216) // 27 * 8
  })
})

describe('esViable', () => {
  it('4 triples es viable con presupuesto 500', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    const v = esViable(config, 500)
    expect(v.viable).toBe(true)
    expect(v.columnas).toBe(81) // 3^4
    expect(v.costo).toBe(81 * 0.75)
  })

  it('14 triples NO es viable con presupuesto 500', () => {
    const config: ConfigUsuario = Array(14).fill('1X2')
    const v = esViable(config, 500)
    expect(v.viable).toBe(false)
    expect(v.columnas).toBe(TOTAL_COLUMNAS_UNIVERSO)
  })
})

/* ══════════════════════════════════════════════
   GENERACIÓN DIRECTA
   ══════════════════════════════════════════════ */

describe('generarDirecta', () => {
  it('config todo fijos genera 1 columna idéntica a la config', () => {
    const config: ConfigUsuario = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
    const res = generarDirecta(config)
    expect(res.columnasTotales).toBe(1)
    expect(res.costoTotal).toBe(PRECIO_POR_COLUMNA)
    expect(res.columnas.length).toBe(1)
    expect(res.columnas[0]).toEqual(['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'])
  })

  it('1 doble genera 2 columnas', () => {
    const config: ConfigUsuario = ['1X', ...Array(13).fill('1')]
    const res = generarDirecta(config)
    expect(res.columnasTotales).toBe(2)
    expect(res.columnas.length).toBe(2)
    // Primera columna: signo '1' del doble
    expect(res.columnas[0][0]).toBe('1')
    // Segunda columna: signo 'X' del doble
    expect(res.columnas[1][0]).toBe('X')
    // Los fijos se mantienen
    for (let i = 1; i < 14; i++) {
      expect(res.columnas[0][i]).toBe('1')
      expect(res.columnas[1][i]).toBe('1')
    }
  })

  it('1 triple genera 3 columnas', () => {
    const config: ConfigUsuario = ['1X2', ...Array(13).fill('1')]
    const res = generarDirecta(config)
    expect(res.columnasTotales).toBe(3)
    expect(res.columnas.length).toBe(3)
    expect(res.columnas[0][0]).toBe('1')
    expect(res.columnas[1][0]).toBe('X')
    expect(res.columnas[2][0]).toBe('2')
  })

  it('2 dobles genera 4 columnas con todas las combinaciones', () => {
    const config: ConfigUsuario = ['1X', '12', ...Array(12).fill('1')]
    const res = generarDirecta(config)
    expect(res.columnasTotales).toBe(4)
    expect(res.columnas.length).toBe(4)
    // Verificar que hay 4 combinaciones únicas
    const pares = res.columnas.map((c) => c[0] + c[1])
    expect(new Set(pares).size).toBe(4)
    expect(pares.sort()).toEqual(['11', '12', 'X1', 'X2'])
  })

  it('3 triples genera 27 columnas', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', ...Array(11).fill('1')]
    const res = generarDirecta(config)
    expect(res.columnasTotales).toBe(27)
    expect(res.columnas.length).toBe(27)
  })

  it('todas las columnas generadas son únicas', () => {
    const config: ConfigUsuario = ['1X2', '1X', '12', ...Array(11).fill('1')]
    const res = generarDirecta(config)
    const serializadas = res.columnas.map((c) => c.join(''))
    expect(new Set(serializadas).size).toBe(res.columnas.length)
  })

  it('lanza error si se excede el límite de columnas', () => {
    // 12 triples = 3^12 = 531,441 > 50,000
    const config: ConfigUsuario = [...Array(12).fill('1X2'), '1', '1']
    expect(() => generarDirecta(config)).toThrow(/Demasiadas columnas/)
  })
})

/* ══════════════════════════════════════════════
   GENERACIÓN POR LOTES
   ══════════════════════════════════════════════ */

describe('generarPorLotes', () => {
  it('genera todas las columnas en lotes', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X', ...Array(11).fill('1')]
    // 3*3*2 = 18 columnas
    const todas: Columna[] = []
    for (const lote of generarPorLotes(config, 5)) {
      todas.push(...lote)
    }
    expect(todas.length).toBe(18)
    const serializadas = todas.map((c) => c.join(''))
    expect(new Set(serializadas).size).toBe(18)
  })

  it('funciona con lotes más grandes que el total', () => {
    const config: ConfigUsuario = ['1X', ...Array(13).fill('1')]
    const lotes = [...generarPorLotes(config, 100)]
    expect(lotes.length).toBe(1)
    expect(lotes[0].length).toBe(2)
  })
})

/* ══════════════════════════════════════════════
   REDUCCIONES
   ══════════════════════════════════════════════ */

describe('CATALOGO_REDUCCIONES', () => {
  it('tiene 12 reducciones', () => {
    expect(CATALOGO_REDUCCIONES.length).toBe(12)
  })

  it('Reducción 1 requiere 4 triples y 0 dobles', () => {
    const r1 = CATALOGO_REDUCCIONES[0]
    expect(r1.triples).toBe(4)
    expect(r1.dobles).toBe(0)
    expect(r1.columnasRequeridas).toBe(9)
  })

  it('todas las reducciones tienen datos consistentes', () => {
    for (const r of CATALOGO_REDUCCIONES) {
      expect(r.id).toBeGreaterThan(0)
      expect(r.nombre.length).toBeGreaterThan(0)
      expect(r.columnasRequeridas).toBeGreaterThan(0)
      expect(r.nivel).toBeGreaterThanOrEqual(11)
      expect(r.nivel).toBeLessThanOrEqual(13)
    }
  })
})

describe('esCompatible', () => {
  it('config con 4 triples es compatible con Reducción 1', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    const r1 = CATALOGO_REDUCCIONES[0] // 4T
    expect(esCompatible(config, r1)).toBe(true)
  })

  it('config con 3 triples NO es compatible con Reducción 1', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', ...Array(11).fill('1')]
    const r1 = CATALOGO_REDUCCIONES[0] // necesita 4T
    expect(esCompatible(config, r1)).toBe(false)
  })

  it('config con más triples de los necesarios SÍ es compatible', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', '1X2', ...Array(9).fill('1')]
    const r1 = CATALOGO_REDUCCIONES[0] // necesita 4T
    expect(esCompatible(config, r1)).toBe(true)
  })
})

describe('calcularAhorroReduccion', () => {
  it('4 triples directo (81 col) vs reducción (9 col) → 88.9% ahorro', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    const ahorro = calcularAhorroReduccion(config, 9)
    expect(ahorro).toBeCloseTo(1 - 9 / 81, 4)
  })

  it('ahorro de 0 columnas es 1 (100%)', () => {
    const config: ConfigUsuario = Array(14).fill('1')
    expect(calcularAhorroReduccion(config, 0)).toBe(1)
  })
})

describe('estadoMotor', () => {
  it('reporta matrices_parciales (6 integradas de 12)', () => {
    expect(estadoMotor()).toBe('matrices_parciales')
  })
})

/* ══════════════════════════════════════════════
   MATRICES
   ══════════════════════════════════════════════ */

describe('matrices', () => {
  it('6 matrices integradas, 6 pendientes', () => {
    expect(matricesIntegradas()).toBe(6)
    expect(matricesPendientes()).toBe(6)
  })
})

/* ══════════════════════════════════════════════
   REDUCCIONES CON MATRICES REALES
   ══════════════════════════════════════════════ */

describe('obtenerColumnasReduccion', () => {
  it('Reducción 1 (4T al 13): 4 triples generan 9 columnas', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    const result = obtenerColumnasReduccion(config, 1)
    expect(result.disponible).toBe(true)
    expect(result.columnas).not.toBeNull()
    expect(result.columnas!.length).toBe(9)
    expect(result.origen).toBe('codigo_perfecto')
    for (const col of result.columnas!) {
      expect(col.length).toBe(14)
      for (const s of col) {
        expect(['1', 'X', '2']).toContain(s)
      }
    }
  })

  it('Reducción 1: las 9 columnas son únicas', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    const result = obtenerColumnasReduccion(config, 1)
    const serializadas = result.columnas!.map((c) => c.join(''))
    expect(new Set(serializadas).size).toBe(9)
  })

  it('Reducción 2 (7D al 13): 7 dobles generan 16 columnas', () => {
    const config: ConfigUsuario = ['1X', '12', 'X2', '1X', '12', 'X2', '1X', ...Array(7).fill('1')]
    const result = obtenerColumnasReduccion(config, 2)
    expect(result.disponible).toBe(true)
    expect(result.columnas!.length).toBe(16)
  })

  it('Reducción 1 con más triples de los necesarios: usa solo los primeros 4', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', '1X2', ...Array(9).fill('1')]
    const result = obtenerColumnasReduccion(config, 1)
    expect(result.disponible).toBe(true)
    expect(result.columnas!.length).toBe(9)
    expect(result.columnas![0][4]).toBe('1')
  })

  it('Matriz pendiente (id 7) retorna no disponible', () => {
    const config: ConfigUsuario = [...Array(5).fill('1X2'), ...Array(4).fill('1X'), ...Array(5).fill('1')]
    const result = obtenerColumnasReduccion(config, 7)
    expect(result.disponible).toBe(false)
    expect(result.columnas).toBeNull()
    expect(result.razon).toBeTruthy()
  })

  it('Coverage: Reducción 1 cumple garantía 13 para todos los resultados posibles', () => {
    const config: ConfigUsuario = ['1X2', '1X2', '1X2', '1X2', ...Array(10).fill('1')]
    const result = obtenerColumnasReduccion(config, 1)
    const columnas = result.columnas!

    const signos = ['1', 'X', '2'] as const
    let todasCumplen = true
    for (let n = 0; n < 81; n++) {
      const resultado: ResultadoReal = [
        signos[Math.floor(n / 27) % 3],
        signos[Math.floor(n / 9) % 3],
        signos[Math.floor(n / 3) % 3],
        signos[n % 3],
        ...Array(10).fill('1'),
      ] as ResultadoReal

      if (!cumpleGarantia(columnas, resultado, 13)) {
        todasCumplen = false
        break
      }
    }
    expect(todasCumplen).toBe(true)
  })

  it('Coverage: Reducción 2 cumple garantía 13 para los 128 resultados de 7 dobles', () => {
    // Dobles definidos: opción 0 | opción 1
    const doblesDef: [string, string][] = [
      ['1', 'X'], ['1', '2'], ['X', '2'], ['1', 'X'], ['1', '2'], ['X', '2'], ['1', 'X'],
    ]
    const config: ConfigUsuario = [...doblesDef.map((d) => d.join('') as ConfigUsuario[number]), ...Array(7).fill('1')]
    const result = obtenerColumnasReduccion(config, 2)
    const columnas = result.columnas!

    let todasCumplen = true
    // Enumerar las 128 combinaciones de opciones (0=A, 1=B) para cada doble
    for (let n = 0; n < 128; n++) {
      const resultado: ResultadoReal = [
        doblesDef[0][(n >> 6) & 1],
        doblesDef[1][(n >> 5) & 1],
        doblesDef[2][(n >> 4) & 1],
        doblesDef[3][(n >> 3) & 1],
        doblesDef[4][(n >> 2) & 1],
        doblesDef[5][(n >> 1) & 1],
        doblesDef[6][n & 1],
        ...Array(7).fill('1'),
      ] as ResultadoReal

      if (!cumpleGarantia(columnas, resultado, 13)) {
        todasCumplen = false
        break
      }
    }
    expect(todasCumplen).toBe(true)
  })
})

/* ══════════════════════════════════════════════
   COBERTURA
   ══════════════════════════════════════════════ */

describe('aciertosColumna', () => {
  it('columna idéntica al resultado → 14 aciertos', () => {
    const col: Columna = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
    const res: ResultadoReal = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
    expect(aciertosColumna(col, res)).toBe(14)
  })

  it('columna completamente diferente → 0 aciertos', () => {
    const col: Columna = Array(14).fill('1') as Columna
    const res: ResultadoReal = Array(14).fill('2') as ResultadoReal
    expect(aciertosColumna(col, res)).toBe(0)
  })

  it('mitad de aciertos → 7', () => {
    const col: Columna = [...Array(7).fill('1'), ...Array(7).fill('X')] as Columna
    const res: ResultadoReal = [...Array(7).fill('1'), ...Array(7).fill('2')] as ResultadoReal
    expect(aciertosColumna(col, res)).toBe(7)
  })
})

describe('aciertosPorColumna', () => {
  it('retorna array con el mismo número de elementos', () => {
    const columnas: Columna[] = [
      Array(14).fill('1') as Columna,
      Array(14).fill('X') as Columna,
    ]
    const res: ResultadoReal = Array(14).fill('1') as ResultadoReal
    const aciertos = aciertosPorColumna(columnas, res)
    expect(aciertos).toEqual([14, 0])
  })
})

describe('cumpleGarantia', () => {
  it('garantía 13: cumple si una columna tiene 13 aciertos', () => {
    const columnas: Columna[] = [
      Array(14).fill('1') as Columna,      // 14 aciertos
      Array(14).fill('X') as Columna,      // 0 aciertos
    ]
    const res: ResultadoReal = Array(14).fill('1') as ResultadoReal
    expect(cumpleGarantia(columnas, res, 13)).toBe(true)
  })

  it('garantía 13: no cumple si el máximo es 12', () => {
    const columnas: Columna[] = [
      [...Array(12).fill('1'), 'X', 'X'] as Columna,  // 12 aciertos
      Array(14).fill('X') as Columna,                  // 0 aciertos
    ]
    const res: ResultadoReal = Array(14).fill('1') as ResultadoReal
    expect(cumpleGarantia(columnas, res, 13)).toBe(false)
  })
})

describe('configCubreResultado', () => {
  it('config "1X" cubre resultado "1"', () => {
    const config: ConfigUsuario = ['1X', ...Array(13).fill('1')]
    const res: ResultadoReal = Array(14).fill('1') as ResultadoReal
    expect(configCubreResultado(config, res)).toBe(true)
  })

  it('config "1X" cubre resultado "X"', () => {
    const config: ConfigUsuario = ['1X', ...Array(13).fill('1')]
    const res: ResultadoReal = ['X', ...Array(13).fill('1')] as ResultadoReal
    expect(configCubreResultado(config, res)).toBe(true)
  })

  it('config "1X" NO cubre resultado "2"', () => {
    const config: ConfigUsuario = ['1X', ...Array(13).fill('1')]
    const res: ResultadoReal = ['2', ...Array(13).fill('1')] as ResultadoReal
    expect(configCubreResultado(config, res)).toBe(false)
  })

  it('config "1X2" cubre 1, X, y 2', () => {
    const config: ConfigUsuario = ['1X2', ...Array(13).fill('1')]
    expect(configCubreResultado(config, Array(14).fill('1') as ResultadoReal)).toBe(true)
    expect(configCubreResultado(config, ['X', ...Array(13).fill('1')] as ResultadoReal)).toBe(true)
    expect(configCubreResultado(config, ['2', ...Array(13).fill('1')] as ResultadoReal)).toBe(true)
  })
})
