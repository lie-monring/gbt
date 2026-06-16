import { create } from 'zustand'

interface GraphState {
  /** Offset of viewport in px */
  offsetX: number
  offsetY: number
  /** Zoom scale, 0.25 to 3.0 */
  zoom: number
  /** Currently selected commit hash */
  selectedHash: string | null
  /** Search/filter text */
  filterText: string

  setOffset: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  selectCommit: (hash: string | null) => void
  setFilterText: (text: string) => void
}

function clampZoom(z: number) {
  return Math.max(0.25, Math.min(3, z))
}

export const useGraphStore = create<GraphState>((set) => ({
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  selectedHash: null,
  filterText: '',

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),
  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  selectCommit: (hash) => set({ selectedHash: hash }),
  setFilterText: (text) => set({ filterText: text }),
}))
