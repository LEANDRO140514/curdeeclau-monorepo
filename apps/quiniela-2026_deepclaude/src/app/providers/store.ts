import { create } from 'zustand'
import type { Signo, FaseApp, BoletosGenerados, Vaquita, QuinielaRecord, VoteState, ToastMsg } from '../../shared/types'

/* ===== LOCAL STORAGE PERSISTENCE ===== */
function load<K extends string, V>(key: K, fallback: V): V {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as V) : fallback
  } catch {
    return fallback
  }
}
function save<K extends string>(key: K, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota exceeded */ }
}

/* ===== STORE ===== */
export interface AppState {
  // Navegación
  fase: FaseApp
  setFase: (f: FaseApp) => void

  // Configuración de partidos
  config: Signo[]
  setSigno: (idx: number, signo: Signo) => void
  resetConfig: () => void

  // Resultado generado
  resultado: BoletosGenerados | null
  setResultado: (r: BoletosGenerados | null) => void

  // Tokens / monedero
  tokens: number
  gastarTokens: (cantidad: number) => boolean
  agregarTokens: (cantidad: number) => void

  // Historial
  historial: QuinielaRecord[]
  agregarHistorial: (r: QuinielaRecord) => void
  borrarHistorial: () => void

  // Vaquitas
  vaquitas: Vaquita[]
  agregarVaquita: (v: Vaquita) => void
  eliminarVaquita: (id: string) => void
  actualizarPagoVaquita: (id: string, pagado: number) => void

  // Votos comunitarios (por índice de partido)
  votos: Record<number, VoteState>
  votar: (matchIdx: number, signo: '1' | 'X' | '2') => void

  // Toasts
  toasts: ToastMsg[]
  pushToast: (text: string, type?: ToastMsg['type']) => void
  popToast: (id: number) => void
}

let toastId = 0

export const useStore = create<AppState>((set, get) => ({
  fase: 0,
  setFase: (f) => set({ fase: f }),

  config: load('q6_config', Array<Signo>(14).fill('1')),
  setSigno: (idx, signo) => {
    const cfg = [...get().config]
    cfg[idx] = signo
    set({ config: cfg })
    save('q6_config', cfg)
  },
  resetConfig: () => {
    const cfg = Array<Signo>(14).fill('1')
    set({ config: cfg })
    save('q6_config', cfg)
  },

  resultado: null,
  setResultado: (r) => set({ resultado: r }),

  tokens: load('q6_tokens', 100),
  gastarTokens: (cantidad) => {
    const actual = get().tokens
    if (actual < cantidad) return false
    const nuevo = actual - cantidad
    set({ tokens: nuevo })
    save('q6_tokens', nuevo)
    return true
  },
  agregarTokens: (cantidad) => {
    const nuevo = get().tokens + cantidad
    set({ tokens: nuevo })
    save('q6_tokens', nuevo)
  },

  historial: load('q6_historial', []),
  agregarHistorial: (r) => {
    const h = [r, ...get().historial].slice(0, 50)
    set({ historial: h })
    save('q6_historial', h)
  },
  borrarHistorial: () => {
    set({ historial: [] })
    save('q6_historial', [])
  },

  vaquitas: load('q6_vaquitas', []),
  agregarVaquita: (v) => {
    const va = [...get().vaquitas, v]
    set({ vaquitas: va })
    save('q6_vaquitas', va)
  },
  eliminarVaquita: (id) => {
    const va = get().vaquitas.filter((v) => v.id !== id)
    set({ vaquitas: va })
    save('q6_vaquitas', va)
  },
  actualizarPagoVaquita: (id, pagado) => {
    const va = get().vaquitas.map((v) => (v.id === id ? { ...v, pagado } : v))
    set({ vaquitas: va })
    save('q6_vaquitas', va)
  },

  votos: load('q6_votos', {} as Record<number, VoteState>),
  votar: (matchIdx, signo) => {
    const votos = { ...get().votos }
    if (!votos[matchIdx]) votos[matchIdx] = { 1: 0, X: 0, 2: 0 }
    votos[matchIdx][signo]++
    set({ votos })
    save('q6_votos', votos)
  },

  toasts: [],
  pushToast: (text, type = 'info') => {
    const id = ++toastId
    const toast: ToastMsg = { id, text, type }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    setTimeout(() => get().popToast(id), 4000)
  },
  popToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
