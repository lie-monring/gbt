import { useCallback } from 'react'
import { useRepoStore } from '../stores/repoStore'
import { useOpStore, createOperation } from '../stores/opStore'
import type { OperationEntry } from '../../electron/git/types'

/**
 * Executes a git operation and records it in the operation history.
 * Returns { success, data }.
 */
export function useGitOperation() {
  const repoPath = useRepoStore((s) => s.repoPath)
  const pushOperation = useOpStore((s) => s.pushOperation)

  const execute = useCallback(
    async (
      args: string[],
      meta: {
        type: OperationEntry['type']
        description: string
        undoDescription?: string
      },
    ): Promise<{ success: boolean; data?: string; error?: string }> => {
      if (!repoPath) {
        return { success: false, error: 'No repository open' }
      }

      const result = await window.gbt.gitRaw(repoPath, args)

      if (result.success) {
        const op = createOperation({
          type: meta.type,
          description: meta.description,
          undoDescription: meta.undoDescription ?? `Undo: ${meta.description}`,
        })
        pushOperation(op)
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error,
      }
    },
    [repoPath, pushOperation],
  )

  return { execute }
}
