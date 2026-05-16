/**
 * HEURÍSTICAS DE OPTIMIZACIÓN
 *
 * Estrategias para aproximar soluciones al problema de covering
 * cuando la solución exacta es computacionalmente inviable.
 *
 * El problema de encontrar la cobertura mínima es NP-hard.
 * Para configuraciones grandes (T+D > 8), la expansión directa
 * genera millones de columnas y la búsqueda exacta es imposible.
 *
 * Las heurísticas aquí documentadas permiten:
 * 1. Reducir el espacio de búsqueda con criterios estadísticos
 * 2. Priorizar columnas con mayor probabilidad de cobertura
 * 3. Aplicar filtros basados en frecuencias históricas de signos
 */

import type { Columna, ConfigUsuario } from '../types'
import { PRECIO_POR_COLUMNA } from '../engine/validate'

/**
 * Filtra columnas por frecuencia de signos.
 *
 * Heurística: eliminar columnas con distribuciones "extremas"
 * (ej: 14 signos '1') que son estadísticamente improbables.
 *
 * Los resultados reales de Progol muestran que:
 * - ~48% de los partidos terminan en '1' (local)
 * - ~28% terminan en 'X' (empate)
 * - ~24% terminan en '2' (visitante)
 *
 * Una columna con 14 '2' es virtualmente imposible.
 */
export function filtrarPorFrecuencia(
  columnas: Columna[],
  limites?: { maxUnos?: number; maxEquis?: number; maxDoses?: number },
): Columna[] {
  const { maxUnos = 10, maxEquis = 7, maxDoses = 8 } = limites ?? {}

  return columnas.filter((col) => {
    let unos = 0, equis = 0, doses = 0
    for (const s of col) {
      if (s === '1') unos++
      else if (s === 'X') equis++
      else doses++
    }
    return unos <= maxUnos && equis <= maxEquis && doses <= maxDoses
  })
}

/**
 * Prioriza columnas por "entropía" — diversidad de signos.
 * Las columnas con mezcla balanceada de 1/X/2 tienen mayor
 * probabilidad empírica de contener aciertos.
 *
 * Score = 1 - (|unos - equis| + |equis - doses| + |doses - unos|) / 28
 * Rango: 0 (todo igual) a 1 (distribución perfecta 5/5/4)
 */
export function scoreDiversidad(columna: Columna): number {
  let unos = 0, equis = 0, doses = 0
  for (const s of columna) {
    if (s === '1') unos++
    else if (s === 'X') equis++
    else doses++
  }
  const dispersion = Math.abs(unos - equis) + Math.abs(equis - doses) + Math.abs(doses - unos)
  return 1 - dispersion / 28
}

/**
 * Ordena columnas por score de diversidad (mayor a menor).
 * Las primeras N columnas son las más "balanceadas".
 */
export function ordenarPorDiversidad(columnas: Columna[]): Columna[] {
  return [...columnas].sort((a, b) => scoreDiversidad(b) - scoreDiversidad(a))
}

/**
 * Reduce un conjunto de columnas quedándose con las top-N
 * más diversas. Heurística simple para cuando el conjunto
 * completo es demasiado grande.
 */
export function topNDiversas(columnas: Columna[], n: number): Columna[] {
  return ordenarPorDiversidad(columnas).slice(0, n)
}

/**
 * Calcula la matriz de distancia Hamming entre columnas.
 * Distancia = número de posiciones donde difieren.
 *
 * Útil para:
 * - Verificar diversidad real del conjunto
 * - Detectar columnas duplicadas o casi-duplicadas
 */
export function distanciaHamming(a: Columna, b: Columna): number {
  let d = 0
  for (let i = 0; i < 14; i++) {
    if (a[i] !== b[i]) d++
  }
  return d
}

/**
 * Estadísticas de la configuración del usuario.
 * Información para ayudar al usuario a entender el riesgo de su selección.
 */
export function estadisticasConfig(config: ConfigUsuario): {
  combinacionesDirectas: number
  costoEstimado: number
  nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'extremo'
  recomendacion: string
} {
  let triples = 0, dobles = 0
  for (const s of config) {
    if (s === '1X2') triples++
    else if (s.length === 2) dobles++
  }

  const combinaciones = 3 ** triples * 2 ** dobles
  const costo = combinaciones * PRECIO_POR_COLUMNA

  let nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'extremo'
  let recomendacion: string

  if (combinaciones <= 81) {
    nivelRiesgo = 'bajo'
    recomendacion = 'Configuración manejable. El Modelo 14 directo es viable.'
  } else if (combinaciones <= 1000) {
    nivelRiesgo = 'medio'
    recomendacion = 'Considera una reducción al 13 para bajar el costo sin perder mucha cobertura.'
  } else if (combinaciones <= 10000) {
    nivelRiesgo = 'alto'
    recomendacion = 'El directo es caro. Una reducción oficial al 12 o 13 es muy recomendable.'
  } else {
    nivelRiesgo = 'extremo'
    recomendacion = 'Combinaciones masivas. Usa reducciones al 11/12 o reduce triples/dobles.'
  }

  return { combinacionesDirectas: combinaciones, costoEstimado: costo, nivelRiesgo, recomendacion }
}
