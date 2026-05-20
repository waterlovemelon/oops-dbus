/**
 * Settings Store
 * Manages user preferences and UI settings using Zustand
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Sidebar
  sidebarWidth: number
  setSidebarWidth: (width: number) => void

  // Bottom panel
  bottomPanelHeight: number
  setBottomPanelHeight: (height: number) => void
  bottomPanelCollapsed: boolean
  toggleBottomPanel: () => void

  // Search
  searchFilter: string
  setSearchFilter: (filter: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarWidth: 300,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // Bottom panel
      bottomPanelHeight: 200,
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
      bottomPanelCollapsed: false,
      toggleBottomPanel: () =>
        set((state) => ({ bottomPanelCollapsed: !state.bottomPanelCollapsed })),

      // Search
      searchFilter: '',
      setSearchFilter: (filter) => set({ searchFilter: filter }),
    }),
    {
      name: 'dbus-workbench-settings',
    }
  )
)
