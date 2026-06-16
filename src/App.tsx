import { TopBar } from './components/layout/TopBar'
import { BottomBar } from './components/layout/BottomBar'
import { BranchTree } from './components/graph/BranchTree'
import { CommitPanel } from './components/panels/CommitPanel'
import { DetailPanel } from './components/panels/DetailPanel'
import { HistoryPanel } from './components/panels/HistoryPanel'
import { useAppStore } from './stores/appStore'
import { useRepoStore } from './stores/repoStore'

export default function App() {
  const theme = useAppStore((s) => s.theme)
  const repoPath = useRepoStore((s) => s.repoPath)

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex flex-col h-screen bg-surface text-white dark:bg-surface dark:text-white overflow-hidden">
        <TopBar />
        <main className="flex-1 relative overflow-hidden">
          {repoPath ? (
            <BranchTree />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="text-6xl">🌿</div>
                <h2 className="text-xl font-light text-muted">
                  Open a Git repository to see your branch tree
                </h2>
                <p className="text-sm text-muted/60">
                  Click the folder icon in the top bar to get started
                </p>
              </div>
            </div>
          )}
        </main>
        <BottomBar />
        <CommitPanel />
        <DetailPanel />
        <HistoryPanel />
      </div>
    </div>
  )
}
