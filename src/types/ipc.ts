export interface IpcApi {
  terminal: {
    create: (opts: TerminalCreateOpts) => Promise<string>
    write: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    kill: (id: string) => void
    onData: (id: string, callback: (data: string) => void) => () => void
    onExit: (id: string, callback: (code: number) => void) => () => void
  }
  webview: {
    create: (opts: WebViewCreateOpts) => Promise<string>
    setBounds: (id: string, bounds: ElectronBounds) => void
    navigate: (id: string, url: string) => void
    goBack: (id: string) => void
    goForward: (id: string) => void
    reload: (id: string) => void
    destroy: (id: string) => void
    show: (id: string) => void
    hide: (id: string) => void
    onTitleChanged: (id: string, callback: (title: string) => void) => () => void
    onUrlChanged: (id: string, callback: (url: string) => void) => () => void
    onExternalAuth: (id: string, callback: (authUrl: string) => void) => () => void
  }
  persistence: {
    getLayout: () => Promise<object | null>
    saveLayout: (model: object) => Promise<void>
    getServices: () => Promise<any[]>
    saveServices: (services: any[]) => Promise<void>
    getConfig: () => Promise<any>
    saveConfig: (config: any) => Promise<void>
    getPresets: () => Promise<any[]>
    savePreset: (preset: any) => Promise<void>
    deletePreset: (id: string) => Promise<void>
    saveApiKey: (serviceId: string, key: string) => Promise<void>
    getApiKey: (serviceId: string) => Promise<string | null>
  }
  tracking: {
    getUsage: (serviceId: string) => Promise<any | null>
    getAllUsage: () => Promise<Record<string, any>>
    refreshUsage: (serviceId: string) => Promise<void>
    onUsageUpdate: (callback: (data: { serviceId: string; usage: any }) => void) => () => void
  }
  dialog: {
    selectDirectory: () => Promise<string | null>
  }
  app: {
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    onMaximizeChange: (callback: (maximized: boolean) => void) => () => void
  }
}

export interface TerminalCreateOpts {
  shell?: string
  command?: string
  cwd?: string
  env?: Record<string, string>
}

export interface WebViewCreateOpts {
  url: string
  partition?: string
}

export interface ElectronBounds {
  x: number
  y: number
  width: number
  height: number
}
