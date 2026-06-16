import { create } from 'zustand'

type Theme = 'dark' | 'light'
type Language = 'en' | 'zh'

interface AppState {
  theme: Theme
  language: Language
  commitPanelOpen: boolean
  detailPanelOpen: boolean
  historyPanelOpen: boolean

  toggleTheme: () => void
  setLanguage: (lang: Language) => void
  setCommitPanelOpen: (open: boolean) => void
  setDetailPanelOpen: (open: boolean) => void
  setHistoryPanelOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  language: 'en',
  commitPanelOpen: false,
  detailPanelOpen: false,
  historyPanelOpen: false,

  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  setLanguage: (language) => set({ language }),

  setCommitPanelOpen: (open) => set({ commitPanelOpen: open }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
  setHistoryPanelOpen: (open) => set({ historyPanelOpen: open }),
}))
