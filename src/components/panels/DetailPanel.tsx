import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useGraphStore } from '../../stores/graphStore'
import { useRepoStore } from '../../stores/repoStore'
import type { Commit } from '../../../electron/git/types'

export function DetailPanel() {
  const open = useAppStore((s) => s.detailPanelOpen)
  const setOpen = useAppStore((s) => s.setDetailPanelOpen)
  const selectedHash = useGraphStore((s) => s.selectedHash)
  const repoPath = useRepoStore((s) => s.repoPath)
  const triggerRefresh = useRepoStore((s) => s.triggerRefresh)

  const [commit, setCommit] = useState<Commit | null>(null)
  const [diff, setDiff] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !selectedHash || !repoPath) return

    setLoading(true)
    Promise.all([
      // Get commit details
      window.gbt.gitRaw(repoPath, [
        'log', '-1', selectedHash,
        '--format=%H|%h|%P|%an|%ae|%aI|%s|%b|%D',
      ]),
      // Get diff
      window.gbt.gitRaw(repoPath, ['diff', `${selectedHash}~1`, selectedHash, '--stat']),
    ]).then(([logResult, diffResult]) => {
      if (logResult.success && logResult.data) {
        const line = logResult.data.trim().split('\n')[0]
        if (line) {
          const parts = line.split('|')
          setCommit({
            hash: parts[0] ?? '',
            shortHash: parts[1] ?? '',
            parents: parts[2] ? parts[2].trim().split(' ').filter(Boolean) : [],
            author: parts[3] ?? '',
            email: parts[4] ?? '',
            date: parts[5] ?? '',
            subject: parts[6] ?? '',
            body: parts[7] || null,
            refs: [],
          })
        }
      }
      if (diffResult.success) {
        setDiff(diffResult.data ?? null)
      }
      setLoading(false)
    })
  }, [open, selectedHash, repoPath])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

      <div className="fixed inset-y-0 right-0 w-96 bg-surface-raised border-l border-white/5 shadow-2xl z-30 animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-medium">Commit Details</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-muted text-center mt-8">Loading...</p>
          ) : commit ? (
            <div className="space-y-4">
              {/* Subject */}
              <h4 className="text-base font-medium text-white">{commit.subject}</h4>

              {/* Meta */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Author</span>
                  <span className="text-white">{commit.author}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Date</span>
                  <span className="text-white">{commit.date?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Hash</span>
                  <code className="text-accent font-mono text-xs">{commit.shortHash}</code>
                </div>
                {commit.parents.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Parents</span>
                    <span className="text-white">
                      {commit.parents.map((p) => p.slice(0, 7)).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              {commit.body && (
                <div className="mt-3">
                  <p className="text-xs text-muted whitespace-pre-wrap">{commit.body}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={async () => {
                    if (!repoPath) return
                    const ok = confirm(`Go back to commit ${commit.shortHash}?\nThis will detach HEAD.`)
                    if (!ok) return
                    await window.gbt.gitRaw(repoPath, ['checkout', commit.hash])
                    setOpen(false)
                    triggerRefresh()
                  }}
                  className="w-full py-1.5 text-xs text-white bg-accent/20 hover:bg-accent/30 rounded transition-colors"
                >
                  Go back to this commit
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(commit.hash)
                  }}
                  className="w-full py-1.5 text-xs text-muted hover:text-white hover:bg-white/5 rounded transition-colors"
                >
                  Copy full hash
                </button>
              </div>

              {/* Diff stat */}
              {diff && (
                <div className="pt-3 border-t border-white/5">
                  <h5 className="text-xs font-medium text-muted mb-2">Changed Files</h5>
                  <pre className="text-[11px] font-mono text-muted whitespace-pre-wrap leading-relaxed">
                    {diff}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted text-center mt-8">Select a commit to see details</p>
          )}
        </div>
      </div>
    </>
  )
}
