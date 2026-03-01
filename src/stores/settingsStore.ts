import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface SettingsState {
  theme: Theme
  autoSaveLayout: boolean
  loadSettings: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  setAutoSaveLayout: (enabled: boolean) => Promise<void>
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',
  autoSaveLayout: false,

  loadSettings: async () => {
    try {
      const config = await window.api.persistence.getConfig()
      const theme: Theme = config?.theme === 'light' ? 'light' : 'dark'
      const autoSaveLayout = config?.autoSaveLayout === true
      set({ theme, autoSaveLayout })
      applyTheme(theme)
    } catch {
      applyTheme('dark')
    }
  },

  setTheme: async (theme) => {
    set({ theme })
    applyTheme(theme)
    try {
      const config = await window.api.persistence.getConfig()
      await window.api.persistence.saveConfig({ ...config, theme })
    } catch {
      // ignore persistence errors
    }
  },

  setAutoSaveLayout: async (enabled) => {
    set({ autoSaveLayout: enabled })
    try {
      const config = await window.api.persistence.getConfig()
      await window.api.persistence.saveConfig({ ...config, autoSaveLayout: enabled })
    } catch {
      // ignore persistence errors
    }
  }
}))
