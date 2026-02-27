export interface LayoutPreset {
  id: string
  name: string
  /** FlexLayout JSON model */
  model: object
  createdAt: number
}

export interface AppConfig {
  theme: 'dark' | 'light'
  autoSaveLayout: boolean
  autoSaveIntervalMs: number
  trackingIntervalMs: number
  defaultShell: string
}

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'dark',
  autoSaveLayout: true,
  autoSaveIntervalMs: 5000,
  trackingIntervalMs: 300000, // 5 min
  defaultShell: 'powershell'
}
