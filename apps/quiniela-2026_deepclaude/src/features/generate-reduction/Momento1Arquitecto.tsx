import { useState, useMemo } from 'react'
import { useStore } from '../../app/providers/store'
import {
  generarDirecta,
  generarPorLotes,
  calcularPresupuestoDirecto,
  contarSignos,
  esViable,
  CATALOGO_REDUCCIONES,
  esCompatible,
  reduccionesCompatibles,
  obtenerColumnasReduccion,
  calcularAhorroReduccion,
  PATRONES_MATRICES,
  PRECIO_POR_COLUMNA,
  TOTAL_COLUMNAS_UNIVERSO,
} from '../../lib/quiniela'
import { exportarCSV, copiarPortapapeles } from '../../shared/lib/export'
import type { Signo, NivelReduccion } from '../../shared/types'
import type { Columna } from '../../lib/quiniela/types'
import Button from '../../shared/ui/Button'

/* ─── CONSTANTES ─── */
const CICLO_SIGNO: Signo[] = ['1', '1X', '12', '1X2', 'X', 'X2', '2']

const NIVELES: { nivel: NivelReduccion; label: string; sub: string }[] = [
  { nivel: 13, label: 'Al 13', sub: 'Garantía 13 aciertos' },
  { nivel: 12, label: 'Al 12', sub: 'Cobertura amplia' },
  { nivel: 11, label: 'Al 11', sub: 'Máximo ahorro' },
]

/* ─── SUBCOMPONENTES ─── */
function SignoPill({ signo }: { signo: Signo }) {
  const esTriple = signo === '1X2'
  const esDoble = signo.length === 2 && signo !== '1X2'
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-bold border
        ${esTriple ? 'bg-accent/20 text-accent border-accent/50' : ''}
        ${esDoble ? 'bg-primary/20 text-primary border-primary/40' : ''}
        ${!esTriple && !esDoble ? 'bg-white/10 text-white/50 border-white/10' : ''}
      `}
    >
      {signo}
    </span>
  )
}

function StatBox({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 bg-black/25 rounded-2xl p-3 text-center border border-white/5">
      <div className="text-[11px] text-white/40 mb-0.5">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{value}</div>
    </div>
  )
}

/* ─── MOMENTO 1 ─── */
export default function Momento1Arquitecto() {
  /* ── Store ── */
  const config = useStore((s) => s.config)
  const setSigno = useStore((s) => s.setSigno)
  const resetConfig = useStore((s) => s.resetConfig)
  const resultado = useStore((s) => s.resultado)
  const setResultado = useStore((s) => s.setResultado)
  const pushToast = useStore((s) => s.pushToast)
  const agregarHistorial = useStore((s) => s.agregarHistorial)

  /* ── Estado local ── */
  const [nivel, setNivel] = useState<NivelReduccion>(13)
  const [modoModelo, setModoModelo] = useState<'14' | '13'>('14')
  const [reduccionId, setReduccionId] = useState(1)
  const [showColumnas, setShowColumnas] = useState(false)
  const [columnaPreview, setColumnaPreview] = useState<Signo[][]>([])

  /* ── Derivados ── */
  const { triples, dobles, fijos } = contarSignos(config)
  const presupuesto = useMemo(() => calcularPresupuestoDirecto(config), [config])
  const reduccionesNivel = useMemo(() => CATALOGO_REDUCCIONES.filter((r) => r.nivel === nivel), [nivel])
  const reduccionSel = CATALOGO_REDUCCIONES.find((r) => r.id === reduccionId) ?? CATALOGO_REDUCCIONES[0]
  const viabilidad = useMemo(() => esViable(config), [config])

  /* ── Acciones ── */
  const cicloSigno = (idx: number) => {
    const actual = config[idx]
    const i = CICLO_SIGNO.indexOf(actual)
    setSigno(idx, CICLO_SIGNO[(i + 1) % CICLO_SIGNO.length])
  }

  const handleGenerar = () => {
    if (modoModelo === '14') {
      try {
        const resultadoDirecto = generarDirecta(config)
        const ahorro = ((1 - resultadoDirecto.columnasTotales / TOTAL_COLUMNAS_UNIVERSO) * 100).toFixed(4)
        const res = {
          modelo: 14,
          titulo: 'MODELO 14 — DIRECTO',
          boletos: resultadoDirecto.columnasTotales,
          ahorro: ahorro + '%',
          precio: resultadoDirecto.costoTotal.toFixed(2) + ' €',
          garantia: 'Máxima probabilidad al 14',
          config: [...config],
          columnas: resultadoDirecto.columnas.map((c) => [...c] as Signo[]),
          oficial: false,
        }
        setResultado(res)
        agregarHistorial({ id: crypto.randomUUID(), fecha: new Date().toISOString(), modelo: 14, titulo: res.titulo, boletos: res.boletos, precio: res.precio, config: [...config], ahorro: res.ahorro })
        pushToast(`Reducida al directo: ${resultadoDirecto.columnasTotales.toLocaleString('es-ES')} columnas reales`, 'success')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al generar'
        pushToast(msg, 'error')
      }
    } else {
      const r = reduccionSel
      // Verificar compatibilidad
      if (!esCompatible(config, r)) {
        pushToast(`Esta reducción requiere ${r.triples} triples y ${r.dobles} dobles. Ajusta tu configuración.`, 'warning')
        return
      }
      // Intentar obtener columnas reales
      const resultadoRed = obtenerColumnasReduccion(config, r.id)
      if (!resultadoRed.disponible) {
        pushToast('Matrices de reducción pendientes de integrar. Usa Modelo 14 Directo para obtener columnas reales.', 'warning')
        const ahorro = (calcularAhorroReduccion(config, r.columnasRequeridas) * 100).toFixed(1)
        const res = {
          modelo: r.nivel,
          titulo: r.nombre,
          boletos: r.columnasRequeridas,
          ahorro: ahorro + '%',
          precio: (r.columnasRequeridas * PRECIO_POR_COLUMNA).toFixed(2) + ' €',
          garantia: `Garantía 100% al ${r.nivel} (pendiente de integrar)`,
          config: [...config],
          columnas: [],
          oficial: false,
        }
        setResultado(res)
        agregarHistorial({ id: crypto.randomUUID(), fecha: new Date().toISOString(), modelo: r.nivel, titulo: r.nombre, boletos: r.columnasRequeridas, precio: res.precio, config: [...config], ahorro: res.ahorro })
      } else {
        const columnasReales = resultadoRed.columnas!
        const ahorro = (calcularAhorroReduccion(config, r.columnasRequeridas) * 100).toFixed(1)
        const res = {
          modelo: r.nivel,
          titulo: r.nombre,
          boletos: columnasReales.length,
          ahorro: ahorro + '%',
          precio: (columnasReales.length * PRECIO_POR_COLUMNA).toFixed(2) + ' €',
          garantia: `Garantía 100% al ${r.nivel}`,
          config: [...config],
          columnas: columnasReales as unknown as Signo[][],
          oficial: true,
        }
        setResultado(res)
        agregarHistorial({ id: crypto.randomUUID(), fecha: new Date().toISOString(), modelo: r.nivel, titulo: r.nombre, boletos: res.boletos, precio: res.precio, config: [...config], ahorro: res.ahorro })
        pushToast(`Reducción al ${r.nivel} generada: ${columnasReales.length} columnas reales`, 'success')
      }
    }
  }

  /* ── Comparador de ahorro ── */
  const ahorroData = useMemo(() => {
    if (triples + dobles === 0) return null
    const sinReduccion = presupuesto.costo
    const conReduccion = modoModelo === '13' ? reduccionSel.columnasRequeridas * PRECIO_POR_COLUMNA : presupuesto.costo
    const pct = sinReduccion > 0 ? ((1 - conReduccion / sinReduccion) * 100).toFixed(1) : '0'
    return { sinReduccion, conReduccion, pct }
  }, [presupuesto.costo, modoModelo, reduccionSel.columnasRequeridas, triples, dobles])

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ─── TÍTULO ─── */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🏗️</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold">
          El <span className="text-primary neon-text">Arquitecto</span>
        </h2>
        <span className="text-white/20 text-sm hidden sm:inline">— Generador de Reducidas</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ COLUMNA IZQUIERDA: EDITOR ═══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selector de Nivel */}
          <div className="card-glass p-5 sm:p-6">
            <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm">
                <i className="fa-solid fa-layer-group" />
              </span>
              Nivel de Reducción
            </h3>
            <div className="flex gap-2">
              {NIVELES.map((n) => (
                <button
                  key={n.nivel}
                  onClick={() => setNivel(n.nivel)}
                  className={`flex-1 py-3 px-3 rounded-2xl text-center border transition-all duration-300
                    ${nivel === n.nivel
                      ? 'border-primary bg-primary/10 text-primary shadow-neon'
                      : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                    }`}
                >
                  <div className="text-sm font-bold">{n.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{n.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor de Partidos */}
          <div className="card-glass p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-sm">
                  <i className="fa-solid fa-table-cells" />
                </span>
                Editor de Partidos
              </h3>
              <button
                onClick={resetConfig}
                className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors"
              >
                <i className="fa-solid fa-rotate-left" /> Reset
              </button>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mb-5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-accent shadow-[0_0_8px_#ff00cc]" /> Triple (1X2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-primary shadow-[0_0_8px_#00f0ff]" /> Doble (1X / 12 / X2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-white/15" /> Fijo (1 / X / 2)
              </span>
            </div>

            {/* Grid de partidos: 2 filas de 7 */}
            <div className="space-y-2 mb-6">
              {[0, 1].map((fila) => (
                <div key={fila} className="grid grid-cols-7 gap-2">
                  {config.slice(fila * 7, fila * 7 + 7).map((signo, colIdx) => {
                    const i = fila * 7 + colIdx
                    const esTriple = signo === '1X2'
                    const esDoble = signo.length === 2 && signo !== '1X2'
                    return (
                      <button
                        key={i}
                        onClick={() => cicloSigno(i)}
                        className={`partido-pill aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5
                          ${esTriple ? '!border-accent !bg-accent/15 !text-accent' : ''}
                          ${esDoble ? '!border-primary !bg-primary/15 !text-primary' : ''}
                        `}
                      >
                        <span className="text-[10px] opacity-50 font-medium">P{i + 1}</span>
                        <SignoPill signo={signo} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <StatBox label="Triples" value={triples} color="text-accent" />
              <StatBox label="Dobles" value={dobles} color="text-primary" />
              <StatBox label="Fijos" value={fijos} />
              <StatBox label="Combinaciones (dir.)" value={presupuesto.columnas.toLocaleString('es-ES')} color={presupuesto.columnas > 10000 ? 'text-warning' : 'text-white'} />
            </div>
          </div>

          {/* Comparador de Ahorro */}
          {ahorroData && (
            <div className="card-glass p-5 sm:p-6">
              <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center text-success text-sm">
                  <i className="fa-solid fa-chart-bar" />
                </span>
                Comparador Visual de Ahorro
              </h3>
              <div className="flex items-end justify-center gap-8 sm:gap-16 py-4">
                {/* Barra sin reducción */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-white/40">Sin Reducción</span>
                  <div className="w-16 sm:w-20 bg-danger/20 border border-danger/30 rounded-t-2xl flex items-start justify-center pt-3" style={{ height: '130px' }}>
                    <span className="text-sm font-bold text-danger">{ahorroData.sinReduccion.toFixed(0)} €</span>
                  </div>
                  <span className="text-[10px] text-white/20">14 Triples</span>
                </div>

                {/* Flecha */}
                <div className="flex flex-col items-center pb-8">
                  <i className="fa-solid fa-arrow-right text-2xl text-success animate-pulse-neon" />
                  <span className="text-sm font-bold text-success">-{ahorroData.pct}%</span>
                </div>

                {/* Barra con reducción */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-success">Con Reducción</span>
                  <div
                    className="w-16 sm:w-20 bg-success/20 border border-success/30 rounded-t-2xl flex items-end justify-center pb-3"
                    style={{ height: `${Math.max(24, (ahorroData.conReduccion / Math.max(ahorroData.sinReduccion, 1)) * 130)}px` }}
                  >
                    <span className="text-sm font-bold text-success">{ahorroData.conReduccion.toFixed(0)} €</span>
                  </div>
                  <span className="text-[10px] text-success/60">Modelo {modoModelo}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ COLUMNA DERECHA: GENERADOR ═══ */}
        <div className="space-y-6">
          <div className="card-glass p-5 sm:p-6 lg:sticky lg:top-28">
            <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm">
                <i className="fa-solid fa-cubes" />
              </span>
              Generar Reducida
            </h3>

            {/* Toggle Modelo */}
            <div className="flex bg-white/5 rounded-2xl p-1 mb-5">
              <button
                onClick={() => setModoModelo('14')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                  ${modoModelo === '14' ? 'bg-gradient-to-r from-primary to-accent text-black shadow-neon' : 'text-white/45 hover:text-white'}`}
              >
                <i className="fa-solid fa-bolt mr-1.5" />
                Modelo 14
              </button>
              <button
                onClick={() => setModoModelo('13')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                  ${modoModelo === '13' ? 'bg-gradient-to-r from-primary to-accent text-black shadow-neon' : 'text-white/45 hover:text-white'}`}
              >
                <i className="fa-solid fa-shield-halved mr-1.5" />
                Modelo 13
              </button>
            </div>

            {/* Select de reducción (solo modelo 13) */}
            {modoModelo === '13' && (
              <>
                <select
                  value={reduccionId}
                  onChange={(e) => setReduccionId(Number(e.target.value))}
                  className="cyber-select mb-4 text-sm"
                >
                  {reduccionesNivel.map((r) => {
                    const pendiente = PATRONES_MATRICES[r.id]?.origen === 'pendiente'
                    return (
                      <option key={r.id} value={r.id} disabled={pendiente}>
                        {r.nombre} — {r.columnasRequeridas} bol. ({(r.columnasRequeridas * PRECIO_POR_COLUMNA).toFixed(2)} €){pendiente ? ' — Próximamente' : ''}
                      </option>
                    )
                  })}
                </select>

                {/* Info reducción */}
                <div className="bg-black/25 rounded-2xl p-4 mb-4 border border-white/5">
                  <div className="font-bold text-primary text-sm">{reduccionSel.nombre}</div>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">
                    {reduccionSel.triples > 0 && `${reduccionSel.triples} triples`}{reduccionSel.triples > 0 && reduccionSel.dobles > 0 && ' + '}{reduccionSel.dobles > 0 && `${reduccionSel.dobles} dobles`}
                  </p>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-white/5 text-xs">
                    <span className="text-success font-bold">{reduccionSel.columnasRequeridas} boletos</span>
                    <span className="text-warning">{(reduccionSel.columnasRequeridas * PRECIO_POR_COLUMNA).toFixed(2)} €</span>
                    <span className="text-primary">Garantía al {reduccionSel.nivel}</span>
                  </div>
                </div>
              </>
            )}

            {/* Alerta presupuesto */}
            {!viabilidad.viable && (
              <div className="bg-danger/10 border border-danger/25 rounded-2xl p-3 mb-4 text-xs text-danger flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation mt-0.5" />
                <span>Presupuesto estimado alto ({presupuesto.costo.toFixed(0)} €). Reduce triples o elige un nivel inferior.</span>
              </div>
            )}

            {/* Alerta reducción pendiente */}
            {modoModelo === '13' && PATRONES_MATRICES[reduccionSel.id]?.origen === 'pendiente' && (
              <div className="bg-amber-400/10 border border-amber-400/25 rounded-2xl p-3 mb-4 text-xs text-amber-400 flex items-start gap-2">
                <i className="fa-solid fa-clock mt-0.5" />
                <span>Esta reducción aún no está integrada. Requiere backend Python (OR-Tools CP-SAT).</span>
              </div>
            )}

            {/* Botón generar */}
            <button
              onClick={handleGenerar}
              disabled={triples + dobles === 0 || (modoModelo === '13' && PATRONES_MATRICES[reduccionSel.id]?.origen === 'pendiente')}
              className={`w-full py-4 rounded-3xl font-bold text-base transition-all duration-300
                ${triples + dobles > 0 && !(modoModelo === '13' && PATRONES_MATRICES[reduccionSel.id]?.origen === 'pendiente')
                  ? 'bg-gradient-to-r from-primary to-accent text-black shadow-neon hover:shadow-neon-lg hover:-translate-y-0.5 active:scale-95'
                  : 'bg-white/5 text-white/15 cursor-not-allowed'
                }`}
            >
              <i className={`fa-solid ${modoModelo === '14' ? 'fa-bolt' : 'fa-shield-halved'} mr-2`} />
              {modoModelo === '14' ? 'GENERAR DIRECTO' : 'USAR REDUCCIÓN OFICIAL'}
            </button>

            <div className="text-center text-[11px] text-white/25 mt-3">
              Genera tantas veces como necesites
            </div>

            {/* ─── RESULTADO ─── */}
            {resultado && (
              <div className="mt-6 bg-black/25 rounded-2xl p-4 border border-white/5 animate-slide-in">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {resultado.modelo === 14 ? 'Modelo 14' : `Oficial al ${nivel}`}
                  </span>
                  <span className="text-3xl font-bold text-success">{resultado.boletos.toLocaleString('es-ES')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="text-white/35">Ahorro <span className="text-primary font-bold ml-1">{resultado.ahorro}</span></div>
                  <div className="text-white/35 text-right">Precio <span className="text-warning font-bold ml-1">{resultado.precio}</span></div>
                </div>

                {/* Config visual compacta */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {resultado.config.map((s, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-bold w-7 h-7 flex items-center justify-center rounded-lg
                        ${s === '1X2' ? 'bg-accent/20 text-accent border border-accent/30' : ''}
                        ${s.length === 2 && s !== '1X2' ? 'bg-primary/20 text-primary border border-primary/30' : ''}
                        ${s.length === 1 ? 'bg-white/5 text-white/30' : ''}
                      `}
                      title={`P${i + 1}: ${s}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setColumnaPreview(resultado.columnas ?? []); setShowColumnas(true) }}
                  >
                    <i className="fa-solid fa-table-list" /> Boletos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { exportarCSV(resultado); pushToast('CSV descargado', 'success') }}
                  >
                    <i className="fa-solid fa-download" /> CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      const ok = await copiarPortapapeles(resultado)
                      pushToast(ok ? 'Copiado al portapapeles' : 'Error', ok ? 'success' : 'error')
                    }}
                  >
                    <i className="fa-solid fa-copy" /> Copiar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: BOLETOS VIRTUALES ─── */}
      {showColumnas && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/75 backdrop-blur-sm animate-fade-in" onClick={() => setShowColumnas(false)}>
          <div
            className="card-glass p-6 mx-4 w-full max-w-5xl max-h-[85vh] overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                🎫 Boletos Virtuales
                <span className="text-sm text-white/40 font-normal">({columnaPreview.length} columnas)</span>
              </h2>
              <button onClick={() => setShowColumnas(false)} className="text-white/40 hover:text-white text-xl transition-colors">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-white/5">
                    <th className="py-3 px-3 text-left text-white/30 font-medium">#</th>
                    {Array.from({ length: 14 }, (_, i) => (
                      <th key={i} className="py-3 px-2 text-center text-white/30 font-medium">P{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {columnaPreview.slice(0, 100).map((col, idx) => (
                    <tr key={idx} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-white/20">{idx + 1}</td>
                      {col.map((s, j) => {
                        const esTriple = s === '1X2'
                        const esDoble = s.length === 2 && s !== '1X2'
                        return (
                          <td
                            key={j}
                            className={`py-2.5 px-2 text-center font-bold
                              ${esTriple ? 'text-accent' : ''}
                              ${esDoble ? 'text-primary' : ''}
                              ${!esTriple && !esDoble ? 'text-white/50' : ''}
                            `}
                          >
                            {s}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {columnaPreview.length > 100 && (
              <p className="text-center text-white/25 text-xs mt-4">
                Mostrando 100 de {columnaPreview.length.toLocaleString('es-ES')} columnas
              </p>
            )}

            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowColumnas(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
