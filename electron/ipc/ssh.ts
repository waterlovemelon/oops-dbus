import { ipcMain, BrowserWindow } from 'electron'
import { TunnelManager } from '../ssh/TunnelManager.js'
import { ConnectionStore } from '../ssh/ConnectionStore.js'
import type { RemoteConnection, ConnectionState } from '../ssh/types.js'

const tunnelManager = new TunnelManager()
const connectionStore = new ConnectionStore()

export function getTunnelManager(): TunnelManager {
  return tunnelManager
}

export function registerSSHHandlers() {
  // Load saved connections on startup
  connectionStore.load()

  // List all saved connections
  ipcMain.handle('ssh:listConnections', () => {
    return connectionStore.getAll()
  })

  // Create a new connection
  ipcMain.handle('ssh:createConnection', (_event, conn: RemoteConnection) => {
    return connectionStore.add(conn)
  })

  // Update an existing connection
  ipcMain.handle('ssh:updateConnection', (_event, conn: RemoteConnection) => {
    return connectionStore.update(conn)
  })

  // Delete a connection
  ipcMain.handle('ssh:deleteConnection', (_event, id: string) => {
    // Disconnect if connected
    tunnelManager.disconnect(id)
    return connectionStore.remove(id)
  })

  // Connect to a remote host
  ipcMain.handle('ssh:connect', async (_event, id: string) => {
    const conn = connectionStore.getAll().find((c) => c.id === id)
    if (!conn) {
      return { id, status: 'error', error: '连接配置不存在' }
    }
    return tunnelManager.connect(conn)
  })

  // Disconnect from a remote host
  ipcMain.handle('ssh:disconnect', async (_event, id: string) => {
    await tunnelManager.disconnect(id)
    return { id, status: 'disconnected' }
  })

  // Get connection state
  ipcMain.handle('ssh:getConnectionState', (_event, id: string) => {
    return tunnelManager.getState(id)
  })

  // Get all connection states
  ipcMain.handle('ssh:getAllConnectionStates', () => {
    return tunnelManager.getAllStates()
  })

  // Listen for status changes and forward to renderer
  tunnelManager.onStatusChange((state: ConnectionState) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.webContents.send('ssh:connectionStatus', state)
    }
  })
}

export async function cleanupSSH(): Promise<void> {
  await tunnelManager.disconnectAll()
}
