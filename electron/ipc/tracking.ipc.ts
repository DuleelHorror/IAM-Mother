import { IpcMain } from 'electron'
import { TrackingService } from '../services/TrackingService'

export function registerTrackingIpc(
  ipcMain: IpcMain,
  service: TrackingService
): void {
  ipcMain.handle('tracking:getUsage', (_, serviceId) => service.getUsage(serviceId))
  ipcMain.handle('tracking:getAllUsage', () => service.getAllUsage())
  ipcMain.handle('tracking:refreshUsage', (_, serviceId) =>
    service.refreshUsage(serviceId)
  )

  // Forward usage updates to renderer
  service.on('usageUpdate', (data) => {
    const windows = require('electron').BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('tracking:usageUpdate', data)
      }
    }
  })
}
