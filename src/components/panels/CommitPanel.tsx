import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { useRepoStore } from '../../stores/repoStore'
import { useGitStatus } from '../../hooks/useGitStatus'

export function CommitPanel() {
  const { t } = useTranslation()
  const open = useAppStore((s) => s.commitPanelOpen)
  const setOpen = useAppStore((s) => s.setCommitPanelOpen)
  const repoPath = useRepoStore((s) => s.repoPath)
  const fileStatuses = useRepoStore((s) => s.fileStatuses)
  const triggerRefresh = useRepoStore((s) => s.triggerRefresh)
  const { refresh } = useGitStatus()

  const [message, setMessage] = useState('')
  const [staged, setStaged] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (open) { refresh(); setStatus(null); setStaged(new Set()); setMessage('') }
  }, [open, refresh])

  if (!open) return null

  const toggleStage = (path: string) => {
    setStaged((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const handleCommit = async () => {
    if (!repoPath || !message.trim()) return
    setBusy(true); setStatus(null)
    try {
      for (const p of staged) {
        const r = await window.gbt.gitRaw(repoPath, ['add', p])
        if (!r.success) {
          setStatus({ type: 'error', text: `${t('commit.gitAddFailed')} ${r.error}` })
          setBusy(false); return
        }
      }
      const result = await window.gbt.gitRaw(repoPath, ['commit', '-m', message.trim()])
      if (result.success) {
        setStatus({ type: 'success', text: t('commit.committed') })
        setMessage(''); setStaged(new Set()); await refresh(); triggerRefresh()
        setTimeout(() => setOpen(false), 800)
      } else {
        setStatus({ type: 'error', text: result.error || t('commit.commitFailed') })
      }
    } catch (err: unknown) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : String(err) })
    }
    setBusy(false)
  }

  const changed = fileStatuses.filter((f) => f.index !== ' ' || f.workingTree !== ' ')

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-80 bg-[#1a1d27] border-l border-white/5 shadow-2xl z-30 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-medium">{t('commit.title')}</h3>
          <button onClick={() => setOpen(false)} className="text-[#8b8fa3] hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {changed.length === 0 ? (
            <p className="text-sm text-[#8b8fa3] text-center mt-8">{t('commit.noChanges')}</p>
          ) : (
            <ul className="space-y-1 mb-4 max-h-60 overflow-y-auto">
              {changed.map((f) => {
                const isStaged = staged.has(f.path)
                return (
                  <li key={f.path} onClick={() => toggleStage(f.path)}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${isStaged ? 'bg-[#6c8cf5]/20 text-white' : 'text-[#8b8fa3] hover:bg-white/5'}`}>
                    <span className="w-4 h-4 border border-[#8b8fa3] rounded flex items-center justify-center text-[10px] shrink-0">{isStaged ? '✓' : ''}</span>
                    <span className="truncate flex-1">{f.path}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder={t('commit.messagePlaceholder')}
            className="w-full h-20 bg-[#0f1117] border border-white/10 rounded-md p-2 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-[#6c8cf5] mb-3" />
          {status && (
            <div className={`text-xs p-2 rounded mb-3 ${status.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {status.text}
            </div>
          )}
          <button onClick={handleCommit}
            disabled={!message.trim() || busy || staged.size === 0}
            className="w-full py-2 text-sm font-medium bg-[#6c8cf5] hover:bg-[#8aa4ff] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-md transition-colors">
            {busy ? '...' : `${t('commit.commitButton')} (${staged.size})`}
          </button>
        </div>
      </div>
    </>
  )
}
