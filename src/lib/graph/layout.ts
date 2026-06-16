import type { Commit } from '../../../electron/git/types'

/** A commit node positioned for SVG rendering */
export interface LayoutNode {
  hash: string
  fullHash: string
  subject: string
  author: string
  date: string
  /** X position in px (center of node) */
  x: number
  /** Y position in px (center of node) */
  y: number
  /** Column index (lane) */
  column: number
  /** Branch color */
  color: string
  /** Ref names pointing here */
  refs: string[]
  /** Parent hashes */
  parents: string[]
}

/** A line connecting a commit to its parent */
export interface BranchLine {
  x1: number; y1: number
  x2: number; y2: number
  color: string
}

/** Returned graph data ready for rendering */
export interface GraphData {
  nodes: LayoutNode[]
  lines: BranchLine[]
  branchLabels: { name: string; x: number; y: number; color: string }[]
  totalHeight: number
  totalWidth: number
}

const COL_WIDTH = 24
const ROW_HEIGHT = 48
const PADDING_X = 100
const PADDING_Y = 40
const PALETTE = [
  '#f87171', '#60a5fa', '#4ade80', '#facc15',
  '#c084fc', '#fb923c', '#2dd4bf', '#f472b6',
  '#a78bfa', '#34d399', '#fbbf24', '#818cf8',
]

/**
 * Assign columns to commits using lane-assignment algorithm.
 * Walk commits newest→oldest, placing each one in the appropriate lane.
 */
export function computeLayout(commits: Commit[]): GraphData {
  if (commits.length === 0) {
    return { nodes: [], lines: [], branchLabels: [], totalHeight: 0, totalWidth: 0 }
  }

  // Build hash→index lookup for child/parent resolution
  const idx = new Map<string, number>()
  commits.forEach((c, i) => idx.set(c.hash, i))

  // Maps branch name → column index
  const branchCol = new Map<string, number>()
  // Maps commit hash → column index
  const commitCol = new Map<string, number>()
  let nextCol = 0

  const getColor = (col: number) => PALETTE[col % PALETTE.length]!

  // ── Pass 1: assign columns ──────────────────────────
  for (const commit of commits) {
    // Find a branch ref pointing at this commit (exclude HEAD, tags)
    const branchRef = commit.refs.find(
      (r) => r !== 'HEAD' && !r.startsWith('tag:') && !r.startsWith('origin/')
    )

    if (branchRef) {
      // This commit is a branch tip — ensure its column exists
      if (!branchCol.has(branchRef)) {
        branchCol.set(branchRef, nextCol++)
      }
      commitCol.set(commit.hash, branchCol.get(branchRef)!)
      continue
    }

    // Try to inherit column from children (commits that list THIS as parent)
    let inherited = false
    for (let i = 0; i < commits.length; i++) {
      if (commits[i].parents.includes(commit.hash) && commitCol.has(commits[i].hash)) {
        commitCol.set(commit.hash, commitCol.get(commits[i].hash)!)
        inherited = true
        break
      }
    }

    if (!inherited) {
      commitCol.set(commit.hash, 0)
    }
  }

  // ── Pass 2: build nodes ─────────────────────────────
  const nodes: LayoutNode[] = commits.map((commit, i) => {
    const col = commitCol.get(commit.hash) ?? 0
    const branchRef = commit.refs.find(
      (r) => r !== 'HEAD' && !r.startsWith('tag:') && !r.startsWith('origin/')
    )
    const color = branchRef && branchCol.has(branchRef)
      ? getColor(branchCol.get(branchRef)!)
      : PALETTE[col % PALETTE.length]!

    return {
      hash: commit.shortHash,
      fullHash: commit.hash,
      subject: commit.subject,
      author: commit.author,
      date: commit.date,
      x: PADDING_X + col * COL_WIDTH + COL_WIDTH / 2,
      y: PADDING_Y + i * ROW_HEIGHT + ROW_HEIGHT / 2,
      column: col,
      color,
      refs: commit.refs.filter((r) => r !== 'HEAD'),
      parents: commit.parents,
    }
  })

  // ── Pass 3: build lines ─────────────────────────────
  const lines: BranchLine[] = []
  for (const commit of commits) {
    const col = commitCol.get(commit.hash) ?? 0
    const ci = idx.get(commit.hash) ?? 0

    for (const parentHash of commit.parents) {
      const pi = idx.get(parentHash)
      if (pi === undefined) continue
      const pCol = commitCol.get(parentHash) ?? 0

      // Vertical line from commit down to the merge curve
      const yMid = nodes[ci].y + (nodes[pi].y - nodes[ci].y) * 0.4
      const color = getColor(col)

      if (col === pCol) {
        // Same column: straight vertical line
        lines.push({
          x1: nodes[ci].x,
          y1: nodes[ci].y,
          x2: nodes[pi].x,
          y2: nodes[pi].y,
          color,
        })
      } else {
        // Different column: draw a curve (horizontal then vertical)
        lines.push({
          x1: nodes[ci].x,
          y1: nodes[ci].y,
          x2: nodes[ci].x,
          y2: yMid,
          color,
        })
        lines.push({
          x1: nodes[ci].x,
          y1: yMid,
          x2: nodes[pi].x,
          y2: yMid,
          color: getColor(col),
        })
        lines.push({
          x1: nodes[pi].x,
          y1: yMid,
          x2: nodes[pi].x,
          y2: nodes[pi].y,
          color: getColor(pCol),
        })
      }
    }
  }

  // ── Pass 4: branch labels ────────────────────────────
  const branchLabels: GraphData['branchLabels'] = []
  const labeledBranches = new Set<string>()
  for (const commit of commits) {
    for (const ref of commit.refs) {
      if (
        ref === 'HEAD' ||
        ref.startsWith('tag:') ||
        ref.startsWith('origin/') ||
        labeledBranches.has(ref)
      ) continue

      const col = branchCol.get(ref)
      if (col === undefined) continue
      const node = nodes.find((n) => n.fullHash === commit.hash)
      if (!node) continue

      branchLabels.push({
        name: ref,
        x: node.x,
        y: node.y - 16,
        color: getColor(col),
      })
      labeledBranches.add(ref)
    }
  }

  const maxCol = Math.max(nextCol - 1, 0)
  const totalWidth = PADDING_X + maxCol * COL_WIDTH + COL_WIDTH + 200
  const totalHeight = PADDING_Y + commits.length * ROW_HEIGHT + 100

  return { nodes, lines, branchLabels, totalHeight, totalWidth }
}
