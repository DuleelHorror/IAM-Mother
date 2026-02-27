import { create } from 'zustand'
import { UsageData } from '../types/ai-service'

interface TrackingState {
  usage: Record<string, UsageData>
  totalCostUsd: number
  loading: boolean
  loadAllUsage: () => Promise<void>
  refreshUsage: (serviceId: string) => Promise<void>
  setUsage: (serviceId: string, data: UsageData) => void
  getTotalCost: () => number
  listenForUpdates: () => () => void
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  usage: {},
  totalCostUsd: 0,
  loading: false,

  loadAllUsage: async () => {
    set({ loading: true })
    try {
      const allUsage = await window.api.tracking.getAllUsage()
      const totalCostUsd = Object.values(allUsage).reduce(
        (sum: number, u: any) => sum + (u.costUsd || 0),
        0
      )
      set({ usage: allUsage, totalCostUsd })
    } catch {
      // ignore
    }
    set({ loading: false })
  },

  refreshUsage: async (serviceId) => {
    await window.api.tracking.refreshUsage(serviceId)
  },

  setUsage: (serviceId, data) => {
    set((state) => {
      const usage = { ...state.usage, [serviceId]: data }
      const totalCostUsd = Object.values(usage).reduce(
        (sum, u) => sum + (u.costUsd || 0),
        0
      )
      return { usage, totalCostUsd }
    })
  },

  getTotalCost: () => get().totalCostUsd,

  listenForUpdates: () => {
    return window.api.tracking.onUsageUpdate(
      (data: { serviceId: string; usage: UsageData }) => {
        get().setUsage(data.serviceId, data.usage)
      }
    )
  }
}))
