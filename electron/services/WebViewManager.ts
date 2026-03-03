import { BrowserWindow, WebContentsView, session, shell } from 'electron'
import { EventEmitter } from 'events'
import path from 'path'

interface WebViewInstance {
  id: string
  view: WebContentsView
  partition: string
  authWindow: BrowserWindow | null
}

export class WebViewManager extends EventEmitter {
  private views = new Map<string, WebViewInstance>()
  private parentWindow: BrowserWindow
  private nextId = 0

  constructor(parentWindow: BrowserWindow) {
    super()
    this.parentWindow = parentWindow
  }

  /**
   * Configura una sesión para que parezca Chrome real.
   * Google bloquea login si detecta "Electron" en Sec-CH-UA headers.
   */
  private disguiseSession(ses: Electron.Session): string {
    const chromeMajor = process.versions.chrome.split('.')[0]
    const realUserAgent =
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`

    ses.setUserAgent(realUserAgent)

    // Reescribir TODAS las cabeceras que delatan Electron
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders }

      // Eliminar headers de Electron
      delete headers['X-Electron']

      // Reemplazar Sec-CH-UA: la clave del bloqueo de Google
      // Electron envía: "Electron";v="35" → Google lo detecta y bloquea
      // Chrome real envía: "Google Chrome";v="130"
      headers['Sec-CH-UA'] =
        `"Chromium";v="${chromeMajor}", "Google Chrome";v="${chromeMajor}", "Not?A_Brand";v="99"`
      headers['Sec-CH-UA-Mobile'] = '?0'
      headers['Sec-CH-UA-Platform'] = '"Windows"'
      headers['Sec-CH-UA-Full-Version-List'] =
        `"Chromium";v="${process.versions.chrome}", "Google Chrome";v="${process.versions.chrome}", "Not?A_Brand";v="99.0.0.0"`
      headers['User-Agent'] = realUserAgent

      callback({ requestHeaders: headers })
    })

    return realUserAgent
  }

  create(opts: { url: string; partition?: string }): string {
    const id = `web-${++this.nextId}`
    const partition = opts.partition || `persist:web-${id}`

    const ses = session.fromPartition(partition)
    this.disguiseSession(ses)

    // Web preload: sobreescribe navigator.userAgentData ANTES que cualquier script de la página
    const webPreloadPath = path.join(__dirname, 'web-preload.js')

    const view = new WebContentsView({
      webPreferences: {
        session: ses,
        // contextIsolation OFF para que el preload corra en el mundo de la página
        // (así navigator.userAgentData es visible para Google)
        // Seguro: no hay nodeIntegration ni APIs expuestas
        contextIsolation: false,
        nodeIntegration: false,
        sandbox: false,
        allowPopups: true,
        preload: webPreloadPath
      }
    })

    this.parentWindow.contentView.addChildView(view)
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 })

    const instance: WebViewInstance = { id, view, partition, authWindow: null }

    // Track URL/title changes
    view.webContents.on('page-title-updated', (_, title) => {
      this.emit('titleChanged', id, title)
    })

    view.webContents.on('did-navigate', (_, url) => {
      this.emit('urlChanged', id, url)
    })

    view.webContents.on('did-navigate-in-page', (_, url) => {
      this.emit('urlChanged', id, url)
    })

    // Manejar popups de login (Google, Microsoft, etc.)
    // Todos se abren en un BrowserWindow popup con sesión compartida + disfraz
    view.webContents.setWindowOpenHandler(({ url }) => {
      this.openAuthPopup(instance, url)
      return { action: 'deny' }
    })

    view.webContents.loadURL(opts.url)

    this.views.set(id, instance)
    return id
  }

  /**
   * Abre una ventana de navegador real para el flujo de auth.
   * La sesión se comparte, así que las cookies vuelven al WebContentsView.
   * El disfraz de Chrome (preload + headers) se aplica también al popup.
   */
  private openAuthPopup(instance: WebViewInstance, url: string): void {
    if (instance.authWindow && !instance.authWindow.isDestroyed()) {
      instance.authWindow.close()
    }

    const ses = instance.view.webContents.session

    const webPreloadPath = path.join(__dirname, 'web-preload.js')

    const popup = new BrowserWindow({
      width: 500,
      height: 700,
      parent: this.parentWindow,
      modal: false,
      show: true,
      title: 'Iniciar sesion',
      backgroundColor: '#0a120a',
      webPreferences: {
        session: ses,
        contextIsolation: false,
        nodeIntegration: false,
        sandbox: false,
        preload: webPreloadPath
      }
    })

    instance.authWindow = popup

    // El preload ya se encarga del disfraz

    // Manejar popups anidados (Google a veces abre más ventanas)
    popup.webContents.setWindowOpenHandler(({ url: nestedUrl }) => {
      popup.loadURL(nestedUrl)
      return { action: 'deny' }
    })

    popup.loadURL(url)

    // Cuando el login termine y navegue de vuelta, cerrar y refrescar
    popup.webContents.on('will-navigate', (_, navUrl) => {
      // Si navega fuera de accounts.google / login.microsoftonline, login completado
      const isAuthPage =
        navUrl.includes('accounts.google') ||
        navUrl.includes('login.microsoftonline') ||
        navUrl.includes('auth0.com') ||
        navUrl.includes('login.') ||
        navUrl.includes('signin') ||
        navUrl.includes('oauth')

      if (!isAuthPage && !popup.isDestroyed()) {
        // Login completado, recargar el webview original para usar las cookies
        setTimeout(() => {
          if (!popup.isDestroyed()) popup.close()
          instance.view.webContents.reload()
        }, 500)
      }
    })

    popup.on('closed', () => {
      instance.authWindow = null
      // Recargar el panel por si el login se completó
      if (!instance.view.webContents.isDestroyed()) {
        instance.view.webContents.reload()
      }
    })
  }

  setBounds(id: string, bounds: { x: number; y: number; width: number; height: number }): void {
    const instance = this.views.get(id)
    if (instance) {
      const scaleFactor = this.parentWindow.webContents.getZoomFactor()
      instance.view.setBounds({
        x: Math.round(bounds.x * scaleFactor),
        y: Math.round(bounds.y * scaleFactor),
        width: Math.round(bounds.width * scaleFactor),
        height: Math.round(bounds.height * scaleFactor)
      })
    }
  }

  navigate(id: string, url: string): void {
    const instance = this.views.get(id)
    if (instance) {
      const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`
      instance.view.webContents.loadURL(fullUrl)
    }
  }

  goBack(id: string): void {
    this.views.get(id)?.view.webContents.goBack()
  }

  goForward(id: string): void {
    this.views.get(id)?.view.webContents.goForward()
  }

  reload(id: string): void {
    this.views.get(id)?.view.webContents.reload()
  }

  show(id: string): void {
    this.views.get(id)?.view.setVisible(true)
  }

  hide(id: string): void {
    this.views.get(id)?.view.setVisible(false)
  }

  hideAll(): void {
    for (const instance of this.views.values()) {
      try {
        instance.view.setVisible(false)
        instance.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      } catch { /* ignore */ }
    }
  }

  destroy(id: string): void {
    const instance = this.views.get(id)
    if (!instance) return
    this.views.delete(id)

    try {
      if (instance.authWindow && !instance.authWindow.isDestroyed()) {
        instance.authWindow.close()
      }
    } catch { /* ya destruida */ }

    try {
      if (!instance.view.webContents.isDestroyed()) {
        this.parentWindow.contentView.removeChildView(instance.view)
        instance.view.webContents.close()
      }
    } catch { /* ya destruida */ }
  }

  destroyAll(): void {
    const ids = Array.from(this.views.keys())
    for (const id of ids) {
      this.destroy(id)
    }
  }

  getIds(): string[] {
    return Array.from(this.views.keys())
  }

  getSession(id: string): Electron.Session | null {
    return this.views.get(id)?.view.webContents.session || null
  }

  getCurrentUrl(id: string): string | null {
    const instance = this.views.get(id)
    if (!instance || instance.view.webContents.isDestroyed()) return null
    return instance.view.webContents.getURL()
  }

  openExternal(url: string): void {
    shell.openExternal(url)
  }
}
