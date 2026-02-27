import { IpcMain, BrowserWindow } from 'electron'
import { TerminalManager } from '../services/TerminalManager'

export function registerTerminalIpc(ipcMain: IpcMain, manager: TerminalManager): void {
  // Registrar forwarding UNA sola vez, no por cada terminal:create
  // El manager emite (termId, data) - reenviamos al renderer filtrando por sender
  let sender: Electron.WebContents | null = null

  manager.on('data', (termId: string, data: string) => {
    if (sender && !sender.isDestroyed()) {
      sender.send('terminal:data', termId, data)
    }
  })

  manager.on('exit', (termId: string, code: number) => {
    if (sender && !sender.isDestroyed()) {
      sender.send('terminal:exit', termId, code)
    }
  })

  ipcMain.handle('terminal:create', (event, opts) => {
    // Guardar referencia al sender (solo hay un renderer)
    sender = event.sender
    return manager.create(opts)
  })

  ipcMain.on('terminal:write', (_, id: string, data: string) => {
    manager.write(id, data)
  })

  ipcMain.on('terminal:resize', (_, id: string, cols: number, rows: number) => {
    manager.resize(id, cols, rows)
  })

  ipcMain.on('terminal:kill', (_, id: string) => {
    manager.kill(id)
  })
}
