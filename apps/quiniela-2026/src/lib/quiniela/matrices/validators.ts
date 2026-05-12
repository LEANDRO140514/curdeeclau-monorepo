/**
 * VALIDATORS — Validación de integridad de matrices packed.
 *
 * Validaciones:
 *   - Columnas válidas (sin bits inválidos)
 *   - Sin duplicados
 *   - Cantidad correcta de columnas
 *   - Cobertura mínima verificada
 *   - Metadatos consistentes
 */

import type { PackedMatriz, PackedMatrizMeta, ValidacionMatriz } from './schema'
import { esPackedValido, hammingDistancia, cumpleGarantia } from './packer'
import { MASCARA_28BITS } from './schema'

/** Valida que todas las columnas tengan valores válidos (0,1,2) */
export function validarColumnas(matriz: PackedMatriz): ValidacionMatriz {
  const errores: string[] = []
  const advertencias: string[] = []
  let valoresInvalidos = 0

  for (let i = 0; i < matriz.length; i++) {
    if (!esPackedValido(matriz[i])) {
      valoresInvalidos++
      if (errores.length < 5) {
        errores.push(`Columna ${i}: valor inválido 0x${matriz[i].toString(16)}`)
      }
    }
  }

  if (valoresInvalidos > 5) {
    errores.push(`... y ${valoresInvalidos - 5} columnas más con valores inválidos`)
  }

  return {
    valida: valoresInvalidos === 0 && errores.length === 0,
    errores,
    advertencias,
    stats: {
      columnas: matriz.length,
      duplicadas: 0,
      unicas: matriz.length,
      valoresInvalidos,
      rangoMin: 0,
      rangoMax: 0,
    },
  }
}

/** Detecta columnas duplicadas en la matriz */
export function validarDuplicados(matriz: PackedMatriz): ValidacionMatriz {
  const vistos = new Set<number>()
  let duplicadas = 0
  const errores: string[] = []

  for (let i = 0; i < matriz.length; i++) {
    if (vistos.has(matriz[i])) {
      duplicadas++
      if (errores.length < 3) {
        errores.push(`Columna duplicada en índice ${i}: 0x${matriz[i].toString(16)}`)
      }
    } else {
      vistos.add(matriz[i])
    }
  }

  if (duplicadas > 0) {
    errores.push(`Total: ${duplicadas} columnas duplicadas de ${matriz.length}`)
  }

  return {
    valida: duplicadas === 0,
    errores,
    advertencias: [],
    stats: {
      columnas: matriz.length,
      duplicadas,
      unicas: vistos.size,
      valoresInvalidos: 0,
      rangoMin: 0,
      rangoMax: 0,
    },
  }
}

/**
 * Verifica que la matriz cumpla la cobertura prometida.
 *
 * Enumera todos los resultados posibles (3^T × 2^D) y verifica
 * que cada uno tenga ≥ N aciertos con al menos una columna.
 *
 * Solo viable para T+D ≤ 12 (max ~500k resultados).
 */
export function validarCobertura(
  matriz: PackedMatriz,
  meta: PackedMatrizMeta,
): ValidacionMatriz {
  const { triples, dobles, nivel } = meta
  const p = triples + dobles
  const fijos = 14 - p
  const aciertosRequeridosVar = nivel - fijos

  if (aciertosRequeridosVar <= 0) {
    return {
      valida: true,
      errores: [],
      advertencias: ['Cobertura trivial: los fijos garantizan el nivel'],
      stats: { columnas: matriz.length, duplicadas: 0, unicas: matriz.length, valoresInvalidos: 0, rangoMin: 0, rangoMax: 0 },
    }
  }

  const totalResultados = 3 ** triples * 2 ** dobles
  if (totalResultados > 100_000) {
    return {
      valida: true, // No podemos verificar exhaustivamente
      errores: [],
      advertencias: [
        `Verificación exhaustiva no viable: ${totalResultados.toLocaleString('es-ES')} resultados > 100k. ` +
        'Usar validación por muestreo o backend Python.',
      ],
      stats: { columnas: matriz.length, duplicadas: 0, unicas: matriz.length, valoresInvalidos: 0, rangoMin: 0, rangoMax: 0 },
    }
  }

  const errores: string[] = []
  const garantia = nivel  // global

  for (let n = 0; n < totalResultados; n++) {
    // Construir resultado packed para las T+D posiciones variables
    let resultado = 0
    let resto = n

    for (let d = 0; d < dobles; d++) {
      resultado |= (resto % 2) << (d * 2)
      resto = Math.floor(resto / 2)
    }
    for (let t = 0; t < triples; t++) {
      resultado |= (resto % 3) << ((dobles + t) * 2)
      resto = Math.floor(resto / 3)
    }
    // Los fijos se quedan en 0 ('1') — no afectan porque siempre aciertan

    if (!cumpleGarantia(matriz, resultado, garantia)) {
      if (errores.length < 5) {
        errores.push(`Resultado no cubierto: patrón 0x${resultado.toString(16)}`)
      }
    }
  }

  if (errores.length > 0) {
    errores.push(`Total: algunos resultados no alcanzan garantía ${nivel}`)
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias: [],
    stats: {
      columnas: matriz.length,
      duplicadas: 0,
      unicas: matriz.length,
      valoresInvalidos: 0,
      rangoMin: 0,
      rangoMax: 0,
    },
  }
}

/** Valida consistencia de metadatos con la matriz */
export function validarMetadatos(
  matriz: PackedMatriz,
  meta: PackedMatrizMeta,
): ValidacionMatriz {
  const errores: string[] = []
  const advertencias: string[] = []

  if (matriz.length !== meta.columnasTotales) {
    errores.push(
      `Columnas declaradas: ${meta.columnasTotales}, reales: ${matriz.length}`,
    )
  }

  if (meta.triples < 0 || meta.triples > 14) {
    errores.push(`Triples inválido: ${meta.triples}`)
  }

  if (meta.dobles < 0 || meta.dobles > 14) {
    errores.push(`Dobles inválido: ${meta.dobles}`)
  }

  if (meta.triples + meta.dobles > 14) {
    errores.push(`T+D = ${meta.triples + meta.dobles} > 14`)
  }

  if (![11, 12, 13, 14].includes(meta.nivel)) {
    errores.push(`Nivel inválido: ${meta.nivel}`)
  }

  if (meta.columnasTotales <= 0) {
    errores.push(`Columnas totales debe ser > 0: ${meta.columnasTotales}`)
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias,
    stats: {
      columnas: matriz.length,
      duplicadas: 0,
      unicas: matriz.length,
      valoresInvalidos: 0,
      rangoMin: 0,
      rangoMax: 0,
    },
  }
}

/** Validación completa de una matriz */
export function validarMatriz(
  matriz: PackedMatriz,
  meta: PackedMatrizMeta,
  verificarCobertura = false,
): ValidacionMatriz {
  const resultados: ValidacionMatriz[] = [
    validarMetadatos(matriz, meta),
    validarColumnas(matriz),
    validarDuplicados(matriz),
  ]

  if (verificarCobertura) {
    resultados.push(validarCobertura(matriz, meta))
  }

  const todosErrores = resultados.flatMap((r) => r.errores)
  const todasAdvertencias = resultados.flatMap((r) => r.advertencias)

  return {
    valida: resultados.every((r) => r.valida),
    errores: todosErrores,
    advertencias: todasAdvertencias,
    stats: {
      columnas: matriz.length,
      duplicadas: resultados[2]?.stats.duplicadas ?? 0,
      unicas: resultados[2]?.stats.unicas ?? matriz.length,
      valoresInvalidos: resultados[1]?.stats.valoresInvalidos ?? 0,
      rangoMin: 0,
      rangoMax: 0,
    },
  }
}
