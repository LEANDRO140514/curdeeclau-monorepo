/**
 * PRICING & PRESUPUESTO
 *
 * Cálculo de costos, viabilidad económica y proyección de premios.
 * Separado de la validación y generación para mantener single responsibility.
 */

import type { ConfigUsuario } from '../types'
import { contarSignos, PRECIO_POR_COLUMNA } from './validate'

/**
 * Calcula el presupuesto necesario para la generación DIRECTA.
 * Fórmula exacta: 3^T × 2^D × 0.75€
 * Sin heurísticas, sin factores inventados.
 */
export function calcularPresupuestoDirecto(config: ConfigUsuario): {
  columnas: number
  costo: number
} {
  const { triples, dobles } = contarSignos(config)
  const columnas = 3 ** triples * 2 ** dobles
  const costo = columnas * PRECIO_POR_COLUMNA
  return { columnas, costo }
}

/**
 * Valida si una configuración es viable económicamente.
 * El límite por defecto (500€) es orientativo.
 */
export function esViable(config: ConfigUsuario, presupuestoMaximo = 500): {
  viable: boolean
  columnas: number
  costo: number
  mensaje: string
} {
  const { columnas, costo } = calcularPresupuestoDirecto(config)
  const viable = costo <= presupuestoMaximo
  return {
    viable,
    columnas,
    costo,
    mensaje: viable
      ? `Viable: ${columnas.toLocaleString('es-ES')} columnas por ${costo.toFixed(2)} €`
      : `Excede presupuesto: ${columnas.toLocaleString('es-ES')} columnas por ${costo.toFixed(2)} € (máx ${presupuestoMaximo} €)`,
  }
}

/**
 * Calcular premios proyectados basado en aciertos.
 * Usa distribución oficial de La Quiniela:
 * - 14 aciertos: 16% de la recaudación
 * - 13 aciertos: 7.5%
 * - 12 aciertos: 3%
 * - 11 aciertos: 1.5%
 * - 10 aciertos: reintegro
 */
export function calcPremios(aciertos: number, boteEstimado: number): {
  nivel: string
  premio: string
  color: string
} {
  if (aciertos >= 14) return { nivel: '14 Aciertos — PLENO', premio: (boteEstimado * 0.16).toLocaleString('es-ES') + ' €', color: '#ff00cc' }
  if (aciertos >= 13) return { nivel: '13 Aciertos', premio: (boteEstimado * 0.075).toLocaleString('es-ES') + ' €', color: '#00f0ff' }
  if (aciertos >= 12) return { nivel: '12 Aciertos', premio: (boteEstimado * 0.03).toLocaleString('es-ES') + ' €', color: '#34d399' }
  if (aciertos >= 11) return { nivel: '11 Aciertos', premio: (boteEstimado * 0.015).toLocaleString('es-ES') + ' €', color: '#fbbf24' }
  if (aciertos >= 10) return { nivel: '10 Aciertos', premio: 'Reintegro (~15 €)', color: '#9ca3af' }
  return { nivel: 'Sin premio', premio: '0 €', color: '#6b7280' }
}
