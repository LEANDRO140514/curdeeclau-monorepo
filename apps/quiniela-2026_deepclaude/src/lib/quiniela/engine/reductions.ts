/**
 * REDUCCIONES OFICIALES (MODELO 13, 12, 11)
 *
 * Las reducciones oficiales usan MATRICES predefinidas:
 * conjuntos mínimos de columnas que garantizan N aciertos dados T triples y D dobles.
 *
 * Matrices integradas: 1-6 (códigos perfectos + tablas LAE).
 * Matrices 7-12: generadas vía greedy o pendientes de backend Python.
 */

import type { ConfigUsuario, ReduccionMeta, EstadoMotor, Columna } from '../types'
import { contarSignos } from './validate'
import { PATRONES_MATRICES } from '../matrices/data'
import type { MatrizPatron } from '../matrices/data'

/**
 * Catálogo de reducciones oficiales reconocidas.
 * Datos verificados contra tablas de Loterías y Apuestas del Estado.
 */
export const CATALOGO_REDUCCIONES: ReduccionMeta[] = [
  { id: 1,  nombre: 'Reducción 1  — 4 Triples',             triples: 4,  dobles: 0,  columnasRequeridas: 9,    nivel: 13 },
  { id: 2,  nombre: 'Reducción 2  — 7 Dobles',               triples: 0,  dobles: 7,  columnasRequeridas: 16,   nivel: 13 },
  { id: 3,  nombre: 'Reducción 3  — 3 Triples + 3 Dobles',  triples: 3,  dobles: 3,  columnasRequeridas: 24,   nivel: 13 },
  { id: 4,  nombre: 'Reducción 4  — 2 Triples + 6 Dobles',  triples: 2,  dobles: 6,  columnasRequeridas: 64,   nivel: 13 },
  { id: 5,  nombre: 'Reducción 5  — 8 Triples',             triples: 8,  dobles: 0,  columnasRequeridas: 81,   nivel: 13 },
  { id: 6,  nombre: 'Reducción 6  — 11 Dobles',             triples: 0,  dobles: 11, columnasRequeridas: 132,  nivel: 13 },
  { id: 7,  nombre: 'Reducción 7  — 5 Triples + 4 Dobles',  triples: 5,  dobles: 4,  columnasRequeridas: 192,  nivel: 12 },
  { id: 8,  nombre: 'Reducción 8  — 3 Triples + 8 Dobles',  triples: 3,  dobles: 8,  columnasRequeridas: 216,  nivel: 12 },
  { id: 9,  nombre: 'Reducción 9  — 6 Triples + 2 Dobles',  triples: 6,  dobles: 2,  columnasRequeridas: 288,  nivel: 12 },
  { id: 10, nombre: 'Reducción 10 — 4 Triples + 6 Dobles',  triples: 4,  dobles: 6,  columnasRequeridas: 432,  nivel: 11 },
  { id: 11, nombre: 'Reducción 11 — 7 Triples + 3 Dobles',  triples: 7,  dobles: 3,  columnasRequeridas: 648,  nivel: 11 },
  { id: 12, nombre: 'Reducción 12 — 10 Dobles + 1 Triple',  triples: 1,  dobles: 10, columnasRequeridas: 512,  nivel: 11 },
]

/**
 * Compara una configuración de usuario con una reducción.
 * Retorna true si la config tiene AL MENOS los triples/dobles requeridos.
 */
export function esCompatible(config: ConfigUsuario, reduccion: ReduccionMeta): boolean {
  const { triples, dobles } = contarSignos(config)
  return triples >= reduccion.triples && dobles >= reduccion.dobles
}

/**
 * Filtra las reducciones compatibles con una configuración.
 */
export function reduccionesCompatibles(config: ConfigUsuario): ReduccionMeta[] {
  return CATALOGO_REDUCCIONES.filter((r) => esCompatible(config, r))
}

/**
 * Estado actual del motor.
 */
export function estadoMotor(): EstadoMotor {
  const total = Object.keys(PATRONES_MATRICES).length
  const conDatos = Object.values(PATRONES_MATRICES).filter((m) => m.origen !== 'pendiente').length
  if (conDatos === 0) return 'matrices_pendientes'
  if (conDatos < total) return 'matrices_parciales'
  return 'completo'
}

/**
 * Obtener columnas de una reducción usando la matriz integrada.
 *
 * Toma los primeros T triples y D dobles de la configuración del usuario,
 * aplica la matriz patrón, y reduce los triples/dobles sobrantes a su
 * primera opción.
 */
export function obtenerColumnasReduccion(
  config: ConfigUsuario,
  reduccionId: number,
): { disponible: boolean; columnas: Columna[] | null; razon: string | null; origen: string | null } {
  const matriz: MatrizPatron | undefined = PATRONES_MATRICES[reduccionId]

  if (!matriz || matriz.origen === 'pendiente' || matriz.columnas.length === 0) {
    return {
      disponible: false,
      columnas: null,
      origen: null,
      razon:
        'Matriz de reducción no disponible. ' +
        'Usa el modelo 14 directo (generarDirecta) para obtener columnas reales. ' +
        'Las matrices grandes requieren backend Python (OR-Tools).',
    }
  }

  const { triples: tMatriz, dobles: dMatriz } = matriz

  // Encontrar posiciones de triples y dobles en la config
  const idxTriples: number[] = []
  const idxDobles: number[] = []
  const opcionesDobles: [string, string][] = []

  for (let i = 0; i < config.length; i++) {
    const s = config[i]
    if (s === '1X2' && idxTriples.length < tMatriz) {
      idxTriples.push(i)
    } else if (s.length === 2 && idxDobles.length < dMatriz) {
      idxDobles.push(i)
      opcionesDobles.push([s[0], s[1]])
    }
  }

  if (idxTriples.length < tMatriz || idxDobles.length < dMatriz) {
    return {
      disponible: false,
      columnas: null,
      origen: null,
      razon: `Configuración insuficiente: necesita ${tMatriz} triples y ${dMatriz} dobles.`,
    }
  }

  // Construir columnas a partir de los patrones
  const columnas: Columna[] = []

  for (const patron of matriz.columnas) {
    // Empezar con fijos + reducir triples/dobles sobrantes a primera opción
    const col = config.map((s) => {
      if (s.length === 1) return s
      return s[0] // primera opción de doble/triple sobrante
    }) as Columna

    // Aplicar valores de triples desde el patrón
    for (let t = 0; t < tMatriz; t++) {
      const v = patron[t]
      col[idxTriples[t]] = (v === 0 ? '1' : v === 1 ? 'X' : '2') as Columna[number]
    }

    // Aplicar valores de dobles desde el patrón
    for (let d = 0; d < dMatriz; d++) {
      const v = patron[tMatriz + d]
      col[idxDobles[d]] = opcionesDobles[d][v] as Columna[number]
    }

    columnas.push(col)
  }

  return {
    disponible: true,
    columnas,
    origen: matriz.origen,
    razon: null,
  }
}

/**
 * Calcula el AHORRO de una reducción vs el directo.
 *   ahorro = 1 - (columnas_reducida / columnas_directo)
 */
export function calcularAhorroReduccion(config: ConfigUsuario, columnasReducida: number): number {
  const { triples, dobles } = contarSignos(config)
  const columnasDirecto = 3 ** triples * 2 ** dobles
  if (columnasDirecto === 0) return 0
  return 1 - columnasReducida / columnasDirecto
}
