import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { useRepoStore } from '../../stores/repoStore'
import { useGitBranches } from '../../hooks/useGitBranches'
import { useGitStatus } from '../../hooks/useGitStatus'

export function BottomBar() {
  const { t } = useTranslation()
  const repoPath = useRepoStore((s) => s.repoPath)
  const setCommitPanelOpen = useAppStore((s) => s.setCommitPanelOpen)
  const { refreshBranches } = useGitBranches()
  const { refresh: refreshStatus } = useGitStatus()

  if (!repoPath) return null

  const handleRefresh = async () => {
    await refreshBranches()
    await refreshStatus()
  }

  return (
    <footer className="flex items-center justify-center gap-4 h-10 px-3 bg-surface-raised border-t border-white/5">
      <button
        onClick={() => setCommitPanelOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1 text-sm text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
      >
        <span>⊕</span>
        <span>{t('bottombar.commit')}</span>
      </button>

      <button
        className="flex items-center gap-1.5 px-4 py-1 text-sm text-muted hover:text-white rounded-md hover:bg-white/5 transition-colors"
        onClick={handleRefresh}
      >
        <span>↻</span>
        <span>Refresh</span>
      </button>
    </footer>
  )
}
