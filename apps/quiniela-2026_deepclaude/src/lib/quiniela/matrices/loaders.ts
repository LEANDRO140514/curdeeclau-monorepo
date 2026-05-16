/**
 * LOADERS — Carga de matrices desde datos embebidos o externos.
 *
 * Fuentes:
 *   - Embebidas (códigos perfectos, tablas LAE conocidas)
 *   - API Python (backend CP-SAT para matrices grandes)
 *   - Archivos binarios locales (.qmat)
 */

import type { PackedMatriz, PackedMatrizMeta } from './schema'
import { packDesdePatron } from './packer'
import { validarMatriz } from './validators'
import { PATRONES_MATRICES } from './data' // los datos numéricos existentes

/** Resultado de carga */
export interface CargaMatriz {
  matriz: PackedMatriz | null
  meta: PackedMatrizMeta | null
  error: string | null
}

/**
 * Carga una matriz desde los datos embebidos (reducciones 1-6).
 * Las matrices 7-12 requieren backend Python.
 */
export function cargarMatrizEmbebida(id: number): CargaMatriz {
  const patron = PATRONES_MATRICES[id]
  if (!patron || patron.origen === 'pendiente') {
    return {
      matriz: null,
      meta: null,
      error:
        `Matriz ${id} no disponible embebida. ` +
        'Usa cargarMatrizRemota() para solicitarla al backend Python.',
    }
  }

  const meta: PackedMatrizMeta = {
    id,
    nombre: `Reducción ${id}`,
    triples: patron.triples,
    dobles: patron.dobles,
    nivel: id <= 6 ? 13 : id <= 9 ? 12 : 11,
    columnasTotales: patron.columnas.length,
    origen: patron.origen,
    fuente: patron.fuente,
  }

  // Empaquetar: los patrones tienen T+D valores por columna (triples primero, dobles después)
  // Necesitamos mapear a las posiciones 0..(T+D-1) en el packed
  const matriz = packDesdePatron(patron.columnas, 0, 0)

  // Validación rápida
  const validacion = validarMatriz(matriz, meta)
  if (!validacion.valida) {
    return {
      matriz: null,
      meta,
      error: `Validación fallida: ${validacion.errores.join('; ')}`,
    }
  }

  return { matriz, meta, error: null }
}

/**
 * Carga una matriz desde el backend Python (API REST).
 * Endpoint: POST /solve con { triples, dobles, fallos_permitidos, max_columnas }
 */
export async function cargarMatrizRemota(
  triples: number,
  dobles: number,
  fallosPermitidos: number,
  maxColumnas?: number,
  apiUrl = 'http://localhost:8000',
): Promise<CargaMatriz> {
  try {
    const resp = await fetch(`${apiUrl}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        triples,
        dobles,
        fallos_permitidos: fallosPermitidos,
        max_columnas: maxColumnas,
      }),
    })

    if (!resp.ok) {
      return { matriz: null, meta: null, error: `API error ${resp.status}: ${await resp.text()}` }
    }

    const data = await resp.json()
    const columnas: number[][] = data.columnas

    if (!columnas || columnas.length === 0) {
      return { matriz: null, meta: null, error: 'API retornó 0 columnas' }
    }

    const matriz = packDesdePatron(columnas, 0, 0)
    const nivelGlobal = 14 - fallosPermitidos

    const meta: PackedMatrizMeta = {
      id: 0, // genérico, no es del catálogo oficial
      nombre: `${triples}T+${dobles}D (remoto)`,
      triples,
      dobles,
      nivel: nivelGlobal as PackedMatrizMeta['nivel'],
      columnasTotales: matriz.length,
      origen: data.optimalidad === 'optimo' ? 'codigo_perfecto' : 'greedy',
      fuente: `Python OR-Tools CP-SAT. Optimalidad: ${data.optimalidad}. ${data.mensaje}`,
    }

    return { matriz, meta, error: null }
  } catch (err) {
    return {
      matriz: null,
      meta: null,
      error: `Error de conexión al backend Python: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Carga todas las matrices embebidas disponibles.
 * Retorna un Map<id, {matriz, meta}>.
 */
export function cargarTodasEmbebidas(): Map<number, { matriz: PackedMatriz; meta: PackedMatrizMeta }> {
  const result = new Map<number, { matriz: PackedMatriz; meta: PackedMatrizMeta }>()
  for (let id = 1; id <= 12; id++) {
    const carga = cargarMatrizEmbebida(id)
    if (carga.matriz && carga.meta) {
      result.set(id, { matriz: carga.matriz, meta: carga.meta })
    }
  }
  return result
}

/**
 * Caché en memoria de matrices cargadas.
 * Evita re-empaquetar en cada llamada a obtenerColumnasReduccion.
 */
const cacheMatrices = new Map<number, PackedMatriz>()

export function obtenerMatrizCache(id: number): PackedMatriz | undefined {
  return cacheMatrices.get(id)
}

export function guardarMatrizCache(id: number, matriz: PackedMatriz): void {
  cacheMatrices.set(id, matriz)
}

export function limpiarCache(): void {
  cacheMatrices.clear()
}
