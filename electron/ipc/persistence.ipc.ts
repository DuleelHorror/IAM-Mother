import { IpcMain } from 'electron'
import { PersistenceService } from '../services/PersistenceService'

export function registerPersistenceIpc(
  ipcMain: IpcMain,
  service: PersistenceService
): void {
  ipcMain.handle('persistence:getLayout', () => service.getLayout())
  ipcMain.handle('persistence:saveLayout', (_, model) => service.saveLayout(model))
  ipcMain.handle('persistence:getServices', () => service.getServices())
  ipcMain.handle('persistence:saveServices', (_, services) =>
    service.saveServices(services)
  )
  ipcMain.handle('persistence:getConfig', () => service.getConfig())
  ipcMain.handle('persistence:saveConfig', (_, config) => service.saveConfig(config))
  ipcMain.handle('persistence:getPresets', () => service.getPresets())
  ipcMain.handle('persistence:savePreset', (_, preset) => service.savePreset(preset))
  ipcMain.handle('persistence:deletePreset', (_, id) => service.deletePreset(id))
  ipcMain.handle('persistence:saveApiKey', (_, serviceId, key) =>
    service.saveApiKey(serviceId, key)
  )
  ipcMain.handle('persistence:getApiKey', (_, serviceId) =>
    service.getApiKey(serviceId)
  )
}
