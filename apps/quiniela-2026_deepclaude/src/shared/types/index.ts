/* ===== TIPOS DE QUINIELA 2026 ===== */

export type Signo = '1' | 'X' | '2' | '1X' | '12' | 'X2' | '1X2'

export type NivelReduccion = 13 | 12 | 11

export type FaseApp = 0 | 1 | 2 | 3

export interface PartidoData {
  id: number
  local: string
  visitante: string
  dia: string
  hora: string
  escudoLocal: string  // emoji placeholder
  escudoVisitante: string
  h2h: { local: number; empate: number; visitante: number }
  formaLocal: ('V' | 'E' | 'D')[]
  formaVisitante: ('V' | 'E' | 'D')[]
  momio: { uno: number; equis: number; dos: number }
  dificultad: 'verde' | 'amarillo' | 'rojo'
}

export interface ReduccionInfo {
  id: number
  nombre: string
  descripcion: string
  boletos: number
  precio: number
  garantia: string
  nivel: NivelReduccion
  configRequerida?: { triples: number; dobles: number }
}

export interface BoletosGenerados {
  modelo: number
  titulo: string
  boletos: number
  ahorro: string
  precio: string
  garantia: string
  config: Signo[]
  columnas?: Signo[][]  // virtual ticket columns
  oficial: boolean
}

export interface Vaquita {
  id: string
  nombre: string
  boletos: number
  pagado: number
  total: number
  color: string
}

export interface QuinielaRecord {
  id: string
  fecha: string
  modelo: number
  titulo: string
  boletos: number
  precio: string
  config: Signo[]
  ahorro: string
}

export interface VoteState {
  1: number
  X: number
  2: number
}

export interface ToastMsg {
  id: number
  text: string
  type: 'success' | 'error' | 'info' | 'warning'
}
