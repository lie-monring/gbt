import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRepoStore } from '../../stores/repoStore'
import { useGraphStore } from '../../stores/graphStore'
import { useAppStore } from '../../stores/appStore'
import { useGitLog } from '../../hooks/useGitLog'
import { computeLayout, type LayoutNode } from '../../lib/graph/layout'
import type { Commit } from '../../../electron/git/types'

export function BranchTree() {
  const repoPath = useRepoStore((s) => s.repoPath)
  const isLoading = useRepoStore((s) => s.isLoading)
  const refreshTick = useRepoStore((s) => s.refreshTick)
  const triggerRefresh = useRepoStore((s) => s.triggerRefresh)
  const { commits, loading: logLoading, fetchLog } = useGitLog()

  const { zoom, offsetX, offsetY, setZoom, setOffset, selectCommit, selectedHash } = useGraphStore()
  const setDetailPanelOpen = useAppStore((s) => s.setDetailPanelOpen)

  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: LayoutNode } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  // Fetch log when repo opens or refresh is triggered
  useEffect(() => {
    if (repoPath) {
      fetchLog(300)
    }
  }, [repoPath, refreshTick, fetchLog])

  // Compute graph layout
  const graph = useMemo(() => computeLayout(commits), [commits])

  // ── Pan/Zoom handlers ───────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(zoom + delta)
      } else {
        setOffset(offsetX - e.deltaX, offsetY - e.deltaY)
      }
    },
    [zoom, offsetX, offsetY, setZoom, setOffset],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY })
      }
    },
    [offsetX, offsetY],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) {
        setOffset(
          dragStart.ox + (e.clientX - dragStart.x),
          dragStart.oy + (e.clientY - dragStart.y),
        )
      }
    },
    [dragging, dragStart, setOffset],
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  // ── Node interaction ─────────────────────────────────
  const handleNodeClick = useCallback(
    (node: LayoutNode) => {
      selectCommit(node.fullHash)
      setDetailPanelOpen(true)
    },
    [selectCommit, setDetailPanelOpen],
  )

  const handleNodeDoubleClick = useCallback(
    async (node: LayoutNode) => {
      if (!repoPath) return
      const ok = confirm(`Checkout commit ${node.hash}?\n\n${node.subject}\n\nThis will detach HEAD.`)
      if (!ok) return
      await window.gbt.gitRaw(repoPath, ['checkout', node.fullHash])
      triggerRefresh()
    },
    [repoPath, triggerRefresh],
  )

  const handleBranchLabelClick = useCallback(
    async (branchName: string) => {
      if (!repoPath) return
      const result = await window.gbt.gitRaw(repoPath, ['checkout', branchName])
      if (result.success) {
        triggerRefresh()
      }
    },
    [repoPath, triggerRefresh],
  )

  // ── Empty / loading states ───────────────────────────
  if (!repoPath || isLoading || logLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 dark:text-[#8b8fa3] text-sm animate-fade-in">Loading branch tree...</p>
      </div>
    )
  }

  if (commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted text-sm">No commits yet in this repository.</p>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="h-full w-full overflow-hidden cursor-default">
      <svg
        ref={svgRef}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
      >
        {/* Viewport transform group */}
        <g transform={`translate(${offsetX},${offsetY}) scale(${zoom})`}>
          {/* Branch lines */}
          {graph.lines.map((line, i) => (
            <line
              key={`ln-${i}`}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={line.color}
              className="branch-line"
            />
          ))}

          {/* Branch labels */}
          {graph.branchLabels.map((bl) => (
            <g
              key={`bl-${bl.name}`}
              transform={`translate(${bl.x},${bl.y})`}
              className="branch-label"
              style={{ cursor: 'pointer' }}
              onClick={() => handleBranchLabelClick(bl.name)}
            >
              <rect
                x={-4} y={-4}
                width={bl.name.length * 7 + 8}
                height={16}
                rx={4}
                fill={bl.color}
                opacity={0.2}
              />
              <text
                x={bl.name.length * 3.5 + 2}
                y={8}
                textAnchor="middle"
                fill={bl.color}
                fontSize={11}
                fontWeight={600}
              >
                {bl.name}
              </text>
            </g>
          ))}

          {/* Commit nodes */}
          {graph.nodes.map((node) => {
            const isSelected = node.fullHash === selectedHash
            return (
              <g
                key={node.fullHash}
                transform={`translate(${node.x},${node.y})`}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node) }}
                onDoubleClick={(e) => { e.stopPropagation(); handleNodeDoubleClick(node) }}
                onMouseEnter={(e) => {
                  const svg = svgRef.current
                  if (!svg) return
                  const rect = svg.getBoundingClientRect()
                  setTooltip({
                    x: (e.clientX - rect.left) / zoom,
                    y: (e.clientY - rect.top) / zoom,
                    node,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={isSelected ? 7 : 4}
                  fill={node.color}
                  className={`commit-dot ${isSelected ? 'selected' : ''}`}
                  opacity={isSelected ? 1 : 0.8}
                />
              </g>
            )
          })}
        </g>

        {/* Tooltip (in screen space, not affected by zoom/pan) */}
        {tooltip && (
          <g transform={`translate(${tooltip.x + 12},${tooltip.y - 12})`}>
            <rect x={0} y={-20} width={300} height={56} rx={6} fill="#1a1d27" stroke="#2a2d37" strokeWidth={1} opacity={0.95} />
            <text x={8} y={-2} fill="#f8f9fa" fontSize={12} fontWeight={500}>
              {tooltip.node.subject.slice(0, 50)}
            </text>
            <text x={8} y={14} fill="#8b8fa3" fontSize={10}>
              {tooltip.node.author} · {tooltip.node.hash}
            </text>
            <text x={8} y={28} fill="#8b8fa3" fontSize={10}>
              {tooltip.node.date?.slice(0, 10)}
            </text>
          </g>
        )}
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 text-xs text-muted/60 bg-surface-raised px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}
