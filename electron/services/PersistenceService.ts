import Store from 'electron-store'
import { safeStorage } from 'electron'

interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

interface StoreSchema {
  layout: object | null
  services: any[]
  config: any
  presets: any[]
  windowBounds: WindowBounds | null
}

export class PersistenceService {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'iam-mother-config',
      defaults: {
        layout: null,
        services: [],
        config: {
          theme: 'dark',
          autoSaveLayout: true,
          autoSaveIntervalMs: 5000,
          trackingIntervalMs: 300000,
          defaultShell: 'powershell'
        },
        presets: [],
        windowBounds: null
      }
    })
  }

  // Layout
  getLayout(): object | null {
    return this.store.get('layout')
  }

  saveLayout(model: object): void {
    this.store.set('layout', model)
  }

  // Services
  getServices(): any[] {
    return this.store.get('services')
  }

  saveServices(services: any[]): void {
    this.store.set('services', services)
  }

  // Config
  getConfig(): any {
    return this.store.get('config')
  }

  saveConfig(config: any): void {
    this.store.set('config', config)
  }

  // Presets
  getPresets(): any[] {
    return this.store.get('presets')
  }

  savePreset(preset: any): void {
    const presets = this.getPresets()
    const idx = presets.findIndex((p: any) => p.id === preset.id)
    if (idx >= 0) {
      presets[idx] = preset
    } else {
      presets.push(preset)
    }
    this.store.set('presets', presets)
  }

  deletePreset(id: string): void {
    const presets = this.getPresets().filter((p: any) => p.id !== id)
    this.store.set('presets', presets)
  }

  // Window Bounds
  getWindowBounds(): WindowBounds | null {
    return this.store.get('windowBounds')
  }

  saveWindowBounds(bounds: WindowBounds): void {
    this.store.set('windowBounds', bounds)
  }

  // API Keys (encrypted)
  saveApiKey(serviceId: string, key: string): void {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(key)
      this.store.set(`apiKeys.${serviceId}` as any, encrypted.toString('base64'))
    } else {
      // Fallback: store as plaintext (not ideal)
      this.store.set(`apiKeys.${serviceId}` as any, key)
    }
  }

  getApiKey(serviceId: string): string | null {
    const stored = this.store.get(`apiKeys.${serviceId}` as any) as string | undefined
    if (!stored) return null

    if (safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(stored, 'base64')
        return safeStorage.decryptString(buffer)
      } catch {
        return stored // fallback if decryption fails
      }
    }
    return stored
  }
}
