import { useState, useEffect, useRef, useCallback } from 'react'
import { PARTIDOS } from '../../shared/config/matches'
import { useStore } from '../../app/providers/store'
import { calcPremios } from '../../lib/quiniela'
import type { Signo } from '../../shared/types'

interface ResultadoPartido {
  golLocal: number
  golVisitante: number
  signoQuiniela: Signo  // 1 = local, X = empate, 2 = visitante
  finalizado: boolean
  minuto: number
}

interface Notificacion {
  id: number
  texto: string
  tipo: 'peligro' | 'exito' | 'gol' | 'final'
  timestamp: number
}

// Simular resultados iniciales
function generarResultadosIniciales(): ResultadoPartido[] {
  return PARTIDOS.map((p) => {
    const r = Math.random()
    const golLocal = Math.floor(Math.random() * 4)
    const golVisitante = Math.floor(Math.random() * 3)
    const signo: Signo = golLocal > golVisitante ? '1' : golLocal === golVisitante ? 'X' : '2'
    return {
      golLocal,
      golVisitante,
      signoQuiniela: signo,
      finalizado: Math.random() > 0.5,
      minuto: Math.floor(Math.random() * 95),
    }
  })
}

function simularGol(resultados: ResultadoPartido[], idx: number): ResultadoPartido[] {
  const nuevos = [...resultados]
  const p = nuevos[idx]
  if (p.finalizado) return nuevos
  if (Math.random() > 0.5) {
    p.golLocal++
  } else {
    p.golVisitante++
  }
  p.signoQuiniela = p.golLocal > p.golVisitante ? '1' : p.golLocal === p.golVisitante ? 'X' : '2'
  p.minuto = Math.min(95, p.minuto + Math.floor(Math.random() * 5))
  return nuevos
}

function simularFinal(resultados: ResultadoPartido[], idx: number): ResultadoPartido[] {
  const nuevos = [...resultados]
  nuevos[idx] = { ...nuevos[idx], finalizado: true, minuto: 95 }
  return nuevos
}

export default function Momento3Estadio() {
  const config = useStore((s) => s.config)
  const resultado = useStore((s) => s.resultado)
  const pushToast = useStore((s) => s.pushToast)

  const [resultados, setResultados] = useState<ResultadoPartido[]>(generarResultadosIniciales)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [modoSimulacion, setModoSimulacion] = useState(false)
  const [boteEstimado] = useState(4_200_000)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifId = useRef(0)

  const agregarNotificacion = useCallback((texto: string, tipo: Notificacion['tipo']) => {
    const id = ++notifId.current
    setNotificaciones((prev) => [{ id, texto, tipo, timestamp: Date.now() }, ...prev].slice(0, 10))
  }, [])

  // Calcular aciertos por boleto
  const aciertosPorBoleto = resultado?.columnas?.slice(0, 10).map((col) => {
    let aciertos = 0
    col.forEach((signoCol, i) => {
      if (signoCol === resultados[i].signoQuiniela ||
          (signoCol.length === 2 && signoCol.includes(resultados[i].signoQuiniela)) ||
          signoCol === '1X2') {
        aciertos++
      }
    })
    return aciertos
  }) ?? []

  const maxAciertos = aciertosPorBoleto.length > 0 ? Math.max(...aciertosPorBoleto) : 0
  const premioInfo = calcPremios(maxAciertos, boteEstimado)
  const partidosFinalizados = resultados.filter((r) => r.finalizado).length
  const partidosEnJuego = resultados.filter((r) => !r.finalizado).length

  const iniciarSimulacion = () => {
    if (modoSimulacion) {
      // Detener
      if (intervaloRef.current) clearInterval(intervaloRef.current)
      setModoSimulacion(false)
      return
    }

    setModoSimulacion(true)
    agregarNotificacion('🎮 Simulación Live iniciada — siguiendo los 14 partidos en tiempo real', 'exito')

    intervaloRef.current = setInterval(() => {
      setResultados((prev) => {
        const enJuego = prev.map((p, i) => ({ ...p, idx: i })).filter((p) => !p.finalizado)
        if (enJuego.length === 0) {
          if (intervaloRef.current) clearInterval(intervaloRef.current)
          setModoSimulacion(false)
          return prev
        }

        const partido = enJuego[Math.floor(Math.random() * enJuego.length)]
        let nuevos = [...prev]

        // 30% probabilidad de que termine
        if (Math.random() < 0.3) {
          nuevos = simularFinal(nuevos, partido.idx)
          const p = PARTIDOS[partido.idx]
          const r = nuevos[partido.idx]
          agregarNotificacion(
            `🏁 FINAL: ${p.local} ${r.golLocal}-${r.golVisitante} ${p.visitante} → Signo ${r.signoQuiniela}`,
            'final',
          )
        } else {
          nuevos = simularGol(nuevos, partido.idx)
          const p = PARTIDOS[partido.idx]
          const r = nuevos[partido.idx]
          agregarNotificacion(
            `⚽ GOL: ${p.local} ${r.golLocal}-${r.golVisitante} ${p.visitante} (min ${r.minuto}')`,
            'gol',
          )
        }

        return nuevos
      })
    }, 2500 + Math.random() * 2000)
  }

  // Cleanup
  useEffect(() => {
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current) }
  }, [])

  const signoColor = (s: Signo): string => {
    if (s === '1X2') return 'bg-accent/20 text-accent'
    if (s.length === 2) return 'bg-primary/20 text-primary'
    return 'bg-white/10 text-white/70'
  }

  return (
    <section className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal: Marcador */}
        <div className="lg:col-span-2">
          {/* Header controles */}
          <div className="card-glass p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                <i className="fa-solid fa-tower-cell text-primary animate-pulse-neon" />
                Estadio Virtual
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">{partidosEnJuego}</span>
                  <span className="text-white/40">en juego</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="text-white/50 font-bold">{partidosFinalizados}</span>
                  <span className="text-white/30">finalizados</span>
                </div>
                <button
                  onClick={iniciarSimulacion}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                    modoSimulacion
                      ? 'bg-red-400/20 border border-red-400/40 text-red-400'
                      : 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20'
                  }`}
                >
                  <i className={`fa-solid ${modoSimulacion ? 'fa-stop' : 'fa-play'} mr-2`} />
                  {modoSimulacion ? 'Detener Live' : 'Iniciar Simulación'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de partidos */}
          <div className="card-glass p-6 mb-6">
            <h3 className="text-lg font-bold font-heading mb-4">
              <i className="fa-solid fa-futbol text-primary mr-2" />
              Marcador en Vivo
            </h3>

            <div className="divide-y divide-white/5">
              {resultados.map((res, i) => {
                const p = PARTIDOS[i]
                const cfg = config[i]
                const acertado = cfg === '1X2' || cfg.includes(res.signoQuiniela)

                return (
                  <div
                    key={i}
                    className={`py-4 flex items-center gap-3 transition-all ${
                      res.finalizado ? 'opacity-60' : ''
                    } ${!acertado && res.finalizado ? 'bg-red-400/5 -mx-4 px-4 rounded-xl' : ''}`}
                  >
                    {/* Nº y estado */}
                    <div className="w-16 flex-shrink-0">
                      <div className="text-[10px] text-white/30">P{i + 1}</div>
                      <div className="text-[10px] font-bold">
                        {res.finalizado ? (
                          <span className="text-white/40">FINAL</span>
                        ) : (
                          <span className="text-emerald-400 animate-pulse">{res.minuto}'</span>
                        )}
                      </div>
                    </div>

                    {/* Equipos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="truncate font-medium">{p.local}</span>
                        <span className="text-white/20">{p.escudoLocal}</span>
                        <span className={`text-lg font-bold mx-2 ${!res.finalizado ? 'text-white' : 'text-white/50'}`}>
                          {res.golLocal} - {res.golVisitante}
                        </span>
                        <span className="text-white/20">{p.escudoVisitante}</span>
                        <span className="truncate font-medium">{p.visitante}</span>
                      </div>
                    </div>

                    {/* Signo resultado */}
                    <div className="w-16 text-center">
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                        res.signoQuiniela === '1' ? 'bg-emerald-400/20 text-emerald-400' :
                        res.signoQuiniela === 'X' ? 'bg-amber-400/20 text-amber-400' :
                        'bg-blue-400/20 text-blue-400'
                      }`}>
                        {res.signoQuiniela}
                      </span>
                    </div>

                    {/* Tu pronóstico */}
                    <div className="w-16 text-center">
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${signoColor(cfg)}`}>
                        {cfg}
                      </span>
                    </div>

                    {/* Check */}
                    <div className="w-10 text-center">
                      {res.finalizado ? (
                        acertado ? (
                          <i className="fa-solid fa-check text-emerald-400" />
                        ) : (
                          <i className="fa-solid fa-xmark text-red-400" />
                        )
                      ) : (
                        <span className="text-white/10">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna lateral: Aciertos y Premios */}
        <div className="lg:col-span-1">
          {/* Aciertos por boleto */}
          {resultado && resultado.columnas && (
            <div className="card-glass p-6 mb-6">
              <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                <i className="fa-solid fa-ticket text-accent" />
                Tus Boletos ({Math.min(resultado.boletos, 10)} primeros)
              </h3>

              {aciertosPorBoleto.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-4">
                  Genera una reducida en El Arquitecto para ver tus boletos aquí.
                </div>
              ) : (
                <div className="space-y-2">
                  {aciertosPorBoleto.map((aciertos, idx) => {
                    const pct = ((aciertos / partidosFinalizados) * 100 || 0).toFixed(0)
                    return (
                      <div key={idx} className="bg-black/20 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-xs text-white/30">Boleto {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <div className="progress-cyber w-24">
                            <div
                              className="progress-cyber-fill"
                              style={{ width: `${(aciertos / 14) * 100}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${
                            aciertos >= 12 ? 'text-emerald-400' :
                            aciertos >= 10 ? 'text-amber-400' :
                            'text-white/60'
                          }`}>
                            {aciertos}/14
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {aciertosPorBoleto.length < (resultado.boletos) && (
                    <div className="text-center text-white/20 text-xs py-2">
                      ... y {resultado.boletos - aciertosPorBoleto.length} boletos más
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Premios proyectados */}
          <div className="card-glass p-6 mb-6">
            <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
              <i className="fa-solid fa-sack-dollar text-amber-400" />
              Premios Proyectados
            </h3>

            {resultado ? (
              <div className="space-y-3">
                <div className="bg-black/20 rounded-2xl p-4 text-center">
                  <div className="text-white/40 text-xs mb-1">Mejor Boleto</div>
                  <div className="text-4xl font-bold" style={{ color: premioInfo.color }}>
                    {maxAciertos}
                    <span className="text-lg text-white/40">/14</span>
                  </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-4">
                  <div className="text-white/40 text-xs mb-2">Proyección de premios</div>
                  {[13, 12, 11, 10].map((n) => {
                    const info = calcPremios(n, boteEstimado)
                    const alcanzado = maxAciertos >= n
                    return (
                      <div key={n} className={`flex justify-between py-2 border-b border-white/5 text-sm ${alcanzado ? '' : 'opacity-30'}`}>
                        <span>{info.nivel}</span>
                        <span className="font-bold" style={{ color: alcanzado ? info.color : undefined }}>
                          {info.premio}
                          {alcanzado && ' ✅'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="text-xs text-white/30 text-center">
                  Bote estimado: {(boteEstimado / 1_000_000).toFixed(1)}M €
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm text-center py-8">
                Genera una reducida para ver la proyección de premios.
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <div className="card-glass p-6">
            <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
              <i className="fa-solid fa-bell text-accent" />
              Alertas Live
            </h3>

            {notificaciones.length === 0 ? (
              <div className="text-white/20 text-sm text-center py-8">
                Inicia la simulación para recibir alertas de goles y finales.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notificaciones.map((n) => {
                  const seg = Math.round((Date.now() - n.timestamp) / 1000)
                  const tiempo = seg < 60 ? `${seg}s` : `${Math.round(seg / 60)}min`
                  const iconos: Record<string, string> = {
                    gol: '⚽',
                    final: '🏁',
                    peligro: '⚠️',
                    exito: '✅',
                  }
                  return (
                    <div key={n.id} className="bg-black/20 rounded-xl p-3 flex gap-2 items-start animate-slide-in">
                      <span className="text-sm">{iconos[n.tipo]}</span>
                      <span className="text-xs text-white/70 flex-1">{n.texto}</span>
                      <span className="text-[10px] text-white/20 flex-shrink-0">{tiempo}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
