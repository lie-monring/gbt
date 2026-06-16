import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { useRepoStore } from '../../stores/repoStore'
import { useGitStatus } from '../../hooks/useGitStatus'

export function TopBar() {
  const { t, i18n } = useTranslation()
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const repoPath = useRepoStore((s) => s.repoPath)
  const repoName = useRepoStore((s) => s.repoName)
  const currentBranch = useRepoStore((s) => s.currentBranch)
  const setRepoPath = useRepoStore((s) => s.setRepoPath)
  const setBranches = useRepoStore((s) => s.setBranches)
  const setFileStatuses = useRepoStore((s) => s.setFileStatuses)
  const setLoading = useRepoStore((s) => s.setLoading)

  const { refresh } = useGitStatus()

  const handleOpenRepo = async () => {
    const folder = await window.gbt.openFolder()
    if (!folder) return

    // Verify it's a git repo by checking for .git
    const gitDir = `${folder}/.git`
    const exists = await window.gbt.fileExists(gitDir)
    if (!exists) {
      alert('Not a Git repository. Please select a folder with a .git directory.')
      return
    }

    setRepoPath(folder)
    setLoading(true)

    try {
      // Load branches
      const branchResult = await window.gbt.gitRaw(folder, [
        'branch', '-a', '--format=%(refname:short)|%(objectname:short)|%(HEAD)|%(upstream:short)',
      ])
      if (branchResult.success && branchResult.data) {
        const branches = branchResult.data
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [name, hash, head, upstream] = line.split('|')
            return {
              name: name.replace('remotes/origin/', ''),
              hash,
              isCurrent: head === '*',
              upstream: upstream || null,
            }
          })
        setBranches(branches)
      }

      // Load file status
      await refresh()
    } catch {
      // ignore initial load errors
    }

    setLoading(false)
  }

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(next)
  }

  return (
    <header
      className="flex items-center justify-between h-9 px-3 bg-surface-raised border-b border-white/5 select-none"
      style={{ WebkitAppRegion: 'drag' as unknown as 'no-drag' }}
    >
      {/* Left: Repo info */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' as unknown as 'no-drag' }}>
        <button
          onClick={handleOpenRepo}
          className="text-muted hover:text-white transition-colors text-sm px-2 py-0.5 rounded hover:bg-white/5"
          title={t('topbar.openRepo')}
        >
          📁 {repoPath ? repoName : t('topbar.noRepo')}
        </button>
        {currentBranch && (
          <span className="text-xs text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {currentBranch}
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' as unknown as 'no-drag' }}>
        <button
          onClick={toggleLang}
          className="text-xs text-muted hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
          title={t('topbar.language')}
        >
          {i18n.language === 'en' ? '中' : 'EN'}
        </button>
        <button
          onClick={toggleTheme}
          className="text-xs text-muted hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
          title={t('topbar.theme')}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
    </header>
  )
}
