/**
 * ANÁLISIS DE COBERTURA
 *
 * Dado un conjunto de columnas generadas y un resultado real,
 * calcula cuántos aciertos tiene cada columna.
 *
 * Útil para:
 * - Validar que una reducción cumple su garantía
 * - Comparar estrategias de cobertura
 * - Auditar matrices de reducción
 */

import type { Columna, ConfigUsuario } from '../types'

/** Resultado real de los 14 partidos (signos fijos) */
export type ResultadoReal = ['1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2']

/**
 * Calcula el número de aciertos de una columna contra un resultado real.
 * Un acierto = signo coincide exactamente.
 * Los dobles/triples en la columna NO se consideran — la columna ya debe
 * ser una apuesta concreta (signos fijos).
 */
export function aciertosColumna(columna: Columna, resultado: ResultadoReal): number {
  let aciertos = 0
  for (let i = 0; i < 14; i++) {
    if (columna[i] === resultado[i]) aciertos++
  }
  return aciertos
}

/**
 * Calcula los aciertos de todas las columnas contra un resultado.
 * Retorna un array con el número de aciertos de cada columna.
 */
export function aciertosPorColumna(columnas: Columna[], resultado: ResultadoReal): number[] {
  return columnas.map((col) => aciertosColumna(col, resultado))
}

/**
 * Verifica si un conjunto de columnas cumple una garantía mínima.
 * Retorna true si AL MENOS una columna tiene >= N aciertos.
 */
export function cumpleGarantia(columnas: Columna[], resultado: ResultadoReal, garantia: number): boolean {
  return aciertosPorColumna(columnas, resultado).some((a) => a >= garantia)
}

/**
 * Dada una configuración de usuario y un resultado real,
 * calcula si la configuración "cubre" el resultado.
 * Una config cubre un resultado si, para cada partido, el signo
 * resultado está dentro de las opciones de la config.
 *
 * Ejemplo: config '1X' cubre resultado '1' y 'X', pero no '2'.
 */
export function configCubreResultado(config: ConfigUsuario, resultado: ResultadoReal): boolean {
  for (let i = 0; i < 14; i++) {
    if (!config[i].includes(resultado[i])) return false
  }
  return true
}

/**
 * Para una config y un resultado, calcula el % de cobertura:
 * cuántas de TODAS las combinaciones posibles de la config
 * tendrían al menos N aciertos.
 *
 * Esto requiere expandir todas las columnas (costoso).
 * Usar solo para conjuntos pequeños (T+D < 8).
 */
export function tasaCobertura(
  columnas: Columna[],
  resultadosMuestrales: ResultadoReal[],
  garantia: number,
): { tasa: number; cumplen: number; total: number } {
  let cumplen = 0
  for (const res of resultadosMuestrales) {
    if (cumpleGarantia(columnas, res, garantia)) cumplen++
  }
  return {
    tasa: resultadosMuestrales.length > 0 ? cumplen / resultadosMuestrales.length : 0,
    cumplen,
    total: resultadosMuestrales.length,
  }
}
