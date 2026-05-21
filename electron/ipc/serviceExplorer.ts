import { ipcMain } from 'electron'
import { ServiceExplorer } from '../dbus/ServiceExplorer'
import { RemoteDBusExplorer } from '../dbus/RemoteDBusExplorer'
import { getTunnelManager } from './ssh'
import type { BusType } from '../dbus/types'

const serviceExplorer = new ServiceExplorer()
let remoteExplorer: RemoteDBusExplorer | null = null

function getRemoteExplorer(): RemoteDBusExplorer {
  if (!remoteExplorer) {
    remoteExplorer = new RemoteDBusExplorer(getTunnelManager())
  }
  return remoteExplorer
}

export function registerServiceExplorerHandlers() {
  // List services (supports remote via connectionId)
  ipcMain.handle('dbus:listServices', async (_event, busType: BusType, connectionId?: string) => {
    try {
      if (connectionId) {
        return await getRemoteExplorer().listServices(connectionId, busType)
      }
      return await serviceExplorer.listServices(busType)
    } catch (error: any) {
      console.error('Failed to list services:', error)
      throw error
    }
  })

  // Introspect service members (supports remote via connectionId)
  ipcMain.handle(
    'dbus:introspectServiceMembers',
    async (_event, serviceName: string, busType: BusType, connectionId?: string) => {
      try {
        if (connectionId) {
          return await getRemoteExplorer().introspectServiceMembers(connectionId, serviceName, busType)
        }
        return await serviceExplorer.introspectServiceMembers(serviceName, busType)
      } catch (error: any) {
        console.error('Failed to introspect service:', error)
        throw error
      }
    }
  )
}
