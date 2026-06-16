import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { useOpStore } from '../../stores/opStore'

export function HistoryPanel() {
  const { t } = useTranslation()
  const open = useAppStore((s) => s.historyPanelOpen)
  const setOpen = useAppStore((s) => s.setHistoryPanelOpen)
  const history = useOpStore((s) => s.history)

  if (!open) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface-raised border-l border-white/5 shadow-2xl animate-slide-in-right z-20">
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h3 className="text-sm font-medium">{t('history.title')}</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-muted hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="p-3">
        {history.length === 0 ? (
          <p className="text-sm text-muted text-center mt-8">{t('history.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="text-xs text-muted border-b border-white/5 pb-2">
                <span className="text-white">{entry.description}</span>
                <br />
                <span className="opacity-50">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
