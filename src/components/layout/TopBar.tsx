import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { useRepoStore } from '../../stores/repoStore'
import { useGitStatus } from '../../hooks/useGitStatus'

export function TopBar() {
  const { t, i18n } = useTranslation()
  const [helpOpen, setHelpOpen] = useState(false)
  const repoPath = useRepoStore((s) => s.repoPath)
  const repoName = useRepoStore((s) => s.repoName)
  const currentBranch = useRepoStore((s) => s.currentBranch)
  const setRepoPath = useRepoStore((s) => s.setRepoPath)
  const setBranches = useRepoStore((s) => s.setBranches)
  const setLoading = useRepoStore((s) => s.setLoading)
  const setCommitPanelOpen = useAppStore((s) => s.setCommitPanelOpen)
  const { refresh } = useGitStatus()

  // Handle right-click context menu startup
  useEffect(() => {
    (async () => {
      const startupPath = await window.gbt.getStartupPath()
      if (startupPath) {
        await openRepo(startupPath)
        // Auto-open commit panel when launched via context menu
        setTimeout(() => setCommitPanelOpen(true), 500)
      }
    })()
  }, [])

  const openRepo = async (folder: string) => {
    const gitDir = `${folder}/.git`
    const exists = await window.gbt.fileExists(gitDir)
    if (!exists) {
      if (!confirm(t('init.confirm'))) return
      const r = await window.gbt.gitRaw(folder, ['init'])
      if (!r.success) { alert(`${t('init.failed')} ${r.error}`); return }
      await window.gbt.gitRaw(folder, ['commit', '-m', 'Initial commit', '--allow-empty'])
    }
    setRepoPath(folder)
    setLoading(true)
    try {
      const br = await window.gbt.gitRaw(folder, [
        'branch', '-a', '--format=%(refname:short)|%(objectname:short)|%(HEAD)|%(upstream:short)',
      ])
      if (br.success && br.data) {
        setBranches(br.data.trim().split('\n').filter(Boolean).map((l: string) => {
          const [n, h, d, u] = l.split('|')
          return { name: (n ?? '').replace('remotes/origin/', ''), hash: h ?? '', isCurrent: d === '*', upstream: u || null }
        }))
      }
      await refresh()
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleOpenRepo = async () => {
    const folder = await window.gbt.openFolder()
    if (folder) await openRepo(folder)
  }

  return (
    <header
      className="flex items-center justify-between h-9 px-3 bg-[#1a1d27] border-b border-white/5 select-none"
      style={{ WebkitAppRegion: 'drag' as unknown as 'no-drag' }}
    >
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' as unknown as 'no-drag' }}>
        <button onClick={handleOpenRepo}
          className="text-[#8b8fa3] hover:text-white transition-colors text-sm px-2 py-0.5 rounded hover:bg-white/5">
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
        <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')}
          className="text-xs text-[#8b8fa3] hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5">
          {i18n.language === 'en' ? '中' : 'EN'}
        </button>
        <button onClick={() => setHelpOpen(true)}
          className="text-sm text-[#8b8fa3] hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5" title="Help">?</button>
        <button onClick={() => window.gbt.minimizeWindow()}
          className="text-sm text-[#8b8fa3] hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5" title="Minimize">─</button>
        <button onClick={() => window.gbt.closeWindow()}
          className="text-sm text-[#8b8fa3] hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5" title={t('common.close')}>✕</button>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ WebkitAppRegion: 'no-drag' as unknown as 'no-drag' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setHelpOpen(false)} />
          <div className="relative bg-[#1a1d27] border border-white/10 rounded-lg shadow-2xl w-96 max-h-[70vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium">{t('help.title')}</h2>
              <button onClick={() => setHelpOpen(false)} className="text-[#8b8fa3] hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="space-y-4 text-sm">
              {(['nav','commits','branches','buttons','tips'] as const).map((section) => (
                <div key={section}>
                  <h3 className="text-[#6c8cf5] text-xs font-medium mb-1">{t(`help.${section}`)}</h3>
                  <ul className="text-[#8b8fa3] space-y-1 text-xs">
                    {section === 'nav' && <><li>{t('help.navScroll')}</li><li>{t('help.navZoom')}</li><li>{t('help.navPan')}</li></>}
                    {section === 'commits' && <><li>{t('help.commitsClick')}</li><li>{t('help.commitsDouble')}</li><li>{t('help.commitsHover')}</li><li>{t('help.commitsRevert')}</li></>}
                    {section === 'branches' && <li>{t('help.branchesClick')}</li>}
                    {section === 'buttons' && <><li>{t('help.buttonsCommit')}</li><li>{t('help.buttonsRefresh')}</li></>}
                    {section === 'tips' && <><li>{t('help.tipsInit')}</li><li>{t('help.tipsLang')}</li></>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
