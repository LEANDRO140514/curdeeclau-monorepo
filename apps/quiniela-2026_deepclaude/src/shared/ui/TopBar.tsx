import { useStore } from '../../app/providers/store'
import { useState } from 'react'

export default function TopBar() {
  const tokens = useStore((s) => s.tokens)
  const historial = useStore((s) => s.historial)
  const agregarTokens = useStore((s) => s.agregarTokens)
  const pushToast = useStore((s) => s.pushToast)
  const [showShop, setShowShop] = useState(false)

  const comprarTokens = (cantidad: number) => {
    agregarTokens(cantidad)
    pushToast(`+${cantidad} tokens añadidos al monedero`, 'success')
    setShowShop(false)
  }

  const ultimaJugada = historial[0]

  return (
    <>
      <div className="bg-dark-light/60 border-b border-white/5 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-4">
            {/* Tokens */}
            <button
              onClick={() => setShowShop(!showShop)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-2xl transition-all"
              title="Comprar tokens"
            >
              <i className="fa-solid fa-coins text-amber-400" />
              <span className="font-bold text-amber-400">{tokens}</span>
              <span className="text-white/40 hidden sm:inline">TOKENS</span>
              <i className="fa-solid fa-plus text-[10px] text-white/30" />
            </button>

            {ultimaJugada && (
              <span className="text-white/30 hidden md:inline">
                Última: <span className="text-white/60">{ultimaJugada.titulo}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Help button */}
            <button
              onClick={() => pushToast('Soporte al Quinielero: escribe "ayuda" en el chat de Leandro para empezar', 'info')}
              className="text-white/40 hover:text-primary transition-colors text-lg"
              title="Soporte"
            >
              <i className="fa-solid fa-circle-question" />
            </button>
            <span className="text-white/20 text-lg hidden sm:inline">|</span>
            <span className="text-white/30 text-[10px] hidden sm:inline">
              Progol · Lotería Nacional MX
            </span>
          </div>
        </div>
      </div>

      {/* Tienda de tokens */}
      {showShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShop(false)}>
          <div
            className="card-glass p-6 w-full max-w-sm mx-4 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 font-heading">🪙 Tienda de Tokens</h3>
            <p className="text-white/60 text-sm mb-4">
              Los tokens desbloquean generaciones de reducidas, escaneos y funcionalidades premium.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { tokens: 50, precio: 'Gratis', color: 'from-emerald-400 to-emerald-600' },
                { tokens: 200, precio: '29 MXN', color: 'from-primary to-accent' },
                { tokens: 500, precio: '59 MXN', color: 'from-accent to-primary' },
              ].map((pkg) => (
                <button
                  key={pkg.tokens}
                  onClick={() => comprarTokens(pkg.tokens)}
                  className={`bg-gradient-to-r ${pkg.color} text-black font-bold py-3 px-5 rounded-2xl hover:scale-[1.02] transition-transform text-left flex justify-between items-center`}
                >
                  <span>{pkg.tokens} Tokens</span>
                  <span className="text-xs opacity-70">{pkg.precio}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShop(false)}
              className="mt-4 w-full text-white/40 hover:text-white py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
