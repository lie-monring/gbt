import { useCallback, useState } from 'react'
import { useRepoStore } from '../stores/repoStore'
import type { Commit } from '../../electron/git/types'

/**
 * Fetches commit log data for the branch graph.
 * Uses git log with a pipe-delimited format for easy parsing.
 */
export function useGitLog() {
  const repoPath = useRepoStore((s) => s.repoPath)
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLog = useCallback(
    async (maxCount = 500) => {
      if (!repoPath) return []

      setLoading(true)
      try {
        // Format: hash|shortHash|parents|author|email|date|subject|refs
        // %H = full hash, %h = short hash, %P = parent hashes (space separated)
        // %an = author name, %ae = author email, %aI = author date ISO
        // %s = subject, %D = ref names (decorations)
        const result = await window.gbt.gitRaw(repoPath, [
          'log',
          '--all',
          '--topo-order',
          `--max-count=${maxCount}`,
          '--format=%H|%h|%P|%an|%ae|%aI|%s|%D',
        ])

        if (!result.success || !result.data) {
          setLoading(false)
          return []
        }

        const parsed: Commit[] = result.data
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const parts = line.split('|')
            const hash = parts[0] ?? ''
            const shortHash = parts[1] ?? ''
            const parents = parts[2] ? parts[2].trim().split(' ').filter(Boolean) : []
            const author = parts[3] ?? ''
            const email = parts[4] ?? ''
            const date = parts[5] ?? ''
            const subject = parts[6] ?? ''
            const refsRaw = parts[7] ?? ''

            // Parse ref decorations: "HEAD -> main, origin/main, tag: v1.0"
            const refs: string[] = []
            if (refsRaw) {
              // Handle the various decoration formats git outputs
              const cleanRefs = refsRaw
                .replace(/^\(|\)$/g, '') // Remove surrounding parens if present
                .split(',')
                .map((r) => r.trim())
                .filter(Boolean)
                .map((r) => {
                  // "HEAD -> main" → extract "main"
                  if (r.includes('->')) {
                    return r.split('->')[1]!.trim()
                  }
                  // "tag: v1.0" → extract "v1.0"
                  if (r.startsWith('tag: ')) {
                    return r.slice(5)
                  }
                  return r
                })
              refs.push(...cleanRefs)
            }

            return {
              hash,
              shortHash,
              parents,
              author,
              email,
              date,
              subject,
              body: null,
              refs,
            }
          })

        setCommits(parsed)
        setLoading(false)
        return parsed
      } catch {
        setLoading(false)
        return []
      }
    },
    [repoPath],
  )

  return { commits, loading, fetchLog }
}
