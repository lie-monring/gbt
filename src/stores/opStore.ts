import { create } from 'zustand'
import type { OperationEntry } from '../../electron/git/types'

interface OpState {
  /** Operation history stack (newest first) */
  history: OperationEntry[]
  /** Index of the next undone operation, for redo */
  undoneStack: OperationEntry[]

  pushOperation: (op: OperationEntry) => void
  popUndo: () => OperationEntry | null
  pushRedo: (op: OperationEntry) => void
  popRedo: () => OperationEntry | null
  clearHistory: () => void
}

let nextId = 0

export function createOperation(
  overrides: Partial<OperationEntry> & Pick<OperationEntry, 'type' | 'description'>,
): OperationEntry {
  return {
    id: `op-${++nextId}-${Date.now()}`,
    timestamp: Date.now(),
    preRefs: {},
    postRefs: {},
    undoable: true,
    undoDescription: `Undo: ${overrides.description}`,
    ...overrides,
  }
}

export const useOpStore = create<OpState>((set) => ({
  history: [],
  undoneStack: [],

  pushOperation: (op) =>
    set((s) => ({
      history: [op, ...s.history].slice(0, 100), // keep last 100
      undoneStack: [], // clear redo stack on new operation
    })),

  popUndo: () => {
    let popped: OperationEntry | null = null
    set((s) => {
      if (s.history.length === 0) return s
      const [first, ...rest] = s.history
      popped = first
      return { history: rest }
    })
    return popped
  },

  pushRedo: (op) =>
    set((s) => ({
      undoneStack: [op, ...s.undoneStack],
    })),

  popRedo: () => {
    let popped: OperationEntry | null = null
    set((s) => {
      if (s.undoneStack.length === 0) return s
      const [first, ...rest] = s.undoneStack
      popped = first
      return { undoneStack: rest }
    })
    return popped
  },

  clearHistory: () => set({ history: [], undoneStack: [] }),
}))
