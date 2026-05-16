import { useState, useRef } from 'react'
import { useStore } from '../../app/providers/store'
import { exportarTexto } from '../../shared/lib/export'
import Modal from '../../shared/ui/Modal'
import type { Vaquita } from '../../shared/types'

/* ===== SIMULACIÓN OCR ===== */
function simularOCR(): string[] {
  const opciones = ['1', 'X', '2', '1X', '1X2']
  return Array.from({ length: 14 }, () => opciones[Math.floor(Math.random() * opciones.length)])
}

export default function Momento2Notario() {
  const config = useStore((s) => s.config)
  const resultado = useStore((s) => s.resultado)
  const pushToast = useStore((s) => s.pushToast)
  const vaquitas = useStore((s) => s.vaquitas)
  const agregarVaquita = useStore((s) => s.agregarVaquita)
  const eliminarVaquita = useStore((s) => s.eliminarVaquita)
  const actualizarPagoVaquita = useStore((s) => s.actualizarPagoVaquita)
  const gastarTokens = useStore((s) => s.gastarTokens)

  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [escaneado, setEscaneado] = useState<string[] | null>(null)
  const [escanenado, setEscanenado] = useState(false)
  const [showVaquitas, setShowVaquitas] = useState(false)
  const [nuevaVaquitaNombre, setNuevaVaquitaNombre] = useState('')
  const [nuevaVaquitaBoletos, setNuevaVaquitaBoletos] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubirImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagenPreview(url)
    setEscaneado(null)
  }

  const handleEscanear = () => {
    if (!imagenPreview) {
      pushToast('Sube una imagen del boleto primero', 'warning')
      return
    }
    if (!gastarTokens(1)) {
      pushToast('Necesitas 1 token para escanear', 'warning')
      return
    }
    setEscanenado(true)
    setTimeout(() => {
      const leido = simularOCR()
      setEscaneado(leido)
      setEscanenado(false)
      pushToast('Escaneo completado. Revisa los signos detectados.', 'success')
    }, 1800 + Math.random() * 1500)
  }

  const handleImportarTuLotero = () => {
    if (!gastarTokens(1)) {
      pushToast('Necesitas 1 token para importar', 'warning')
      return
    }
    setImagenPreview(null)
    setEscaneado(null)
    setEscanenado(true)
    setTimeout(() => {
      const leido = simularOCR()
      setEscaneado(leido)
      setImagenPreview(null)
      setEscanenado(false)
      pushToast('Screenshot de TuLotero importado y analizado', 'success')
    }, 1500 + Math.random() * 1000)
  }

  // Comparar escaneado vs planificado
  const diferencias = escaneado
    ? escaneado.map((s, i) => ({ idx: i, escaneado: s, planificado: config[i], coincide: s === config[i] || config[i] === '1X2' || config[i].includes(s) }))
    : []

  const handleAgregarVaquita = () => {
    if (!nuevaVaquitaNombre.trim()) return
    const nueva: Vaquita = {
      id: crypto.randomUUID(),
      nombre: nuevaVaquitaNombre.trim(),
      boletos: nuevaVaquitaBoletos,
      pagado: 0,
      total: nuevaVaquitaBoletos * 0.75,
      color: ['#00f0ff', '#ff00cc', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'][Math.floor(Math.random() * 6)],
    }
    agregarVaquita(nueva)
    setNuevaVaquitaNombre('')
    pushToast(`Vaquita "${nueva.nombre}" creada`, 'success')
  }

  const generarTextoWhatsApp = (): string => {
    let txt = '💸 *VAQUITAS QUINIELA 2026*\n\n'
    vaquitas.forEach((v) => {
      const pct = v.total > 0 ? ((v.pagado / v.total) * 100).toFixed(0) : '0'
      txt += `👤 ${v.nombre}: ${v.boletos} bol. — ${v.total.toFixed(2)} € (pagado: ${v.pagado.toFixed(2)} € / ${pct}%)\n`
    })
    const totalVaq = vaquitas.reduce((acc, v) => acc + v.total, 0)
    const totalPagado = vaquitas.reduce((acc, v) => acc + v.pagado, 0)
    txt += `\n💰 Total: ${totalVaq.toFixed(2)} € | Recibido: ${totalPagado.toFixed(2)} €`
    return txt
  }

  const copiarWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(generarTextoWhatsApp())
      pushToast('Resumen copiado para WhatsApp', 'success')
    } catch {
      pushToast('Error al copiar', 'error')
    }
  }

  return (
    <section className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Escaneo e Importación */}
        <div>
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
              <i className="fa-solid fa-camera-retro text-primary" />
              Escanear Boleto
            </h2>

            {/* Zona de subida */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleSubirImagen}
              className="hidden"
            />

            {!imagenPreview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-white/20 hover:border-primary/60 rounded-2xl p-12 text-center transition-all"
              >
                <div className="text-5xl mb-3">📸</div>
                <div className="text-white/50 text-sm">Toca para subir foto del boleto</div>
                <div className="text-white/20 text-xs mt-1">JPG, PNG, HEIC</div>
              </button>
            ) : (
              <div className="rounded-2xl overflow-hidden mb-4">
                <img src={imagenPreview} alt="Boleto subido" className="w-full h-48 object-cover" />
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEscanear}
                disabled={!imagenPreview || escanenado}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                  imagenPreview && !escanenado
                    ? 'btn-primary'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                {escanenado ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner animate-spin" /> Escaneando...
                  </span>
                ) : (
                  <span><i className="fa-solid fa-wand-magic-sparkles mr-2" />Escanear (1 token)</span>
                )}
              </button>
              <button
                onClick={handleImportarTuLotero}
                disabled={escanenado}
                className="flex-1 border border-white/20 hover:border-primary text-white/60 hover:text-primary py-4 rounded-2xl font-semibold transition-all text-sm"
              >
                <i className="fa-solid fa-file-import mr-2" />Importar TuLotero
              </button>
            </div>
          </div>

          {/* Resultados del escaneo */}
          {escaneado && (
            <div className="card-glass p-6 mb-6 animate-slide-in">
              <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                <i className="fa-solid fa-check-double text-emerald-400" />
                Signos Detectados
              </h3>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {escaneado.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-xl py-2 px-1 text-center text-xs font-bold ${
                      s === '1X2' ? 'bg-accent/30 text-accent border border-accent/50' :
                      s.length === 2 ? 'bg-primary/20 text-primary border border-primary/40' :
                      'bg-white/10 text-white/70'
                    }`}
                  >
                    <div className="text-[10px] opacity-60">P{i + 1}</div>
                    {s}
                  </div>
                ))}
              </div>

              {/* Validador de estrategia */}
              {resultado && (
                <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-emerald-400 mb-3">
                    <i className="fa-solid fa-clipboard-check mr-2" />Validador de Estrategia
                  </h4>
                  <div className="space-y-2 text-sm">
                    {diferencias.map((d) => (
                      <div key={d.idx} className="flex items-center gap-2">
                        <span className={`text-xs ${d.coincide ? 'text-emerald-400' : 'text-red-400'}`}>
                          {d.coincide ? '✅' : '❌'}
                        </span>
                        <span className="text-white/40 text-xs">P{d.idx + 1}:</span>
                        <span className="text-xs">Escaneado <strong className="text-primary">{d.escaneado}</strong></span>
                        <span className="text-white/20">vs</span>
                        <span className="text-xs">Plan <strong className="text-accent">{d.planificado}</strong></span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-sm font-bold">
                      Coincidencia: {' '}
                      <span className={diferencias.filter((d) => d.coincide).length >= 10 ? 'text-emerald-400' : 'text-amber-400'}>
                        {diferencias.filter((d) => d.coincide).length}/14 partidos
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vaquitas Manager */}
        <div>
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
              <i className="fa-solid fa-people-group text-accent" />
              Vaquitas
            </h2>

            {/* Agregar */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={nuevaVaquitaNombre}
                onChange={(e) => setNuevaVaquitaNombre(e.target.value)}
                placeholder="Nombre del dueño"
                className="cyber-input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAgregarVaquita()}
              />
              <input
                type="number"
                value={nuevaVaquitaBoletos}
                onChange={(e) => setNuevaVaquitaBoletos(Math.max(1, parseInt(e.target.value) || 1))}
                className="cyber-input w-20 text-center"
                min={1}
                max={100}
              />
              <button onClick={handleAgregarVaquita} className="btn-primary px-4 text-sm">
                <i className="fa-solid fa-plus" />
              </button>
            </div>

            {/* Lista */}
            {vaquitas.length === 0 ? (
              <div className="text-center text-white/30 py-8 text-sm">
                No hay vaquitas registradas. Agrega dueños de boletos.
              </div>
            ) : (
              <div className="space-y-3">
                {vaquitas.map((v) => {
                  const pct = v.total > 0 ? ((v.pagado / v.total) * 100).toFixed(0) : '0'
                  return (
                    <div key={v.id} className="bg-black/20 rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                          <span className="font-semibold text-sm">{v.nombre}</span>
                        </div>
                        <button
                          onClick={() => eliminarVaquita(v.id)}
                          className="text-white/20 hover:text-red-400 text-xs"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>{v.boletos} boletos</span>
                        <span>{v.total.toFixed(2)} €</span>
                      </div>
                      <div className="progress-cyber mb-2">
                        <div className="progress-cyber-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400 font-bold">{v.pagado.toFixed(2)} € pagado</span>
                        <span className="text-white/30">{pct}%</span>
                        <div className="flex gap-1">
                          {[1, 2, 5, 10].map((cant) => (
                            <button
                              key={cant}
                              onClick={() => actualizarPagoVaquita(v.id, Math.min(v.total, v.pagado + cant))}
                              className="bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary px-1.5 py-0.5 rounded-lg transition-all"
                            >
                              +{cant}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {vaquitas.length > 0 && (
              <button
                onClick={copiarWhatsApp}
                className="w-full mt-4 bg-emerald-400/10 border border-emerald-400/30 hover:bg-emerald-400/20 text-emerald-400 font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-brands fa-whatsapp" /> Copiar Resumen para WhatsApp
              </button>
            )}
          </div>

          {/* Botones de exportación global */}
          {resultado && (
            <div className="card-glass p-6">
              <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                <i className="fa-solid fa-file-export text-primary" />
                Exportar Quiniela Actual
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(exportarTexto(resultado))
                      pushToast('Copiado al portapapeles', 'success')
                    } catch {
                      pushToast('Error al copiar', 'error')
                    }
                  }}
                  className="w-full border border-white/20 hover:border-primary text-white/60 hover:text-primary py-3 rounded-2xl font-semibold transition-all"
                >
                  <i className="fa-solid fa-copy mr-2" /> Copiar Texto
                </button>
                <button
                  onClick={() => pushToast('Exportar como imagen: funcionalidad disponible próximamente con integración html2canvas', 'info')}
                  className="w-full border border-white/20 hover:border-primary text-white/60 hover:text-primary py-3 rounded-2xl font-semibold transition-all"
                >
                  <i className="fa-solid fa-image mr-2" /> Exportar Imagen PNG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
