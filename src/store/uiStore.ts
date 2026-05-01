import { create } from 'zustand'

type Filters = Record<string, unknown>

interface UiState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  activeFilters: Filters
  setFilter: (key: string, value: unknown) => void
  clearFilters: () => void
}

export const uiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeFilters: {},
  setFilter: (key, value) => set((s) => ({ activeFilters: { ...s.activeFilters, [key]: value } })),
  clearFilters: () => set({ activeFilters: {} }),
}))

