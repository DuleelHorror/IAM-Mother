import { IpcMain } from 'electron'
import { WebViewManager } from '../services/WebViewManager'

export function registerWebViewIpc(ipcMain: IpcMain, manager: WebViewManager): void {
  ipcMain.handle('webview:create', (event, opts) => {
    const id = manager.create(opts)

    const sender = event.sender
    manager.on('titleChanged', (viewId: string, title: string) => {
      if (viewId === id && !sender.isDestroyed()) {
        sender.send('webview:titleChanged', viewId, title)
      }
    })
    manager.on('urlChanged', (viewId: string, url: string) => {
      if (viewId === id && !sender.isDestroyed()) {
        sender.send('webview:urlChanged', viewId, url)
      }
    })
    manager.on('externalAuth', (viewId: string, authUrl: string) => {
      if (viewId === id && !sender.isDestroyed()) {
        sender.send('webview:externalAuth', viewId, authUrl)
      }
    })

    return id
  })

  ipcMain.on('webview:setBounds', (_, id: string, bounds: any) => {
    manager.setBounds(id, bounds)
  })

  ipcMain.on('webview:navigate', (_, id: string, url: string) => {
    manager.navigate(id, url)
  })

  ipcMain.on('webview:goBack', (_, id: string) => {
    manager.goBack(id)
  })

  ipcMain.on('webview:goForward', (_, id: string) => {
    manager.goForward(id)
  })

  ipcMain.on('webview:reload', (_, id: string) => {
    manager.reload(id)
  })

  ipcMain.on('webview:destroy', (_, id: string) => {
    manager.destroy(id)
  })

  ipcMain.on('webview:show', (_, id: string) => {
    manager.show(id)
  })

  ipcMain.on('webview:hide', (_, id: string) => {
    manager.hide(id)
  })

  ipcMain.on('webview:hideAll', () => {
    manager.hideAll()
  })
}
