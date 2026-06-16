/** A single commit as parsed from git log output */
export interface Commit {
  /** Full SHA-1 hash */
  hash: string
  /** Abbreviated hash (7 chars) */
  shortHash: string
  /** Parent commit hashes (empty array for root commit) */
  parents: string[]
  /** Author name */
  author: string
  /** Author email */
  email: string
  /** ISO 8601 date string */
  date: string
  /** First line of the commit message */
  subject: string
  /** Remaining lines of the commit message, if any */
  body: string | null
  /** Branches and tags pointing at this commit (ref names) */
  refs: string[]
}

/** A Git branch */
export interface BranchInfo {
  name: string
  /** The SHA this branch points to */
  hash: string
  /** Whether this is the currently checked-out branch */
  isCurrent: boolean
  /** Remote tracking branch, e.g. "origin/main" */
  upstream: string | null
}

/** Working tree file status */
export interface FileStatus {
  path: string
  /** Git status porcelain index status */
  index: string
  /** Git status porcelain working tree status */
  workingTree: string
}

/** Parsed reflog entry */
export interface ReflogEntry {
  /** e.g. "HEAD@{0}" */
  ref: string
  /** e.g. "commit: fix typo" */
  message: string
  /** The SHA this reflog entry points to */
  hash: string
  /** ISO 8601 date */
  date: string
}

/** Recorded git operation for undo tracking */
export interface OperationEntry {
  id: string
  timestamp: number
  type: 'commit' | 'merge' | 'checkout' | 'branch-create' | 'branch-delete' | 'reset' | 'pull' | 'push'
  description: string
  /** Branch name → SHA before operation */
  preRefs: Record<string, string>
  /** Branch name → SHA after operation */
  postRefs: Record<string, string>
  undoable: boolean
  undoDescription: string
}
