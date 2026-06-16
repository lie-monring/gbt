import { useTranslation } from 'react-i18next'
import { useRepoStore } from '../../stores/repoStore'
import { useGitStatus } from '../../hooks/useGitStatus'

export function TopBar() {
  const { t, i18n } = useTranslation()
  const repoPath = useRepoStore((s) => s.repoPath)
  const repoName = useRepoStore((s) => s.repoName)
  const currentBranch = useRepoStore((s) => s.currentBranch)
  const setRepoPath = useRepoStore((s) => s.setRepoPath)
  const setBranches = useRepoStore((s) => s.setBranches)
  const setLoading = useRepoStore((s) => s.setLoading)
  const { refresh } = useGitStatus()

  const handleOpenRepo = async () => {
    const folder = await window.gbt.openFolder()
    if (!folder) return

    const gitDir = `${folder}/.git`
    const exists = await window.gbt.fileExists(gitDir)
    if (!exists) {
      const init = confirm('This folder is not a Git repository. Initialize git here?')
      if (!init) return
      const initResult = await window.gbt.gitRaw(folder, ['init'])
      if (!initResult.success) {
        alert(`git init failed: ${initResult.error}`)
        return
      }
      await window.gbt.gitRaw(folder, ['commit', '-m', 'Initial commit', '--allow-empty'])
    }

    setRepoPath(folder)
    setLoading(true)

    try {
      const branchResult = await window.gbt.gitRaw(folder, [
        'branch', '-a', '--format=%(refname:short)|%(objectname:short)|%(HEAD)|%(upstream:short)',
      ])
      if (branchResult.success && branchResult.data) {
        const branches = branchResult.data.trim().split('\n').filter(Boolean).map((line: string) => {
          const [name, hash, head, upstream] = line.split('|')
          return {
            name: (name ?? '').replace('remotes/origin/', ''),
            hash: hash ?? '',
            isCurrent: head === '*',
            upstream: upstream || null,
          }
        })
        setBranches(branches)
      }
      await refresh()
    } catch { /* ignore */ }
    setLoading(false)
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')
  }

  return (
    <header
      className="flex items-center justify-between h-9 px-3 bg-[#1a1d27] border-b border-white/5 select-none"
      style={{ WebkitAppRegion: 'drag' as unknown as 'no-drag' }}
    >
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' as unknown as 'no-drag' }}>
        <button
          onClick={handleOpenRepo}
          className="text-[#8b8fa3] hover:text-white transition-colors text-sm px-2 py-0.5 rounded hover:bg-white/5"
        >
          📁 {repoPath ? repoName : t('topbar.noRepo')}
        </button>
        {currentBranch && (
          <span className="text-xs text-[#8b8fa3] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {currentBranch}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' as unknown as 'no-drag' }}>
        <button
          onClick={toggleLang}
          className="text-xs text-[#8b8fa3] hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
        >
          {i18n.language === 'en' ? '中' : 'EN'}
        </button>
        <button
          onClick={() => window.gbt.closeWindow()}
          className="text-sm text-[#8b8fa3] hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5 ml-1"
        >
          ✕
        </button>
      </div>
    </header>
  )
}
