import { create } from 'zustand'
import { AIServiceConfig, DEFAULT_SERVICES } from '../types/ai-service'

declare global {
  interface Window {
    api: any
  }
}

interface ServiceState {
  services: AIServiceConfig[]
  globalCwd: string
  loading: boolean
  loadServices: () => Promise<void>
  addService: (service: AIServiceConfig) => Promise<void>
  updateService: (id: string, updates: Partial<AIServiceConfig>) => Promise<void>
  removeService: (id: string) => Promise<void>
  getService: (id: string) => AIServiceConfig | undefined
  getEnabledServices: () => AIServiceConfig[]
  setGlobalCwd: (cwd: string) => Promise<void>
  selectGlobalCwd: () => Promise<void>
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: DEFAULT_SERVICES,
  globalCwd: '',
  loading: false,

  loadServices: async () => {
    set({ loading: true })
    try {
      // Load globalCwd from config
      const config = await window.api.persistence.getConfig()
      if (config?.globalCwd) {
        set({ globalCwd: config.globalCwd })
      }

      const saved = await window.api.persistence.getServices()
      if (saved && saved.length > 0) {
        // Merge: añadir servicios default que no existan en los guardados
        // y quitar los que ya no están en defaults (como google-ai-studio)
        const savedIds = new Set(saved.map((s: AIServiceConfig) => s.id))
        const defaultIds = new Set(DEFAULT_SERVICES.map(s => s.id))
        const merged = [
          // Mantener los guardados que siguen en defaults o son custom
          ...saved.filter((s: AIServiceConfig) => defaultIds.has(s.id) || !DEFAULT_SERVICES.find(d => d.id === s.id)),
          // Añadir nuevos defaults que no existían
          ...DEFAULT_SERVICES.filter(d => !savedIds.has(d.id))
        ]
        // Quitar servicios obsoletos (como google-ai-studio)
        const obsoleteIds = ['google-ai-studio', 'banana-pro']
        const cleaned = merged.filter((s: AIServiceConfig) => !obsoleteIds.includes(s.id))
        set({ services: cleaned })
        await window.api.persistence.saveServices(cleaned)
      } else {
        // Initialize with defaults
        set({ services: DEFAULT_SERVICES })
        await window.api.persistence.saveServices(DEFAULT_SERVICES)
      }
    } catch {
      // Use defaults
    }
    set({ loading: false })
  },

  addService: async (service) => {
    const services = [...get().services, service]
    set({ services })
    await window.api.persistence.saveServices(services)
  },

  updateService: async (id, updates) => {
    const services = get().services.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    )
    set({ services })
    await window.api.persistence.saveServices(services)
  },

  removeService: async (id) => {
    const services = get().services.filter((s) => s.id !== id)
    set({ services })
    await window.api.persistence.saveServices(services)
  },

  getService: (id) => get().services.find((s) => s.id === id),

  getEnabledServices: () => get().services.filter((s) => s.enabled),

  setGlobalCwd: async (cwd) => {
    set({ globalCwd: cwd })
    const config = await window.api.persistence.getConfig()
    await window.api.persistence.saveConfig({ ...config, globalCwd: cwd })
  },

  selectGlobalCwd: async () => {
    const result = await window.api.dialog.selectDirectory()
    if (result) {
      get().setGlobalCwd(result)
    }
  }
}))
