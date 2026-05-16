/**
 * VALIDACIÓN DE CONFIGURACIONES
 * Garantiza que los datos de entrada al motor sean correctos.
 */

import type { ConfigUsuario, ConteoSignos } from '../types'

/** Constantes del sistema */
export const TOTAL_PARTIDOS = 14
/** Precio por columna en MXN (Progol — Lotería Nacional de México). */
export const PRECIO_POR_COLUMNA = 15
export const TOTAL_COLUMNAS_UNIVERSO = 3 ** 14 // 4,782,969

/** Verifica que la configuración tenga exactamente 14 elementos */
export function validarConfig(config: ConfigUsuario): asserts config is ConfigUsuario {
  if (config.length !== TOTAL_PARTIDOS) {
    throw new Error(`Config inválida: ${config.length} partidos (deben ser ${TOTAL_PARTIDOS})`)
  }
  const signosValidos = new Set(['1', 'X', '2', '1X', '12', 'X2', '1X2'])
  for (let i = 0; i < config.length; i++) {
    if (!signosValidos.has(config[i])) {
      throw new Error(`Config inválida: signo "${config[i]}" en posición ${i + 1}`)
    }
  }
}

/** Cuenta triples, dobles y fijos en una configuración */
export function contarSignos(config: ConfigUsuario): ConteoSignos {
  validarConfig(config)
  let triples = 0
  let dobles = 0
  let fijos = 0
  for (const s of config) {
    if (s === '1X2') triples++
    else if (s.length === 2) dobles++
    else fijos++
  }
  return { triples, dobles, fijos }
}
