/**
 * TIPOS MATEMÁTICOS DEL MOTOR DE QUINIELA
 * Separados de los tipos de UI (src/types.ts).
 * Cero dependencias de React, Zustand o componentes visuales.
 */

/** Signo de quiniela: fijo (1 carácter), doble (2), triple (3) */
export type Signo = '1' | 'X' | '2' | '1X' | '12' | 'X2' | '1X2'

/** Nivel de garantía de la reducción */
export type NivelGarantia = 11 | 12 | 13 | 14

/** Una columna de quiniela son 14 signos fijos (sin dobles ni triples) */
export type Columna = [
  '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2',
  '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2',
  '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2', '1' | 'X' | '2',
  '1' | 'X' | '2', '1' | 'X' | '2',
]

/** Configuración del usuario: 14 signos (pueden ser fijos, dobles o triples) */
export type ConfigUsuario = Signo[]

/** Resultado de contar tipos de signos en una configuración */
export interface ConteoSignos {
  triples: number
  dobles: number
  fijos: number
}

/** Resultado de la generación directa (Modelo 14) */
export interface ResultadoDirecto {
  config: ConfigUsuario
  conteo: ConteoSignos
  columnasTotales: number
  costoTotal: number // en euros (€0.75 por columna)
  columnas: Columna[]
}

/** Metadatos de una reducción oficial (sin las columnas aún) */
export interface ReduccionMeta {
  id: number
  nombre: string
  triples: number
  dobles: number
  columnasRequeridas: number
  nivel: NivelGarantia
}

/**
 * Matriz de reducción completa.
 * Las columnas definen qué apuestas cubren la garantía.
 * TODO: Integrar matrices oficiales de Progol/Loterías.
 */
export interface MatrizReduccion {
  meta: ReduccionMeta
  /** Las columnas que componen la reducción. undefined = pendiente de integrar. */
  columnas: Columna[] | undefined
  /** Fuente de la matriz (ej: "Progol oficial 2024", "Loterías y Apuestas del Estado") */
  fuente: string | undefined
}

/** Estado actual del motor de reducidas */
export type EstadoMotor =
  | 'directo_disponible'   // Modelo 14 siempre funciona
  | 'matrices_pendientes'  // Reducciones oficiales sin integrar
  | 'matrices_parciales'   // Algunas matrices integradas, otras no
  | 'completo'             // Todas las matrices integradas
