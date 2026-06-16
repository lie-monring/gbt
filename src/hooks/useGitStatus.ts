import { useCallback } from 'react'
import { useRepoStore } from '../stores/repoStore'

export function useGitStatus() {
  const repoPath = useRepoStore((s) => s.repoPath)
  const setFileStatuses = useRepoStore((s) => s.setFileStatuses)

  const refresh = useCallback(async () => {
    if (!repoPath) return

    const result = await window.gbt.gitRaw(repoPath, ['status', '--porcelain'])
    if (!result.success || !result.data) return

    const files = result.data
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => ({
        index: line[0] ?? ' ',
        workingTree: line[1] ?? ' ',
        path: line.slice(3).trim(),
      }))

    setFileStatuses(files)
  }, [repoPath, setFileStatuses])

  return { refresh }
}
