import { ipcMain } from 'electron'
import { ServiceExplorer } from '../dbus/ServiceExplorer'
import type { BusType } from '../dbus/types'

const serviceExplorer = new ServiceExplorer()

/**
 * Register IPC handlers for ServiceExplorer
 */
export function registerServiceExplorerHandlers() {
  // List services
  ipcMain.handle('dbus:listServices', async (_event, busType: BusType) => {
    try {
      const services = await serviceExplorer.listServices(busType)
      return services
    } catch (error: any) {
      console.error('Failed to list services:', error)
      throw error
    }
  })

  // Introspect service members
  ipcMain.handle(
    'dbus:introspectServiceMembers',
    async (_event, serviceName: string, busType: BusType) => {
      try {
        const members = await serviceExplorer.introspectServiceMembers(serviceName, busType)
        return members
      } catch (error: any) {
        console.error('Failed to introspect service:', error)
        throw error
      }
    }
  )
}
