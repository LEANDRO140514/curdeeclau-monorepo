import { useStore } from '../../app/providers/store'

export default function Toast() {
  const toasts = useStore((s) => s.toasts)
  const popToast = useStore((s) => s.popToast)

  if (toasts.length === 0) return null

  const colors: Record<string, string> = {
    success: 'border-l-emerald-400 bg-emerald-400/10',
    error: 'border-l-red-400 bg-red-400/10',
    warning: 'border-l-amber-400 bg-amber-400/10',
    info: 'border-l-primary bg-primary/10',
  }

  const icons: Record<string, string> = {
    success: 'fa-circle-check text-emerald-400',
    error: 'fa-circle-xmark text-red-400',
    warning: 'fa-triangle-exclamation text-amber-400',
    info: 'fa-circle-info text-primary',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter border-l-4 ${colors[t.type]} backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg cursor-pointer`}
          onClick={() => popToast(t.id)}
        >
          <i className={`fa-solid ${icons[t.type]}`} />
          <span className="text-sm text-white/90">{t.text}</span>
        </div>
      ))}
    </div>
  )
}
