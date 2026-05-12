/**
 * SET COVER — COBERTURA DE CONJUNTOS
 *
 * El problema matemático subyacente de las reducidas de quiniela
 * es un "covering design" (diseño de cobertura combinatoria).
 *
 * Dado:
 * - Un universo U = todas las combinaciones posibles de resultados (3^14)
 * - Una configuración de usuario S (subconjunto de U)
 * - Un nivel de garantía k
 *
 * Buscamos el mínimo número de columnas C ⊆ S tal que:
 *   ∀ r ∈ U, ∃ c ∈ C : aciertos(c, r) ≥ k
 *
 * Esto es equivalente al problema de covering arrays CA(N; t, k, v):
 * - N = número de columnas (lo que queremos minimizar)
 * - t = nivel de garantía (13, 12, 11...)
 * - k = número de columnas por fila (14 partidos)
 * - v = tamaño del alfabeto (3 signos: 1, X, 2)
 *
 * Referencias:
 * - Colbourn, C.J. "Covering Arrays" — Encyclopedia of Combinatorial Designs
 * - La Jolla Covering Repository: https://www.ccrwest.org/cover.html
 * - Schönheim, J. "On coverings" — Pacific J. Math. 14 (1964)
 */

export interface CoveringProblem {
  triples: number
  dobles: number
  garantia: number // 11 | 12 | 13 | 14
}

export interface CoveringSolution {
  columnas: number
  cotaInferior: number | null
  optimalidad: 'optimo' | 'mejor_conocida' | 'aproximacion' | 'desconocida'
  referencia: string | null
}

/**
 * Cota inferior de Schönheim para covering designs.
 *
 * Para un covering array CA(N; t, k, v), la cota de Schönheim establece:
 *   CAN(t, k, v) ≥ ⌈v × CAN(t-1, k-1, v) / (k - t + 1)⌉
 *
 * Donde CAN(t, k, v) es el tamaño mínimo de un CA(N; t, k, v).
 *
 * Casos base:
 *   CAN(1, k, v) = v        (trivial: una columna por cada símbolo)
 *   CAN(t, t, v) = v^t      (todas las combinaciones necesarias)
 *   CAN(k, k, v) = v^k      (sin reducción posible)
 *
 * Para la quiniela (v=3, posiciones = T+D, garantía = nivel en esas posiciones):
 *   Sea p = T + D el número de posiciones variables.
 *   Sea g = (nivel_global - (14 - p)) el número de aciertos requeridos en las p posiciones.
 *   Entonces CAN_TRIVIAL = 3^T × 2^D (todas las columnas)
 *
 * La cota de Schönheim nos da un límite inferior teórico para el número
 * de columnas necesarias. Si una matriz alcanza esta cota, es óptima.
 */
export function cotaSchonheim(triples: number, dobles: number, nivel: number): number | null {
  // Nivel global (13, 12, 11) → aciertos requeridos en posiciones variables
  const p = triples + dobles
  const fijos = 14 - p
  const aciertosRequeridosVar = nivel - fijos

  if (aciertosRequeridosVar <= 0) return 1  // Los fijos ya garantizan el nivel
  if (aciertosRequeridosVar >= p) return 3 ** triples * 2 ** dobles // Sin reducción posible

  // Para el caso mixto (triples + dobles), no hay una cota de Schönheim
  // directa porque los alfabetos son diferentes (3 y 2).
  // Usamos una cota combinada: producto de las cotas para cada subsistema.

  // Cota para los triples (alfabeto v=3)
  const cotaTriples = cotaSchonheimPura(3, triples, aciertosRequeridosVar - dobles)

  // Cota para los dobles (alfabeto v=2)
  const cotaDobles = cotaSchonheimPura(2, dobles, aciertosRequeridosVar - triples)

  if (cotaTriples === null || cotaDobles === null) return null

  // Cota combinada conservadora
  return Math.max(cotaTriples, cotaDobles, Math.ceil((3 ** triples * 2 ** dobles) /
    (1 + p * (triples > 0 ? 2 : 1) + (p * (p - 1) / 2) * (triples > 1 ? 2 : 1) * (triples > 1 ? 2 : 1))))
}

/**
 * Cota de Schönheim para covering array homogéneo CA(N; t, k, v).
 *
 * CAN(t, k, v) ≥ ⌈v × CAN(t-1, k-1, v) / (k - t + 1)⌉
 */
function cotaSchonheimPura(v: number, k: number, t: number): number | null {
  if (k <= 0 || t <= 0) return 1
  if (t > k) return null

  // Caso base: CAN(1, k, v) = v
  if (t === 1) return v
  // Caso base: CAN(k, k, v) = v^k (sin reducción)
  if (t === k) return v ** k

  // Recursivo: CAN(t, k, v) ≥ ⌈v × CAN(t-1, k-1, v) / (k - t + 1)⌉
  const prev = cotaSchonheimPura(v, k - 1, t - 1)
  if (prev === null) return null
  return Math.ceil((v * prev) / (k - t + 1))
}

/**
 * Evalúa la optimalidad de una solución comparando con la cota teórica.
 */
export function evaluarOptimalidad(
  columnasReales: number,
  triples: number,
  dobles: number,
  nivel: number,
): CoveringSolution {
  const cota = cotaSchonheim(triples, dobles, nivel)
  let optimalidad: CoveringSolution['optimalidad']

  if (cota !== null && columnasReales <= cota) {
    optimalidad = 'optimo'
  } else if (cota !== null && columnasReales <= cota * 1.2) {
    optimalidad = 'mejor_conocida'
  } else if (cota !== null) {
    optimalidad = 'aproximacion'
  } else {
    optimalidad = 'desconocida'
  }

  return {
    columnas: columnasReales,
    cotaInferior: cota,
    optimalidad,
    referencia: cota !== null
      ? `Cota Schönheim CAN(${nivel - (14 - triples - dobles)}, ${triples + dobles}, mixto) ≥ ${cota}`
      : 'Cota no disponible para estos parámetros',
  }
}
