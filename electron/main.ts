import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, nativeTheme, dialog, screen } from 'electron'
import { existsSync } from 'fs'
import path from 'path'

// Forzar tema oscuro: las webs (ChatGPT, etc.) ven prefers-color-scheme: dark
nativeTheme.themeSource = 'dark'

// ANTES de que Chromium inicialice: eliminar "Electron" de los Client Hints (Sec-CH-UA)
// Esto es lo que Google usa para detectar y bloquear Electron
const chromeMajor = process.versions.chrome.split('.')[0]
// Eliminar detección de automatización (Google usa esto para bloquear)
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')
app.commandLine.appendSwitch('disable-features', 'AllowClientHintsToThirdParty')
// Forzar el user-agent global sin "Electron"
app.userAgentFallback = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`

import { TerminalManager } from './services/TerminalManager'
import { WebViewManager } from './services/WebViewManager'
import { PersistenceService } from './services/PersistenceService'
import { TrackingService } from './services/TrackingService'
import { registerTerminalIpc } from './ipc/terminal.ipc'
import { registerWebViewIpc } from './ipc/webview.ipc'
import { registerPersistenceIpc } from './ipc/persistence.ipc'
import { registerTrackingIpc } from './ipc/tracking.ipc'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Cargar icono de la app (resources/icon.ico en dev, process.resourcesPath en producción)
const iconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'icon.ico')
  : path.join(__dirname, '../../resources/icon.ico')
const appIcon = existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined
let terminalManager: TerminalManager
let webViewManager: WebViewManager
let persistenceService: PersistenceService
let trackingService: TrackingService

function createWindow() {
  // Initialize persistence early to load window bounds
  persistenceService = new PersistenceService()

  // Load saved window bounds
  const savedBounds = persistenceService.getWindowBounds()
  let windowOpts: Electron.BrowserWindowConstructorOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: appIcon,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  }

  if (savedBounds) {
    // Validate that the saved position is on a visible display
    const targetRect = { x: savedBounds.x, y: savedBounds.y, width: savedBounds.width, height: savedBounds.height }
    const display = screen.getDisplayMatching(targetRect)
    if (display) {
      windowOpts.x = savedBounds.x
      windowOpts.y = savedBounds.y
      windowOpts.width = savedBounds.width
      windowOpts.height = savedBounds.height
    }
  }

  mainWindow = new BrowserWindow(windowOpts)

  if (savedBounds?.isMaximized) {
    mainWindow.maximize()
  }

  // Debounced window bounds save
  let boundsTimeout: ReturnType<typeof setTimeout> | null = null
  const saveBoundsDebounced = () => {
    if (boundsTimeout) clearTimeout(boundsTimeout)
    boundsTimeout = setTimeout(() => {
      if (!mainWindow) return
      const isMaximized = mainWindow.isMaximized()
      const bounds = mainWindow.getBounds()
      persistenceService.saveWindowBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized
      })
    }, 500)
  }

  mainWindow.on('move', saveBoundsDebounced)
  mainWindow.on('resize', saveBoundsDebounced)
  mainWindow.on('maximize', saveBoundsDebounced)
  mainWindow.on('unmaximize', saveBoundsDebounced)

  // Initialize remaining services
  terminalManager = new TerminalManager()
  webViewManager = new WebViewManager(mainWindow)
  trackingService = new TrackingService(persistenceService)

  // Register IPC handlers
  registerTerminalIpc(ipcMain, terminalManager)
  registerWebViewIpc(ipcMain, webViewManager)
  registerPersistenceIpc(ipcMain, persistenceService)
  registerTrackingIpc(ipcMain, trackingService)

  // Window control IPC
  ipcMain.on('app:minimize', () => mainWindow?.minimize())
  ipcMain.on('app:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('app:close', () => mainWindow?.close())
  ipcMain.handle('app:isMaximized', () => mainWindow?.isMaximized() ?? false)

  // Directory selection dialog
  ipcMain.handle('dialog:selectDirectory', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Seleccionar carpeta de trabajo'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('app:maximizeChanged', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('app:maximizeChanged', false)
  })

  // Keyboard shortcuts forwarded to renderer
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && !input.alt && !input.meta) {
      switch (input.key.toLowerCase()) {
        case 't':
          mainWindow?.webContents.send('shortcut', 'new-terminal')
          break
        case 'w':
          mainWindow?.webContents.send('shortcut', 'close-tab')
          break
        case 'b':
          mainWindow?.webContents.send('shortcut', 'toggle-sidebar')
          break
        case 'n':
          mainWindow?.webContents.send('shortcut', 'new-web-panel')
          break
        case '/':
          mainWindow?.webContents.send('shortcut', 'show-shortcuts')
          break
      }
    }
  })

  // Load app
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // DevTools: solo con F12, no auto-abrir
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools()
    }
  })

  // Limpiar recursos ANTES de que la ventana se destruya
  mainWindow.on('close', () => {
    try { terminalManager.killAll() } catch { /* ignore */ }
    try { webViewManager.destroyAll() } catch { /* ignore */ }
    try { trackingService.stopAll() } catch { /* ignore */ }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // System tray
  createTray()
}

function createTray() {
  const trayIcon = appIcon
    ? appIcon.resize({ width: 16, height: 16 })
    : nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMkMEa+wAAABLSURBVDhPY/hPBBhVQBwYjCr4/5+BgSGJgSExi4EhOZGBITkRKJaYlJSUCOQnAwBFk5KSEoH8RAAK0BMDhTIZGBhSgWYkE+v/fwBWGDKMVxE2VAAAAABJRU5ErkJggg=='
      )

  tray = new Tray(trayIcon)
  tray.setToolTip('IAM Mother // Centro de Control IA - Duke el Horror')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar IAM Mother',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Cerrar',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
