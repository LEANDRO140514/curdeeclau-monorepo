import { useState, useMemo } from 'react'
import { PARTIDOS } from '../../shared/config/matches'
import { useStore } from '../../app/providers/store'
import Modal from '../../shared/ui/Modal'

/* ===== CHAT SIMULADO DE LEANDRO (ASISTENTE IA) ===== */
const LEANDRO_RESPUESTAS: Record<string, string> = {
  default: '¡Buenas, quinielero! 🧠 Soy Leandro, tu asistente IA. Analizo la jornada y te recomiendo la mejor reducción. Pregúntame: "recomendación", "dificultad", "bote", o dime un partido concreto.',
  recomendacion: '📊 Esta semana recomiendo 4 Triples en los partidos más inciertos (Derbi Vasco, Betis-Valencia, Las Palmas-Espanyol, Boca-River) y 3 Dobles (Clásico, City-Arsenal, Girona-Villarreal). Así cubrimos las zonas rojas con solo 24 boletos usando la Reducción 3. ¡Eficiencia máxima!',
  dificultad: '🔍 La jornada tiene un índice de dificultad de 7.3/10. Hay 4 partidos "rojos" (muy inciertos), 6 "amarillos" y solo 4 "verdes". El bote podría acumularse si fallan los favoritos.',
  bote: '💰 Bote estimado: MXN 4.2M para el pleno al 14. Con esta dificultad, el premio al 13 podría rondar los MXN 15,000-25,000. Vale la pena jugar reducciones al 13.',
  clasico: '🔥 Real Madrid vs Barcelona: El Clásico siempre es impredecible. H2H reciente favorece ligeramente al Madrid en casa, pero el Barça llega en racha. Recomiendo DOBLE (1X).',
  partido: 'Dime qué número de partido (1-14) quieres que analice en detalle.',
}

function generarRespuestaLeandro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('recomend') || m.includes('sugerir') || m.includes('mejor')) return LEANDRO_RESPUESTAS.recomendacion
  if (m.includes('dificil') || m.includes('dificul')) return LEANDRO_RESPUESTAS.dificultad
  if (m.includes('bote') || m.includes('premio') || m.includes('dinero')) return LEANDRO_RESPUESTAS.bote
  if (m.includes('madrid') || m.includes('barcelona') || m.includes('clasico') || m.includes('clásico')) return LEANDRO_RESPUESTAS.clasico
  if (m.includes('partido') || /p\s*\d{1,2}/.test(m)) return LEANDRO_RESPUESTAS.partido
  return LEANDRO_RESPUESTAS.default
}

/* ===== COMPONENTES INTERNOS ===== */

function TrafficLight({ dificultad }: { dificultad: 'verde' | 'amarillo' | 'rojo' }) {
  const labels = { verde: 'Favorito claro', amarillo: 'Incierto', rojo: 'Alta incertidumbre' }
  return (
    <div className="flex items-center gap-2">
      <span className={`semaforo-dot semaforo-${dificultad}`} />
      <span className={`text-xs font-medium text-${dificultad === 'verde' ? 'emerald' : dificultad === 'amarillo' ? 'amber' : 'red'}-400`}>
        {labels[dificultad]}
      </span>
    </div>
  )
}

function FormaBadge({ resultados }: { resultados: ('V' | 'E' | 'D')[] }) {
  const colors: Record<string, string> = { V: 'bg-emerald-500 text-black', E: 'bg-amber-400 text-black', D: 'bg-red-400 text-black' }
  return (
    <div className="flex gap-1">
      {resultados.map((r, i) => (
        <span key={i} className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center ${colors[r]}`}>{r}</span>
      ))}
    </div>
  )
}

function VoteBar({ matchIdx }: { matchIdx: number }) {
  const votos = useStore((s) => s.votos)
  const votar = useStore((s) => s.votar)
  const pushToast = useStore((s) => s.pushToast)
  const v = votos[matchIdx] ?? { 1: 0, X: 0, 2: 0 }
  const total = v[1] + v['X'] + v[2] || 1
  const max = Math.max(v[1], v['X'], v[2]) || 1

  const handleVote = (signo: '1' | 'X' | '2') => {
    votar(matchIdx, signo)
    pushToast(`Votaste ${signo} en el partido ${matchIdx + 1}`, 'info')
  }

  return (
    <div className="mt-2">
      <div className="flex items-end gap-1 h-10 mb-1">
        {(['1', 'X', '2'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleVote(s)}
            className={`flex-1 rounded-t-lg transition-all hover:opacity-80 ${v[s] === max && v[s] > 0 ? 'bg-primary' : 'bg-white/10'}`}
            style={{ height: `${Math.max(20, (v[s] / total) * 100)}%` }}
            title={`${s}: ${v[s]} votos`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-white/40">
        <span>1 ({v[1]})</span>
        <span>X ({v['X']})</span>
        <span>2 ({v[2]})</span>
      </div>
    </div>
  )
}

/* ===== MOMENTO 0 PRINCIPAL ===== */
export default function Momento0Oraculo() {
  const [leandroOpen, setLeandroOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<{ role: 'user' | 'leandro'; text: string }[]>([
    { role: 'leandro', text: '¡Hola! Soy Leandro 🧠. Pregúntame sobre la jornada, recomendaciones de reducidas, o el bote estimado.' },
  ])
  const [inputChat, setInputChat] = useState('')
  const pushToast = useStore((s) => s.pushToast)

  const handleChat = () => {
    if (!inputChat.trim()) return
    const userMsg = inputChat.trim()
    setChatMsgs((prev) => [...prev, { role: 'user', text: userMsg }])
    setInputChat('')
    setTimeout(() => {
      setChatMsgs((prev) => [...prev, { role: 'leandro', text: generarRespuestaLeandro(userMsg) }])
    }, 800 + Math.random() * 1200)
  }

  // Calcular datos del Value Calculator
  const valueData = useMemo(() => {
    const rojos = PARTIDOS.filter((p) => p.dificultad === 'rojo').length
    const amarillos = PARTIDOS.filter((p) => p.dificultad === 'amarillo').length
    const boteEst = rojos >= 4 ? 4_200_000 : rojos >= 2 ? 2_100_000 : 800_000
    const dificultad = rojos >= 4 ? 'ALTA' : rojos >= 2 ? 'MEDIA' : 'BAJA'
    return { rojos, amarillos, verdes: 14 - rojos - amarillos, boteEst, dificultad }
  }, [])

  return (
    <section className="py-6">
      {/* Value Calculator */}
      <div className="card-glass p-6 mb-8">
        <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
          <i className="fa-solid fa-calculator text-primary" />
          Calculadora de Valor
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div className="bg-black/30 rounded-2xl p-4">
            <div className="text-sm text-white/40 mb-1">Dificultad</div>
            <div className={`text-2xl font-bold ${valueData.dificultad === 'ALTA' ? 'text-red-400' : valueData.dificultad === 'MEDIA' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {valueData.dificultad}
            </div>
          </div>
          <div className="bg-black/30 rounded-2xl p-4">
            <div className="text-sm text-white/40 mb-1">Partidos Rojos</div>
            <div className="text-2xl font-bold text-red-400">{valueData.rojos}/14</div>
          </div>
          <div className="bg-black/30 rounded-2xl p-4">
            <div className="text-sm text-white/40 mb-1">Amarillos</div>
            <div className="text-2xl font-bold text-amber-400">{valueData.amarillos}/14</div>
          </div>
          <div className="bg-black/30 rounded-2xl p-4">
            <div className="text-sm text-white/40 mb-1">Bote Estimado</div>
            <div className="text-2xl font-bold text-accent">{(valueData.boteEst / 1_000_000).toFixed(1)}M MXN</div>
          </div>
          <div className="bg-black/30 rounded-2xl p-4">
            <div className="text-sm text-white/40 mb-1">Recomendación</div>
            <div className="text-lg font-bold text-primary">
              {valueData.rojos >= 4 ? '4 Triples' : valueData.rojos >= 2 ? '3 Triples + 3 Dobles' : 'Directa'}
            </div>
          </div>
        </div>
      </div>

      {/* Match Grid */}
      <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
        <i className="fa-solid fa-futbol text-primary" />
        Partidos de la Jornada
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {PARTIDOS.map((partido) => (
          <div key={partido.id} className="card-glass p-5 hover:shadow-neon transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  P{partido.id}
                </span>
                <span className="text-[10px] text-white/40">{partido.dia} · {partido.hora}</span>
              </div>
              <TrafficLight dificultad={partido.dificultad} />
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{partido.escudoLocal}</span>
                <span className="font-semibold text-sm leading-tight">{partido.local}</span>
              </div>
              <span className="text-white/20 text-xs font-bold">VS</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm leading-tight text-right">{partido.visitante}</span>
                <span className="text-2xl">{partido.escudoVisitante}</span>
              </div>
            </div>

            {/* H2H + Form */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-black/20 rounded-xl p-3 text-center">
                <div className="text-[10px] text-white/30 mb-1">H2H (últimos 5)</div>
                <div className="flex justify-center gap-2 text-xs font-bold">
                  <span className="text-emerald-400">{partido.h2h.local} local</span>
                  <span className="text-amber-400">{partido.h2h.empate} E</span>
                  <span className="text-red-400">{partido.h2h.visitante} visit</span>
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-3 text-center">
                <div className="text-[10px] text-white/30 mb-1">Momios (1 X 2)</div>
                <div className="flex justify-center gap-2 text-xs font-mono">
                  <span className="text-white/80">{partido.momio.uno.toFixed(1)}</span>
                  <span className="text-white/50">{partido.momio.equis.toFixed(1)}</span>
                  <span className="text-white/80">{partido.momio.dos.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Forma */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 min-w-[40px]">Local:</span>
                <FormaBadge resultados={partido.formaLocal} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 min-w-[40px] text-right">Visit:</span>
                <FormaBadge resultados={partido.formaVisitante} />
              </div>
            </div>

            {/* Vote */}
            <VoteBar matchIdx={partido.id - 1} />
          </div>
        ))}
      </div>

      {/* Botón Leandro flotante */}
      <button
        onClick={() => setLeandroOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-3xl shadow-neon hover:shadow-neon hover:scale-110 transition-all animate-float"
        title="Hablar con Leandro"
      >
        🧠
      </button>

      {/* Chat Modal */}
      <Modal open={leandroOpen} onClose={() => setLeandroOpen(false)} title="🧠 Leandro — Asistente IA">
        <div className="bg-black/30 rounded-2xl p-4 h-80 overflow-y-auto flex flex-col gap-3 mb-4">
          {chatMsgs.map((msg, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${
                msg.role === 'leandro'
                  ? 'bg-primary/10 border border-primary/20 self-start text-white/90'
                  : 'bg-accent/20 border border-accent/30 self-end text-white/90 ml-auto'
              }`}
            >
              {msg.role === 'leandro' && <span className="text-xs font-bold text-primary block mb-1">Leandro:</span>}
              {msg.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputChat}
            onChange={(e) => setInputChat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            placeholder='Ej: "recomendación", "bote", "dificultad"...'
            className="cyber-input flex-1"
          />
          <button onClick={handleChat} className="btn-primary px-6">
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </Modal>
    </section>
  )
}
