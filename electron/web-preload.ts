/**
 * Preload para web panels.
 * Se ejecuta ANTES que cualquier script de la página.
 * Con contextIsolation: false, corre en el mismo mundo que la página,
 * así que las sobreescrituras son visibles para Google y otros detectores.
 *
 * Objetivo: hacer que el entorno sea IDÉNTICO a Chrome real.
 */
const chromeMajor = process.versions.chrome.split('.')[0]
const fullVersion = process.versions.chrome

// ═══════════════════════════════════════════════════
// 1. navigator.userAgentData - Client Hints API
// ═══════════════════════════════════════════════════
try {
  Object.defineProperty(navigator, 'userAgentData', {
    value: {
      brands: [
        { brand: 'Chromium', version: chromeMajor },
        { brand: 'Google Chrome', version: chromeMajor },
        { brand: 'Not?A_Brand', version: '99' }
      ],
      mobile: false,
      platform: 'Windows',
      getHighEntropyValues(hints: string[]) {
        return Promise.resolve({
          brands: [
            { brand: 'Chromium', version: chromeMajor },
            { brand: 'Google Chrome', version: chromeMajor },
            { brand: 'Not?A_Brand', version: '99' }
          ],
          mobile: false,
          platform: 'Windows',
          platformVersion: '15.0.0',
          architecture: 'x86',
          bitness: '64',
          model: '',
          fullVersionList: [
            { brand: 'Chromium', version: fullVersion },
            { brand: 'Google Chrome', version: fullVersion },
            { brand: 'Not?A_Brand', version: '99.0.0.0' }
          ],
          uaFullVersion: fullVersion
        })
      }
    },
    configurable: false,
    enumerable: true
  })
} catch {
  // Si ya estaba definido
}

// ═══════════════════════════════════════════════════
// 2. navigator.webdriver - Detección de automatización
//    Google comprueba esto para bloquear bots/Electron
// ═══════════════════════════════════════════════════
try {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
    configurable: true
  })
} catch {}

// ═══════════════════════════════════════════════════
// 3. navigator.plugins - Chrome real tiene plugins
//    Electron por defecto tiene plugins vacíos = sospechoso
// ═══════════════════════════════════════════════════
try {
  const fakePlugin = (name: string, description: string, filename: string, mimeType: string, mimeDesc: string) => {
    const mime = {
      type: mimeType,
      suffixes: mimeType === 'application/pdf' ? 'pdf' : '',
      description: mimeDesc,
      enabledPlugin: null as any
    }
    const plugin = {
      name,
      description,
      filename,
      length: 1,
      0: mime,
      item: (i: number) => (i === 0 ? mime : null),
      namedItem: (n: string) => (n === mimeType ? mime : null),
      [Symbol.iterator]: function* () { yield mime }
    }
    mime.enabledPlugin = plugin
    return plugin
  }

  const pdfPlugin = fakePlugin(
    'Chrome PDF Viewer',
    'Portable Document Format',
    'internal-pdf-viewer',
    'application/pdf',
    'Portable Document Format'
  )
  const pdfPlugin2 = fakePlugin(
    'Chromium PDF Viewer',
    'Portable Document Format',
    'internal-pdf-viewer',
    'application/pdf',
    'Portable Document Format'
  )

  const fakePlugins = [pdfPlugin, pdfPlugin2]

  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const arr = fakePlugins as any
      arr.item = (i: number) => fakePlugins[i] || null
      arr.namedItem = (name: string) => fakePlugins.find((p: any) => p.name === name) || null
      arr.refresh = () => {}
      return arr
    },
    configurable: true
  })

  // MimeTypes también
  const fakeMimes = [{
    type: 'application/pdf',
    suffixes: 'pdf',
    description: 'Portable Document Format',
    enabledPlugin: pdfPlugin
  }]

  Object.defineProperty(navigator, 'mimeTypes', {
    get: () => {
      const arr = fakeMimes as any
      arr.item = (i: number) => fakeMimes[i] || null
      arr.namedItem = (name: string) => fakeMimes.find((m: any) => m.type === name) || null
      return arr
    },
    configurable: true
  })
} catch {}

// ═══════════════════════════════════════════════════
// 4. navigator.languages - Asegurar formato correcto
// ═══════════════════════════════════════════════════
try {
  Object.defineProperty(navigator, 'languages', {
    get: () => ['es-ES', 'es', 'en-US', 'en'],
    configurable: true
  })
} catch {}

// ═══════════════════════════════════════════════════
// 5. window.chrome - Google comprueba que exista completo
//    Chrome real tiene chrome.app, chrome.runtime,
//    chrome.loadTimes, chrome.csi
// ═══════════════════════════════════════════════════
try {
  const w = window as any

  if (!w.chrome) {
    w.chrome = {}
  }

  // chrome.app - existe en Chrome real
  if (!w.chrome.app) {
    w.chrome.app = {
      isInstalled: false,
      InstallState: {
        DISABLED: 'disabled',
        INSTALLED: 'installed',
        NOT_INSTALLED: 'not_installed'
      },
      RunningState: {
        CANNOT_RUN: 'cannot_run',
        READY_TO_RUN: 'ready_to_run',
        RUNNING: 'running'
      },
      getDetails: () => null,
      getIsInstalled: () => false
    }
  }

  // chrome.runtime - existe incluso sin extensiones
  if (!w.chrome.runtime) {
    w.chrome.runtime = {
      OnInstalledReason: {
        CHROME_UPDATE: 'chrome_update',
        INSTALL: 'install',
        SHARED_MODULE_UPDATE: 'shared_module_update',
        UPDATE: 'update'
      },
      OnRestartRequiredReason: {
        APP_UPDATE: 'app_update',
        OS_UPDATE: 'os_update',
        PERIODIC: 'periodic'
      },
      PlatformArch: {
        ARM: 'arm',
        ARM64: 'arm64',
        MIPS: 'mips',
        MIPS64: 'mips64',
        X86_32: 'x86-32',
        X86_64: 'x86-64'
      },
      PlatformNaclArch: {
        ARM: 'arm',
        MIPS: 'mips',
        MIPS64: 'mips64',
        X86_32: 'x86-32',
        X86_64: 'x86-64'
      },
      PlatformOs: {
        ANDROID: 'android',
        CROS: 'cros',
        LINUX: 'linux',
        MAC: 'mac',
        OPENBSD: 'openbsd',
        WIN: 'win'
      },
      RequestUpdateCheckStatus: {
        NO_UPDATE: 'no_update',
        THROTTLED: 'throttled',
        UPDATE_AVAILABLE: 'update_available'
      },
      connect: () => { throw new Error('Could not establish connection.') },
      sendMessage: () => { throw new Error('Could not establish connection.') }
    }
  }

  // chrome.loadTimes - deprecated pero Google aún lo comprueba
  if (!w.chrome.loadTimes) {
    w.chrome.loadTimes = () => ({
      commitLoadTime: Date.now() / 1000,
      connectionInfo: 'h2',
      finishDocumentLoadTime: Date.now() / 1000,
      finishLoadTime: Date.now() / 1000,
      firstPaintAfterLoadTime: 0,
      firstPaintTime: Date.now() / 1000,
      navigationType: 'Other',
      npnNegotiatedProtocol: 'h2',
      requestTime: Date.now() / 1000 - 0.1,
      startLoadTime: Date.now() / 1000 - 0.1,
      wasAlternateProtocolAvailable: false,
      wasFetchedViaSpdy: true,
      wasNpnNegotiated: true
    })
  }

  // chrome.csi - Chrome Status Indicator
  if (!w.chrome.csi) {
    w.chrome.csi = () => ({
      onloadT: Date.now(),
      pageT: Date.now() / 1000,
      startE: Date.now(),
      tran: 15 // Navigation type
    })
  }
} catch {}

// ═══════════════════════════════════════════════════
// 6. Notification permissions - Chrome real las tiene
// ═══════════════════════════════════════════════════
try {
  const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions)
  Object.defineProperty(navigator.permissions, 'query', {
    value: (parameters: any) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: Notification.permission } as PermissionStatus)
      }
      return origQuery(parameters)
    },
    configurable: true,
    writable: true
  })
} catch {}

// ═══════════════════════════════════════════════════
// 7. WebGL - Limpiar cualquier string que delate Electron
// ═══════════════════════════════════════════════════
try {
  const getParameterOrig = WebGLRenderingContext.prototype.getParameter
  WebGLRenderingContext.prototype.getParameter = function (param: number) {
    // UNMASKED_VENDOR_WEBGL = 0x9245, UNMASKED_RENDERER_WEBGL = 0x9246
    const result = getParameterOrig.call(this, param)
    if (typeof result === 'string' && result.toLowerCase().includes('electron')) {
      return result.replace(/electron/gi, 'Chrome')
    }
    return result
  }
  if (typeof WebGL2RenderingContext !== 'undefined') {
    const getParameter2Orig = WebGL2RenderingContext.prototype.getParameter
    WebGL2RenderingContext.prototype.getParameter = function (param: number) {
      const result = getParameter2Orig.call(this, param)
      if (typeof result === 'string' && result.toLowerCase().includes('electron')) {
        return result.replace(/electron/gi, 'Chrome')
      }
      return result
    }
  }
} catch {}

// ═══════════════════════════════════════════════════
// 8. Eliminar huellas de Electron en propiedades globales
// ═══════════════════════════════════════════════════
try {
  // Limpiar process (no debería estar expuesto pero por si acaso con contextIsolation: false)
  // No eliminamos process completamente porque lo necesitamos arriba para versions.chrome
  // Pero lo ocultamos después de usarlo
  if ((window as any).process) {
    delete (window as any).process
  }
  if ((window as any).require) {
    delete (window as any).require
  }
  if ((window as any).__electron_preload) {
    delete (window as any).__electron_preload
  }
} catch {}
