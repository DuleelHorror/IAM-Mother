import { contextBridge, ipcRenderer } from 'electron'

const api = {
  terminal: {
    create: (opts: any) => ipcRenderer.invoke('terminal:create', opts),
    write: (id: string, data: string) => ipcRenderer.send('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', id, cols, rows),
    kill: (id: string) => ipcRenderer.send('terminal:kill', id),
    onData: (id: string, callback: (data: string) => void) => {
      const handler = (_: any, tid: string, data: string) => {
        if (tid === id) callback(data)
      }
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.removeListener('terminal:data', handler)
    },
    onExit: (id: string, callback: (code: number) => void) => {
      const handler = (_: any, tid: string, code: number) => {
        if (tid === id) callback(code)
      }
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.removeListener('terminal:exit', handler)
    }
  },

  webview: {
    create: (opts: any) => ipcRenderer.invoke('webview:create', opts),
    setBounds: (id: string, bounds: any) =>
      ipcRenderer.send('webview:setBounds', id, bounds),
    navigate: (id: string, url: string) =>
      ipcRenderer.send('webview:navigate', id, url),
    goBack: (id: string) => ipcRenderer.send('webview:goBack', id),
    goForward: (id: string) => ipcRenderer.send('webview:goForward', id),
    reload: (id: string) => ipcRenderer.send('webview:reload', id),
    destroy: (id: string) => ipcRenderer.send('webview:destroy', id),
    show: (id: string) => ipcRenderer.send('webview:show', id),
    hide: (id: string) => ipcRenderer.send('webview:hide', id),
    hideAll: () => ipcRenderer.send('webview:hideAll'),
    onTitleChanged: (id: string, callback: (title: string) => void) => {
      const handler = (_: any, vid: string, title: string) => {
        if (vid === id) callback(title)
      }
      ipcRenderer.on('webview:titleChanged', handler)
      return () => ipcRenderer.removeListener('webview:titleChanged', handler)
    },
    onUrlChanged: (id: string, callback: (url: string) => void) => {
      const handler = (_: any, vid: string, url: string) => {
        if (vid === id) callback(url)
      }
      ipcRenderer.on('webview:urlChanged', handler)
      return () => ipcRenderer.removeListener('webview:urlChanged', handler)
    },
    onExternalAuth: (id: string, callback: (authUrl: string) => void) => {
      const handler = (_: any, vid: string, authUrl: string) => {
        if (vid === id) callback(authUrl)
      }
      ipcRenderer.on('webview:externalAuth', handler)
      return () => ipcRenderer.removeListener('webview:externalAuth', handler)
    }
  },

  persistence: {
    getLayout: () => ipcRenderer.invoke('persistence:getLayout'),
    saveLayout: (model: any) => ipcRenderer.invoke('persistence:saveLayout', model),
    getServices: () => ipcRenderer.invoke('persistence:getServices'),
    saveServices: (services: any) =>
      ipcRenderer.invoke('persistence:saveServices', services),
    getConfig: () => ipcRenderer.invoke('persistence:getConfig'),
    saveConfig: (config: any) => ipcRenderer.invoke('persistence:saveConfig', config),
    getPresets: () => ipcRenderer.invoke('persistence:getPresets'),
    savePreset: (preset: any) => ipcRenderer.invoke('persistence:savePreset', preset),
    deletePreset: (id: string) => ipcRenderer.invoke('persistence:deletePreset', id),
    saveApiKey: (serviceId: string, key: string) =>
      ipcRenderer.invoke('persistence:saveApiKey', serviceId, key),
    getApiKey: (serviceId: string) =>
      ipcRenderer.invoke('persistence:getApiKey', serviceId)
  },

  tracking: {
    getUsage: (serviceId: string) => ipcRenderer.invoke('tracking:getUsage', serviceId),
    getAllUsage: () => ipcRenderer.invoke('tracking:getAllUsage'),
    refreshUsage: (serviceId: string) =>
      ipcRenderer.invoke('tracking:refreshUsage', serviceId),
    onUsageUpdate: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('tracking:usageUpdate', handler)
      return () => ipcRenderer.removeListener('tracking:usageUpdate', handler)
    }
  },

  dialog: {
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory')
  },

  browser: {
    openExternal: (url: string) => ipcRenderer.invoke('browser:openExternal', url),
    importSession: (webviewId: string) =>
      ipcRenderer.invoke('browser:importSession', webviewId),
    getAvailableBrowsers: () => ipcRenderer.invoke('browser:getAvailableBrowsers')
  },

  app: {
    minimize: () => ipcRenderer.send('app:minimize'),
    maximize: () => ipcRenderer.send('app:maximize'),
    close: () => ipcRenderer.send('app:close'),
    isMaximized: () => ipcRenderer.invoke('app:isMaximized'),
    onMaximizeChange: (callback: (maximized: boolean) => void) => {
      const handler = (_: any, maximized: boolean) => callback(maximized)
      ipcRenderer.on('app:maximizeChanged', handler)
      return () => ipcRenderer.removeListener('app:maximizeChanged', handler)
    },
    onShortcut: (callback: (action: string) => void) => {
      const handler = (_: any, action: string) => callback(action)
      ipcRenderer.on('shortcut', handler)
      return () => ipcRenderer.removeListener('shortcut', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
