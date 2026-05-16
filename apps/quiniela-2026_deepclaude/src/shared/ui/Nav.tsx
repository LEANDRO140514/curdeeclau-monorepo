import { useStore } from '../../app/providers/store'
import type { FaseApp } from '../types'

const TABS: { id: FaseApp; emoji: string; label: string }[] = [
  { id: 0, emoji: '🔮', label: 'El Oráculo' },
  { id: 1, emoji: '🏗️', label: 'El Arquitecto' },
  { id: 2, emoji: '📜', label: 'El Notario' },
  { id: 3, emoji: '🏟️', label: 'El Estadio' },
]

export default function Nav() {
  const fase = useStore((s) => s.fase)
  const setFase = useStore((s) => s.setFase)

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-dark/85 border-b border-primary/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Logo + Título */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-xl shadow-neon">
              ⚽
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading text-2xl font-bold neon-text tracking-tight leading-none">
                QUINIELA
              </h1>
              <span className="text-primary text-xs font-bold tracking-widest">2026</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 bg-white/5 rounded-3xl p-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const activo = fase === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setFase(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-3xl text-sm font-semibold whitespace-nowrap
                    transition-all duration-300
                    ${activo
                      ? 'bg-gradient-to-r from-primary to-accent text-black shadow-neon'
                      : 'text-white/50 hover:text-white hover:bg-white/8'
                    }
                  `}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Versión mobile: solo texto del tab activo */}
          <div className="md:hidden text-right flex-shrink-0 ml-2">
            <span className="text-xs text-white/30">Momento {fase}</span>
            <div className="text-sm font-semibold text-primary">
              {TABS[fase].label}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
