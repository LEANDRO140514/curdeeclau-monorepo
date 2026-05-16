/**
 * TESTS DE LA ARQUITECTURA PACKED
 *
 * Verifican pack/unpack, Hamming distance, validación, cobertura,
 * serialización, loaders y metadata.
 */

import { describe, it, expect } from 'vitest'
import {
  packColumna,
  unpackColumna,
  packMatriz,
  unpackMatriz,
  packDesdePatron,
  hammingDistancia,
  aciertosPacked,
  cumpleGarantiaPacked,
  esPackedValido,
  validarColumnas,
  validarDuplicados,
  validarMetadatos,
  validarCobertura,
  validarMatriz,
  serializarMatriz,
  deserializarMatriz,
  cargarMatrizEmbebida,
  obtenerMatrizCache,
  guardarMatrizCache,
  limpiarCache,
  obtenerMeta,
  porNivel,
  resumenIntegracion,
  SIGNO_A_BITS,
} from '../index'

/* ══════════════════════════════════════════════
   SCHEMA
   ══════════════════════════════════════════════ */

describe('SIGNO_A_BITS', () => {
  it("'1' → 0, 'X' → 1, '2' → 2", () => {
    expect(SIGNO_A_BITS['1']).toBe(0b00)
    expect(SIGNO_A_BITS['X']).toBe(0b01)
    expect(SIGNO_A_BITS['2']).toBe(0b10)
  })
})

/* ══════════════════════════════════════════════
   PACK / UNPACK
   ══════════════════════════════════════════════ */

describe('packColumna / unpackColumna', () => {
  it('roundtrip: columna string → packed → string es idéntica', () => {
    const col = ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X']
    const packed = packColumna(col)
    expect(typeof packed).toBe('number')
    expect(packed).toBeGreaterThan(0)
    const unpacked = unpackColumna(packed)
    expect(unpacked).toEqual(col)
  })

  it('14 signos "1" → packed = 0', () => {
    expect(packColumna(Array(14).fill('1'))).toBe(0)
  })

  it('14 signos "2" → packed > 0 y válido', () => {
    const packed = packColumna(Array(14).fill('2'))
    expect(packed).toBeGreaterThan(0)
    expect(esPackedValido(packed)).toBe(true)
  })

  it('todas las posiciones del roundtrip son correctas', () => {
    for (const signo of ['1', 'X', '2']) {
      const col = Array(14).fill(signo)
      expect(unpackColumna(packColumna(col))).toEqual(col)
    }
  })
})

describe('packMatriz / unpackMatriz', () => {
  it('roundtrip matriz completa', () => {
    const cols = [
      ['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'],
      ['X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2'],
      Array(14).fill('1'),
    ]
    const packed = packMatriz(cols)
    expect(packed).toBeInstanceOf(Uint32Array)
    expect(packed.length).toBe(3)
    const unpacked = unpackMatriz(packed)
    expect(unpacked).toEqual(cols)
  })
})

describe('packDesdePatron', () => {
  it('convierte number[][] a Uint32Array', () => {
    // Patrón Hamming ternario: primera columna = [0,0,0,0]
    const patron = [
      [0, 0, 0, 0],
      [0, 1, 1, 2],
      [0, 2, 2, 1],
    ]
    const packed = packDesdePatron(patron, 0, 0)
    expect(packed).toBeInstanceOf(Uint32Array)
    expect(packed.length).toBe(3)
    // Primera columna: todo 0s → packed = 0
    expect(packed[0]).toBe(0)
  })
})

/* ══════════════════════════════════════════════
   HAMMING DISTANCE (PACKED)
   ══════════════════════════════════════════════ */

describe('hammingDistancia', () => {
  it('columnas idénticas → distancia 0', () => {
    const a = packColumna(Array(14).fill('1'))
    const b = packColumna(Array(14).fill('1'))
    expect(hammingDistancia(a, b)).toBe(0)
  })

  it('columnas opuestas → distancia 14', () => {
    const a = packColumna(Array(14).fill('1'))
    const b = packColumna(Array(14).fill('2'))
    expect(hammingDistancia(a, b)).toBe(14)
  })

  it('difieren en 1 posición → distancia 1', () => {
    const a = packColumna(['X', ...Array(13).fill('1')])
    const b = packColumna(Array(14).fill('1'))
    expect(hammingDistancia(a, b)).toBe(1)
  })

  it('difieren en 7 posiciones → distancia 7', () => {
    const a = packColumna([...Array(7).fill('1'), ...Array(7).fill('X')])
    const b = packColumna([...Array(7).fill('2'), ...Array(7).fill('X')])
    expect(hammingDistancia(a, b)).toBe(7)
  })

  it('es simétrica', () => {
    const a = packColumna(['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'])
    const b = packColumna(['X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2'])
    expect(hammingDistancia(a, b)).toBe(hammingDistancia(b, a))
  })
})

describe('aciertosPacked', () => {
  it('14 aciertos para columnas idénticas', () => {
    const a = packColumna(['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'])
    expect(aciertosPacked(a, a)).toBe(14)
  })

  it('0 aciertos para columnas completamente diferentes', () => {
    const a = packColumna(Array(14).fill('1'))
    const b = packColumna(Array(14).fill('2'))
    expect(aciertosPacked(a, b)).toBe(0)
  })
})

/* ══════════════════════════════════════════════
   VALIDATORS
   ══════════════════════════════════════════════ */

describe('validarColumnas', () => {
  it('matriz válida no tiene errores', () => {
    const col = packColumna(['1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X', '2', '1', 'X'])
    const m = new Uint32Array([col, col + 1])
    const v = validarColumnas(m)
    expect(v.valida).toBe(true)
    expect(v.errores).toHaveLength(0)
  })

  it('detecta bits inválidos (0b11 en alguna posición)', () => {
    // Crear un packed con bit pattern inválido: posición 0 = 0b11
    const invalido = 0b11 // solo posición 0 tiene 0b11
    const m = new Uint32Array([invalido])
    const v = validarColumnas(m)
    expect(v.valida).toBe(false)
    expect(v.stats.valoresInvalidos).toBe(1)
  })
})

describe('validarDuplicados', () => {
  it('matriz sin duplicados → válida', () => {
    const a = packColumna(Array(14).fill('1'))
    const b = packColumna(Array(14).fill('X'))
    const m = new Uint32Array([a, b])
    expect(validarDuplicados(m).valida).toBe(true)
  })

  it('detecta columnas duplicadas', () => {
    const a = packColumna(Array(14).fill('1'))
    const m = new Uint32Array([a, a, a])
    const v = validarDuplicados(m)
    expect(v.valida).toBe(false)
    expect(v.stats.duplicadas).toBe(2)
    expect(v.stats.unicas).toBe(1)
  })
})

describe('validarMetadatos', () => {
  it('metadatos consistentes con la matriz → válido', () => {
    const m = new Uint32Array(9)
    const meta = {
      id: 1, nombre: 'Test', triples: 4, dobles: 0, nivel: 13 as const,
      columnasTotales: 9, origen: 'codigo_perfecto' as const, fuente: 'Test',
    }
    expect(validarMetadatos(m, meta).valida).toBe(true)
  })

  it('discrepancia en columnasTotales → error', () => {
    const m = new Uint32Array(9)
    const meta = {
      id: 1, nombre: 'Test', triples: 4, dobles: 0, nivel: 13 as const,
      columnasTotales: 99, origen: 'codigo_perfecto' as const, fuente: 'Test',
    }
    expect(validarMetadatos(m, meta).valida).toBe(false)
  })
})

/* ══════════════════════════════════════════════
   VALIDACIÓN DE COBERTURA
   ══════════════════════════════════════════════ */

describe('validarCobertura', () => {
  it('Reducción 1 (4T al 13): cobertura exhaustiva válida', () => {
    const carga = cargarMatrizEmbebida(1)
    expect(carga.error).toBeNull()
    expect(carga.matriz).not.toBeNull()

    const v = validarCobertura(carga.matriz!, carga.meta!)
    expect(v.valida).toBe(true)
    expect(v.errores).toHaveLength(0)
  })

  it('Reducción 2 (7D al 13): cobertura exhaustiva válida', () => {
    const carga = cargarMatrizEmbebida(2)
    expect(carga.error).toBeNull()

    const v = validarCobertura(carga.matriz!, carga.meta!)
    expect(v.valida).toBe(true)
  })
})

/* ══════════════════════════════════════════════
   VALIDACIÓN COMPLETA
   ══════════════════════════════════════════════ */

describe('validarMatriz', () => {
  it('Reducción 1 pasa validación completa (sin cobertura)', () => {
    const carga = cargarMatrizEmbebida(1)
    const v = validarMatriz(carga.matriz!, carga.meta!, false)
    expect(v.valida).toBe(true)
  })

  it('Reducción 1 pasa validación completa CON cobertura', () => {
    const carga = cargarMatrizEmbebida(1)
    const v = validarMatriz(carga.matriz!, carga.meta!, true)
    expect(v.valida).toBe(true)
  })
})

/* ══════════════════════════════════════════════
   SERIALIZACIÓN
   ══════════════════════════════════════════════ */

describe('serialización', () => {
  it('roundtrip serializar → deserializar', () => {
    const carga = cargarMatrizEmbebida(1)
    const buf = serializarMatriz(carga.matriz!, carga.meta!)
    expect(buf.byteLength).toBe(16 + 9 * 4) // header alineado + 9 cols

    const deser = deserializarMatriz(buf)
    expect(deser).not.toBeNull()
    expect(deser!.matriz).toEqual(carga.matriz)
    expect(deser!.meta.triples).toBe(4)
    expect(deser!.meta.dobles).toBe(0)
    expect(deser!.meta.columnasTotales).toBe(9)
  })

  it('deserializar buffer inválido → null', () => {
    const buf = new ArrayBuffer(100)
    expect(deserializarMatriz(buf)).toBeNull()
  })
})

/* ══════════════════════════════════════════════
   LOADERS
   ══════════════════════════════════════════════ */

describe('cargarMatrizEmbebida', () => {
  it('carga las 6 matrices integradas', () => {
    for (let id = 1; id <= 6; id++) {
      const carga = cargarMatrizEmbebida(id)
      expect(carga.error).toBeNull()
      expect(carga.matriz).not.toBeNull()
      expect(carga.matriz!.length).toBeGreaterThan(0)
      expect(carga.meta!.origen).not.toBe('pendiente')
    }
  })

  it('matriz pendiente (id 7) retorna error', () => {
    const carga = cargarMatrizEmbebida(7)
    expect(carga.error).not.toBeNull()
    expect(carga.matriz).toBeNull()
  })
})

describe('cache de matrices', () => {
  it('guardar y obtener del cache', () => {
    limpiarCache()
    const m = new Uint32Array([1, 2, 3])
    guardarMatrizCache(99, m)
    expect(obtenerMatrizCache(99)).toBe(m)
    limpiarCache()
    expect(obtenerMatrizCache(99)).toBeUndefined()
  })
})

/* ══════════════════════════════════════════════
   METADATA
   ══════════════════════════════════════════════ */

describe('CATALOGO_METADATA', () => {
  it('12 reducciones en total', () => {
    const r = resumenIntegracion()
    expect(r.total).toBe(12)
    expect(r.integradas).toBe(6)
    expect(r.pendientes).toBe(6)
  })

  it('obtenerMeta(id) retorna la correcta', () => {
    const m = obtenerMeta(1)
    expect(m).toBeDefined()
    expect(m!.triples).toBe(4)
    expect(m!.nivel).toBe(13)
  })

  it('porNivel(13) retorna 6 reducciones', () => {
    expect(porNivel(13)).toHaveLength(6)
  })

  it('porNivel(12) retorna 3 reducciones', () => {
    expect(porNivel(12)).toHaveLength(3)
  })

  it('porNivel(11) retorna 3 reducciones', () => {
    expect(porNivel(11)).toHaveLength(3)
  })
})
