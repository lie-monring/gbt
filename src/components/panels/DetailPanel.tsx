import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { useGraphStore } from '../../stores/graphStore'
import { useRepoStore } from '../../stores/repoStore'
import type { Commit } from '../../../electron/git/types'

export function DetailPanel() {
  const { t } = useTranslation()
  const open = useAppStore((s) => s.detailPanelOpen)
  const setOpen = useAppStore((s) => s.setDetailPanelOpen)
  const selectedHash = useGraphStore((s) => s.selectedHash)
  const repoPath = useRepoStore((s) => s.repoPath)
  const triggerRefresh = useRepoStore((s) => s.triggerRefresh)
  const [commit, setCommit] = useState<Commit | null>(null)
  const [diff, setDiff] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [alreadyReverted, setAlreadyReverted] = useState(false)

  useEffect(() => {
    if (!open || !selectedHash || !repoPath) return
    setLoading(true)
    setAlreadyReverted(false)
    Promise.all([
      window.gbt.gitRaw(repoPath, ['log', '-1', selectedHash, '--format=%H|%h|%P|%an|%ae|%aI|%s|%b|%D']),
      window.gbt.gitRaw(repoPath, ['diff', `${selectedHash}~1`, selectedHash, '--stat']),
      // Check if this commit was already reverted
      window.gbt.gitRaw(repoPath, ['log', '--all', '--oneline', `--grep=${selectedHash.slice(0, 7)}`]),
    ]).then(([logResult, diffResult, grepResult]) => {
      if (logResult.success && logResult.data) {
        const line = logResult.data.trim().split('\n')[0]
        if (line) {
          const parts = line.split('|')
          setCommit({
            hash: parts[0] ?? '', shortHash: parts[1] ?? '',
            parents: parts[2] ? parts[2].trim().split(' ').filter(Boolean) : [],
            author: parts[3] ?? '', email: parts[4] ?? '',
            date: parts[5] ?? '', subject: parts[6] ?? '',
            body: parts[7] || null, refs: [],
          })
        }
      }
      if (diffResult.success) setDiff(diffResult.data ?? null)
      // If grep found any commits referencing this hash, it's been reverted
      if (grepResult.success && grepResult.data?.trim()) {
        setAlreadyReverted(true)
      }
      setLoading(false)
    })
  }, [open, selectedHash, repoPath])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-96 bg-[#1a1d27] border-l border-white/5 shadow-2xl z-30 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-medium">{t('detail.title')}</h3>
          <button onClick={() => setOpen(false)} className="text-[#8b8fa3] hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-[#8b8fa3] text-center mt-8">{t('detail.loading')}</p>
          ) : commit ? (
            <div className="space-y-4">
              <h4 className="text-base font-medium">{commit.subject}</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-[#8b8fa3]">{t('detail.author')}</span><span>{commit.author}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#8b8fa3]">{t('detail.date')}</span><span>{commit.date?.slice(0, 16).replace('T', ' ')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#8b8fa3]">{t('detail.hash')}</span><code className="text-[#6c8cf5] font-mono text-xs">{commit.shortHash}</code></div>
                {commit.parents.length > 0 && (
                  <div className="flex justify-between text-xs"><span className="text-[#8b8fa3]">{t('detail.parents')}</span><span>{commit.parents.map(p => p.slice(0, 7)).join(', ')}</span></div>
                )}
              </div>
              {commit.body && <p className="text-xs text-[#8b8fa3] whitespace-pre-wrap">{commit.body}</p>}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                <button onClick={async () => {
                  if (!repoPath) return
                  if (!confirm(`${t('detail.goBackConfirm')} ${commit.shortHash}?\nThis will detach HEAD.`)) return
                  await window.gbt.gitRaw(repoPath, ['checkout', commit.hash])
                  setOpen(false); triggerRefresh()
                }} className="w-full py-1.5 text-xs rounded bg-[#6c8cf5]/20 text-[#6c8cf5] hover:bg-[#6c8cf5]/30 transition-colors">
                  {t('detail.goBack')}
                </button>
                {!alreadyReverted && (
                  <button onClick={async () => {
                    if (!repoPath) return
                    if (!confirm(`Revert commit ${commit.shortHash}?\n\nThis will create a new commit that undoes this one.`)) return
                    const r = await window.gbt.gitRaw(repoPath, ['revert', commit.hash, '--no-edit'])
                    if (r.success) { setOpen(false); triggerRefresh() }
                    else alert(`Revert failed: ${r.error}`)
                  }}
                    className="w-full py-1.5 text-xs text-[#8b8fa3] hover:text-white hover:bg-white/5 rounded transition-colors">
                    {t('detail.revert')}
                  </button>
                )}
              </div>
              {diff && (
                <div className="pt-3 border-t border-white/5">
                  <h5 className="text-xs font-medium text-[#8b8fa3] mb-2">{t('detail.changedFiles')}</h5>
                  <pre className="text-[11px] font-mono text-[#8b8fa3] whitespace-pre-wrap leading-relaxed">{diff}</pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#8b8fa3] text-center mt-8">{t('detail.noData')}</p>
          )}
        </div>
      </div>
    </>
  )
}
