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

  return (
    <footer className="flex items-center justify-center gap-4 h-10 px-3 bg-[#1a1d27] border-t border-white/5">
      <button
        onClick={() => setCommitPanelOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1 text-sm text-white bg-[#6c8cf5] hover:bg-[#8aa4ff] rounded-md transition-colors"
      >
        <span>⊕</span>
        <span>{t('bottombar.commit')}</span>
      </button>
      <button
        onClick={async () => { await refreshBranches(); await refreshStatus() }}
        className="flex items-center gap-1.5 px-4 py-1 text-sm text-[#8b8fa3] hover:text-white rounded-md hover:bg-white/5 transition-colors"
      >
        <span>↻</span>
        <span>{t('bottombar.refresh')}</span>
      </button>
    </footer>
  )
}
