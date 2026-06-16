# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Launch Electron + Vite dev server (HMR for renderer)
npm run build        # Vite production build (dist/ + dist-electron/)
npm run dist         # Build + package Windows exe (release/win-unpacked/)

npx tsc --noEmit     # TypeScript type-check only
npx vite build        # Build renderer + electron without packaging
npx electron-builder --win --x64  # Package only (requires prior vite build)
```

Electron is at `D:\download\Git\cmd\git.exe` on this machine. `electron/main.ts` hardcodes this path in `findGit()`. A cleaner solution would use a config file or environment variable.

## Architecture

**Process model**: Electron main process (`electron/main.ts`) runs Node.js and spawns git via `simple-git`. Renderer process (`src/`) is a React SPA with no Node.js access — all git operations go through IPC via `contextBridge` (`electron/preload.ts`).

**IPC bridge**: `window.gbt` exposes 6 methods: `openFolder`, `fileExists`, `gitRaw`, `closeWindow`, `minimizeWindow`, `getStartupPath`. All git commands flow through `gitRaw(repoPath, args[])` which calls `simple-git.raw()` on the main side.

**Git log pipeline**: The branch tree depends on `git log --all --topo-order --format=%H|%h|%P|%an|%ae|%aI|%s|%D`. The pipe-delimited format is parsed in `useGitLog.ts` into `Commit[]`, then `src/lib/graph/layout.ts:computeLayout()` runs a 4-pass lane-assignment algorithm to produce `GraphData` (nodes with x/y coordinates, colored lines, branch labels). The graph renders as SVG in `BranchTree.tsx`.

**State management**: Zustand stores — `repoStore` (repo path, branches, file status, `refreshTick` for invalidation), `graphStore` (viewport offset/zoom, selected commit), `appStore` (panel open state). The `refreshTick` counter triggers `useEffect` re-fetches after mutations; `triggerRefresh()` increments it.

**i18n**: `react-i18next` with namespace `translation`. JSON files in `src/lib/i18n/{en,zh}/`. Every user-facing string goes through `t()`. The top-bar button toggles `i18n.language`.

**Branch graph rendering**: Pure SVG with React — no Canvas or D3. Commit dots are `<circle>`, branch lines are `<line>`, labels are `<text>`. Pan via middle-mouse/shift-drag (updates `graphStore.offsetX/Y`), zoom via Ctrl+scroll (updates `graphStore.zoom`), applied as SVG `transform`.

**Revert guard**: `DetailPanel` runs `git log --all --grep=<shortHash>` on open to detect if a commit has already been reverted, and hides the revert button.

**Context menu integration**: `scripts/install-context-menu.reg` adds Windows registry keys. When launched via right-click, the folder path arrives as a CLI arg; `main.ts` stores it in `startupFolder` and the renderer reads it via `getStartupPath()` on mount, auto-opening the repo and commit panel.

**Window controls**: Custom title bar (`titleBarStyle: 'hidden'`). The `--` minimize and `✕` close buttons use `window.gbt.minimizeWindow()` / `closeWindow()` IPC. `WebkitAppRegion: 'drag'` makes the title bar draggable, `no-drag` on buttons.

## Key files

- `electron/main.ts` — IPC handlers, git binary detection, CLI arg parsing
- `electron/preload.ts` — `window.gbt` API surface
- `src/lib/graph/layout.ts` — lane-assignment algorithm (the hardest code)
- `src/components/graph/BranchTree.tsx` — SVG container, pan/zoom, interactions
- `src/hooks/useGitLog.ts` — git log parsing, pipe-delimited format
- `src/stores/repoStore.ts` — central repo state, `refreshTick` pattern
