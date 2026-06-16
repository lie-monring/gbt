import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useRepoStore } from '../../stores/repoStore'
import { useGitStatus } from '../../hooks/useGitStatus'
import type { FileStatus } from '../../../electron/git/types'

export function CommitPanel() {
  const open = useAppStore((s) => s.commitPanelOpen)
  const setOpen = useAppStore((s) => s.setCommitPanelOpen)
  const repoPath = useRepoStore((s) => s.repoPath)
  const fileStatuses = useRepoStore((s) => s.fileStatuses)
  const { refresh } = useGitStatus()

  const [message, setMessage] = useState('')
  const [staged, setStaged] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) refresh()
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
    setBusy(true)

    // Stage selected files
    for (const path of staged) {
      await window.gbt.gitRaw(repoPath, ['add', path])
    }

    // Commit
    const result = await window.gbt.gitRaw(repoPath, ['commit', '-m', message.trim()])
    setBusy(false)

    if (result.success) {
      setMessage('')
      setStaged(new Set())
      setOpen(false)
      await refresh()
      alert('Committed!')
    } else {
      alert(`Commit failed: ${result.error}`)
    }
  }

  const changed = fileStatuses.filter((f) => f.index !== ' ' || f.workingTree !== ' ')

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

      <div className="fixed inset-y-0 right-0 w-80 bg-surface-raised border-l border-white/5 shadow-2xl z-30 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <h3 className="text-sm font-medium">Commit Changes</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Files */}
        <div className="p-3">
          {changed.length === 0 ? (
            <p className="text-sm text-muted text-center mt-8">Nothing to commit</p>
          ) : (
            <ul className="space-y-1 mb-4 max-h-60 overflow-y-auto">
              {changed.map((f) => {
                const isStaged = staged.has(f.path)
                return (
                  <li
                    key={f.path}
                    onClick={() => toggleStage(f.path)}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                      isStaged ? 'bg-accent/20 text-white' : 'text-muted hover:bg-white/5'
                    }`}
                  >
                    <span className="w-4 h-4 border border-muted rounded flex items-center justify-center text-[10px]">
                      {isStaged ? '✓' : ''}
                    </span>
                    <span className="truncate flex-1">{f.path}</span>
                    <span className="text-[10px] opacity-50">{f.index}{f.workingTree}</span>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your changes..."
            className="w-full h-20 bg-surface border border-white/10 rounded-md p-2 text-sm text-white placeholder:text-muted/50 resize-none focus:outline-none focus:border-accent mb-3"
          />

          <button
            onClick={handleCommit}
            disabled={!message.trim() || busy || staged.size === 0}
            className="w-full py-2 text-sm font-medium bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {busy ? 'Committing...' : `Commit (${staged.size} files)`}
          </button>
        </div>
      </div>
    </>
  )
}
