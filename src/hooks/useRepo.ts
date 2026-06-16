import { useRepoStore } from '../stores/repoStore'

/**
 * Convenience hook for accessing the current repo state.
 */
export function useRepo() {
  const repoPath = useRepoStore((s) => s.repoPath)
  const repoName = useRepoStore((s) => s.repoName)
  const branches = useRepoStore((s) => s.branches)
  const currentBranch = useRepoStore((s) => s.currentBranch)
  const fileStatuses = useRepoStore((s) => s.fileStatuses)
  const isLoading = useRepoStore((s) => s.isLoading)

  return {
    repoPath,
    repoName,
    branches,
    currentBranch,
    fileStatuses,
    isLoading,
    hasRepo: repoPath !== null,
  }
}
