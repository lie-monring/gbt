import { useCallback } from 'react'
import { useRepoStore } from '../stores/repoStore'
import type { BranchInfo } from '../../electron/git/types'

export function useGitBranches() {
  const repoPath = useRepoStore((s) => s.repoPath)
  const setBranches = useRepoStore((s) => s.setBranches)

  const refreshBranches = useCallback(async () => {
    if (!repoPath) return

    const result = await window.gbt.gitRaw(repoPath, [
      'branch',
      '-a',
      '--format=%(refname:short)|%(objectname:short)|%(HEAD)|%(upstream:short)',
    ])

    if (!result.success || !result.data) return

    const branches: BranchInfo[] = result.data
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, hash, head, upstream] = line.split('|')
        return {
          name: (name ?? '').replace('remotes/origin/', ''),
          hash: hash ?? '',
          isCurrent: head === '*',
          upstream: upstream || null,
        }
      })

    setBranches(branches)
  }, [repoPath, setBranches])

  return { refreshBranches }
}
