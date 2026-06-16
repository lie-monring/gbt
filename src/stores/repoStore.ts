import { create } from 'zustand'
import type { BranchInfo, FileStatus } from '../../electron/git/types'

interface RepoState {
  repoPath: string | null
  repoName: string
  branches: BranchInfo[]
  currentBranch: string | null
  fileStatuses: FileStatus[]
  isLoading: boolean
  refreshTick: number

  setRepoPath: (path: string | null) => void
  setBranches: (branches: BranchInfo[]) => void
  setCurrentBranch: (branch: string | null) => void
  setFileStatuses: (files: FileStatus[]) => void
  setLoading: (loading: boolean) => void
  triggerRefresh: () => void
}

export const useRepoStore = create<RepoState>((set) => ({
  repoPath: null,
  repoName: '',
  branches: [],
  currentBranch: null,
  fileStatuses: [],
  isLoading: false,
  refreshTick: 0,

  setRepoPath: (path) =>
    set({
      repoPath: path,
      repoName: path ? path.split(/[/\\]/).pop() || '' : '',
      branches: [],
      currentBranch: null,
      fileStatuses: [],
    }),

  setBranches: (branches) =>
    set({
      branches,
      currentBranch: branches.find((b) => b.isCurrent)?.name ?? null,
    }),

  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setFileStatuses: (files) => set({ fileStatuses: files }),
  setLoading: (isLoading) => set({ isLoading }),
  triggerRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}))
